import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createInitialState } from './defaults';
import { clearAll, loadImage, loadStateRaw, saveImage, saveStateRaw } from './db';
import { sanitizeState } from './sanitize';
import type { AppState } from './types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => void) => void;
  saveStatus: SaveStatus;
  lastSaved: number | null;
  /** 이 기기에 이전 작업이 있었는지(시작 화면 안내용) */
  hadSaved: boolean;
  resetAll: () => Promise<void>;
  replaceAll: (s: AppState, images: Record<string, Blob>) => Promise<void>;
  imageVersion: number;
  bumpImage: () => void;
  saveNow: () => Promise<boolean>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hadSaved, setHadSaved] = useState(false);
  const [storageBroken, setStorageBroken] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<AppState | null>(null);
  const skipNext = useRef(true);

  useEffect(() => {
    let alive = true;
    loadStateRaw()
      .then((raw) => {
        if (!alive) return;
        const s = raw ? sanitizeState(raw) : null;
        if (s) {
          setHadSaved(s.started);
          setLastSaved(s.updatedAt);
          setSaveStatus('saved');
        }
        setState(s ?? createInitialState());
      })
      .catch(() => {
        if (!alive) return;
        setStorageBroken(true);
        setSaveStatus('error');
        setState(createInitialState());
      });
    return () => {
      alive = false;
    };
  }, []);

  const doSave = useCallback(async (): Promise<boolean> => {
    const s = latest.current;
    if (!s) return false;
    setSaveStatus('saving');
    try {
      await saveStateRaw(s);
      setSaveStatus('saved');
      setLastSaved(Date.now());
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    latest.current = state;
    if (!state) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    setSaveStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void doSave(), 500);
  }, [state, doSave]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && latest.current) {
        window.clearTimeout(timer.current);
        void doSave();
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [doSave]);

  const update = useCallback((fn: (s: AppState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      next.updatedAt = Date.now();
      return next;
    });
  }, []);

  const resetAll = useCallback(async () => {
    window.clearTimeout(timer.current);
    try {
      await clearAll();
    } catch {
      /* 저장소를 못 쓰는 경우에도 화면은 새로 시작 */
    }
    skipNext.current = true;
    setHadSaved(false);
    setLastSaved(null);
    setSaveStatus('idle');
    setState(createInitialState());
  }, []);

  const replaceAll = useCallback(async (s: AppState, images: Record<string, Blob>) => {
    window.clearTimeout(timer.current);
    await clearAll();
    for (const [k, b] of Object.entries(images)) await saveImage(k, b);
    await saveStateRaw(s);
    skipNext.current = true;
    latest.current = s;
    setState(s);
    setSaveStatus('saved');
    setLastSaved(Date.now());
    setImageVersion((v) => v + 1);
  }, []);

  const value = useMemo<Store | null>(
    () =>
      state
        ? {
            state,
            update,
            saveStatus: storageBroken ? 'error' : saveStatus,
            lastSaved,
            hadSaved,
            resetAll,
            replaceAll,
            imageVersion,
            bumpImage: () => setImageVersion((v) => v + 1),
            saveNow: doSave,
          }
        : null,
    [state, update, saveStatus, storageBroken, lastSaved, hadSaved, resetAll, replaceAll, imageVersion, doSave],
  );

  if (!value) {
    return (
      <div className="loading" role="status">
        활동 기록을 불러오는 중…
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

/** 저장된 이미지를 화면에 보여 줄 주소로 바꿉니다. */
export function useImageUrl(key: string | undefined): string | null {
  const { imageVersion } = useStore();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    if (!key) {
      setUrl(null);
      return;
    }
    loadImage(key)
      .then((b) => {
        if (!alive) return;
        if (b) {
          made = URL.createObjectURL(b);
          setUrl(made);
        } else setUrl(null);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [key, imageVersion]);
  return url;
}

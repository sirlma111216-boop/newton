import { useRef, useState } from 'react';
import { downloadBlob, safeFileName, stamp } from '../lib/files';
import { BackupError, buildBackup, readBackup } from '../state/backup';
import { useStore } from '../state/store';
import type { AppState } from '../state/types';
import { ConfirmDialog } from './Dialog';
import { Note } from './ui';

type Msg = { kind: 'ok' | 'error' | 'warn'; text: string } | null;

export function useBackupActions() {
  const store = useStore();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, setPending] = useState<{ state: AppState; images: Record<string, Blob>; warnings: string[] } | null>(null);
  const [askReset, setAskReset] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveFile = async () => {
    try {
      const blob = await buildBackup(store.state);
      downloadBlob(blob, `${safeFileName('뉴턴인터뷰_활동파일', store.state.reporter, stamp())}.json`);
      setMsg({ kind: 'ok', text: '활동 파일을 내려받았어요. 다운로드 폴더나 선생님이 알려 준 곳에 잘 보관하세요.' });
    } catch {
      setMsg({ kind: 'error', text: '활동 파일을 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
    }
  };

  const pickFile = () => inputRef.current?.click();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const r = await readBackup(f);
      setPending(r);
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof BackupError ? e.message : '파일을 불러오지 못했어요.' });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const ui = (
    <>
      <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      {msg && (
        <div className="backup-msg">
          <Note kind={msg.kind}>{msg.text}</Note>
          <button type="button" className="btn btn-small" onClick={() => setMsg(null)}>
            알림 닫기
          </button>
        </div>
      )}
      <ConfirmDialog
        open={!!pending}
        title="활동 파일 불러오기"
        confirmLabel="지금 작업을 바꾸고 불러오기"
        danger
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          const p = pending;
          setPending(null);
          try {
            await store.replaceAll(p.state, p.images);
            setMsg({
              kind: p.warnings.length ? 'warn' : 'ok',
              text: `「${p.state.reporter || '이름 없음'}」 기자의 활동을 불러왔어요.${p.warnings.length ? ' ' + p.warnings.join(' ') : ''}`,
            });
          } catch {
            setMsg({ kind: 'error', text: '불러오는 중 저장에 실패했어요. 브라우저 저장 공간을 확인하고 다시 시도해 주세요.' });
          }
        }}
      >
        <p>
          불러올 파일: <strong>{pending?.state.reporter || '이름 없음'}</strong> 기자의 활동
        </p>
        <p>
          지금 이 기기에 있는 작업(<strong>{store.state.reporter || '이름 없음'}</strong>)은 불러온 내용으로 <strong>바뀌어요</strong>. 지금 작업이 필요하면 먼저
          ‘활동 파일 저장’을 하세요.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={askReset}
        title="이 기기의 내 활동 지우기"
        confirmLabel="모두 지우기"
        danger
        onCancel={() => setAskReset(false)}
        onConfirm={async () => {
          setAskReset(false);
          await store.resetAll();
        }}
      >
        <p>이 기기에 저장된 질문, 인터뷰, 이미지, 신문 내용이 모두 지워지고 처음 화면으로 돌아가요. 지운 뒤에는 되살릴 수 없어요.</p>
        <p>나중에 이어서 하려면 먼저 ‘활동 파일 저장’을 하세요.</p>
      </ConfirmDialog>
    </>
  );

  return { saveFile, pickFile, askReset: () => setAskReset(true), ui };
}

/** 각 활동 끝의 ‘저장하기’ 단계에 넣는 묶음 */
export function SavePanel() {
  const { saveFile, pickFile, ui } = useBackupActions();
  return (
    <div className="save-panel">
      <p>
        내 기록은 이 브라우저에 자동으로 저장되지만, 브라우저 기록을 지우거나 다른 기기를 쓰면 사라질 수 있어요. 수업이 끝나기 전에 <strong>활동 파일</strong>로도
        저장해 두세요. 이미지도 함께 저장돼요.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={() => void saveFile()}>
          활동 파일 저장 (.json)
        </button>
        <button type="button" className="btn" onClick={pickFile}>
          활동 파일 불러오기
        </button>
      </div>
      {ui}
    </div>
  );
}

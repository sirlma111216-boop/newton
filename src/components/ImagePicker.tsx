import { useRef, useState } from 'react';
import { ACCEPTED_TYPES, FRAME_ASPECT, ImageError, prepareImage } from '../lib/images';
import { deleteImage, saveImage } from '../state/db';
import { newId } from '../state/defaults';
import { useImageUrl, useStore } from '../state/store';
import { Choice, Note } from './ui';

export function ImagePicker() {
  const { state, update, bumpImage } = useStore();
  const img = state.a2.image;
  const url = useImageUrl(img?.key);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'warn'; text: string } | null>(null);
  const [drag, setDrag] = useState(false);

  const accept = async (file: Blob | null | undefined, name: string) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const p = await prepareImage(file);
      const key = newId();
      await saveImage(key, p.blob);
      const old = state.a2.image?.key;
      update((s) => {
        s.a2.image = {
          key,
          name: name.slice(0, 120),
          width: p.width,
          height: p.height,
          source: s.a2.image?.source ?? 'gemini',
          fit: p.width >= p.height ? 'cover' : 'contain',
          focusX: 50,
          focusY: 50,
        };
      });
      if (old) void deleteImage(old).catch(() => undefined);
      bumpImage();
      setMsg({
        kind: 'ok',
        text: p.resized ? '이미지를 가져왔어요. 저장 공간을 아끼려고 크기를 알맞게 줄였어요.' : '이미지를 가져왔어요.',
      });
    } catch (e) {
      setMsg({
        kind: 'error',
        text: e instanceof ImageError ? e.message : '이미지를 저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요. 다시 시도해 주세요.',
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.kind === 'file' && i.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      void accept(item.getAsFile(), '붙여 넣은 이미지');
    } else {
      setMsg({ kind: 'warn', text: '복사된 이미지가 없어요. 이미지를 내려받은 뒤 ‘이미지 파일 고르기’를 눌러 주세요.' });
    }
  };

  const portrait = img ? img.height > img.width : false;

  return (
    <div className="image-picker">
      <div
        className={`drop ${drag ? 'is-drag' : ''}`}
        tabIndex={0}
        role="group"
        aria-label="이미지 가져오기 상자. 이미지를 복사한 뒤 이 상자를 선택하고 붙여 넣을 수도 있어요."
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          void accept(f, f?.name ?? '이미지');
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            void accept(f, f?.name ?? '이미지');
          }}
        />
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? '가져오는 중…' : img ? '다른 이미지로 바꾸기' : '이미지 파일 고르기'}
        </button>
        <p className="help">
          PNG·JPG·WEBP·GIF, 25MB 이하. 이미지를 이 상자에 끌어다 놓거나, 이미지를 복사한 뒤 상자를 누르고 <kbd>Ctrl</kbd>+<kbd>V</kbd>로 붙여 넣어도 돼요.
        </p>
      </div>
      {msg && <Note kind={msg.kind}>{msg.text}</Note>}

      {img && url && (
        <div className="image-setup">
          <div className={`frame-preview ${img.fit === 'cover' ? 'is-cover' : 'is-contain'}`} style={img.fit === 'cover' ? { aspectRatio: String(FRAME_ASPECT) } : undefined}>
            <img
              src={url}
              alt="가져온 인터뷰 장면 이미지"
              style={img.fit === 'cover' ? { objectFit: 'cover', objectPosition: `${img.focusX}% ${img.focusY}%` } : { objectFit: 'contain' }}
            />
          </div>
          <p className="help">
            {img.width}×{img.height} · {portrait ? '세로로 긴 이미지' : '가로로 긴 이미지'} — 신문에는 위 모습 그대로 들어가요.
          </p>
          <Choice
            legend="신문에 넣는 방법"
            options={[
              { id: 'cover', label: '틀에 맞게 잘라 넣기', hint: '가로 4:3 틀' },
              { id: 'contain', label: '이미지 전체 보이기', hint: '잘리지 않음' },
            ]}
            value={img.fit}
            onChange={(v) =>
              update((s) => {
                if (s.a2.image) s.a2.image.fit = v;
              })
            }
          />
          {img.fit === 'cover' && (
            <div className="field">
              <label htmlFor="focus">{img.width / img.height > FRAME_ASPECT ? '보여 줄 부분 (왼쪽 ↔ 오른쪽)' : '보여 줄 부분 (위 ↕ 아래)'}</label>
              <input
                id="focus"
                type="range"
                min={0}
                max={100}
                step={5}
                value={img.width / img.height > FRAME_ASPECT ? img.focusX : img.focusY}
                onChange={(e) =>
                  update((s) => {
                    if (!s.a2.image) return;
                    if (img.width / img.height > FRAME_ASPECT) s.a2.image.focusX = Number(e.target.value);
                    else s.a2.image.focusY = Number(e.target.value);
                  })
                }
              />
            </div>
          )}
          <Choice
            legend="이 이미지는 어디서 왔나요?"
            options={[
              { id: 'gemini', label: 'Gemini로 만든 그림' },
              { id: 'teacher', label: '선생님이 준 자료' },
              { id: 'drawing', label: '내가 직접 그린 그림' },
            ]}
            value={img.source}
            onChange={(v) =>
              update((s) => {
                if (s.a2.image) s.a2.image.source = v;
              })
            }
          />
          <button
            type="button"
            className="btn btn-small btn-quiet"
            onClick={() => {
              const k = img.key;
              update((s) => {
                s.a2.image = null;
              });
              void deleteImage(k).catch(() => undefined);
              setMsg({ kind: 'ok', text: '이미지를 뺐어요. 이미지 없이도 신문을 만들 수 있어요.' });
            }}
          >
            이미지 빼기
          </button>
        </div>
      )}
      {img && !url && <p className="help">이미지를 불러오는 중…</p>}
    </div>
  );
}

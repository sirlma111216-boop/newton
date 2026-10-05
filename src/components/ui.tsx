import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GEMINI_URL } from '../content/gems';
import type { Where } from '../content/guide';

/* ───────── 아이콘 (장식용, 글자와 함께 씀) ───────── */

export function IconGemini() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 2c.6 4.9 3.1 8.4 10 10-6.9 1.6-9.4 5.1-10 10-.6-4.9-3.1-8.4-10-10 6.9-1.6 9.4-5.1 10-10z" fill="currentColor" />
    </svg>
  );
}

export function IconApp() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M1 19h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ───────── 어디에서 할 일인지 표시 ───────── */

export function WhereTag({ where }: { where: Where | 'both' }) {
  if (where === 'both')
    return (
      <span className="where-pair">
        <WhereTag where="app" />
        <WhereTag where="gemini" />
      </span>
    );
  return where === 'gemini' ? (
    <span className="where where-gemini">
      <IconGemini /> Gemini에서 할 일
    </span>
  ) : (
    <span className="where where-app">
      <IconApp /> 이 웹앱에서 할 일
    </span>
  );
}

/* ───────── Gemini 열기 ───────── */

export function GeminiButton({ url, label = 'Gemini 열기 (새 탭)' }: { url?: string; label?: string }) {
  const safe = url && /^https:\/\/gemini\.google\.com\//.test(url.trim()) ? url.trim() : GEMINI_URL;
  return (
    <a className="btn btn-gemini" href={safe} target="_blank" rel="noopener noreferrer">
      <IconGemini /> {label} <IconExternal />
    </a>
  );
}

/* ───────── 복사 버튼 (실패하면 직접 복사할 수 있게) ───────── */

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 아래 방법으로 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({ text, label, className = '' }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (state === 'ok') {
      const t = window.setTimeout(() => setState('idle'), 2500);
      return () => window.clearTimeout(t);
    }
  }, [state]);
  useEffect(() => {
    if (state === 'fail') taRef.current?.select();
  }, [state]);
  return (
    <span className="copy-wrap">
      <button type="button" className={`btn btn-copy ${className}`} onClick={async () => setState((await copyText(text)) ? 'ok' : 'fail')}>
        {state === 'ok' ? (
          <>
            <IconCheck /> 복사했어요
          </>
        ) : (
          label
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'ok' ? '복사했어요. Gemini에 붙여 넣으세요.' : state === 'fail' ? '자동 복사가 막혔어요.' : ''}
      </span>
      {state === 'fail' && (
        <span className="copy-fallback" role="alert">
          <span>
            브라우저가 자동 복사를 막았어요. 아래 글이 선택되어 있으니 <kbd>Ctrl</kbd>+<kbd>C</kbd>(맥·아이패드는 <kbd>⌘</kbd>+<kbd>C</kbd> 또는 길게 눌러 ‘복사’)로 복사하세요.
          </span>
          <textarea ref={taRef} readOnly value={text} rows={4} aria-label="직접 복사할 글" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn btn-small" onClick={() => setState('idle')}>
            닫기
          </button>
        </span>
      )}
    </span>
  );
}

/* ───────── 입력칸 ───────── */

interface FieldProps {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  help?: ReactNode;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  multiline?: boolean;
  readOnly?: boolean;
  optional?: boolean;
  id?: string;
  action?: ReactNode;
}

export function Field({ label, value, onChange, help, placeholder, rows = 3, maxLength, multiline, readOnly, optional, id, action }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const hid = `${fid}-help`;
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={fid}>
          {label}
          {optional && <span className="optional"> (선택)</span>}
        </label>
        {action}
      </div>
      {help && (
        <p className="help" id={hid}>
          {help}
        </p>
      )}
      {multiline ? (
        <textarea
          id={fid}
          value={value}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          aria-describedby={help ? hid : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={fid}
          type="text"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          aria-describedby={help ? hid : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ───────── 고르기 버튼 묶음 ───────── */

export function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
  help,
}: {
  legend: ReactNode;
  options: { id: T; label: string; hint?: string }[];
  value: T | '';
  onChange: (v: T) => void;
  help?: ReactNode;
}) {
  const name = useId();
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      {help && <p className="help">{help}</p>}
      <div className="choice-row">
        {options.map((o) => (
          <label key={o.id} className={`chip ${value === o.id ? 'chip-on' : ''}`}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span className="chip-mark" aria-hidden="true">
              {value === o.id ? <IconCheck /> : null}
            </span>
            <span>
              {o.label}
              {o.hint && <small className="chip-hint">{o.hint}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ───────── 펼쳐 보기 ───────── */

export function Expand({ summary, children, open, className = '' }: { summary: ReactNode; children: ReactNode; open?: boolean; className?: string }) {
  return (
    <details className={`expand ${className}`} open={open}>
      <summary>{summary}</summary>
      <div className="expand-body">{children}</div>
    </details>
  );
}

export function Note({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode }) {
  const label = { info: '안내', warn: '확인해요', error: '문제가 있어요', ok: '잘 됐어요' }[kind];
  return (
    <div className={`note note-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <strong className="note-label">{label}</strong>
      <div>{children}</div>
    </div>
  );
}

export function ExampleBadge({ text = '수업용 예시' }: { text?: string }) {
  return <span className="example-badge">{text}</span>;
}

/** 클립보드에서 글 붙여넣기 (막히면 안내) */
export function PasteButton({ onPaste }: { onPaste: (t: string) => void }) {
  const [msg, setMsg] = useState('');
  return (
    <span className="copy-wrap">
      <button
        type="button"
        className="btn btn-small"
        onClick={async () => {
          try {
            const t = await navigator.clipboard.readText();
            if (t.trim()) {
              onPaste(t);
              setMsg('붙여 넣었어요.');
            } else setMsg('복사된 글이 없어요. Gemini 답변 아래 ‘복사’ 버튼을 먼저 눌러 주세요.');
          } catch {
            setMsg('브라우저가 막았어요. 칸을 누르고 Ctrl+V(아이패드는 길게 눌러 ‘붙여넣기’)로 붙여 넣으세요.');
          }
        }}
      >
        결과 붙여넣기
      </button>
      <span className="paste-msg" aria-live="polite">
        {msg}
      </span>
    </span>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { articleQA } from '../pdf/article';
import { findUnsupported, type CharProblem } from '../pdf/text';
import { useStore } from '../state/store';
import type { AppState } from '../state/types';
import { Note } from './ui';

export function paperFields(state: AppState): { label: string; text: string }[] {
  const qa = articleQA(state);
  return [
    { label: '신문 이름', text: state.a3.paperName },
    { label: '발행일', text: state.a3.date },
    { label: '기자', text: state.a3.byline || state.reporter },
    { label: '제목', text: state.a3.title },
    { label: '부제', text: state.a3.subtitle },
    { label: '도입부', text: state.a3.lead },
    ...qa.flatMap((p, i) => [
      { label: `질문 ${i + 1}`, text: p.q },
      { label: `답변 ${i + 1}`, text: p.a },
    ]),
    { label: '캡션', text: state.a2.caption },
    { label: '확인한 내용과 참고 자료', text: state.a3.sources },
    { label: '남은 질문', text: state.a3.remaining },
  ];
}

export function CharWarning({ problems }: { problems: CharProblem[] }) {
  if (!problems.length) return null;
  return (
    <Note kind="warn">
      <p>신문 글꼴에 없는 글자가 있어요(이모지, 한자 등). PDF에서 빈칸이나 네모로 보일 수 있으니 다른 말로 바꾸거나 지워 주세요.</p>
      <ul>
        {problems.map((p) => (
          <li key={p.label}>
            {p.label}: <span className="bad-chars">{p.chars.join(' ')}</span>
          </li>
        ))}
      </ul>
    </Note>
  );
}

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'error'; text: string } | { kind: 'ok'; pages: number; overflow: boolean; tips: string[] };

export function PaperPreview() {
  const { state, update, imageVersion } = useStore();
  const holder = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [nonce, setNonce] = useState(0);
  const run = useRef(0);

  const key = useMemo(
    () =>
      JSON.stringify([
        state.a3.paperName,
        state.a3.date,
        state.a3.byline,
        state.reporter,
        state.a3.title,
        state.a3.subtitle,
        state.a3.lead,
        articleQA(state),
        state.a3.sources,
        state.a3.remaining,
        state.a3.pages,
        state.a2.image,
        state.a2.caption,
        imageVersion,
        nonce,
      ]),
    [state, imageVersion, nonce],
  );
  const problems = useMemo(() => findUnsupported(paperFields(state)), [state]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const my = ++run.current;
    const t = window.setTimeout(async () => {
      setStatus({ kind: 'busy' });
      try {
        const { makePaperPdf } = await import('../pdf/exporter');
        const { renderPdfToCanvases } = await import('../pdf/preview');
        const r = await makePaperPdf(stateRef.current);
        if (my !== run.current) return;
        const cw = holder.current?.clientWidth ?? 0;
        const width = Math.max(240, Math.min(720, cw > 100 ? cw - 4 : window.innerWidth - 48));
        const canvases = await renderPdfToCanvases(r.blob, width);
        if (my !== run.current || !holder.current) return;
        holder.current.replaceChildren(
          ...canvases.map((c, i) => {
            const wrap = document.createElement('div');
            wrap.className = 'pv-page';
            const tag = document.createElement('span');
            tag.className = 'pv-tag';
            tag.textContent = `${i + 1}쪽`;
            c.setAttribute('role', 'img');
            c.setAttribute('aria-label', `신문 미리보기 ${i + 1}쪽`);
            wrap.append(tag, c);
            return wrap;
          }),
        );
        setStatus({ kind: 'ok', pages: canvases.length, overflow: r.overflow, tips: r.tips });
      } catch (e) {
        if (my !== run.current) return;
        setStatus({ kind: 'error', text: e instanceof Error && e.message ? e.message : '미리보기를 만들지 못했어요.' });
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [key]);

  return (
    <div className="preview">
      <div className="preview-head">
        <h2>신문 미리보기</h2>
        <span className="preview-status" role="status" aria-live="polite">
          {status.kind === 'busy' && '미리보기 만드는 중…'}
          {status.kind === 'ok' && `PDF와 같은 모습 · ${status.pages}쪽`}
        </span>
      </div>
      <p className="help">미리보기는 실제로 만들어질 PDF를 그대로 그린 것이에요. 글을 고치면 잠시 뒤 바뀌어요.</p>
      <CharWarning problems={problems} />
      {status.kind === 'error' && (
        <Note kind="error">
          {status.text}{' '}
          <button type="button" className="btn btn-small" onClick={() => setNonce((n) => n + 1)}>
            다시 시도
          </button>
        </Note>
      )}
      {status.kind === 'ok' && status.overflow && (
        <Note kind="warn">
          <p>
            <strong>1쪽 양식에 다 들어가지 않아요.</strong> 내용을 자르지 않고, 지금은 읽기 좋은 {status.pages}쪽 양식으로 보여 주고 있어요.
          </p>
          <p>1쪽으로 만들고 싶으면 이렇게 해 보세요:</p>
          <ul>
            {status.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-small"
            onClick={() =>
              update((s) => {
                s.a3.pages = 2;
              })
            }
          >
            여러 쪽으로 만들기로 정하기
          </button>
        </Note>
      )}
      {status.kind === 'ok' && !status.overflow && state.a3.pages === 2 && status.pages === 1 && (
        <Note kind="info">내용이 짧아서 읽기 좋은 양식으로도 1쪽에 모두 들어갔어요.</Note>
      )}
      <div ref={holder} className={`pv-pages ${status.kind === 'busy' ? 'is-busy' : ''}`} />
    </div>
  );
}

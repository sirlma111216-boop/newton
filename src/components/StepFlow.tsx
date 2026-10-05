import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Where } from '../content/guide';
import { useStore } from '../state/store';
import { IconCheck, WhereTag } from './ui';

export interface StepDef {
  id: string;
  title: string;
  task: string; // 이번에 할 일 한 문장
  where: Where | 'both';
  time?: string;
  render: () => ReactNode;
  missing?: () => string[];
}

export const ACTIVITY_NAMES = ['1. 질문 연습실', '2. 뉴턴 인터뷰실', '3. 신문 편집실'];

export function StepFlow({ activity, steps, aside }: { activity: 1 | 2 | 3; steps: StepDef[]; aside?: ReactNode }) {
  const { state, update } = useStore();
  const idx = Math.min(state.steps[activity - 1], steps.length - 1);
  const step = steps[idx];
  const headRef = useRef<HTMLHeadingElement>(null);
  const [gentle, setGentle] = useState<string[] | null>(null);
  const first = useRef(true);

  useEffect(() => {
    document.querySelector('.step-chip.is-current')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [idx, activity]);

  useEffect(() => {
    setGentle(null);
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headRef.current?.focus();
  }, [idx, activity]);

  const go = (i: number) =>
    update((s) => {
      s.steps[activity - 1] = Math.max(0, Math.min(steps.length - 1, i));
    });
  const goActivity = (a: 1 | 2 | 3) =>
    update((s) => {
      s.activity = a;
    });

  const isDone = !!state.done[step.id];
  const doneCount = steps.filter((s) => state.done[s.id]).length;

  const markDone = () => {
    if (isDone) {
      update((s) => {
        delete s.done[step.id];
      });
      return;
    }
    const miss = step.missing?.() ?? [];
    update((s) => {
      s.done[step.id] = true;
    });
    if (miss.length > 0) {
      setGentle(miss);
    } else if (idx < steps.length - 1) {
      go(idx + 1);
    } else {
      setGentle([]);
    }
  };

  return (
    <div className={`flow flow-a${activity} ${aside ? 'flow-with-aside' : ''}`}>
      <nav className="stepper" aria-label={`${ACTIVITY_NAMES[activity - 1]} 단계`}>
        <p className="stepper-count">
          단계 {idx + 1} / {steps.length} · 완료 표시 {doneCount}개
        </p>
        <ol>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={`step-chip ${i === idx ? 'is-current' : ''} ${state.done[s.id] ? 'is-done' : ''}`}
                aria-current={i === idx ? 'step' : undefined}
                onClick={() => go(i)}
              >
                <span className="step-num" aria-hidden="true">
                  {state.done[s.id] ? <IconCheck /> : i + 1}
                </span>
                <span className="step-chip-title">{s.title}</span>
                <span className="sr-only">{state.done[s.id] ? ' (완료 표시함)' : ''}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flow-body">
        <section className="step-card" aria-labelledby={`h-${step.id}`}>
          <header className="step-head">
            <div className="step-meta">
              <span className="step-index">단계 {idx + 1}</span>
              <WhereTag where={step.where} />
              {step.time && <span className="step-time">권장 {step.time}</span>}
            </div>
            <h2 id={`h-${step.id}`} ref={headRef} tabIndex={-1}>
              {step.title}
            </h2>
            <p className="step-task">
              <strong>이번에 할 일 </strong>
              {step.task}
            </p>
          </header>

          <div className="step-content">{step.render()}</div>

          {gentle && (
            <div className="gentle" role="status">
              {gentle.length > 0 ? (
                <>
                  <p>
                    <strong>완료로 표시했어요.</strong> 아직 비어 있는 곳이 있어요. 지금 채우거나, 나중에 이 단계로 돌아와 채워도 괜찮아요.
                  </p>
                  <ul>
                    {gentle.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  {idx < steps.length - 1 && (
                    <button type="button" className="btn btn-small" onClick={() => go(idx + 1)}>
                      일단 다음 단계로 가기
                    </button>
                  )}
                </>
              ) : (
                <p>
                  <strong>이 활동의 마지막 단계까지 완료로 표시했어요.</strong>
                </p>
              )}
            </div>
          )}

          <footer className="step-nav">
            <button type="button" className="btn" onClick={() => go(idx - 1)} disabled={idx === 0}>
              ← 이전
            </button>
            <button type="button" className={`btn btn-done ${isDone ? 'is-done' : ''}`} onClick={markDone} aria-pressed={isDone}>
              {isDone ? (
                <>
                  <IconCheck /> 완료 표시함 (누르면 해제)
                </>
              ) : (
                '여기까지 했어요'
              )}
            </button>
            {idx < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(idx + 1)}>
                다음 →
              </button>
            ) : activity < 3 ? (
              <button type="button" className="btn btn-primary" onClick={() => goActivity((activity + 1) as 2 | 3)}>
                다음 활동: {ACTIVITY_NAMES[activity]} →
              </button>
            ) : (
              <span />
            )}
          </footer>
        </section>
        {aside && <aside className="flow-aside">{aside}</aside>}
      </div>
    </div>
  );
}

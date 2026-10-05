import { useState } from 'react';
import { SavePanel } from '../components/Backup';
import { ConfirmDialog } from '../components/Dialog';
import { CharWarning, PaperPreview, paperFields } from '../components/PaperPreview';
import { StepFlow, type StepDef } from '../components/StepFlow';
import { Choice, ExampleBadge, Expand, Field, Note } from '../components/ui';
import { REVIEW_QUESTIONS, REVISION_QUESTION, WRITING_TIPS } from '../content/newspaper';
import { downloadBlob, safeFileName } from '../lib/files';
import { articleQA } from '../pdf/article';
import { cleanAnswerForArticle, findUnsupported } from '../pdf/text';
import { useImageUrl, useStore } from '../state/store';
import type { AppState } from '../state/types';
import { KIND_LABEL, cardLabel } from './Activity2';

function Tip({ k }: { k: keyof typeof WRITING_TIPS }) {
  const t = WRITING_TIPS[k];
  return (
    <Expand summary="도움말과 예시 보기">
      <p>{t.tip}</p>
      {t.examples.length > 0 && (
        <ul className="example-list">
          {t.examples.map((e) => (
            <li key={e}>
              <ExampleBadge text="예시" /> {e}
            </li>
          ))}
        </ul>
      )}
      <p className="help">예시는 참고용이에요. 입력칸에 자동으로 들어가지 않아요. 내 기사에 맞게 직접 써요.</p>
    </Expand>
  );
}

function snapshotOf(s: AppState) {
  return {
    at: Date.now(),
    title: s.a3.title,
    subtitle: s.a3.subtitle,
    lead: s.a3.lead,
    qa: articleQA(s).map(({ q, a }) => ({ q, a })),
    caption: s.a2.caption,
    sources: s.a3.sources,
    remaining: s.a3.remaining,
  };
}

function ExportPanel() {
  const { state, update } = useStore();
  const [busy, setBusy] = useState<'' | 'pdf' | 'print' | 'growth'>('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'warn'; text: string } | null>(null);
  const [askStrip, setAskStrip] = useState<null | 'pdf' | 'print'>(null);
  const problems = findUnsupported(paperFields(state));
  const fileBase = safeFileName(state.a3.byline || state.reporter || '기자', state.a3.title || '뉴턴 인터뷰 신문');

  const doPaper = async (mode: 'pdf' | 'print', strip = false) => {
    let win: Window | null = null;
    if (mode === 'print') win = window.open('', '_blank');
    setBusy(mode);
    setMsg(null);
    try {
      const { makePaperPdf } = await import('../pdf/exporter');
      const r = await makePaperPdf(state, { strip });
      if (mode === 'pdf') {
        downloadBlob(r.blob, `${fileBase}.pdf`);
      } else {
        const url = URL.createObjectURL(r.blob);
        if (win) win.location.href = url;
        else {
          setMsg({ kind: 'warn', text: '새 탭이 막혔어요. ‘신문 PDF 다운로드’로 받은 파일을 열어 인쇄하세요.' });
          return;
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      }
      setMsg({
        kind: r.overflow ? 'warn' : 'ok',
        text:
          (mode === 'pdf' ? `신문 PDF(${r.pages}쪽)를 내려받았어요.` : `새 탭에서 PDF를 열었어요. 그 화면의 인쇄 버튼을 눌러 인쇄하거나 PDF로 저장하세요.`) +
          (r.overflow ? ' 1쪽 양식에 다 들어가지 않아 내용을 자르지 않고 여러 쪽으로 만들었어요.' : ''),
      });
    } catch (e) {
      win?.close();
      setMsg({ kind: 'error', text: e instanceof Error && e.message ? e.message : 'PDF를 만들지 못했어요. 다시 시도해 주세요.' });
    } finally {
      setBusy('');
    }
  };

  const start = (mode: 'pdf' | 'print') => {
    if (problems.length) setAskStrip(mode);
    else void doPaper(mode);
  };

  const growth = async () => {
    setBusy('growth');
    setMsg(null);
    try {
      const { makeGrowthPdf } = await import('../pdf/exporter');
      const blob = await makeGrowthPdf(state);
      downloadBlob(blob, `${safeFileName(state.reporter || '기자', '질문성장기록')}.pdf`);
      setMsg({ kind: 'ok', text: '질문 성장 기록을 내려받았어요.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error && e.message ? e.message : '질문 성장 기록을 만들지 못했어요.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="export">
      <Choice
        legend="쪽수"
        options={[
          { id: '1', label: '1쪽 신문', hint: '기본 · 2단 신문 양식' },
          { id: '2', label: '읽기 좋은 여러 쪽', hint: '글씨 조금 크게, 한 단' },
        ]}
        value={String(state.a3.pages) as '1' | '2'}
        onChange={(v) =>
          update((s) => {
            s.a3.pages = v === '2' ? 2 : 1;
          })
        }
        help="1쪽에 다 들어가지 않으면 내용을 자르지 않고 여러 쪽으로 만들어요. 오른쪽(또는 ‘신문 미리보기’) 화면에서 줄일 부분을 알려 줘요."
      />
      <CharWarning problems={problems} />
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-big" onClick={() => start('pdf')} disabled={!!busy}>
          {busy === 'pdf' ? 'PDF 만드는 중…' : '신문 PDF 다운로드'}
        </button>
        <button type="button" className="btn" onClick={() => start('print')} disabled={!!busy}>
          {busy === 'print' ? '준비 중…' : '인쇄 / PDF로 저장'}
        </button>
      </div>
      <p className="help">처음 PDF를 만들 때는 한글 글꼴을 한 번 내려받느라 조금 걸릴 수 있어요.</p>
      {msg && <Note kind={msg.kind}>{msg.text}</Note>}
      <ConfirmDialog
        open={!!askStrip}
        title="신문 글꼴에 없는 글자가 있어요"
        confirmLabel="그 글자를 빼고 만들기"
        cancelLabel="돌아가서 고치기"
        onCancel={() => setAskStrip(null)}
        onConfirm={() => {
          const m = askStrip!;
          setAskStrip(null);
          void doPaper(m, true);
        }}
      >
        <p>아래 글자는 PDF에서 제대로 보이지 않아요. 직접 고치는 것이 가장 좋아요. 그래도 지금 만들려면, 이 글자들만 빼고 만들 수 있어요(내 기록에서는 지워지지 않아요).</p>
        <ul>
          {problems.map((p) => (
            <li key={p.label}>
              {p.label}: <span className="bad-chars">{p.chars.join(' ')}</span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
      <h3 className="sub-h">질문 성장 기록</h3>
      <p>처음 질문과 고친 질문, 이어서 물은 질문, 사실 확인, 기사에 고른 이유, 독자 질문과 고친 내용을 한 장에 모아 내려받아요.</p>
      <button type="button" className="btn" onClick={() => void growth()} disabled={!!busy}>
        {busy === 'growth' ? '만드는 중…' : '질문 성장 기록 내려받기 (PDF)'}
      </button>
    </div>
  );
}

export function Activity3() {
  const { state, update } = useStore();
  const a = state.a3;
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const imgUrl = useImageUrl(state.a2.image?.key);
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) =>
    update((s) => {
      s.a3[k] = v;
    });
  const answered = state.a2.cards.filter((c) => c.question.trim() || c.answer.trim());
  const sorted = [...answered].sort((x, y) => Number(y.candidate) - Number(x.candidate));
  const qa = articleQA(state);

  const togglePick = (id: string) =>
    update((s) => {
      if (s.a3.picks.includes(id)) s.a3.picks = s.a3.picks.filter((x) => x !== id);
      else {
        s.a3.picks.push(id);
        const c = s.a2.cards.find((x) => x.id === id);
        if (c && !s.a3.qa[id]) s.a3.qa[id] = { q: c.question, a: cleanAnswerForArticle(c.answer) };
      }
    });
  const move = (id: string, d: -1 | 1) =>
    update((s) => {
      const i = s.a3.picks.indexOf(id);
      const j = i + d;
      if (i < 0 || j < 0 || j >= s.a3.picks.length) return;
      [s.a3.picks[i], s.a3.picks[j]] = [s.a3.picks[j], s.a3.picks[i]];
    });
  const setQA = (id: string, patch: Partial<{ q: string; a: string }>) =>
    update((s) => {
      const c = s.a2.cards.find((x) => x.id === id);
      const cur = s.a3.qa[id] ?? { q: c?.question ?? '', a: cleanAnswerForArticle(c?.answer ?? '') };
      s.a3.qa[id] = { ...cur, ...patch };
    });
  const ensureSnapshot = () =>
    update((s) => {
      if (!s.a3.before) s.a3.before = snapshotOf(s);
    });

  const steps: StepDef[] = [
    {
      id: 'a3-pick',
      title: '기사거리 고르기',
      task: '기사에 실을 인터뷰 3~4개를 고르고, 고른 이유를 한 문장으로 써요.',
      where: 'app',
      time: '5분',
      missing: () => [a.picks.length < 3 && `고른 인터뷰가 ${a.picks.length}개예요 (3~4개 권장)`, !a.pickReason.trim() && '고른 이유'].filter(Boolean) as string[],
      render: () => (
        <>
          {answered.length === 0 ? (
            <Note kind="info">아직 인터뷰 기록이 없어요. ‘2. 뉴턴 인터뷰실’에서 인터뷰를 먼저 모아 주세요.</Note>
          ) : (
            <fieldset className="choice">
              <legend>인터뷰 고르기 (기사 후보를 먼저 보여 줘요)</legend>
              <div className="pick-list">
                {sorted.map((c) => {
                  const on = a.picks.includes(c.id);
                  return (
                    <label key={c.id} className={`pick ${on ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => togglePick(c.id)} />
                      <span>
                        <strong>{cardLabel(state.a2.cards, c.id)}</strong> <small>{KIND_LABEL[c.kind]}</small>
                        {c.candidate && <span className="tag-candidate">기사 후보</span>}
                        {c.memo && <small className="memo">메모: {c.memo}</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          {a.picks.length > 4 && <Note kind="warn">{a.picks.length}개를 골랐어요. 1쪽 신문에는 3~4개가 알맞아요.</Note>}
          {a.picks.length > 0 && (
            <>
              <h3 className="sub-h">기사에 싣는 순서</h3>
              <ol className="order-list">
                {a.picks.map((id, i) => (
                  <li key={id}>
                    <span>{cardLabel(state.a2.cards, id)}</span>
                    <span className="order-btns">
                      <button type="button" className="btn btn-small" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`${i + 1}번째를 위로`}>
                        ↑
                      </button>
                      <button type="button" className="btn btn-small" onClick={() => move(id, 1)} disabled={i === a.picks.length - 1} aria-label={`${i + 1}번째를 아래로`}>
                        ↓
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
          <Field label="이 인터뷰들을 고른 이유 (한 문장)" value={a.pickReason} onChange={(v) => set('pickReason', v)} placeholder="예: 독자가 중력의 방향을 쉽게 이해할 수 있는 답이라서." />
        </>
      ),
    },
    {
      id: 'a3-head',
      title: '제목과 도입부 쓰기',
      task: '신문 이름, 제목, 부제, 도입부를 써요.',
      where: 'app',
      time: '기사 작성 20분',
      missing: () => [!a.title.trim() && '기사 제목', !a.lead.trim() && '도입부'].filter(Boolean) as string[],
      render: () => (
        <>
          <div className="grid2">
            <Field label="신문 이름" value={a.paperName} onChange={(v) => set('paperName', v)} maxLength={40} />
            <Field label="발행일" value={a.date} onChange={(v) => set('date', v)} maxLength={30} />
          </div>
          <Field label="기자 별명 또는 모둠명" value={a.byline} onChange={(v) => set('byline', v)} placeholder={state.reporter || '예: 사과나무 모둠'} maxLength={40} help="비워 두면 처음에 쓴 별명이 들어가요. 실명은 쓰지 않아요." />
          <Field label="기사 제목" value={a.title} onChange={(v) => set('title', v)} maxLength={120} />
          <Tip k="title" />
          <Field label="부제" optional value={a.subtitle} onChange={(v) => set('subtitle', v)} maxLength={150} />
          <Tip k="subtitle" />
          <Field label="도입부 (2~3문장)" value={a.lead} onChange={(v) => set('lead', v)} multiline rows={4} help="누가, 누구에게, 무엇을 알아보기 위해 인터뷰했는지 써요." />
          <Tip k="lead" />
        </>
      ),
    },
    {
      id: 'a3-qa',
      title: '질문과 답변 정리하기',
      task: '고른 질문과 답변을 독자가 읽기 좋게 다듬어요.',
      where: 'app',
      missing: () => (qa.length === 0 ? ['고른 인터뷰가 없어요 (첫 단계에서 골라 주세요)'] : qa.filter((p) => !p.a.trim()).map((p) => `${cardLabel(state.a2.cards, p.id)}의 답변`)),
      render: () => (
        <>
          <Note kind="info">{WRITING_TIPS.qa.tip}</Note>
          {qa.length === 0 && <Note kind="warn">아직 고른 인터뷰가 없어요. ‘기사거리 고르기’ 단계에서 골라 주세요.</Note>}
          {qa.map((p, i) => {
            const card = state.a2.cards.find((c) => c.id === p.id)!;
            return (
              <article key={p.id} className="qa-edit">
                <h3>
                  기사 속 질문·답변 {i + 1} <small>({cardLabel(state.a2.cards, p.id).split(' — ')[0]}에서)</small>
                </h3>
                <Field label="질문 (기사용)" value={p.q} onChange={(v) => setQA(p.id, { q: v })} multiline rows={2} />
                <Field label="답변 (기사용)" value={p.a} onChange={(v) => setQA(p.id, { a: v })} multiline rows={6} help={`지금 ${Array.from(p.a.replace(/\s/g, '')).length}자 · 1쪽 신문에는 한 답변에 150~250자 정도가 알맞아요.`} />
                <Expand summary="AI 답변 원문 보기 (바뀌지 않아요)">
                  <p className="raw-text">{card.answer || '(원문이 비어 있어요)'}</p>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => setQA(p.id, { q: card.question, a: cleanAnswerForArticle(card.answer) })}
                  >
                    원문에서 다시 가져오기 (기사용 글을 바꿈)
                  </button>
                </Expand>
              </article>
            );
          })}
        </>
      ),
    },
    {
      id: 'a3-image',
      title: '사진과 캡션 배치',
      task: '인터뷰 장면 이미지와 캡션을 확인해요.',
      where: 'app',
      render: () => (
        <>
          {state.a2.image && imgUrl ? (
            <div className="thumb-row">
              <img src={imgUrl} alt="가져온 인터뷰 장면" className="thumb" />
              <div>
                <p>
                  이미지를 바꾸거나 자르는 위치를 고치려면{' '}
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() =>
                      update((s) => {
                        s.activity = 2;
                        s.steps[1] = 6;
                      })
                    }
                  >
                    2활동 ‘이미지 가져오기’로 가기
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <Note kind="info">
              이미지가 없어요. 이미지 없이도 신문을 만들 수 있어요. 넣고 싶으면{' '}
              <button
                type="button"
                className="btn btn-small"
                onClick={() =>
                  update((s) => {
                    s.activity = 2;
                    s.steps[1] = 6;
                  })
                }
              >
                2활동 ‘이미지 가져오기’로 가기
              </button>
            </Note>
          )}
          {state.a2.image && (
            <Choice
              legend="신문에 넣는 방법"
              options={[
                { id: 'cover', label: '틀에 맞게 잘라 넣기' },
                { id: 'contain', label: '이미지 전체 보이기' },
              ]}
              value={state.a2.image.fit}
              onChange={(v) =>
                update((s) => {
                  if (s.a2.image) s.a2.image.fit = v;
                })
              }
            />
          )}
          <Field
            label="이미지 캡션"
            value={state.a2.caption}
            onChange={(v) =>
              update((s) => {
                s.a2.caption = v;
              })
            }
            multiline
            rows={2}
            help="캡션 위에는 ‘AI로 재구성한 가상 장면’ 같은 출처 표시가 자동으로 작게 붙어요."
          />
        </>
      ),
    },
    {
      id: 'a3-sources',
      title: '확인한 자료와 남은 질문',
      task: '확인한 과학 내용과 자료, 아직 남은 질문을 정리해요.',
      where: 'app',
      missing: () => [!a.sources.trim() && '확인한 내용과 참고 자료', !a.remaining.trim() && '남은 질문'].filter(Boolean) as string[],
      render: () => {
        const c = state.a2.check;
        const fromCheck = [c.claim && `${c.claim.trim()}`, c.source && `(확인한 자료: ${c.source.trim()})`, c.result === 'fix' && c.note && `→ 고친 설명: ${c.note.trim()}`, c.result === 'notyet' && '→ 아직 확인하지 못함']
          .filter(Boolean)
          .join(' ');
        return (
          <>
            {fromCheck && (
              <div className="record-box">
                <p>
                  <span className="q-label">2활동에서 확인한 기록</span> {fromCheck}
                </p>
                <button type="button" className="btn btn-small" onClick={() => set('sources', a.sources.trim() ? `${a.sources.trim()}\n${fromCheck}` : fromCheck)}>
                  이 기록을 아래 칸에 넣기
                </button>
              </div>
            )}
            <Field label="확인한 내용과 참고 자료" value={a.sources} onChange={(v) => set('sources', v)} multiline rows={3} />
            <Tip k="sources" />
            <Field label="아직 남은 질문 (한 문장)" value={a.remaining} onChange={(v) => set('remaining', v)} multiline rows={2} />
            <Tip k="remaining" />
          </>
        );
      },
    },
    {
      id: 'a3-review',
      title: '독자 질문 받기',
      task: '다른 모둠 친구에게 기사를 보여 주고 질문을 받은 뒤, 기사를 고쳐요.',
      where: 'app',
      time: '동료 질문 7분',
      missing: () => [!a.review.curious.trim() && !a.review.evidence.trim() && '독자의 질문', !a.review.revised.trim() && '고친 부분'].filter(Boolean) as string[],
      render: () => (
        <>
          <ol className="mini-steps">
            <li>먼저 아래 버튼으로 지금 기사를 ‘독자 질문 전 기사’로 남겨요. (고친 내용과 비교하려고요)</li>
            <li>다른 모둠 친구가 미리보기를 읽고 ①, ② 칸에 질문을 써 줘요.</li>
            <li>친구의 질문을 보고 앞 단계로 돌아가 기사를 고친 뒤, ③ 칸에 무엇을 고쳤는지 써요.</li>
          </ol>
          {a.before ? (
            <Note kind="ok">
              독자 질문 전 기사를 남겨 두었어요 ({new Date(a.before.at).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}).{' '}
              <button type="button" className="btn btn-small" onClick={() => set('before', snapshotOf(state))}>
                지금 기사로 다시 남기기
              </button>
            </Note>
          ) : (
            <button type="button" className="btn btn-primary" onClick={ensureSnapshot}>
              지금 기사를 ‘독자 질문 전 기사’로 남기기
            </button>
          )}
          <Field
            label="질문한 친구의 별명 또는 모둠명"
            optional
            value={a.review.reader}
            onChange={(v) => update((s) => void ((s.a3.review.reader = v), !s.a3.before && (s.a3.before = snapshotOf(s))))}
            maxLength={40}
          />
          {REVIEW_QUESTIONS.map((q, i) => (
            <Field
              key={q.id}
              label={`${'①②'[i]} ${q.text}`}
              value={a.review[q.id]}
              onChange={(v) =>
                update((s) => {
                  s.a3.review[q.id] = v;
                  if (!s.a3.before) s.a3.before = snapshotOf(s);
                })
              }
              multiline
              rows={2}
              help="독자(친구)가 써요."
            />
          ))}
          <Field label={`③ ${REVISION_QUESTION}`} value={a.review.revised} onChange={(v) => update((s) => void (s.a3.review.revised = v))} multiline rows={3} help="기자(나)가 써요. 고칠 필요가 없었다면 그 이유를 써도 돼요." />
          {a.before && (
            <Expand summary="독자 질문 전 기사 다시 보기">
              <dl className="before-view">
                <dt>제목</dt>
                <dd>{a.before.title || '(비어 있음)'}</dd>
                <dt>도입부</dt>
                <dd>{a.before.lead || '(비어 있음)'}</dd>
                {a.before.qa.map((p, i) => (
                  <div key={i}>
                    <dt>질문·답변 {i + 1}</dt>
                    <dd>
                      Q. {p.q}
                      <br />
                      A. {p.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </Expand>
          )}
        </>
      ),
    },
    {
      id: 'a3-export',
      title: '신문 PDF 내려받기',
      task: '미리보기를 확인하고 신문을 PDF로 내려받아요.',
      where: 'app',
      time: '수정·PDF 8분',
      render: () => <ExportPanel />,
    },
    {
      id: 'a3-save',
      title: '성찰과 저장',
      task: '질문 성장 기록을 내려받고, 활동 파일을 저장해요.',
      where: 'app',
      time: '5분',
      render: () => (
        <>
          <p>세 차시 동안 내 질문이 어떻게 달라졌는지 ‘질문 성장 기록’으로 돌아보세요.</p>
          <ExportPanelGrowthOnly />
          <SavePanel />
          <Note kind="info">공용 기기라면, 활동 파일을 저장한 뒤 오른쪽 위 ‘메뉴 → 이 기기의 내 활동 지우기’를 눌러 주세요.</Note>
        </>
      ),
    },
  ];

  return (
    <div className={`a3-wrap view-${view}`}>
      <div className="view-toggle" role="group" aria-label="화면 보기 바꾸기">
        <button type="button" className={`chip ${view === 'edit' ? 'chip-on' : ''}`} aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
          편집하기
        </button>
        <button type="button" className={`chip ${view === 'preview' ? 'chip-on' : ''}`} aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
          신문 미리보기
        </button>
      </div>
      <StepFlow activity={3} steps={steps} aside={<PaperPreview />} />
    </div>
  );
}

function ExportPanelGrowthOnly() {
  const { state } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  return (
    <div className="btn-row-wrap">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const { makeGrowthPdf } = await import('../pdf/exporter');
            const blob = await makeGrowthPdf(state);
            downloadBlob(blob, `${safeFileName(state.reporter || '기자', '질문성장기록')}.pdf`);
            setMsg({ kind: 'ok', text: '질문 성장 기록을 내려받았어요.' });
          } catch (e) {
            setMsg({ kind: 'error', text: e instanceof Error && e.message ? e.message : '만들지 못했어요. 다시 시도해 주세요.' });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? '만드는 중…' : '질문 성장 기록 내려받기 (PDF)'}
      </button>
      {msg && <Note kind={msg.kind}>{msg.text}</Note>}
    </div>
  );
}

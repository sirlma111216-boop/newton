import { SavePanel } from '../components/Backup';
import { GemGuide, InstructionBox } from '../components/Gem';
import { StepFlow, type StepDef } from '../components/StepFlow';
import { Choice, CopyButton, ExampleBadge, Expand, Field, GeminiButton, Note, PasteButton } from '../components/ui';
import {
  CHECKER_CRITERIA,
  CHECKER_DEFAULT_NAME,
  CHECKER_NAME_SUGGESTIONS,
  buildCheckerInstruction,
  buildCheckerMessage,
} from '../content/gems';
import { CHECKER_REFLECTION, CHECKER_TEST_SUGGESTIONS, GOOD_QUESTION_INTRO, MYTH_NOTE, QUESTION_EXAMPLES, QUESTION_TIPS, QUIZ } from '../content/lesson';
import { useStore } from '../state/store';

export function useCheckerInstruction() {
  const { state } = useStore();
  const generated = buildCheckerInstruction(state.a1.gemName, state.a1.focus);
  return { generated, text: state.a1.customInstruction ?? generated };
}

export function Activity1() {
  const { state, update } = useStore();
  const a = state.a1;
  const checker = useCheckerInstruction();
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) =>
    update((s) => {
      s.a1[k] = v;
    });

  const steps: StepDef[] = [
    {
      id: 'a1-intro',
      title: '좋은 질문이란?',
      task: '질문을 잘하는 다섯 가지 방법을 읽어 봐요.',
      where: 'app',
      time: '5분',
      render: () => (
        <>
          <p className="lead-text">{GOOD_QUESTION_INTRO}</p>
          <ol className="tips">
            {QUESTION_TIPS.map((t, i) => (
              <li key={t.title}>
                <span className="tip-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <p>{t.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Note kind="info">{MYTH_NOTE}</Note>
        </>
      ),
    },
    {
      id: 'a1-examples',
      title: '예시로 배우기',
      task: '질문 예시를 보고 먼저 생각한 다음, 설명을 펼쳐 봐요.',
      where: 'app',
      time: '10분',
      missing: () => {
        const n = QUESTION_EXAMPLES.filter((e) => a.seen[e.id]).length;
        return n < QUESTION_EXAMPLES.length ? [`아직 설명을 펼쳐 보지 않은 예시 ${QUESTION_EXAMPLES.length - n}개`] : [];
      },
      render: () => (
        <div className="examples">
          <p className="help">아래 예시는 선생님이 만든 수업용 예시예요. 실제 학생이 한 말이 아니에요.</p>
          {QUESTION_EXAMPLES.map((e, i) => (
            <article key={e.id} className="example">
              <div className="example-top">
                <span className="example-no">예시 {i + 1}</span>
                <ExampleBadge />
              </div>
              {e.context && <p className="example-context">{e.context}</p>}
              <p className="q-before">
                <span className="q-label">질문</span> {e.before}
              </p>
              <p className="think">
                <strong>먼저 생각해 보기 </strong>
                {e.think}
              </p>
              {a.seen[e.id] ? (
                <div className="reveal">
                  {e.after && (
                    <p className="q-after">
                      <span className="q-label">이렇게 바꿔 볼 수 있어요</span> {e.after}
                    </p>
                  )}
                  <p className="explain">
                    <strong>설명 </strong>
                    {e.explain}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() =>
                    update((s) => {
                      s.a1.seen[e.id] = true;
                    })
                  }
                >
                  생각했어요, 설명 보기
                </button>
              )}
            </article>
          ))}
        </div>
      ),
    },
    {
      id: 'a1-quiz',
      title: '질문 연습 문제',
      task: '여섯 문제를 풀며 질문을 고르고, 나누고, 이어서 써 봐요.',
      where: 'app',
      time: '7분',
      missing: () => {
        const left = QUIZ.filter((q) => {
          const r = a.quiz[q.id];
          return q.kind === 'choice' ? !r?.choice : !r?.text?.trim();
        }).length;
        return left ? [`아직 풀지 않은 문제 ${left}개`] : [];
      },
      render: () => (
        <div className="quiz">
          {QUIZ.map((q, i) => {
            const r = a.quiz[q.id] ?? { choice: '', text: '', checked: false };
            const setR = (patch: Partial<typeof r>) =>
              update((s) => {
                s.a1.quiz[q.id] = { ...r, ...patch };
              });
            return (
              <article key={q.id} className="quiz-item">
                <p className="quiz-skill">
                  문제 {i + 1} · {q.skill} <ExampleBadge />
                </p>
                {q.context && <p className="example-context">{q.context}</p>}
                {q.kind === 'choice' ? (
                  <>
                    <Choice
                      legend={q.prompt}
                      options={q.options.map((o, j) => ({ id: o.id, label: `${'①②③④'[j]} ${o.text}` }))}
                      value={r.choice}
                      onChange={(v) => setR({ choice: v })}
                    />
                    {r.choice && (
                      <div className={`quiz-feedback ${r.choice === q.answer ? 'is-right' : 'is-wrong'}`} role="status">
                        <strong>{r.choice === q.answer ? '맞아요.' : `다시 생각해 봐요. 알맞은 답은 ${'①②③④'[q.options.findIndex((o) => o.id === q.answer)]}이에요.`}</strong>{' '}
                        {q.explain}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Field label={q.prompt} multiline rows={2} value={r.text} placeholder={q.placeholder} onChange={(v) => setR({ text: v })} />
                    <div className="self-check">
                      <p className="help">스스로 확인해 봐요 (컴퓨터가 채점하지 않아요)</p>
                      <ul>
                        {q.selfCheck.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <Expand summary="예시 답 보기">
                      <p>{q.sample}</p>
                    </Expand>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ),
    },
    {
      id: 'a1-first',
      title: '나의 첫 질문',
      task: '알아보고 싶은 주제와 처음 질문을 적어요.',
      where: 'app',
      time: '질문 연습에 포함',
      missing: () =>
        [!a.topic.trim() && '주제 또는 인물', !a.want.trim() && '알고 싶은 것', !a.firstQuestion.trim() && '처음 질문'].filter(Boolean) as string[],
      render: () => (
        <>
          <p>뉴턴이 아니어도 괜찮아요. 내가 정말 궁금한 주제나 인물로 적어도 돼요.</p>
          <Field label="주제 또는 인물" value={a.topic} onChange={(v) => set('topic', v)} placeholder="예: 뉴턴, 중력" maxLength={100} />
          <Field label="알고 싶은 것" value={a.want} onChange={(v) => set('want', v)} placeholder="예: 물체가 왜 아래로 떨어지는지" multiline rows={2} />
          <Field
            label="처음 질문"
            value={a.firstQuestion}
            onChange={(v) => set('firstQuestion', v)}
            help="지금 생각나는 대로 써요. 나중에 고쳐도 처음 질문은 따로 그대로 남아요."
            multiline
            rows={2}
          />
        </>
      ),
    },
    {
      id: 'a1-design',
      title: '질문 감별기 Gem 설계하기',
      task: 'Gem 이름과 특히 연습하고 싶은 점을 골라 나만의 지시문을 만들어요.',
      where: 'app',
      time: '감별기 만들기 13분',
      render: () => (
        <>
          <p>
            <strong>Gem</strong>은 Gemini에게 미리 ‘이런 역할로, 이렇게 대답해 줘’라고 적어 두고 저장한 나만의 도우미예요. 지시문은 세 부분으로 되어 있어요.
          </p>
          <div className="parts3">
            <div>
              <strong>역할</strong>
              <p>어떤 도움을 주는 AI인지 정해요. → “질문 연습을 도와주는 감별기”</p>
            </div>
            <div>
              <strong>기준</strong>
              <p>질문에서 무엇을 살펴볼지 정해요. → “무엇을 묻는지 분명한가” 등</p>
            </div>
            <div>
              <strong>답하는 방법</strong>
              <p>피드백을 어떤 순서로 줄지 정해요. → 좋은 점 → 다듬을 부분 → 힌트</p>
            </div>
          </div>

          <fieldset className="choice">
            <legend>Gem 이름</legend>
            <div className="choice-row">
              {CHECKER_NAME_SUGGESTIONS.map((n) => (
                <button key={n} type="button" className={`chip ${a.gemName === n ? 'chip-on' : ''}`} aria-pressed={a.gemName === n} onClick={() => set('gemName', n)}>
                  {n}
                </button>
              ))}
            </div>
            <Field label="직접 쓰기" value={a.gemName} onChange={(v) => set('gemName', v)} placeholder={CHECKER_DEFAULT_NAME} maxLength={30} />
          </fieldset>

          <fieldset className="choice">
            <legend>특히 연습하고 싶은 점 (1~2개 고르기)</legend>
            <p className="help">고른 점은 지시문에 들어가서, 감별기가 그 부분을 먼저 살펴보게 돼요.</p>
            <div className="choice-row">
              {CHECKER_CRITERIA.map((c) => {
                const on = a.focus.includes(c.id);
                return (
                  <label key={c.id} className={`chip ${on ? 'chip-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        update((s) => {
                          s.a1.focus = on ? s.a1.focus.filter((x) => x !== c.id) : [...s.a1.focus, c.id];
                        })
                      }
                    />
                    <span>{c.label}</span>
                  </label>
                );
              })}
            </div>
            {a.focus.length > 2 && <p className="field-error">세 개 이상 골랐어요. 한두 개만 고르면 피드백이 더 분명해져요.</p>}
          </fieldset>

          <InstructionBox generated={checker.generated} custom={a.customInstruction} onCustom={(v) => set('customInstruction', v)} />
          <p className="help">지시문을 펼쳐서 내가 고른 이름과 연습하고 싶은 점이 들어갔는지 확인해 보세요.</p>
        </>
      ),
    },
    {
      id: 'a1-make',
      title: '질문 감별기 Gem 만들기',
      task: '안내를 따라 Gemini에서 Gem을 만들고 저장해요.',
      where: 'both',
      render: () => (
        <GemGuide
          prefix="a1"
          name={a.gemName || CHECKER_DEFAULT_NAME}
          instruction={checker.text}
          testMessage={buildCheckerMessage(a.topic || '뉴턴', a.want || '뉴턴이 태어난 시대', a.firstQuestion || '뉴턴은 언제 태어났나요?')}
          gemUrl={a.gemUrl}
          onGemUrl={(v) => set('gemUrl', v)}
        />
      ),
    },
    {
      id: 'a1-test',
      title: '감별기 시험하기',
      task: '서로 다른 질문 두 개를 보내 보고, 감별기의 피드백을 받아들일지 내가 판단해요.',
      where: 'both',
      time: '시험·수정 7분',
      missing: () => {
        const m: string[] = [];
        a.tests.slice(0, 2).forEach((t, i) => {
          if (!t.question.trim()) m.push(`시험 ${i + 1}의 질문`);
          if (!t.feedback.trim()) m.push(`시험 ${i + 1}의 감별기 피드백`);
        });
        return m;
      },
      render: () => (
        <>
          <p>
            두 질문 중 하나는 <strong>꼭 고칠 필요가 없는 사실 질문</strong>으로 해 보세요. 감별기가 짧은 질문을 무조건 나쁘다고 하지 않는지 확인하려는 거예요.
          </p>
          <Expand summary="시험용 질문 예시 보기">
            <ul>
              {CHECKER_TEST_SUGGESTIONS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Expand>
          {a.tests.slice(0, 2).map((t, i) => {
            const setT = (patch: Partial<typeof t>) =>
              update((s) => {
                s.a1.tests[i] = { ...s.a1.tests[i], ...patch };
              });
            return (
              <article key={i} className="test-card">
                <h3>시험 {i + 1}</h3>
                <Field label="감별기에 보낼 질문" value={t.question} onChange={(v) => setT({ question: v })} multiline rows={2} />
                {t.question.trim() && (
                  <div className="tool-row">
                    <CopyButton text={t.question} label="질문 복사" />
                    <GeminiButton url={a.gemUrl} label={a.gemUrl ? '저장한 감별기 열기' : 'Gemini 열기'} />
                  </div>
                )}
                <Field
                  label="감별기의 피드백"
                  action={<PasteButton onPaste={(v) => setT({ feedback: v })} />}
                  value={t.feedback}
                  onChange={(v) => setT({ feedback: v })}
                  multiline
                  rows={4}
                  help="Gemini 답변 아래 ‘복사’ 버튼을 누른 뒤 여기에 붙여 넣어요."
                />
                <Choice
                  legend="이 피드백을 어떻게 할까요?"
                  options={[
                    { id: 'accept', label: '받아들일래요' },
                    { id: 'partly', label: '일부만 받아들일래요' },
                    { id: 'keep', label: '내 질문을 그대로 둘래요' },
                  ]}
                  value={t.decision}
                  onChange={(v) => setT({ decision: v })}
                />
                <Field label="그렇게 판단한 이유" optional value={t.note} onChange={(v) => setT({ note: v })} />
              </article>
            );
          })}
          <h3 className="sub-h">감별기 살펴보기</h3>
          {CHECKER_REFLECTION.map((r) => (
            <Choice
              key={r.id}
              legend={r.text}
              options={[
                { id: 'yes', label: '그래요' },
                { id: 'partly', label: '조금' },
                { id: 'no', label: '아니요' },
              ]}
              value={a.reflection[r.id] ?? ''}
              onChange={(v) =>
                update((s) => {
                  s.a1.reflection[r.id] = v;
                })
              }
            />
          ))}
          <p className="help">아니라고 답한 것이 있다면, 지시문을 고쳐서 다시 저장해 볼 수 있어요(앞 단계의 ‘지시문 펼쳐 보기’).</p>
        </>
      ),
    },
    {
      id: 'a1-revise',
      title: '내 질문 고치기',
      task: '처음 질문을 감별기에 보내고, 피드백을 보고 내 말로 고쳐 써요.',
      where: 'both',
      missing: () =>
        [!a.gemFeedback.trim() && '감별기의 피드백', !a.revisedQuestion.trim() && '내가 고친 질문', !a.reason.trim() && '바꾼 이유'].filter(Boolean) as string[],
      render: () => (
        <>
          <div className="record-box">
            <p>
              <span className="q-label">주제</span> {a.topic || <em className="empty">아직 안 썼어요</em>}
            </p>
            <p>
              <span className="q-label">알고 싶은 것</span> {a.want || <em className="empty">아직 안 썼어요</em>}
            </p>
            <p>
              <span className="q-label">처음 질문 (그대로 남아요)</span> {a.firstQuestion || <em className="empty">아직 안 썼어요 — ‘나의 첫 질문’ 단계에서 쓸 수 있어요</em>}
            </p>
          </div>
          <div className="tool-row">
            <CopyButton text={buildCheckerMessage(a.topic, a.want, a.firstQuestion)} label="감별기에 보낼 글 복사" className="btn-primary" />
            <GeminiButton url={a.gemUrl} label={a.gemUrl ? '저장한 감별기 열기' : 'Gemini 열기'} />
          </div>
          <Field
            label="감별기의 피드백"
                  action={<PasteButton onPaste={(v) => set('gemFeedback', v)} />}
            value={a.gemFeedback}
            onChange={(v) => set('gemFeedback', v)}
            multiline
            rows={5}
          />
          <Field
            label="내가 고친 질문"
            value={a.revisedQuestion}
            onChange={(v) => set('revisedQuestion', v)}
            multiline
            rows={2}
            help="감별기가 써 준 문장을 그대로 옮기지 말고 내 말로 써요. 처음 질문이 더 낫다고 생각하면 그대로 두고 이유를 써도 돼요."
          />
          {!a.revisedQuestion && a.firstQuestion && (
            <button type="button" className="btn btn-small" onClick={() => set('revisedQuestion', a.firstQuestion)}>
              처음 질문을 옮겨 와서 고치기
            </button>
          )}
          <Field label="바꾼 이유 (한 문장)" value={a.reason} onChange={(v) => set('reason', v)} placeholder="예: 한 번에 두 가지를 묻고 있어서 하나로 줄였다." />
        </>
      ),
    },
    {
      id: 'a1-save',
      title: '저장하기',
      task: '오늘 활동을 활동 파일로 저장해요.',
      where: 'app',
      time: '3분',
      render: () => <SavePanel />,
    },
  ];

  return <StepFlow activity={1} steps={steps} />;
}

import { useState } from 'react';
import { SavePanel } from '../components/Backup';
import { GemGuide, GemUrlField, InstructionBox } from '../components/Gem';
import { ImagePicker } from '../components/ImagePicker';
import { StepFlow, type StepDef } from '../components/StepFlow';
import { Choice, CopyButton, Expand, Field, GeminiButton, Note, PasteButton, WhereTag } from '../components/ui';
import {
  ANSWER_LENGTH_OPTIONS,
  INTEREST_OPTIONS,
  NEWTON_DEFAULT_NAME,
  PLACE_OPTIONS,
  SCENE_DEFAULT_NAME,
  SCENE_INSTRUCTION,
  STYLE_OPTIONS,
  TONE_OPTIONS,
  buildNewtonInstruction,
  buildSceneRequest,
} from '../content/gems';
import { IMAGE_FALLBACK, IMAGE_STEPS } from '../content/guide';
import { FOLLOW_UP_HINTS } from '../content/lesson';
import { CAPTION_NOTICE_HINT } from '../content/newspaper';
import { newId } from '../state/defaults';
import { useStore } from '../state/store';
import type { InterviewCard, QKind } from '../state/types';
import { useCheckerInstruction } from './Activity1';

export const KIND_LABEL: Record<QKind, string> = { personal: '개인적 질문', science: '과학적 질문', other: '기타' };

export function cardLabel(cards: InterviewCard[], id: string | null): string {
  const i = cards.findIndex((c) => c.id === id);
  if (i < 0) return '';
  const q = cards[i].question.trim();
  return `질문 ${i + 1}${q ? ` — ${Array.from(q).slice(0, 24).join('')}${Array.from(q).length > 24 ? '…' : ''}` : ''}`;
}

function InterviewCards() {
  const { state, update } = useStore();
  const a = state.a2;
  const cards = a.cards;
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const checker = useCheckerInstruction();

  const add = (fromId: string | null = null) => {
    const id = newId();
    update((s) => {
      s.a2.cards.push({ id, question: '', kind: fromId ? (s.a2.cards.find((c) => c.id === fromId)?.kind ?? 'science') : 'personal', answer: '', fromId, candidate: false, memo: '', createdAt: Date.now() });
    });
    window.setTimeout(() => document.getElementById(`q-${id}`)?.focus(), 50);
  };
  const setC = (id: string, patch: Partial<InterviewCard>) =>
    update((s) => {
      const c = s.a2.cards.find((x) => x.id === id);
      if (c) Object.assign(c, patch);
    });

  const personal = cards.filter((c) => c.question.trim() && c.kind === 'personal').length;
  const science = cards.filter((c) => c.question.trim() && c.kind === 'science').length;
  const follow = cards.filter((c) => c.question.trim() && c.fromId).length;
  const asked = cards.filter((c) => c.question.trim()).length;

  return (
    <div className="interview">
      <div className="interview-guide">
        <p>
          <strong>순서</strong> ① 웹앱에 질문 쓰기 → ② ‘질문 복사’ → ③ Gemini의 뉴턴 Gem에 붙여 넣고 보내기 → ④ 답변 아래 ‘복사’ → ⑤ 웹앱 ‘AI 답변’ 칸에 붙여넣기
        </p>
        <p className="help">인터뷰는 Gemini의 한 대화창에서 이어서 하세요. 새 대화를 열면 앞에서 한 이야기를 기억하지 못할 수 있어요.</p>
        <ul className="tally" aria-label="지금까지의 인터뷰">
          <li>질문 {asked}개 <small>(4~6개 권장)</small></li>
          <li>개인적 질문 {personal}개</li>
          <li>과학적 질문 {science}개</li>
          <li>이어서 물은 질문 {follow}개 <small>(2번 정도 시도)</small></li>
        </ul>
        <p className="help">개수를 채우는 것보다, 답을 읽고 정말 궁금해진 것을 묻는 것이 더 중요해요.</p>
        <div className="tool-row">
          <GeminiButton url={a.gemUrl} label={a.gemUrl ? '저장한 뉴턴 Gem 열기' : 'Gemini 열기'} />
        </div>
      </div>

      <Expand summary="이어서 물을 질문이 잘 떠오르지 않을 때 (힌트)">
        <ul>
          {FOLLOW_UP_HINTS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </Expand>
      <Expand summary="질문을 보내기 전에 감별기로 점검하고 싶다면 (선택)">
        <p>꼭 하지 않아도 돼요. 점검하고 싶은 질문만 1차시에 만든 질문 감별기에 보내 보세요.</p>
        <div className="tool-row">
          {state.a1.gemUrl ? <GeminiButton url={state.a1.gemUrl} label="저장한 질문 감별기 열기" /> : <GeminiButton />}
          <CopyButton text={checker.text} label="감별기 지시문 복사" />
        </div>
      </Expand>

      {cards.length === 0 && <Note kind="info">아직 질문 카드가 없어요. 아래 ‘새 질문 카드’를 눌러 첫 질문을 써 보세요.</Note>}

      <ol className="cards">
        {cards.map((c, i) => {
          const prev = cards.slice(0, i).filter((p) => p.answer.trim() || p.question.trim());
          return (
            <li key={c.id} className={`qcard ${c.candidate ? 'is-candidate' : ''}`}>
              <div className="qcard-head">
                <h3>질문 {i + 1}</h3>
                {c.fromId && <span className="tag-follow">이어서 물은 질문 · {cardLabel(cards, c.fromId).split(' — ')[0]}에서</span>}
                {c.candidate && <span className="tag-candidate">기사 후보</span>}
              </div>
              <Choice
                legend="질문 구분"
                options={(['personal', 'science', 'other'] as QKind[]).map((k) => ({ id: k, label: KIND_LABEL[k] }))}
                value={c.kind}
                onChange={(v) => setC(c.id, { kind: v })}
              />
              <div className="field">
                <label htmlFor={`from-${c.id}`}>어느 답에서 이어진 질문인가요?</label>
                <select id={`from-${c.id}`} value={c.fromId ?? ''} onChange={(e) => setC(c.id, { fromId: e.target.value || null })}>
                  <option value="">새로운 질문 (이어지지 않음)</option>
                  {prev.map((p) => (
                    <option key={p.id} value={p.id}>
                      {cardLabel(cards, p.id)}의 답에서 이어짐
                    </option>
                  ))}
                </select>
              </div>
              {c.fromId && (() => {
                const src = cards.find((x) => x.id === c.fromId);
                return src?.answer.trim() ? (
                  <Expand summary="이어진 앞 답변 다시 보기">
                    <p className="raw-text">{src.answer}</p>
                  </Expand>
                ) : null;
              })()}
              <Field id={`q-${c.id}`} label="내 질문" value={c.question} onChange={(v) => setC(c.id, { question: v })} multiline rows={2} />
              {c.question.trim() && (
                <div className="tool-row">
                  <WhereTag where="gemini" />
                  <CopyButton text={c.question.trim()} label="질문 복사" className="btn-primary" />
                </div>
              )}
              <Field
                label="AI 답변 (원문 그대로)"
                action={<PasteButton onPaste={(v) => setC(c.id, { answer: v })} />}
                value={c.answer}
                onChange={(v) => setC(c.id, { answer: v })}
                multiline
                rows={5}
                help="Gemini 답변을 그대로 붙여 넣어요. 기사에 넣을 문장은 신문 편집실에서 따로 다듬기 때문에, 여기 원문은 바뀌지 않아요."
              />
              <div className="qcard-foot">
                <label className="check">
                  <input type="checkbox" checked={c.candidate} onChange={(e) => setC(c.id, { candidate: e.target.checked })} />
                  <span>기사 후보로 표시</span>
                </label>
                <Field label="짧은 메모" optional value={c.memo} onChange={(v) => setC(c.id, { memo: v })} placeholder="예: 확인이 필요함, 독자가 재미있어할 것 같음" />
              </div>
              <div className="btn-row">
                {c.answer.trim() && (
                  <button type="button" className="btn btn-small" onClick={() => add(c.id)}>
                    ↳ 이 답에서 이어서 묻기
                  </button>
                )}
                {confirmDel === c.id ? (
                  <span className="inline-confirm" role="alert">
                    이 카드를 지울까요?{' '}
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => {
                        update((s) => {
                          s.a2.cards = s.a2.cards.filter((x) => x.id !== c.id).map((x) => (x.fromId === c.id ? { ...x, fromId: null } : x));
                          s.a3.picks = s.a3.picks.filter((x) => x !== c.id);
                          s.a2.sceneCardIds = s.a2.sceneCardIds.filter((x) => x !== c.id);
                          if (s.a2.check.cardId === c.id) s.a2.check.cardId = null;
                        });
                        setConfirmDel(null);
                      }}
                    >
                      지우기
                    </button>{' '}
                    <button type="button" className="btn btn-small" onClick={() => setConfirmDel(null)}>
                      그대로 두기
                    </button>
                  </span>
                ) : (
                  <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirmDel(c.id)}>
                    카드 지우기
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn btn-primary" onClick={() => add(null)}>
        + 새 질문 카드
      </button>
    </div>
  );
}

export function Activity2() {
  const { state, update } = useStore();
  const a = state.a2;
  const set = <K extends keyof typeof a>(k: K, v: (typeof a)[K]) =>
    update((s) => {
      s.a2[k] = v;
    });
  const generated = buildNewtonInstruction({ length: a.length, tone: a.tone, interest: a.interest });
  const newtonText = a.customInstruction ?? generated;
  const sceneText = a.sceneCustomInstruction ?? SCENE_INSTRUCTION;
  const answered = a.cards.filter((c) => c.question.trim() && c.answer.trim());
  const sceneRequest = buildSceneRequest({
    excerpt: a.excerpt,
    place: a.place,
    placeCustom: a.placeCustom,
    style: a.style,
    reporter: a.reporterInScene,
    mood: a.mood,
  });

  const fillExcerpt = () =>
    update((s) => {
      const picked = s.a2.cards.filter((c) => s.a2.sceneCardIds.includes(c.id));
      s.a2.excerpt = picked.map((c) => `기자: ${c.question.trim()}\n뉴턴(가상): ${c.answer.trim()}`).join('\n\n');
    });

  const steps: StepDef[] = [
    {
      id: 'a2-setup',
      title: '뉴턴 인터뷰 Gem 설정',
      task: '뉴턴 역할을 맡을 Gem의 답변 길이·말투·관심사를 골라요.',
      where: 'app',
      time: '뉴턴 Gem 만들기 8분',
      render: () => (
        <>
          <p className="lead-text">
            이제 기자가 되어 뉴턴에게 질문해 봅시다. 이 대화는 <strong>AI가 뉴턴의 역할을 맡는 가상 인터뷰</strong>예요. 실제 뉴턴의 말을 녹음하거나 옮긴 것은
            아니에요.
          </p>
          <Field label="Gem 이름" value={a.gemName} onChange={(v) => set('gemName', v)} placeholder={NEWTON_DEFAULT_NAME} maxLength={30} />
          <Choice legend="답변 길이" options={ANSWER_LENGTH_OPTIONS} value={a.length} onChange={(v) => set('length', v)} />
          <Choice legend="말투" options={TONE_OPTIONS} value={a.tone} onChange={(v) => set('tone', v)} />
          <Choice
            legend="내가 특히 궁금한 것"
            options={INTEREST_OPTIONS}
            value={a.interest}
            onChange={(v) => set('interest', v)}
            help="어느 것을 골라도 개인적인 질문과 과학적인 질문을 모두 할 수 있어요."
          />
          <InstructionBox generated={generated} custom={a.customInstruction} onCustom={(v) => set('customInstruction', v)} />
        </>
      ),
    },
    {
      id: 'a2-make',
      title: '뉴턴 인터뷰 Gem 만들기',
      task: 'Gemini에서 뉴턴 인터뷰 Gem을 만들고 저장해요.',
      where: 'both',
      render: () => (
        <>
          <div className="toggle-row">
            <button type="button" className={`chip ${a.shortGuide ? 'chip-on' : ''}`} aria-pressed={a.shortGuide} onClick={() => set('shortGuide', true)}>
              앞에서 해 봤어요 — 짧은 안내
            </button>
            <button type="button" className={`chip ${!a.shortGuide ? 'chip-on' : ''}`} aria-pressed={!a.shortGuide} onClick={() => set('shortGuide', false)}>
              자세한 안내 보기
            </button>
          </div>
          <GemGuide
            prefix="a2"
            short={a.shortGuide}
            name={a.gemName || NEWTON_DEFAULT_NAME}
            instruction={newtonText}
            testMessage="안녕하세요, 뉴턴 선생님. 어린 시절에는 무엇을 하며 지내셨나요?"
            gemUrl={a.gemUrl}
            onGemUrl={(v) => set('gemUrl', v)}
          />
        </>
      ),
    },
    {
      id: 'a2-interview',
      title: '뉴턴 인터뷰하기',
      task: '질문을 쓰고 Gemini에 보낸 뒤, 답변을 붙여 넣어 모아요.',
      where: 'both',
      time: '17분',
      missing: () => {
        const m: string[] = [];
        if (answered.length < 4) m.push(`답변까지 모은 질문이 ${answered.length}개예요 (4~6개 권장)`);
        if (!a.cards.some((c) => c.kind === 'personal' && c.question.trim())) m.push('개인적 질문');
        if (!a.cards.some((c) => c.kind === 'science' && c.question.trim())) m.push('과학적 질문');
        if (!a.cards.some((c) => c.fromId)) m.push('앞선 답에서 이어서 물은 질문');
        if (!a.cards.some((c) => c.candidate)) m.push('기사 후보 표시');
        return m;
      },
      render: () => <InterviewCards />,
    },
    {
      id: 'a2-check',
      title: '기사에 넣기 전 짧은 확인',
      task: '핵심 과학 내용 하나를 골라 교과서나 선생님 자료와 비교해요.',
      where: 'app',
      time: '6분',
      missing: () =>
        [!a.check.claim.trim() && '확인할 내용', !a.check.source.trim() && '확인한 자료', !a.check.result && '확인 결과'].filter(Boolean) as string[],
      render: () => (
        <>
          <Note kind="warn">
            AI의 답에 링크나 책 이름이 있어도, 그것만으로 확인된 것은 아니에요. 내가 직접 자료를 보고 확인해야 해요. 확인되지 않은 개인적·역사적 이야기는 기사에서
            실제 사실이나 뉴턴이 실제로 한 말처럼 쓰지 않아요.
          </Note>
          <div className="field">
            <label htmlFor="check-card">어느 답변의 내용인가요? (선택)</label>
            <select id="check-card" value={a.check.cardId ?? ''} onChange={(e) => update((s) => void (s.a2.check.cardId = e.target.value || null))}>
              <option value="">고르지 않음</option>
              {a.cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {cardLabel(a.cards, c.id)}
                </option>
              ))}
            </select>
          </div>
          {a.check.cardId && (
            <Expand summary="고른 답변 원문 보기" open>
              <p className="raw-text">{a.cards.find((c) => c.id === a.check.cardId)?.answer || '(답변이 비어 있어요)'}</p>
            </Expand>
          )}
          <Field
            label="확인할 내용"
            value={a.check.claim}
            onChange={(v) => update((s) => void (s.a2.check.claim = v))}
            multiline
            rows={2}
            placeholder="예: 지구 반대편에서도 중력은 지구 중심 쪽으로 작용한다."
          />
          <Field
            label="확인한 자료의 제목과 쪽수 또는 주소"
            value={a.check.source}
            onChange={(v) => update((s) => void (s.a2.check.source = v))}
            placeholder="예: 과학 1 교과서 ○○쪽 / 선생님 자료 ‘중력’ 2쪽"
          />
          <Choice
            legend="확인 결과"
            options={[
              { id: 'use', label: '그대로 사용' },
              { id: 'fix', label: '고쳐서 사용' },
              { id: 'notyet', label: '아직 확인하지 못함' },
            ]}
            value={a.check.result}
            onChange={(v) => update((s) => void (s.a2.check.result = v))}
          />
          <Field
            label={a.check.result === 'fix' ? '고친 설명' : '판단 이유'}
            value={a.check.note}
            onChange={(v) => update((s) => void (s.a2.check.note = v))}
            multiline
            rows={2}
          />
          {a.check.result === 'notyet' && <Note kind="info">아직 확인하지 못한 내용은 기사에서 “아직 확인하지 못했다”고 밝히거나, ‘남은 질문’으로 써 보세요.</Note>}
        </>
      ),
    },
    {
      id: 'a2-scene-gem',
      title: '장면 제작소 Gem 만들기',
      task: '기사에 넣을 그림을 도와줄 세 번째 Gem을 만들어요.',
      where: 'both',
      time: '장면 Gem·이미지 10분',
      render: () => (
        <>
          <p>
            세 번째 Gem의 이름은 <strong>‘{SCENE_DEFAULT_NAME}’</strong>예요. 인터뷰 내용을 보고 어울리는 장면 그림을 만들도록 도와줘요.
          </p>
          <Field label="Gem 이름" value={a.sceneGemName} onChange={(v) => set('sceneGemName', v)} placeholder={SCENE_DEFAULT_NAME} maxLength={30} />
          <InstructionBox generated={SCENE_INSTRUCTION} custom={a.sceneCustomInstruction} onCustom={(v) => set('sceneCustomInstruction', v)} />
          <GemGuide
            prefix="a2s"
            short
            name={a.sceneGemName || SCENE_DEFAULT_NAME}
            instruction={sceneText}
            testMessage="서재에서 뉴턴이 프리즘을 들고 있는 신문 삽화를 만들어 주세요."
            gemUrl={a.sceneGemUrl}
            onGemUrl={(v) => set('sceneGemUrl', v)}
          />
        </>
      ),
    },
    {
      id: 'a2-scene-request',
      title: '장면 요청 만들기',
      task: '기사에 넣고 싶은 대화를 고르고 장면을 정해 요청문을 만들어요.',
      where: 'both',
      missing: () => [!a.excerpt.trim() && '그림에 담을 인터뷰 내용'].filter(Boolean) as string[],
      render: () => (
        <>
          <fieldset className="choice">
            <legend>그림에 담을 대화 고르기</legend>
            {answered.length === 0 ? (
              <Note kind="info">답변까지 모은 질문이 아직 없어요. ‘뉴턴 인터뷰하기’ 단계에서 먼저 인터뷰해 주세요. 아래 칸에 직접 써도 돼요.</Note>
            ) : (
              <div className="pick-list">
                {answered.map((c) => {
                  const on = a.sceneCardIds.includes(c.id);
                  return (
                    <label key={c.id} className={`pick ${on ? 'is-on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          update((s) => {
                            s.a2.sceneCardIds = on ? s.a2.sceneCardIds.filter((x) => x !== c.id) : [...s.a2.sceneCardIds, c.id];
                          })
                        }
                      />
                      <span>
                        <strong>{cardLabel(a.cards, c.id)}</strong>
                        {c.candidate && <span className="tag-candidate">기사 후보</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {a.sceneCardIds.length > 0 && (
              <button type="button" className="btn btn-small" onClick={fillExcerpt}>
                고른 대화로 아래 칸 채우기
              </button>
            )}
          </fieldset>
          <Field
            label="그림에 담을 인터뷰 내용"
            value={a.excerpt}
            onChange={(v) => set('excerpt', v)}
            multiline
            rows={5}
            help="길면 장면에 꼭 필요한 부분만 남기고 줄여도 돼요. 인터뷰 기록 원문은 바뀌지 않아요."
          />
          <Choice legend="장소" options={PLACE_OPTIONS.map((p) => ({ id: p.id, label: p.label }))} value={a.place} onChange={(v) => set('place', v)} />
          {a.place === 'custom' && <Field label="장소 직접 쓰기" value={a.placeCustom} onChange={(v) => set('placeCustom', v)} placeholder="예: 케임브리지 대학의 오래된 강의실" />}
          <Choice legend="표현 방식" options={STYLE_OPTIONS.map((p) => ({ id: p.id, label: p.label }))} value={a.style} onChange={(v) => set('style', v)} />
          {a.style === 'photo' && (
            <Note kind="info">사진처럼 표현해도 실제 역사 사진이 아니에요. 뉴턴이 살던 시대에는 사진기가 없었어요. 캡션에 ‘AI로 재구성한 가상 장면’이라고 꼭 밝혀요.</Note>
          )}
          <Choice
            legend="가상의 학생 기자도 함께 나오게 할까요?"
            options={[
              { id: 'yes', label: '함께 나와요' },
              { id: 'no', label: '뉴턴만 나와요' },
            ]}
            value={a.reporterInScene ? 'yes' : 'no'}
            onChange={(v) => set('reporterInScene', v === 'yes')}
            help="내 얼굴 사진은 필요 없어요. 가상의 인물로 그려져요."
          />
          <Field label="원하는 구도나 분위기" optional value={a.mood} onChange={(v) => set('mood', v)} placeholder="예: 창가에서 햇빛을 받으며 마주 앉은 모습, 차분한 분위기" />
          <h3 className="sub-h">Gemini에 보낼 장면 요청</h3>
          <pre className="pre-msg">{sceneRequest}</pre>
          <div className="tool-row">
            <CopyButton text={sceneRequest} label="장면 요청 복사" className="btn-primary" />
            <GeminiButton url={a.sceneGemUrl} label={a.sceneGemUrl ? '저장한 장면 제작소 열기' : 'Gemini 열기'} />
          </div>
        </>
      ),
    },
    {
      id: 'a2-image',
      title: '이미지 가져오기와 캡션',
      task: 'Gemini에서 만든 그림을 내려받아 이 웹앱으로 가져오고 캡션을 써요.',
      where: 'both',
      missing: () => [!a.image && '이미지 (없어도 신문은 만들 수 있어요)', a.image && !a.caption.trim() && '캡션'].filter(Boolean) as string[],
      render: () => (
        <>
          <Expand summary="그림을 만들고 가져오는 8단계 보기" open={!a.image}>
            <ol className="mini-steps">
              {IMAGE_STEPS.map((s) => (
                <li key={s.title}>
                  <WhereTag where={s.where} /> <strong>{s.title}</strong> — {s.body}
                </li>
              ))}
            </ol>
          </Expand>
          <Expand summary="그림이 안 만들어질 때">
            <ul>
              {IMAGE_FALLBACK.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Expand>
          <ImagePicker />
          <Field
            label="이미지 캡션"
            value={a.caption}
            onChange={(v) => set('caption', v)}
            multiline
            rows={2}
            help={`가상 장면이라는 점이 드러나게 써요. ${CAPTION_NOTICE_HINT}`}
          />
          {a.caption.trim() && !/(AI|가상|재구성)/.test(a.caption) && (
            <Note kind="warn">캡션에 ‘AI로 재구성한 가상 장면’이라는 뜻이 보이지 않아요. 신문에는 이 표시가 자동으로 한 번 더 붙지만, 캡션에도 써 주면 좋아요.</Note>
          )}
          <GemUrlField value={a.sceneGemUrl} onChange={(v) => set('sceneGemUrl', v)} label="장면 제작소 Gem 주소" />
        </>
      ),
    },
    {
      id: 'a2-save',
      title: '저장하기',
      task: '오늘 활동을 활동 파일로 저장해요.',
      where: 'app',
      time: '4분',
      render: () => <SavePanel />,
    },
  ];

  return <StepFlow activity={2} steps={steps} />;
}

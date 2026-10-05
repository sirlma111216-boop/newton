// 저장된 값이나 불러온 파일을 그대로 믿지 않고, 알맞은 형태로만 받아들입니다.
import { createInitialState } from './defaults';
import type { AppState, ArticleSnapshot, CheckerTest, ImageInfo, InterviewCard } from './types';

const MAX_TEXT = 20000;

type U = unknown;
const isObj = (v: U): v is Record<string, U> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: U, d = ''): string => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : d);
const strOrNull = (v: U): string | null => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : null);
const bool = (v: U, d = false): boolean => (typeof v === 'boolean' ? v : d);
const num = (v: U, d: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
function oneOf<T extends string>(v: U, allowed: readonly T[], d: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : d;
}
const strArr = (v: U, limit = 50): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, limit).map((s) => s.slice(0, 200)) : [];
function boolRecord(v: U): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v).slice(0, 300)) if (typeof x === 'boolean') out[k.slice(0, 100)] = x;
  return out;
}

function card(v: U): InterviewCard | null {
  if (!isObj(v) || typeof v.id !== 'string') return null;
  return {
    id: v.id.slice(0, 100),
    question: str(v.question),
    kind: oneOf(v.kind, ['personal', 'science', 'other'] as const, 'other'),
    answer: str(v.answer),
    fromId: typeof v.fromId === 'string' ? v.fromId.slice(0, 100) : null,
    candidate: bool(v.candidate),
    memo: str(v.memo),
    createdAt: num(v.createdAt, Date.now()),
  };
}

function test(v: U): CheckerTest {
  const o = isObj(v) ? v : {};
  return {
    question: str(o.question),
    feedback: str(o.feedback),
    decision: oneOf(o.decision, ['', 'accept', 'partly', 'keep'] as const, ''),
    note: str(o.note),
  };
}

function image(v: U): ImageInfo | null {
  if (!isObj(v) || typeof v.key !== 'string') return null;
  return {
    key: v.key.slice(0, 100),
    name: str(v.name).slice(0, 200),
    width: num(v.width, 1, 1, 100000),
    height: num(v.height, 1, 1, 100000),
    source: oneOf(v.source, ['gemini', 'teacher', 'drawing'] as const, 'gemini'),
    fit: oneOf(v.fit, ['cover', 'contain'] as const, 'cover'),
    focusX: num(v.focusX, 50, 0, 100),
    focusY: num(v.focusY, 50, 0, 100),
  };
}

function snapshot(v: U): ArticleSnapshot | null {
  if (!isObj(v)) return null;
  return {
    at: num(v.at, Date.now()),
    title: str(v.title),
    subtitle: str(v.subtitle),
    lead: str(v.lead),
    qa: Array.isArray(v.qa)
      ? v.qa.slice(0, 10).map((x) => (isObj(x) ? { q: str(x.q), a: str(x.a) } : { q: '', a: '' }))
      : [],
    caption: str(v.caption),
    sources: str(v.sources),
    remaining: str(v.remaining),
  };
}

/** 알 수 없는 값을 AppState로 바꿉니다. 형태가 전혀 맞지 않으면 null. */
export function sanitizeState(raw: U): AppState | null {
  if (!isObj(raw) || raw.format !== 1) return null;
  const d = createInitialState();
  const a1 = isObj(raw.a1) ? raw.a1 : {};
  const a2 = isObj(raw.a2) ? raw.a2 : {};
  const a3 = isObj(raw.a3) ? raw.a3 : {};
  const steps = Array.isArray(raw.steps) ? raw.steps : [];

  const quiz: AppState['a1']['quiz'] = {};
  if (isObj(a1.quiz))
    for (const [k, x] of Object.entries(a1.quiz).slice(0, 30))
      if (isObj(x)) quiz[k.slice(0, 50)] = { choice: str(x.choice).slice(0, 10), text: str(x.text), checked: bool(x.checked) };

  const reflection: AppState['a1']['reflection'] = {};
  if (isObj(a1.reflection))
    for (const [k, x] of Object.entries(a1.reflection).slice(0, 20))
      reflection[k.slice(0, 50)] = oneOf(x, ['', 'yes', 'partly', 'no'] as const, '');

  const cards = (Array.isArray(a2.cards) ? a2.cards : []).slice(0, 60).map(card).filter((c): c is InterviewCard => !!c);
  const cardIds = new Set(cards.map((c) => c.id));
  for (const c of cards) if (c.fromId && !cardIds.has(c.fromId)) c.fromId = null;

  const check = isObj(a2.check) ? a2.check : {};
  const qa: AppState['a3']['qa'] = {};
  if (isObj(a3.qa))
    for (const [k, x] of Object.entries(a3.qa).slice(0, 60)) if (isObj(x)) qa[k.slice(0, 100)] = { q: str(x.q), a: str(x.a) };
  const review = isObj(a3.review) ? a3.review : {};

  const tests = Array.isArray(a1.tests) ? a1.tests.slice(0, 4).map(test) : d.a1.tests;
  while (tests.length < 2) tests.push(test({}));

  return {
    format: 1,
    workId: str(raw.workId, d.workId).slice(0, 100) || d.workId,
    createdAt: num(raw.createdAt, d.createdAt),
    updatedAt: num(raw.updatedAt, d.updatedAt),
    reporter: str(raw.reporter).slice(0, 40),
    started: bool(raw.started),
    activity: raw.activity === 1 || raw.activity === 2 || raw.activity === 3 ? raw.activity : 0,
    steps: [num(steps[0], 0, 0, 30), num(steps[1], 0, 0, 30), num(steps[2], 0, 0, 30)].map(Math.floor) as [number, number, number],
    done: boolRecord(raw.done),
    a1: {
      seen: boolRecord(a1.seen),
      quiz,
      topic: str(a1.topic),
      want: str(a1.want),
      firstQuestion: str(a1.firstQuestion),
      gemFeedback: str(a1.gemFeedback),
      revisedQuestion: str(a1.revisedQuestion),
      reason: str(a1.reason),
      gemName: str(a1.gemName, d.a1.gemName).slice(0, 60),
      focus: strArr(a1.focus, 5),
      customInstruction: strOrNull(a1.customInstruction),
      gemUrl: str(a1.gemUrl).slice(0, 500),
      tests,
      reflection,
    },
    a2: {
      gemName: str(a2.gemName, d.a2.gemName).slice(0, 60),
      length: oneOf(a2.length, ['short', 'detail'] as const, 'short'),
      tone: oneOf(a2.tone, ['friendly', 'calm'] as const, 'friendly'),
      interest: oneOf(a2.interest, ['life', 'science', 'both'] as const, 'both'),
      customInstruction: strOrNull(a2.customInstruction),
      gemUrl: str(a2.gemUrl).slice(0, 500),
      shortGuide: bool(a2.shortGuide, true),
      cards,
      check: {
        cardId: typeof check.cardId === 'string' && cardIds.has(check.cardId) ? check.cardId : null,
        claim: str(check.claim),
        source: str(check.source),
        result: oneOf(check.result, ['', 'use', 'fix', 'notyet'] as const, ''),
        note: str(check.note),
      },
      sceneGemName: str(a2.sceneGemName, d.a2.sceneGemName).slice(0, 60),
      sceneCustomInstruction: strOrNull(a2.sceneCustomInstruction),
      sceneGemUrl: str(a2.sceneGemUrl).slice(0, 500),
      sceneCardIds: strArr(a2.sceneCardIds, 10).filter((id) => cardIds.has(id)),
      excerpt: str(a2.excerpt),
      place: oneOf(a2.place, ['study', 'garden', 'lab', 'custom'] as const, 'study'),
      placeCustom: str(a2.placeCustom).slice(0, 200),
      style: oneOf(a2.style, ['illustration', 'historical', 'photo'] as const, 'illustration'),
      reporterInScene: bool(a2.reporterInScene, true),
      mood: str(a2.mood).slice(0, 500),
      image: image(a2.image),
      caption: str(a2.caption).slice(0, 1000),
    },
    a3: {
      paperName: str(a3.paperName, d.a3.paperName).slice(0, 60),
      date: str(a3.date, d.a3.date).slice(0, 40),
      byline: str(a3.byline).slice(0, 60),
      picks: strArr(a3.picks, 6).filter((id) => cardIds.has(id)),
      pickReason: str(a3.pickReason),
      title: str(a3.title).slice(0, 300),
      subtitle: str(a3.subtitle).slice(0, 300),
      lead: str(a3.lead),
      qa,
      sources: str(a3.sources),
      remaining: str(a3.remaining),
      pages: a3.pages === 2 ? 2 : 1,
      review: { reader: str(review.reader).slice(0, 60), curious: str(review.curious), evidence: str(review.evidence), revised: str(review.revised) },
      before: snapshot(a3.before),
    },
  };
}

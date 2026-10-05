import { CHECKER_DEFAULT_NAME, NEWTON_DEFAULT_NAME, SCENE_DEFAULT_NAME } from '../content/gems';
import { DEFAULT_PAPER_NAME } from '../content/newspaper';
import type { AppState } from './types';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function createInitialState(): AppState {
  const now = Date.now();
  return {
    format: 1,
    workId: newId(),
    createdAt: now,
    updatedAt: now,
    reporter: '',
    started: false,
    activity: 0,
    steps: [0, 0, 0],
    done: {},
    a1: {
      seen: {},
      quiz: {},
      topic: '',
      want: '',
      firstQuestion: '',
      gemFeedback: '',
      revisedQuestion: '',
      reason: '',
      gemName: CHECKER_DEFAULT_NAME,
      focus: [],
      customInstruction: null,
      gemUrl: '',
      tests: [
        { question: '', feedback: '', decision: '', note: '' },
        { question: '', feedback: '', decision: '', note: '' },
      ],
      reflection: {},
    },
    a2: {
      gemName: NEWTON_DEFAULT_NAME,
      length: 'short',
      tone: 'friendly',
      interest: 'both',
      customInstruction: null,
      gemUrl: '',
      shortGuide: true,
      cards: [],
      check: { cardId: null, claim: '', source: '', result: '', note: '' },
      sceneGemName: SCENE_DEFAULT_NAME,
      sceneCustomInstruction: null,
      sceneGemUrl: '',
      sceneCardIds: [],
      excerpt: '',
      place: 'study',
      placeCustom: '',
      style: 'illustration',
      reporterInScene: true,
      mood: '',
      image: null,
      caption: '',
    },
    a3: {
      paperName: DEFAULT_PAPER_NAME,
      date: todayString(),
      byline: '',
      picks: [],
      pickReason: '',
      title: '',
      subtitle: '',
      lead: '',
      qa: {},
      sources: '',
      remaining: '',
      pages: 1,
      review: { reader: '', curious: '', evidence: '', revised: '' },
      before: null,
    },
  };
}

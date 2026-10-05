import type { AnswerLength, Interest, Place, SceneStyle, Tone } from '../content/gems';

export type QKind = 'personal' | 'science' | 'other';
export type Judge = '' | 'yes' | 'partly' | 'no';

export interface InterviewCard {
  id: string;
  question: string;
  kind: QKind;
  answer: string; // AI 답변 원문 (기사 편집과 별도로 보존)
  fromId: string | null; // 이어서 물은 앞선 카드
  candidate: boolean; // 기사 후보
  memo: string;
  createdAt: number;
}

export interface CheckerTest {
  question: string;
  feedback: string;
  decision: '' | 'accept' | 'partly' | 'keep';
  note: string;
}

export interface ImageInfo {
  key: string; // IndexedDB 키
  name: string;
  width: number;
  height: number;
  source: 'gemini' | 'teacher' | 'drawing';
  fit: 'cover' | 'contain';
  focusX: number; // 0~100
  focusY: number; // 0~100
}

export interface ArticleSnapshot {
  at: number;
  title: string;
  subtitle: string;
  lead: string;
  qa: { q: string; a: string }[];
  caption: string;
  sources: string;
  remaining: string;
}

export interface AppState {
  format: 1;
  workId: string;
  createdAt: number;
  updatedAt: number;
  reporter: string;
  started: boolean;
  activity: 0 | 1 | 2 | 3; // 0 = 시작 화면
  steps: [number, number, number];
  done: Record<string, boolean>;

  a1: {
    seen: Record<string, boolean>; // 예시 설명 펼침
    quiz: Record<string, { choice: string; text: string; checked: boolean }>;
    topic: string;
    want: string;
    firstQuestion: string;
    gemFeedback: string;
    revisedQuestion: string;
    reason: string;
    gemName: string;
    focus: string[];
    customInstruction: string | null;
    gemUrl: string;
    tests: CheckerTest[];
    reflection: Record<string, Judge>;
  };

  a2: {
    gemName: string;
    length: AnswerLength;
    tone: Tone;
    interest: Interest;
    customInstruction: string | null;
    gemUrl: string;
    shortGuide: boolean;
    cards: InterviewCard[];
    check: {
      cardId: string | null;
      claim: string;
      source: string;
      result: '' | 'use' | 'fix' | 'notyet';
      note: string;
    };
    sceneGemName: string;
    sceneCustomInstruction: string | null;
    sceneGemUrl: string;
    sceneCardIds: string[];
    excerpt: string;
    place: Place;
    placeCustom: string;
    style: SceneStyle;
    reporterInScene: boolean;
    mood: string;
    image: ImageInfo | null;
    caption: string;
  };

  a3: {
    paperName: string;
    date: string;
    byline: string;
    picks: string[];
    pickReason: string;
    title: string;
    subtitle: string;
    lead: string;
    qa: Record<string, { q: string; a: string }>;
    sources: string;
    remaining: string;
    pages: 1 | 2;
    review: { reader: string; curious: string; evidence: string; revised: string };
    before: ArticleSnapshot | null;
  };
}

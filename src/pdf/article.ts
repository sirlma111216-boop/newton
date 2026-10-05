// 상태 → 신문 데이터 (가벼운 모듈: 화면에서도 씀)
import { VIRTUAL_NOTICE } from '../content/newspaper';
import type { AppState } from '../state/types';
import { cleanAnswerForArticle } from './text';

export function articleQA(state: AppState): { id: string; q: string; a: string }[] {
  return state.a3.picks
    .map((id) => {
      const card = state.a2.cards.find((c) => c.id === id);
      if (!card) return null;
      const edited = state.a3.qa[id];
      return { id, q: edited?.q ?? card.question, a: edited?.a ?? cleanAnswerForArticle(card.answer) };
    })
    .filter((x): x is { id: string; q: string; a: string } => !!x);
}

export function imageCredit(state: AppState): string {
  switch (state.a2.image?.source) {
    case 'teacher':
      return '사진·그림: 선생님 제공 자료';
    case 'drawing':
      return `그림: ${state.reporter || '기자'} 직접 그림 (가상 장면)`;
    default:
      return 'AI로 재구성한 가상 장면';
  }
}

export const NOTICE = VIRTUAL_NOTICE;

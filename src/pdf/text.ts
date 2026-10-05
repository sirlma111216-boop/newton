import { SUPPORTED_RANGES } from './glyphRanges';

const SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '⁰': '0', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-',
};

/** PDF에 넣기 전에 글자를 정리합니다(뜻은 바꾸지 않음). */
export function normalizeForPdf(s: string): string {
  return s
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[​-‍⁠﻿︀-️]/g, '')
    .replace(/[₀-₉⁰⁴-⁹⁺⁻]/g, (c) => SUB[c] ?? c);
}

function supported(cp: number): boolean {
  if (cp === 10) return true;
  let lo = 0,
    hi = SUPPORTED_RANGES.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b] = SUPPORTED_RANGES[mid];
    if (cp < a) hi = mid - 1;
    else if (cp > b) lo = mid + 1;
    else return true;
  }
  return false;
}

export interface CharProblem {
  label: string;
  chars: string[];
}

/** 신문 글꼴에 없는 글자(이모지, 한자 등)를 찾습니다. */
export function findUnsupported(fields: { label: string; text: string }[]): CharProblem[] {
  const out: CharProblem[] = [];
  for (const f of fields) {
    const set = new Set<string>();
    for (const ch of normalizeForPdf(f.text)) {
      const cp = ch.codePointAt(0)!;
      if (!supported(cp)) set.add(ch);
    }
    if (set.size) out.push({ label: f.label, chars: Array.from(set).slice(0, 12) });
  }
  return out;
}

/** 학생이 직접 고른 경우에만: 글꼴에 없는 글자를 뺍니다. */
export function stripUnsupported(s: string): string {
  return Array.from(normalizeForPdf(s))
    .filter((ch) => supported(ch.codePointAt(0)!))
    .join('')
    .replace(/[ ]{2,}/g, ' ');
}

/** AI 답변을 기사용으로 옮길 때 마크다운 꾸밈 기호를 정리합니다(원문은 그대로 둠). */
export function cleanAnswerForArticle(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '· ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1($2)')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function charCount(s: string): number {
  return Array.from(s.replace(/\s/g, '')).length;
}

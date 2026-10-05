// PDF 만들기 (무거운 모듈이라 필요할 때만 불러옵니다)
import { pdf } from '@react-pdf/renderer';
import { loadImage } from '../state/db';
import type { AppState } from '../state/types';
import { renderForPaper } from '../lib/images';
import { NOTICE, articleQA, imageCredit } from './article';
import { ensureFonts } from './fonts';
import { GrowthDoc, type GrowthData } from './GrowthDoc';
import { NewspaperDoc, type Layout, type PaperData } from './NewspaperDoc';
import { charCount, normalizeForPdf, stripUnsupported } from './text';
import { KIND_LABEL_PLAIN } from './labels';

export { ensureFonts };

export class ExportError extends Error {}

export async function buildPaperData(state: AppState, opts: { strip?: boolean } = {}): Promise<PaperData> {
  const t = (x: string) => (opts.strip ? stripUnsupported(x) : normalizeForPdf(x));
  let image: PaperData['image'] = null;
  if (state.a2.image) {
    const blob = await loadImage(state.a2.image.key);
    if (!blob) throw new ExportError('저장된 이미지를 찾을 수 없어요. 2활동의 ‘이미지 가져오기’에서 이미지를 다시 올려 주세요.');
    try {
      image = await renderForPaper(blob, state.a2.image);
    } catch {
      throw new ExportError('이미지를 신문에 넣을 수 없어요. 다른 이미지로 바꿔 보세요.');
    }
  }
  return {
    paperName: t(state.a3.paperName),
    date: t(state.a3.date),
    byline: t(state.a3.byline || state.reporter),
    title: t(state.a3.title),
    subtitle: t(state.a3.subtitle),
    lead: t(state.a3.lead),
    qa: articleQA(state).map((p) => ({ q: t(p.q), a: t(p.a) })),
    image,
    imageCredit:
      state.a2.image?.source === 'gemini' && /가상/.test(state.a2.caption) && /(AI|재구성)/.test(state.a2.caption) ? '' : imageCredit(state),
    caption: t(state.a2.caption),
    sources: t(state.a3.sources),
    remaining: t(state.a3.remaining),
    notice: NOTICE,
  };
}

async function countPages(blob: Blob): Promise<number> {
  const text = await blob.text();
  const m = /\/Type \/Pages[\s\S]*?\/Count (\d+)/.exec(text);
  return m ? Number(m[1]) : 1;
}

async function render(doc: React.ReactElement): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(doc as any).toBlob();
}

export interface PaperResult {
  blob: Blob;
  pages: number;
  layout: Layout;
  /** 1쪽을 원했지만 넘쳐서 여러 쪽 양식으로 만든 경우 */
  overflow: boolean;
  tips: string[];
}

function fitTips(d: PaperData): string[] {
  const tips: string[] = [];
  const items = d.qa.map((p, i) => ({ i, n: charCount(p.a) + charCount(p.q) })).sort((a, b) => b.n - a.n);
  items.slice(0, 2).forEach((x) => {
    if (x.n > 220) tips.push(`질문·답변 ${x.i + 1}이(가) ${x.n}자예요. 핵심만 남기고 줄여 보세요.`);
  });
  if (charCount(d.lead) > 200) tips.push(`도입부가 ${charCount(d.lead)}자예요. 2~3문장으로 줄여 보세요.`);
  if (d.qa.length > 4) tips.push(`질문·답변이 ${d.qa.length}쌍이에요. 3~4쌍을 권장해요.`);
  if (charCount(d.sources) + charCount(d.remaining) > 250) tips.push('‘확인한 내용과 참고 자료’, ‘남은 질문’을 짧게 정리해 보세요.');
  if (d.image && d.image.aspect < 1) tips.push('세로로 긴 이미지는 자리를 많이 차지해요. ‘틀에 맞게 잘라 넣기’를 고르면 자리가 줄어요.');
  if (tips.length === 0) tips.push('가장 긴 답변을 조금씩 줄여 보세요.');
  return tips;
}

export async function makePaperPdf(state: AppState, opts: { strip?: boolean } = {}): Promise<PaperResult> {
  await ensureFonts();
  const d = await buildPaperData(state, opts);
  try {
    if (state.a3.pages === 1) {
      const blob = await render(<NewspaperDoc d={d} layout="compact" />);
      const pages = await countPages(blob);
      if (pages <= 1) return { blob, pages: 1, layout: 'compact', overflow: false, tips: [] };
      const flow = await render(<NewspaperDoc d={d} layout="flow" />);
      return { blob: flow, pages: await countPages(flow), layout: 'flow', overflow: true, tips: fitTips(d) };
    }
    const blob = await render(<NewspaperDoc d={d} layout="flow" />);
    return { blob, pages: await countPages(blob), layout: 'flow', overflow: false, tips: [] };
  } catch (e) {
    console.error(e);
    throw new ExportError('PDF를 만드는 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요. 계속 안 되면 ‘인쇄 / PDF로 저장’을 써 보세요.');
  }
}

export function buildGrowthData(state: AppState): GrowthData {
  const a1 = state.a1;
  const a2 = state.a2;
  const a3 = state.a3;
  const n = normalizeForPdf;
  const cards = a2.cards;
  const follow = cards.filter((c) => c.fromId && c.question.trim());
  const decision = { '': '', accept: '받아들임', partly: '일부만 받아들임', keep: '내 질문을 그대로 둠' } as const;
  const result = { '': '', use: '그대로 사용', fix: '고쳐서 사용', notyet: '아직 확인하지 못함' } as const;

  const before = a3.before;
  const nowQA = articleQA(state);
  const changes: { label: string; text: string }[] = [];
  if (before) {
    const cmp = (label: string, b: string, a: string) => {
      if (b.trim() !== a.trim()) changes.push({ label, text: `고치기 전: ${b.trim() || '(비어 있음)'}\n고친 뒤: ${a.trim() || '(비어 있음)'}` });
    };
    cmp('제목', before.title, a3.title);
    cmp('부제', before.subtitle, a3.subtitle);
    cmp('도입부', before.lead, a3.lead);
    nowQA.forEach((p, i) => {
      const b = before.qa[i];
      if (!b) changes.push({ label: `질문·답변 ${i + 1}`, text: `새로 넣음: Q. ${p.q}` });
      else {
        cmp(`질문 ${i + 1}`, b.q, p.q);
        cmp(`답변 ${i + 1}`, b.a, p.a);
      }
    });
    cmp('캡션', before.caption, a2.caption);
    cmp('확인한 자료', before.sources, a3.sources);
    cmp('남은 질문', before.remaining, a3.remaining);
  }

  const data: GrowthData = {
    reporter: n(state.reporter),
    date: n(a3.date),
    sections: [
      {
        title: '처음 질문과 고친 질문',
        items: [
          { label: '주제·인물', text: a1.topic },
          { label: '알고 싶은 것', text: a1.want },
          { label: '처음 질문', text: a1.firstQuestion },
          { label: '감별기 피드백', text: a1.gemFeedback },
          { label: '고친 질문', text: a1.revisedQuestion },
          { label: '바꾼 이유', text: a1.reason },
        ],
        groups: a1.tests
          .filter((t) => t.question.trim())
          .map((t, i) => ({
            title: `감별기 시험 ${i + 1}`,
            items: [
              { label: '보낸 질문', text: t.question },
              { label: '내 판단', text: [decision[t.decision], t.note].filter(Boolean).join(' — ') },
            ],
          })),
      },
      {
        title: '대표 후속 질문과 연결된 답변',
        items: follow.length ? [] : [{ label: '후속 질문', text: '' }],
        groups: follow.slice(0, 3).map((c) => {
          const src = cards.find((x) => x.id === c.fromId);
          const idx = cards.indexOf(c) + 1;
          return {
            title: `질문 ${idx} (${KIND_LABEL_PLAIN[c.kind]}) — 질문 ${src ? cards.indexOf(src) + 1 : '?'}의 답에서 이어짐`,
            items: [
              { label: '앞선 질문', text: src?.question ?? '' },
              { label: '앞선 답(원문)', text: src?.answer ?? '' },
              { label: '후속 질문', text: c.question },
              { label: '받은 답(원문)', text: c.answer },
            ],
          };
        }),
      },
      {
        title: '사실 확인 기록',
        items: [
          { label: '확인할 내용', text: a2.check.claim },
          { label: '확인한 자료', text: a2.check.source },
          { label: '확인 결과', text: result[a2.check.result] },
          { label: a2.check.result === 'fix' ? '고친 설명' : '판단 이유', text: a2.check.note },
        ],
      },
      {
        title: '기사에 넣을 내용을 고른 이유',
        items: [
          { label: '고른 질문', text: nowQA.map((p, i) => `${i + 1}. ${p.q}`).join('\n') },
          { label: '고른 이유', text: a3.pickReason },
        ],
      },
      {
        title: '독자 질문과 기사 수정',
        items: [
          { label: '질문한 독자', text: a3.review.reader },
          { label: '더 알고 싶어진 점', text: a3.review.curious },
          { label: '근거가 더 필요한 설명', text: a3.review.evidence },
          { label: '고친 부분', text: a3.review.revised },
          ...(before ? (changes.length ? changes : [{ label: '바뀐 내용', text: '독자 질문을 받기 전 기사와 달라진 부분이 없어요.' }]) : [{ label: '바뀐 내용', text: '(독자 질문 전 기사를 저장하지 않았어요)' }]),
        ],
      },
    ],
  };
  for (const sec of data.sections) {
    sec.items = sec.items.map((it) => ({ label: it.label, text: n(it.text) }));
    sec.groups = sec.groups?.map((g) => ({ title: n(g.title), items: g.items.map((it) => ({ label: it.label, text: n(it.text) })) }));
  }
  return data;
}

export async function makeGrowthPdf(state: AppState): Promise<Blob> {
  await ensureFonts();
  try {
    return await render(<GrowthDoc d={buildGrowthData(state)} />);
  } catch (e) {
    console.error(e);
    throw new ExportError('질문 성장 기록을 만드는 중 문제가 생겼어요. 다시 시도해 주세요.');
  }
}

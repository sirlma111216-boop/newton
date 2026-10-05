import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { HEAVY, SANS, SERIF } from './fonts';
import { charCount } from './text';

export interface PaperData {
  paperName: string;
  date: string;
  byline: string;
  title: string;
  subtitle: string;
  lead: string;
  qa: { q: string; a: string }[];
  image: { dataUrl: string; aspect: number } | null;
  imageCredit: string;
  caption: string;
  sources: string;
  remaining: string;
  notice: string;
}

export type Layout = 'compact' | 'flow';

const INK = '#111111';
const SOFT = '#444444';

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 38, color: INK, fontFamily: SERIF as unknown as string },
  rule: { borderBottomWidth: 0.8, borderBottomColor: INK },
  ruleThick: { borderBottomWidth: 2, borderBottomColor: INK },
  masthead: { fontFamily: HEAVY as unknown as string, fontSize: 30, lineHeight: 1.25, textAlign: 'center', paddingTop: 6, paddingBottom: 2 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 },
  metaText: { fontFamily: SANS as unknown as string, fontSize: 8, lineHeight: 1.4, color: SOFT },
  top: { flexDirection: 'row', marginTop: 12 },
  col: { flexGrow: 1, flexBasis: 0 },
  colRight: { flexGrow: 1, flexBasis: 0, marginLeft: 12, paddingLeft: 12, borderLeftWidth: 0.6, borderLeftColor: '#888888' },
  title: { fontFamily: HEAVY as unknown as string, fontSize: 19, lineHeight: 1.32, marginBottom: 6 },
  subtitle: { fontFamily: SANS as unknown as string, fontSize: 10, lineHeight: 1.5, color: SOFT, marginBottom: 8 },
  lead: { fontSize: 10.2, lineHeight: 1.7, textAlign: 'justify' },
  credit: { fontFamily: SANS as unknown as string, fontSize: 7.5, lineHeight: 1.4, color: SOFT, marginTop: 4 },
  caption: { fontSize: 8.8, lineHeight: 1.5, marginTop: 2 },
  sectionLabel: { fontFamily: SANS as unknown as string, fontSize: 8.5, lineHeight: 1.4, letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  qaRow: { flexDirection: 'row' },
  pair: { marginBottom: 10 },
  q: { fontFamily: SANS as unknown as string, fontSize: 9.8, lineHeight: 1.55, marginBottom: 3 },
  a: { fontSize: 9.8, lineHeight: 1.68, textAlign: 'justify' },
  aLabel: { fontFamily: SANS as unknown as string },
  boxRow: { flexDirection: 'row', marginTop: 10, borderTopWidth: 0.8, borderTopColor: INK, borderBottomWidth: 0.8, borderBottomColor: INK, paddingVertical: 7 },
  boxTitle: { fontFamily: SANS as unknown as string, fontSize: 8.5, lineHeight: 1.4, marginBottom: 3 },
  boxText: { fontSize: 9, lineHeight: 1.6 },
  footer: { position: 'absolute', left: 38, right: 38, bottom: 18, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontFamily: SANS as unknown as string, fontSize: 7, lineHeight: 1.3, color: SOFT },
});

/** 문단(빈 줄) 단위로 나누어 Text 여러 개로 만듭니다. */
type TStyle = Style | Style[];

function Paras({ text, style, gap = 4 }: { text: string; style: TStyle; gap?: number }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <Text key={i} style={[...(Array.isArray(style) ? style : [style]), i > 0 ? { marginTop: gap } : {}]}>
          {p}
        </Text>
      ))}
    </>
  );
}

function ImageBlock({ d, maxH, width }: { d: PaperData; maxH: number; width: number }) {
  if (!d.image) return null;
  let w = width;
  let h = width / d.image.aspect;
  if (h > maxH) {
    h = maxH;
    w = maxH * d.image.aspect;
  }
  return (
    <View wrap={false}>
      <View style={{ alignItems: 'center' }}>
        <Image src={d.image.dataUrl} style={{ width: w, height: h }} />
      </View>
      {d.imageCredit ? <Text style={s.credit}>{d.imageCredit}</Text> : null}
      {d.caption.trim() ? <Text style={s.caption}>{d.caption.trim()}</Text> : null}
    </View>
  );
}

function Pair({ p }: { p: { q: string; a: string } }) {
  return (
    <View style={s.pair}>
      <Text style={s.q} minPresenceAhead={30}>
        Q. {p.q.trim() || '(질문을 써 주세요)'}
      </Text>
      {p.a
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => (
          <Text key={i} style={[s.a, i > 0 ? { marginTop: 3 } : {}]}>
            {i === 0 ? <Text style={s.aLabel}>A. </Text> : null}
            {para.trim()}
          </Text>
        ))}
    </View>
  );
}

/** 질문·답변을 두 단에 길이가 비슷하게 나눕니다(순서는 유지). */
export function splitColumns(qa: PaperData['qa']): [PaperData['qa'], PaperData['qa']] {
  const lens = qa.map((p) => charCount(p.q) + charCount(p.a) + 40);
  const total = lens.reduce((x, y) => x + y, 0);
  let acc = 0;
  let cut = qa.length;
  for (let i = 0; i < qa.length; i++) {
    if (acc + lens[i] / 2 > total / 2 && i > 0) {
      cut = i;
      break;
    }
    acc += lens[i];
  }
  if (qa.length > 1 && cut >= qa.length) cut = qa.length - 1;
  return [qa.slice(0, cut), qa.slice(cut)];
}

function Masthead({ d, big }: { d: PaperData; big?: boolean }) {
  return (
    <View>
      <View style={s.rule} />
      <Text style={[s.masthead, big ? { fontSize: 32 } : {}]}>{d.paperName.trim() || 'Newton Interview Times'}</Text>
      <View style={s.ruleThick} />
      <View style={s.meta}>
        <Text style={s.metaText}>
          {d.date}
          {d.byline.trim() ? `  ·  기자: ${d.byline.trim()}` : ''}
        </Text>
        <Text style={s.metaText}>{d.notice}</Text>
      </View>
      <View style={s.rule} />
    </View>
  );
}

function BottomBox({ d }: { d: PaperData }) {
  return (
    <View style={s.boxRow} wrap={charCount(d.sources) + charCount(d.remaining) > 700}>
      <View style={s.col}>
        <Text style={s.boxTitle}>확인한 내용과 참고 자료</Text>
        <Paras text={d.sources.trim() || '(아직 쓰지 않았어요)'} style={s.boxText} gap={2} />
      </View>
      <View style={[s.col, { marginLeft: 12, paddingLeft: 12, borderLeftWidth: 0.6, borderLeftColor: '#888888' }]}>
        <Text style={s.boxTitle}>아직 남은 질문</Text>
        <Paras text={d.remaining.trim() || '(아직 쓰지 않았어요)'} style={s.boxText} gap={2} />
      </View>
    </View>
  );
}

function Footer({ d }: { d: PaperData }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{d.notice} — 실제 뉴턴의 말을 옮긴 기록이 아닙니다.</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')} />
    </View>
  );
}

const CONTENT_W = 595.28 - 38 * 2;
const COL_W = (CONTENT_W - 24.6) / 2;

export function NewspaperDoc({ d, layout }: { d: PaperData; layout: Layout }) {
  const titleBlock = (
    <>
      <Text style={s.title}>{d.title.trim() || '(기사 제목)'}</Text>
      {d.subtitle.trim() ? <Text style={s.subtitle}>{d.subtitle.trim()}</Text> : null}
      <Paras text={d.lead.trim() || '(도입부를 써 주세요)'} style={s.lead} />
    </>
  );

  if (layout === 'compact') {
    const [left, right] = splitColumns(d.qa);
    return (
      <Document title={d.title || d.paperName} author={d.byline || undefined} subject={d.notice} language="ko">
        <Page size="A4" style={s.page}>
          <Footer d={d} />
          <Masthead d={d} />
          {d.image ? (
            <View style={s.top}>
              <View style={s.col}>{titleBlock}</View>
              <View style={s.colRight}>
                <ImageBlock d={d} maxH={230} width={COL_W} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>{titleBlock}</View>
          )}
          <Text style={s.sectionLabel}>인터뷰</Text>
          <View style={[s.rule, { marginBottom: 8, borderBottomColor: '#888888', borderBottomWidth: 0.6 }]} />
          <View style={s.qaRow}>
            <View style={s.col}>
              {left.map((p, i) => (
                <Pair key={i} p={p} />
              ))}
            </View>
            <View style={s.colRight}>
              {right.map((p, i) => (
                <Pair key={i} p={p} />
              ))}
            </View>
          </View>
          <View style={{ flexGrow: 1 }} />
          <BottomBox d={d} />
        </Page>
      </Document>
    );
  }

  // flow: 읽기 좋은 여러 쪽 — 한 단으로 흐르고, 넘치면 다음 쪽으로 이어집니다.
  return (
    <Document title={d.title || d.paperName} author={d.byline || undefined} subject={d.notice} language="ko">
      <Page size="A4" style={s.page}>
        <Footer d={d} />
        <Masthead d={d} big />
        {d.image ? (
          <View style={s.top}>
            <View style={s.col}>{titleBlock}</View>
            <View style={s.colRight}>
              <ImageBlock d={d} maxH={300} width={COL_W} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>{titleBlock}</View>
        )}
        <Text style={s.sectionLabel}>인터뷰</Text>
        <View style={[s.rule, { marginBottom: 8, borderBottomColor: '#888888', borderBottomWidth: 0.6 }]} />
        {d.qa.map((p, i) => (
          <View key={i} style={{ marginBottom: 4 }}>
            <Text style={[s.q, { fontSize: 10.8 }]} minPresenceAhead={40}>
              Q. {p.q.trim() || '(질문을 써 주세요)'}
            </Text>
            {p.a
              .trim()
              .split(/\n\s*\n/)
              .map((para, j) => (
                <Text key={j} style={[s.a, { fontSize: 10.8, lineHeight: 1.72, marginBottom: 4 }]}>
                  {j === 0 ? <Text style={s.aLabel}>A. </Text> : null}
                  {para.trim()}
                </Text>
              ))}
          </View>
        ))}
        <BottomBox d={d} />
      </Page>
    </Document>
  );
}

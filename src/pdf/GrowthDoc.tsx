import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { HEAVY, SANS, SERIF } from './fonts';

export interface GrowthItem {
  label: string;
  text: string;
}
export interface GrowthSection {
  title: string;
  items: GrowthItem[];
  groups?: { title: string; items: GrowthItem[] }[];
}
export interface GrowthData {
  reporter: string;
  date: string;
  sections: GrowthSection[];
}

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 44, paddingHorizontal: 44, fontFamily: SERIF as unknown as string, color: '#111111' },
  h1: { fontFamily: HEAVY as unknown as string, fontSize: 20, lineHeight: 1.3 },
  meta: { fontFamily: SANS as unknown as string, fontSize: 9, lineHeight: 1.4, color: '#444444', marginTop: 4, marginBottom: 6 },
  notice: { fontSize: 8.5, lineHeight: 1.5, color: '#444444', borderTopWidth: 0.8, borderBottomWidth: 0.8, paddingVertical: 4, marginBottom: 8 },
  h2: { fontFamily: SANS as unknown as string, fontSize: 11.5, lineHeight: 1.4, marginTop: 12, marginBottom: 5, paddingBottom: 2, borderBottomWidth: 0.6, borderBottomColor: '#888888' },
  h3: { fontFamily: SANS as unknown as string, fontSize: 10, lineHeight: 1.4, marginTop: 6, marginBottom: 3 },
  item: { flexDirection: 'row', marginBottom: 4 },
  label: { fontFamily: SANS as unknown as string, fontSize: 9, lineHeight: 1.6, width: 92, color: '#333333' },
  text: { fontSize: 9.8, lineHeight: 1.65, flexGrow: 1, flexBasis: 0 },
  empty: { fontSize: 9.5, lineHeight: 1.6, color: '#777777', flexGrow: 1, flexBasis: 0 },
  footer: { position: 'absolute', bottom: 20, left: 44, right: 44, fontFamily: SANS as unknown as string, fontSize: 7, lineHeight: 1.3, color: '#555555', textAlign: 'center' },
});

function Item({ it }: { it: GrowthItem }) {
  const t = it.text.trim();
  return (
    <View style={s.item}>
      <Text style={s.label}>{it.label}</Text>
      {t ? <Text style={s.text}>{t}</Text> : <Text style={s.empty}>(쓰지 않음)</Text>}
    </View>
  );
}

export function GrowthDoc({ d }: { d: GrowthData }) {
  return (
    <Document title={`질문 성장 기록 — ${d.reporter}`} language="ko">
      <Page size="A4" style={s.page}>
        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `뉴턴 인터뷰 신문 제작소 · 질문 성장 기록 · ${pageNumber} / ${totalPages}`} />
        <Text style={s.h1}>질문 성장 기록</Text>
        <Text style={s.meta}>
          {d.reporter ? `기자: ${d.reporter}  ·  ` : ''}
          {d.date}
        </Text>
        <Text style={s.notice}>
          학생이 직접 쓰고 고른 내용을 모은 기록입니다. 점수나 등급이 아닙니다. 인터뷰 답변은 AI가 뉴턴 역할을 맡아 답한 가상 인터뷰입니다.
        </Text>
        {d.sections.map((sec, i) => (
          <View key={i}>
            <Text style={s.h2} minPresenceAhead={40}>
              {i + 1}. {sec.title}
            </Text>
            {sec.items.map((it, j) => (
              <Item key={j} it={it} />
            ))}
            {sec.groups?.map((g, j) => (
              <View key={j}>
                <Text style={s.h3} minPresenceAhead={30}>
                  {g.title}
                </Text>
                {g.items.map((it, k) => (
                  <Item key={k} it={it} />
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

import { Font } from '@react-pdf/renderer';

// 글꼴: 나눔명조(OFL), Noto Sans KR(OFL). 한글 11,172자와 기본 기호만 남겨 크기를 줄였습니다.
// 라이선스 파일: public/fonts/OFL-*.txt
// 웹 배포에서는 별도 파일로, 오프라인 한 파일 버전에서는 HTML 안에 들어갑니다.
import serifUrl from '../assets/fonts/NanumMyeongjo-Regular.ttf?url';
import serifHeavyUrl from '../assets/fonts/NanumMyeongjo-ExtraBold.ttf?url';
import sansUrl from '../assets/fonts/NotoSansKR-Bold.ttf?url';

const FILES = { serif: serifUrl, serifHeavy: serifHeavyUrl, sans: sansUrl };

export class FontError extends Error {}

let ready: Promise<void> | null = null;

async function fetchFont(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, url.startsWith('data:') ? undefined : { cache: 'force-cache' });
  } catch {
    throw new FontError('신문 글꼴을 내려받지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
  }
  if (!res.ok) throw new FontError(`신문 글꼴을 내려받지 못했어요(오류 ${res.status}). 잠시 뒤 다시 시도해 주세요.`);
  const blob = await res.blob();
  if (blob.size < 10000) throw new FontError('신문 글꼴 파일이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
  return URL.createObjectURL(blob);
}

/** 글꼴을 모두 내려받은 뒤에 등록합니다. 실패하면 다음에 다시 시도할 수 있습니다. */
export function ensureFonts(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const [serif, serifHeavy, sans] = await Promise.all([fetchFont(FILES.serif), fetchFont(FILES.serifHeavy), fetchFont(FILES.sans)]);
      Font.register({ family: 'Myeongjo', src: serif });
      Font.register({ family: 'MyeongjoHeavy', src: serifHeavy });
      Font.register({ family: 'Sans', src: sans });
      // 띄어쓰기 단위로 줄을 바꾸고, 너무 긴 낱말(주소 등)만 글자 단위로 나눕니다.
      Font.registerHyphenationCallback((word) => (Array.from(word).length > 18 ? Array.from(word) : [word]));
    })().catch((e) => {
      ready = null;
      throw e instanceof FontError ? e : new FontError('신문 글꼴을 준비하지 못했어요. 다시 시도해 주세요.');
    });
  }
  return ready;
}

// 글꼴에 없는 글자는 다음 글꼴에서 찾아 씁니다.
export const SERIF = ['Myeongjo', 'Sans'];
export const HEAVY = ['MyeongjoHeavy', 'Sans'];
export const SANS = ['Sans', 'Myeongjo'];

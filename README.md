# 뉴턴 인터뷰 신문 제작소

중학교 1학년 과학 수업용 웹앱입니다. 학생은 이 웹앱의 안내를 따라 학교 계정 Gemini에서 Gem 세 개(질문 감별기 · 나의 뉴턴 인터뷰 · 뉴턴 인터뷰 장면 제작소)를 만들고, 질문·인터뷰·이미지를 웹앱으로 가져와 신문 기사를 완성한 뒤 PDF로 내려받습니다.

- 1. 질문 연습실 → 2. 뉴턴 인터뷰실 → 3. 신문 편집실
- Gemini API·Google 로그인 연동은 없습니다. 학생이 지시문을 복사해 Gemini에 붙여 넣고, 결과를 웹앱에 붙여 넣습니다.
- 학생 기록은 학생 브라우저(IndexedDB)에만 저장되며 서버로 보내지 않습니다. 활동 파일(.json, 이미지 포함)로 저장·불러오기를 할 수 있습니다.

## 바로 쓰기 (설치 없이)

`뉴턴인터뷰신문제작소.html` 파일을 크롬이나 엣지로 더블클릭해 열면 됩니다. 한글 글꼴과 PDF 기능이 파일 안에 모두 들어 있어 인터넷 없이도 작동합니다(Gemini를 쓰는 부분만 인터넷 필요). 처음 열 때 몇 초 걸릴 수 있습니다.

- 학생 기록은 그 컴퓨터의 브라우저에 저장됩니다. 파일을 다른 폴더로 옮기면 저장 위치가 달라질 수 있으니, 활동 파일 저장을 함께 쓰세요.
- 이 파일은 `npm run build:offline`으로 다시 만들 수 있습니다(`dist-offline/index.html`).

## 개발용 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 에 배포용 파일 생성
npm run preview  # 빌드 결과 미리 보기
npm run build:offline  # 더블클릭용 한 파일 버전 (dist-offline/index.html)
```

## Cloudflare Pages 배포

**방법 1 — GitHub 연결(권장):** Cloudflare 대시보드 → Workers & Pages → 만들기 → Pages → Git에 연결 → 이 저장소 선택
- 프레임워크 프리셋: 없음(또는 Vite)
- 빌드 명령: `npm run build`
- 빌드 출력 디렉터리: `dist`

이후 `main`에 올릴 때마다 자동 배포됩니다.

**방법 2 — 명령어:** `npm run build` 후 `npx wrangler pages deploy dist --project-name newton-interview`

## 선생님이 고칠 수 있는 곳

| 고칠 내용 | 파일 |
| --- | --- |
| Gem 지시문, 학생 선택지, 장면 요청문 | `src/content/gems.ts` |
| 질문 잘하는 법, 예시, 연습 문제 | `src/content/lesson.ts` |
| Gemini 사용 안내, 교사용 도움말, 차시 계획 | `src/content/guide.ts` |
| 신문 제호 기본값, 글쓰기 도움말 | `src/content/newspaper.ts` |

## PDF

`@react-pdf/renderer`로 브라우저에서 바로 PDF를 만듭니다(글자 선택·검색 가능). 화면의 신문 미리보기는 실제로 만들어진 PDF를 pdf.js로 그린 것이라 미리보기와 PDF가 같습니다.

- A4 세로, 기본 1쪽(2단 신문). 1쪽에 넘치면 내용을 자르지 않고 여러 쪽 양식으로 만들고 줄일 부분을 알려 줍니다.
- 글꼴: 나눔명조, Noto Sans KR (SIL Open Font License 1.1, `public/fonts/OFL-*.txt`, 글꼴 파일은 `src/assets/fonts`). 한글 11,172자와 기본 기호만 남겨 크기를 줄였습니다. 글꼴을 바꾸면 `src/pdf/glyphRanges.ts`를 다시 만들어야 합니다.
- 글꼴에 없는 글자(이모지, 한자 등)는 미리 알려 주고, 학생이 고르면 그 글자만 빼고 만듭니다.

## 구조

```
src/content   수업 내용(교사 수정용)
src/state     상태, 자동 저장(IndexedDB), 활동 파일 검사
src/screens   시작 화면, 세 활동, 교사용 도움말
src/components 단계 안내, Gem 안내, 이미지 가져오기, 미리보기 등
src/pdf       신문·질문 성장 기록 PDF
```

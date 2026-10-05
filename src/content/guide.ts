// ─────────────────────────────────────────────
// Gemini 사용 안내 · 교사용 도움말 · 시간 계획
// Gemini 메뉴 이름은 바뀔 수 있으니, 바뀌면 이 파일의 문구만 고치면 됩니다.
// ─────────────────────────────────────────────

export type Where = 'gemini' | 'app';

export interface GuideStep {
  where: Where;
  title: string;
  body: string;
  /** 이 단계에서 보여 줄 도구: 이름 복사 / 지시문 복사 / 시험 문장 복사 / Gem 주소 입력 */
  tool?: 'copyName' | 'copyInstruction' | 'copyTest' | 'gemUrl' | 'openGemini';
}

export const MENU_NOTE =
  'Gemini 화면의 메뉴 이름과 위치는 계정 종류나 업데이트에 따라 조금 다를 수 있어요. 비슷한 이름을 찾아보고, 안 보이면 선생님께 알려 주세요.';

export const GEM_STEPS: GuideStep[] = [
  {
    where: 'gemini',
    title: '학교 계정으로 Gemini 열기',
    body: '‘Gemini 열기’를 누르면 새 탭이 열려요. 오른쪽 위 동그란 프로필을 눌러 학교에서 받은 계정인지 확인하세요.',
    tool: 'openGemini',
  },
  {
    where: 'gemini',
    title: 'Gems 메뉴 찾기',
    body: '왼쪽 위 줄 세 개(☰) 버튼을 눌러 메뉴를 펼치고 ‘Gems’ 또는 ‘Gem 탐색’을 찾아요. 처음이라 안 보이면 ‘설정 및 도움말’ 안을 살펴보세요.',
  },
  {
    where: 'gemini',
    title: '새 Gem 만들기 누르기',
    body: '‘새 Gem’(또는 ‘Gem 만들기’)을 누르면 Gem을 만드는 화면이 열려요.',
  },
  {
    where: 'gemini',
    title: '이름 입력하기',
    body: '‘이름’ 칸에 아래 이름을 붙여 넣거나 직접 입력해요.',
    tool: 'copyName',
  },
  {
    where: 'app',
    title: '지시문 복사해서 ‘요청 사항’ 칸에 붙여넣기',
    body: '이 웹앱에서 ‘지시문 복사’를 누른 뒤, Gemini의 ‘요청 사항’(또는 ‘안내’) 칸을 클릭하고 Ctrl+V(아이패드는 길게 눌러 ‘붙여넣기’)로 붙여 넣어요. 칸에 원래 적혀 있던 예시 글이 있으면 지우고 붙여 넣으세요. 파일을 올리는 ‘지식’ 칸은 비워 둬도 돼요.',
    tool: 'copyInstruction',
  },
  {
    where: 'gemini',
    title: '미리보기에서 질문 하나로 시험하기',
    body: '화면 오른쪽(또는 아래쪽) 미리보기 칸에 질문을 하나 보내 보세요. Gem이 지시문대로 대답하는지 확인하는 단계예요.',
    tool: 'copyTest',
  },
  {
    where: 'app',
    title: '필요하면 지시문 고치기',
    body: '대답이 이상하면 이 웹앱의 ‘지시문 펼쳐 보기’에서 고친 뒤 다시 복사해 붙여 넣거나, Gemini의 ‘요청 사항’ 칸에서 바로 고쳐도 돼요.',
  },
  {
    where: 'gemini',
    title: '‘저장’ 누르기',
    body: '미리보기에서 대화한 것만으로는 Gem이 남지 않아요. 꼭 오른쪽 위 ‘저장’을 눌러야 내 Gem 목록에 생겨요.',
  },
  {
    where: 'gemini',
    title: '저장한 Gem을 열어 사용하기',
    body: 'Gems 목록에서 방금 만든 Gem을 눌러 대화를 시작해요. 주소창의 주소를 복사해 아래 칸에 붙여 두면 다음 시간에 이 웹앱에서 바로 열 수 있어요(선택).',
    tool: 'gemUrl',
  },
];

/** 이미 Gem을 한 번 만들어 본 학생용 짧은 안내 */
export const GEM_STEPS_SHORT: GuideStep[] = [
  { where: 'gemini', title: 'Gemini에서 Gems → 새 Gem', body: '앞 시간처럼 Gems 메뉴에서 ‘새 Gem’을 눌러요.', tool: 'openGemini' },
  { where: 'app', title: '이름과 지시문 붙여넣기', body: '이름을 넣고, ‘요청 사항’ 칸에 지시문을 붙여 넣어요.', tool: 'copyInstruction' },
  { where: 'gemini', title: '미리보기로 시험한 뒤 저장', body: '질문 하나로 시험해 보고 ‘저장’을 눌러요.', tool: 'copyTest' },
  { where: 'gemini', title: '저장한 Gem 열기', body: 'Gem 목록에서 열어 사용해요. 주소를 아래 칸에 붙여 둘 수 있어요(선택).', tool: 'gemUrl' },
];

export const GEM_TROUBLE: { q: string; a: string }[] = [
  {
    q: 'Gems 메뉴나 ‘새 Gem’ 버튼이 보이지 않아요.',
    a: '선생님께 알려 주세요. 나이 정보를 바꾸거나 개인 계정을 새로 만들지 마세요. 선생님이 미리 만들어 공유한 Gem 링크를 쓰거나, 선생님이 허락하면 일반 Gemini 대화창에 지시문을 먼저 붙여 넣고 이어서 대화하는 방법으로 할 수 있어요.',
  },
  {
    q: '‘저장’을 눌렀는데 목록에 안 보여요.',
    a: '페이지를 새로고침한 뒤 Gems 목록을 다시 열어 보세요. 그래도 없으면 선생님께 알려 주세요.',
  },
  {
    q: '지시문을 붙여 넣었는데 글자가 잘렸어요.',
    a: '웹앱에서 ‘지시문 복사’를 다시 누르고, Gemini의 칸을 모두 지운 뒤 다시 붙여 넣으세요. 복사 버튼이 안 되면 ‘지시문 펼쳐 보기’에서 글을 직접 선택해 복사할 수 있어요.',
  },
];

/** 그림 그리는 법(Gem 사용)과 이미지 가져오기 안내 */
export const IMAGE_STEPS: GuideStep[] = [
  { where: 'app', title: '장면 제작 Gem 지시문 복사', body: '아래 ‘장면 제작소 Gem 만들기’에서 지시문을 복사해요.' },
  { where: 'gemini', title: 'Gemini에서 Gem 만들고 저장', body: '앞에서 한 것처럼 새 Gem을 만들고 ‘저장’까지 눌러요.' },
  { where: 'app', title: '장면 요청 복사', body: '이 웹앱에서 고른 인터뷰와 장면 설정으로 만든 ‘장면 요청’을 복사해요.' },
  { where: 'gemini', title: '저장한 Gem에 요청 보내기', body: '저장한 장면 제작소 Gem을 열고 장면 요청을 붙여 넣어 보내요.' },
  { where: 'gemini', title: '결과 확인하기', body: '그림이 인터뷰 내용과 어울리는지, 글자나 이상한 부분이 없는지 살펴봐요. 마음에 안 들면 “○○를 바꿔 주세요”라고 다시 부탁해요.' },
  { where: 'gemini', title: '이미지 내려받기', body: '그림을 눌러 크게 연 뒤 ‘다운로드’(아래 화살표) 버튼을 눌러 기기에 저장해요.' },
  { where: 'app', title: '웹앱으로 이미지 가져오기', body: '아래 ‘이미지 파일 고르기’로 내려받은 파일을 고르거나, 이미지를 복사한 뒤 상자를 누르고 붙여 넣어요.' },
  { where: 'app', title: '캡션 쓰기', body: '그림 아래에 들어갈 설명을 써요. AI로 재구성한 가상 장면이라는 점이 드러나게 써요.' },
];

export const IMAGE_FALLBACK = [
  'Gem 안에서 그림이 만들어지지 않고 글(요청문)만 나오면: Gemini 첫 화면의 일반 대화창(또는 이미지 만들기 기능)에 그 요청문을 붙여 넣어 보세요.',
  '학교 계정에서 그림 만들기 자체가 막혀 있으면: 선생님이 준 이미지나 내가 직접 그린 그림을 사진으로 찍어 올려도 돼요.',
  '이 웹앱에 이미지를 올리는 것은 내 기기 안의 기록에만 넣는 일이에요. Gemini에 파일을 올리는 것과는 다른 일이에요.',
];

export const SCHOOL_ACCOUNT_NOTES = [
  '개인 계정이 아니라 학교에서 받은 계정인지 확인하세요.',
  '선생님이 허용한 계정과 기능을 사용하세요.',
];

/* ───────── 교사용 도움말 ───────── */

export const TEACHER_CHECKLIST = [
  '학생 계정으로 Gemini에 들어갈 수 있는가.',
  'Gem 생성·저장이 가능한가.',
  '이미지 생성이 가능한가.',
  '생성한 이미지 다운로드가 가능한가.',
  '학생이 기록 파일(활동 파일)과 PDF를 기기에 저장할 수 있는가.',
];

export const TEACHER_LINKS = [
  {
    label: 'Gemini 앱에서 Gems 사용하기 (Google 고객센터)',
    url: 'https://support.google.com/gemini/answer/15146780?co=GENIE.Platform%3DDesktop&hl=ko-KR',
  },
  {
    label: 'Gemini 앱 사용 설정/해제 (Google Workspace 관리자 안내)',
    url: 'https://knowledge.workspace.google.com/admin/generative-ai/gemini-app/turn-the-gemini-app-on-or-off',
  },
];

export const TEACHER_NOTES = [
  '이 웹앱은 Gemini와 자동으로 연결되지 않습니다. 학생이 지시문을 복사해 Gemini에 붙여 넣고, 결과를 다시 웹앱에 붙여 넣는 방식입니다. 웹앱은 Gemini의 응답이나 이미지 생성 여부를 알 수 없습니다.',
  '학생 기록은 학생 기기의 브라우저에만 저장되며 서버로 보내지 않습니다. 브라우저 기록 삭제·기기 변경에 대비해 매 차시 끝에 ‘활동 파일 저장’을 하도록 지도해 주세요.',
  '공용 기기를 쓰는 경우 수업 끝에 ‘이 기기의 내 활동 지우기’를 안내해 주세요.',
  'Gems·이미지 생성 기능은 학교 관리자 설정과 계정 종류에 따라 보이지 않을 수 있습니다. 학생에게 나이를 바꾸거나 개인 계정을 만들게 하지 말고, 교사가 만든 Gem 공유 링크나 교사 제공 이미지를 대안으로 사용하세요.',
  'Gem 지시문·예시 문장·안내 문구·신문 제호 기본값은 소스의 src/content 폴더에서 고칠 수 있습니다.',
];

export const LESSON_PLAN: { title: string; parts: string[] }[] = [
  {
    title: '1차시 · 질문 연습실 (45분)',
    parts: ['도입 5분', '예시 학습 10분', '질문 연습 7분', '질문 감별기 만들기 13분', '시험·수정 7분', '저장 3분'],
  },
  {
    title: '2차시 · 뉴턴 인터뷰실 (45분)',
    parts: ['뉴턴 Gem 만들기 8분', '인터뷰 17분', '핵심 내용 확인 6분', '장면 Gem·이미지 제작 10분', '저장 4분'],
  },
  {
    title: '3차시 · 신문 편집실 (45분)',
    parts: ['기사거리 선택 5분', '기사 작성 20분', '동료 질문 7분', '수정·PDF 출력 8분', '성찰·저장 5분'],
  },
];

export const LESSON_PLAN_4 = [
  '1차시: 질문 연습실 전체 (3차시안과 같음)',
  '2차시: 뉴턴 Gem 만들기 · 인터뷰 · 핵심 내용 확인 (계정 문제 해결 시간 포함)',
  '3차시: 장면 Gem·이미지 제작 · 기사거리 선택 · 기사 초안',
  '4차시: 독자 질문 · 기사 수정 · PDF 출력 · 질문 성장 기록 저장',
];

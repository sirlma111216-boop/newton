import { GEM_STEPS, GEM_STEPS_SHORT, GEM_TROUBLE, MENU_NOTE, type GuideStep } from '../content/guide';
import { useStore } from '../state/store';
import { CopyButton, Expand, Field, GeminiButton, IconCheck, Note, WhereTag } from './ui';

/** Gem 만드는 화면을 단순하게 그린 설명용 그림 (실제 화면 캡처가 아님) */
export function GemSketch() {
  return (
    <figure className="sketch">
      <svg viewBox="0 0 640 300" role="img" aria-labelledby="sketch-title sketch-desc">
        <title id="sketch-title">설명용 그림: Gem 만들기 화면의 대략적인 구성</title>
        <desc id="sketch-desc">
          왼쪽에 이름 칸과 요청 사항 칸, 그 아래 선택 사항인 지식 칸이 있고, 오른쪽에 미리보기 칸, 오른쪽 위에 저장 버튼이 있는 모습을 단순하게 그린 그림입니다.
        </desc>
        <rect x="1" y="1" width="638" height="298" rx="14" fill="#fff" stroke="#9aa3b2" strokeWidth="2" />
        <rect x="1" y="1" width="638" height="40" rx="14" fill="#eef1f5" />
        <text x="22" y="27" fontSize="15" fill="#3b4558">새 Gem 만들기 화면</text>
        <rect x="540" y="9" width="80" height="24" rx="12" fill="#1f2a44" />
        <text x="580" y="26" fontSize="13" fill="#fff" textAnchor="middle">저장</text>
        <circle cx="528" cy="21" r="11" fill="#c2410c" />
        <text x="528" y="26" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700">8</text>

        <text x="24" y="70" fontSize="13" fill="#3b4558">이름</text>
        <rect x="24" y="78" width="290" height="30" rx="6" fill="#fff" stroke="#9aa3b2" />
        <circle cx="330" cy="93" r="11" fill="#c2410c" />
        <text x="330" y="98" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700">4</text>

        <text x="24" y="132" fontSize="13" fill="#3b4558">요청 사항 (지시문을 붙여 넣는 곳)</text>
        <rect x="24" y="140" width="290" height="96" rx="6" fill="#fff" stroke="#9aa3b2" />
        <path d="M38 158h200M38 176h240M38 194h180M38 212h220" stroke="#d5dae2" strokeWidth="6" strokeLinecap="round" />
        <circle cx="330" cy="188" r="11" fill="#c2410c" />
        <text x="330" y="193" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700">5</text>

        <text x="24" y="262" fontSize="13" fill="#6b7385">지식 (파일 추가 — 이번 수업에서는 안 해도 돼요)</text>
        <rect x="24" y="270" width="290" height="16" rx="4" fill="#f4f5f8" stroke="#c9ced8" strokeDasharray="4 3" />

        <rect x="360" y="56" width="262" height="230" rx="10" fill="#f7f8fb" stroke="#9aa3b2" />
        <text x="376" y="80" fontSize="13" fill="#3b4558">미리보기</text>
        <rect x="376" y="96" width="180" height="40" rx="10" fill="#e3e8f0" />
        <rect x="430" y="146" width="176" height="56" rx="10" fill="#fff" stroke="#d5dae2" />
        <rect x="376" y="244" width="230" height="28" rx="14" fill="#fff" stroke="#9aa3b2" />
        <text x="390" y="263" fontSize="12" fill="#6b7385">여기에 질문을 써서 시험해요</text>
        <circle cx="612" cy="258" r="11" fill="#c2410c" />
        <text x="612" y="263" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700">6</text>
      </svg>
      <figcaption>
        <strong>설명용 그림</strong> — 실제 Gemini 화면을 찍은 것이 아니에요. 칸의 위치와 이름은 실제 화면과 다를 수 있어요. 동그라미 숫자는 아래 안내의 단계 번호예요.
      </figcaption>
    </figure>
  );
}

export function InstructionBox({
  generated,
  custom,
  onCustom,
  label = '지시문',
}: {
  generated: string;
  custom: string | null;
  onCustom: (v: string | null) => void;
  label?: string;
}) {
  const text = custom ?? generated;
  const edited = custom !== null && custom !== generated;
  return (
    <div className="instruction">
      <div className="instruction-bar">
        <CopyButton text={text} label={`${label} 복사`} className="btn-primary" />
        {edited && <span className="tag-edited">내가 고친 {label}</span>}
      </div>
      <Expand summary={`${label} 펼쳐 보기 — 읽고 고칠 수 있어요`}>
        <label className="sr-only" htmlFor={`ins-${label}`}>
          {label} 내용
        </label>
        <textarea id={`ins-${label}`} className="instruction-text" value={text} rows={14} onChange={(e) => onCustom(e.target.value)} />
        {edited && (
          <Note kind="warn">
            {label}을 직접 고쳤어요. 위에서 고른 설정을 바꿔도 고친 글이 그대로 쓰여요.{' '}
            <button type="button" className="btn btn-small" onClick={() => onCustom(null)}>
              설정대로 다시 만들기
            </button>
          </Note>
        )}
      </Expand>
    </div>
  );
}

function isGemUrl(v: string) {
  return /^https:\/\/gemini\.google\.com\/\S+$/.test(v.trim());
}

export function GemUrlField({ value, onChange, label = '내가 저장한 Gem 주소' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const bad = value.trim() !== '' && !isGemUrl(value);
  return (
    <div className="gem-url">
      <Field
        label={label}
        optional
        value={value}
        onChange={onChange}
        placeholder="https://gemini.google.com/gem/..."
        help="Gem을 연 상태에서 주소창의 주소를 복사해 붙여 두면, 다음에 아래 버튼으로 바로 열 수 있어요."
      />
      {bad && <p className="field-error">Gemini 주소(https://gemini.google.com/ 으로 시작)가 아니에요. 주소를 다시 확인해 주세요.</p>}
      {isGemUrl(value) && <GeminiButton url={value} label="저장한 Gem 열기" />}
    </div>
  );
}

export function GemGuide({
  prefix,
  name,
  instruction,
  testMessage,
  gemUrl,
  onGemUrl,
  short,
}: {
  prefix: string;
  name: string;
  instruction: string;
  testMessage: string;
  gemUrl: string;
  onGemUrl: (v: string) => void;
  short?: boolean;
}) {
  const { state, update } = useStore();
  const steps: GuideStep[] = short ? GEM_STEPS_SHORT : GEM_STEPS;

  const tool = (s: GuideStep) => {
    switch (s.tool) {
      case 'openGemini':
        return <GeminiButton />;
      case 'copyName':
        return (
          <div className="tool-row">
            <code className="pill">{name}</code>
            <CopyButton text={name} label="이름 복사" />
          </div>
        );
      case 'copyInstruction':
        return (
          <div className="tool-row">
            {short && <CopyButton text={name} label="이름 복사" />}
            <CopyButton text={instruction} label="지시문 복사" className="btn-primary" />
          </div>
        );
      case 'copyTest':
        return (
          <div className="tool-row tool-col">
            <span className="help">시험용으로 이렇게 보내 볼 수 있어요:</span>
            <pre className="pre-msg">{testMessage}</pre>
            <CopyButton text={testMessage} label="시험 문장 복사" />
          </div>
        );
      case 'gemUrl':
        return <GemUrlField value={gemUrl} onChange={onGemUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="gem-guide">
      <Note kind="info">{MENU_NOTE}</Note>
      {!short && (
        <Expand summary="설명용 그림으로 화면 구성 미리 보기">
          <GemSketch />
        </Expand>
      )}
      <ol className="guide-list">
        {steps.map((s, i) => {
          const key = `${prefix}-g${i}`;
          const done = !!state.done[key];
          return (
            <li key={key} className={`guide-item guide-${s.where} ${done ? 'is-done' : ''}`}>
              <div className="guide-num" aria-hidden="true">
                {i + 1}
              </div>
              <div className="guide-main">
                <div className="guide-top">
                  <WhereTag where={s.where} />
                  <h3>{s.title}</h3>
                </div>
                <p>{s.body}</p>
                {tool(s)}
              </div>
              <label className="guide-check">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(e) =>
                    update((st) => {
                      if (e.target.checked) st.done[key] = true;
                      else delete st.done[key];
                    })
                  }
                />
                <span>{done ? <IconCheck /> : null} 했어요</span>
              </label>
            </li>
          );
        })}
      </ol>
      <Expand summary="잘 안 될 때 (선생님께 알려 주세요)">
        <dl className="trouble">
          {GEM_TROUBLE.map((t) => (
            <div key={t.q}>
              <dt>{t.q}</dt>
              <dd>{t.a}</dd>
            </div>
          ))}
        </dl>
      </Expand>
    </div>
  );
}

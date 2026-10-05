import { useState } from 'react';
import { useBackupActions } from '../components/Backup';
import { ConfirmDialog } from '../components/Dialog';
import { Field, GeminiButton, Note } from '../components/ui';
import { SCHOOL_ACCOUNT_NOTES } from '../content/guide';
import { useStore } from '../state/store';

const ACTIVITIES = [
  { n: 1, title: '질문 연습실', body: '질문 잘하는 법을 예시로 배우고, 내 질문을 봐 주는 ‘질문 감별기’ Gem을 만들어요.' },
  { n: 2, title: '뉴턴 인터뷰실', body: '‘뉴턴 인터뷰’ Gem에게 질문하고 답을 모아요. 기사에 넣을 장면 그림도 만들어요.' },
  { n: 3, title: '신문 편집실', body: '모은 인터뷰와 그림으로 신문 기사를 완성하고 PDF로 내려받아요.' },
];

export function Start({ onEnter, onTeacher }: { onEnter: () => void; onTeacher: () => void }) {
  const { state, update, hadSaved, resetAll } = useStore();
  const backup = useBackupActions();
  const [name, setName] = useState(state.started ? state.reporter : '');
  const [askNew, setAskNew] = useState(false);
  const [err, setErr] = useState('');
  const hasWork = hadSaved || state.started;

  const begin = () => {
    const n = name.trim();
    if (!n) {
      setErr('모둠명이나 기자 별명을 써 주세요. 실명은 쓰지 않아도 돼요.');
      document.getElementById('reporter')?.focus();
      return;
    }
    update((s) => {
      s.reporter = n.slice(0, 40);
      s.started = true;
      s.activity = 1;
      s.steps = [0, 0, 0];
      if (!s.a3.byline) s.a3.byline = '';
    });
    onEnter();
  };

  return (
    <main className="start" id="main">
      <section className="hero">
        <p className="hero-kicker">중학교 1학년 과학 · 3차시 활동</p>
        <h1>뉴턴 인터뷰 신문 제작소</h1>
        <p className="hero-lead">
          좋은 질문을 연습하고, AI가 역할을 맡은 뉴턴과 <strong>가상 인터뷰</strong>를 한 뒤, 직접 신문 기사를 만들어요.
        </p>
        <ol className="act-cards">
          {ACTIVITIES.map((a) => (
            <li key={a.n} className={`act-card act-${a.n}`}>
              <span className="act-n" aria-hidden="true">
                {a.n}
              </span>
              <div>
                <h2>
                  {a.n}. {a.title}
                </h2>
                <p>{a.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="help">
          Gemini는 대화하고 그림을 만드는 도구, 이 웹앱은 안내·기록·편집·출력 도구예요. 두 화면을 오가며 활동해요. 이 웹앱은 Gemini와 자동으로 연결되지 않아서, 복사하고
          붙여 넣는 방식으로 옮겨요.
        </p>
      </section>

      <section className="start-panel" aria-labelledby="start-h">
        {hasWork && (
          <Note kind="info">
            <p>
              이 기기에 <strong>「{state.reporter || '이름 없음'}」</strong>의 활동이 저장되어 있어요.
            </p>
            <p>내 활동이면 ‘이어서 하기’를 누르세요. 다른 사람의 활동이라면 ‘새로 시작하기’를 누르세요(그 활동은 이 기기에서 지워져요).</p>
          </Note>
        )}
        <h2 id="start-h">{hasWork ? '어떻게 할까요?' : '시작하기'}</h2>
        {hasWork ? (
          <div className="btn-col">
            <button type="button" className="btn btn-primary btn-big" onClick={onEnter}>
              「{state.reporter || '이름 없음'}」 활동 이어서 하기
            </button>
            <button type="button" className="btn" onClick={() => setAskNew(true)}>
              새로 시작하기
            </button>
            <button type="button" className="btn" onClick={backup.pickFile}>
              활동 파일 불러오기
            </button>
          </div>
        ) : (
          <>
            <Field
              id="reporter"
              label="모둠명 또는 기자 별명"
              value={name}
              onChange={(v) => {
                setName(v);
                setErr('');
              }}
              placeholder="예: 사과나무 모둠, 별빛 기자"
              maxLength={40}
              help="실명, 이메일, 비밀번호는 쓰지 않아요."
            />
            {err && (
              <p className="field-error" role="alert">
                {err}
              </p>
            )}
            <div className="btn-col">
              <button type="button" className="btn btn-primary btn-big" onClick={begin}>
                처음 시작하기
              </button>
              <button type="button" className="btn" onClick={backup.pickFile}>
                이어서 하기 (활동 파일 불러오기)
              </button>
            </div>
          </>
        )}
        {backup.ui}

        <div className="account-box">
          <h3>Gemini는 학교 계정으로</h3>
          <ul>
            {SCHOOL_ACCOUNT_NOTES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <GeminiButton />
        </div>
        <button type="button" className="link-btn" onClick={onTeacher}>
          선생님용 도움말 보기
        </button>
      </section>

      <ConfirmDialog
        open={askNew}
        title="새로 시작하기"
        confirmLabel="지우고 새로 시작하기"
        danger
        onCancel={() => setAskNew(false)}
        onConfirm={async () => {
          setAskNew(false);
          await resetAll();
          setName('');
        }}
      >
        <p>
          이 기기에 저장된 「{state.reporter || '이름 없음'}」의 활동이 지워져요. 내 활동이라면 먼저 ‘활동 파일 저장’을 해 두세요.
        </p>
        <button type="button" className="btn btn-small" onClick={() => void backup.saveFile()}>
          먼저 활동 파일 저장하기
        </button>
      </ConfirmDialog>
    </main>
  );
}

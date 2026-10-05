import { useEffect, useRef, useState } from 'react';
import { useBackupActions } from './components/Backup';
import { Modal } from './components/Dialog';
import { ACTIVITY_NAMES } from './components/StepFlow';
import { IconCheck } from './components/ui';
import { Activity1 } from './screens/Activity1';
import { Activity2 } from './screens/Activity2';
import { Activity3 } from './screens/Activity3';
import { Start } from './screens/Start';
import { TeacherHelp } from './screens/TeacherHelp';
import { StoreProvider, useStore, type SaveStatus } from './state/store';

function SaveBadge({ status, last }: { status: SaveStatus; last: number | null }) {
  const time = last ? new Date(last).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
  const text =
    status === 'saving'
      ? '저장 중…'
      : status === 'saved'
        ? `이 기기에 저장됨 ${time}`
        : status === 'error'
          ? '저장 안 됨 — 활동 파일로 저장하세요'
          : '아직 저장할 내용 없음';
  return (
    <span className={`save-badge save-${status}`} role="status" aria-live="polite">
      {status === 'saved' && <IconCheck />}
      {status === 'error' && <span aria-hidden="true">!</span>}
      {text}
    </span>
  );
}

function Shell() {
  const { state, update, saveStatus, lastSaved, hadSaved } = useStore();
  const [view, setView] = useState<'start' | 'work'>(hadSaved || !state.started ? 'start' : 'work');
  const [menu, setMenu] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const backup = useBackupActions();
  const menuRef = useRef<HTMLDivElement>(null);

  // 새로 시작/지우기로 started가 꺼지면 시작 화면으로
  useEffect(() => {
    if (!state.started) setView('start');
  }, [state.started]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menu]);

  const act = state.activity === 0 ? 1 : state.activity;
  const working = view === 'work' && state.started;

  return (
    <>
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => setView('start')}>
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <span className="brand-name">뉴턴 인터뷰 신문 제작소</span>
          </button>
          {working && (
            <nav className="acts" aria-label="세 활동">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`act-tab act-tab-${n} ${act === n ? 'is-on' : ''}`}
                  aria-current={act === n ? 'page' : undefined}
                  onClick={() =>
                    update((s) => {
                      s.activity = n as 1 | 2 | 3;
                    })
                  }
                >
                  {ACTIVITY_NAMES[n - 1]}
                </button>
              ))}
            </nav>
          )}
          <div className="topbar-right">
            {state.started && <SaveBadge status={saveStatus} last={lastSaved} />}
            <div className="menu" ref={menuRef}>
              <button type="button" className="btn btn-small" aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu((m) => !m)}>
                메뉴
              </button>
              {menu && (
                <div className="menu-pop" role="menu">
                  {state.started && (
                    <button type="button" role="menuitem" onClick={() => (setMenu(false), void backup.saveFile())}>
                      활동 파일 저장
                    </button>
                  )}
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), backup.pickFile())}>
                    활동 파일 불러오기
                  </button>
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), setTeacher(true))}>
                    선생님용 도움말
                  </button>
                  <button type="button" role="menuitem" onClick={() => (setMenu(false), setView('start'))}>
                    처음 화면
                  </button>
                  <button type="button" role="menuitem" className="danger" onClick={() => (setMenu(false), backup.askReset())}>
                    이 기기의 내 활동 지우기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {working && state.reporter && <p className="who">기자: {state.reporter}</p>}
      </header>
      <div className="backup-host">{backup.ui}</div>

      {working ? (
        <main id="main" className={`work work-a${act}`}>
          {act === 1 && <Activity1 />}
          {act === 2 && <Activity2 />}
          {act === 3 && <Activity3 />}
        </main>
      ) : (
        <Start
          onEnter={() => {
            if (state.activity === 0)
              update((s) => {
                s.activity = 1;
              });
            setView('work');
          }}
          onTeacher={() => setTeacher(true)}
        />
      )}

      <Modal open={teacher} title="선생님용 도움말" onClose={() => setTeacher(false)} wide>
        <TeacherHelp />
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

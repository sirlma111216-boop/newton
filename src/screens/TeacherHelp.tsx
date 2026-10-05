import { IconExternal } from '../components/ui';
import { LESSON_PLAN, LESSON_PLAN_4, TEACHER_CHECKLIST, TEACHER_LINKS, TEACHER_NOTES } from '../content/guide';

export function TeacherHelp() {
  return (
    <div className="teacher">
      <section>
        <h3>수업 전에 학생 계정으로 확인할 것</h3>
        <ul className="checklist">
          {TEACHER_CHECKLIST.map((t) => (
            <li key={t}>
              <label>
                <input type="checkbox" /> {t}
              </label>
            </li>
          ))}
        </ul>
        <p className="help">이 체크는 저장되지 않는 확인용 목록입니다.</p>
      </section>
      <section>
        <h3>운영 안내</h3>
        <ul>
          {TEACHER_NOTES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Google 공식 안내</h3>
        <ul>
          {TEACHER_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label} <IconExternal />
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>권장 시간 (3차시)</h3>
        {LESSON_PLAN.map((p) => (
          <p key={p.title}>
            <strong>{p.title}</strong>
            <br />
            {p.parts.join(' → ')}
          </p>
        ))}
        <p className="help">권장 시간일 뿐이며, 화면에 타이머는 나오지 않습니다.</p>
      </section>
      <section>
        <h3>4차시로 운영할 때</h3>
        <p>계정 설정이나 이미지 생성이 늦어질 경우를 위한 대안입니다.</p>
        <ul>
          {LESSON_PLAN_4.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

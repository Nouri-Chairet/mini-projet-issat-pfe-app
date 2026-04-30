import { useTeacherDashboard } from "../../hooks/useTeacherDashboard";
import TeacherDashboardHero from "../../components/teacher-dashboard/TeacherDashboardHero";
import CurrentSessionBanner from "../../components/teacher-dashboard/CurrentSessionBanner";
import SupervisedSubjectsPanel from "../../components/teacher-dashboard/SupervisedSubjectsPanel";
import TeacherSidePanel from "../../components/teacher-dashboard/TeacherSidePanel";
import type { AppUser, PageId } from "../../types/app";

const A = "var(--ens-accent)";

interface EnseignantDashboardProps {
  user: AppUser;
  onNav: (page: PageId) => void;
}

export default function EnseignantDashboard({
  user,
  onNav,
}: EnseignantDashboardProps) {
  const { prof, mesSujets, mesJurys, total, currentSession } =
    useTeacherDashboard(user);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <TeacherDashboardHero
        accent={A}
        userName={user.name}
        supervisedCount={mesSujets.length}
        juryCount={mesJurys.length}
        availabilityCount={prof.disponibilites.length}
        total={total}
      />

      <CurrentSessionBanner
        currentSession={currentSession}
        onViewTimetable={() => onNav("emploi")}
      />

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}
      >
        <SupervisedSubjectsPanel
          accent={A}
          userName={user.name}
          mesSujets={mesSujets}
          mesJurys={mesJurys}
        />

        <TeacherSidePanel
          accent={A}
          availabilities={prof.disponibilites}
          supervisedCount={mesSujets.length}
          total={total}
          onNav={onNav}
        />
      </div>
    </div>
  );
}

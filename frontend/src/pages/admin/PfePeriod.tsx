import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Input, Select } from "../../components/UI";
import {
  getAdminDepartments,
  getPfeCampaign,
  listPfeAssignments,
  pfeAutoAssignCommit,
  pfeAutoAssignDryRun,
  upsertPfeCampaign,
  type AutoAssignPlan,
  type PfeAssignmentListItem,
} from "../../services/admin";

const A = "var(--chef-accent)";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function AdminPfePeriod() {
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [campaignId, setCampaignId] = useState("");
  const [campaignName, setCampaignName] = useState("Campagne PFE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayStartTime, setDayStartTime] = useState("08:00");
  const [dayEndTime, setDayEndTime] = useState("16:00");
  const [roomsCsv, setRoomsCsv] = useState("A1, A2, A3");
  const [weekdays, setWeekdays] = useState<string[]>([
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
  ]);

  const [plan, setPlan] = useState<AutoAssignPlan | null>(null);
  const [assignments, setAssignments] = useState<PfeAssignmentListItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const rooms = useMemo(
    () =>
      roomsCsv
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [roomsCsv],
  );

  const loadAssignments = useCallback(
    async (currentCampaignId?: string) => {
      const rows = await listPfeAssignments(
        currentCampaignId || campaignId || undefined,
      );
      setAssignments(rows);
    },
    [campaignId],
  );

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setLoading(true);
        const deps = await getAdminDepartments();
        if (!mounted) {
          return;
        }

        const simpleDeps = deps.map((item) => ({
          id: item.id,
          name: item.name,
        }));
        setDepartments(simpleDeps);

        const firstDep = simpleDeps[0];
        if (!firstDep) {
          setFeedback("Aucun département trouvé.");
          return;
        }

        setDepartmentId(firstDep.id);
        setDepartmentName(firstDep.name);

        try {
          const campaign = await getPfeCampaign({ department_id: firstDep.id });
          if (!mounted) {
            return;
          }
          setCampaignId(campaign.id);
          setCampaignName(campaign.name);
          setStartDate(campaign.start_date);
          setEndDate(campaign.end_date);
          setDayStartTime(campaign.day_start_time.slice(0, 5));
          setDayEndTime(campaign.day_end_time.slice(0, 5));
          setRoomsCsv(campaign.rooms.join(", "));
          setWeekdays(campaign.weekdays);
          await loadAssignments(campaign.id);
        } catch {
          if (!mounted) {
            return;
          }
          const now = new Date();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          setStartDate(`${now.getFullYear()}-${month}-01`);
          setEndDate(`${now.getFullYear()}-${month}-30`);
        }
      } catch {
        if (mounted) {
          setFeedback("Erreur de chargement du module PFE.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, [loadAssignments]);

  const savePeriod = async () => {
    if (!departmentId) {
      setFeedback("Sélectionnez un département.");
      return;
    }
    if (!startDate || !endDate || rooms.length === 0) {
      setFeedback("Renseignez les dates et les salles.");
      return;
    }

    try {
      setLoading(true);
      const campaign = await upsertPfeCampaign({
        campaign_id: campaignId || undefined,
        department_id: departmentId,
        name: campaignName,
        start_date: startDate,
        end_date: endDate,
        day_start_time: dayStartTime,
        day_end_time: dayEndTime,
        slot_duration_minutes: 60,
        break_duration_minutes: 15,
        weekdays,
        rooms,
        is_active: true,
      });
      setCampaignId(campaign.id);
      setFeedback(
        "Période démarrée. Les enseignants peuvent soumettre leurs disponibilités.",
      );
    } catch {
      setFeedback("Impossible de démarrer la période.");
    } finally {
      setLoading(false);
    }
  };

  const runDry = async () => {
    if (!campaignId) {
      setFeedback("Démarrez la période avant le dry-run.");
      return;
    }

    try {
      setLoading(true);
      const result = await pfeAutoAssignDryRun({ campaign_id: campaignId });
      setPlan(result);
      setFeedback(
        `Dry-run: ${result.stats.assigned_count}/${result.stats.subjects_total} planifiées, ${result.stats.unresolved_count} non résolues.`,
      );
    } catch {
      setFeedback("Erreur pendant le dry-run.");
    } finally {
      setLoading(false);
    }
  };

  const commitPlan = async () => {
    if (!campaignId) {
      setFeedback("Démarrez la période avant la planification.");
      return;
    }

    try {
      setLoading(true);
      const response = await pfeAutoAssignCommit({
        campaign_id: campaignId,
        replace_existing: true,
        block_on_unresolved: false,
      });
      setPlan(response);
      await loadAssignments(campaignId);
      setFeedback(
        `Planning publié: ${response.stats.assigned_count}/${response.stats.subjects_total} soutenances avec date/heure.`,
      );
    } catch {
      setFeedback("Erreur pendant la publication du planning.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          Periode PFE
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>
          Chef departement: lancer la periode
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          1) Démarrer la période. 2) Les enseignants saisissent leurs
          disponibilités. 3) Générer puis publier les dates finales.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Select
          label="Département"
          value={departmentId}
          onChange={(event) => {
            const depId = event.target.value;
            setDepartmentId(depId);
            const dep = departments.find((item) => item.id === depId);
            setDepartmentName(dep?.name || "");
          }}
        >
          <option value="">-- choisir --</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </Select>
        <Input
          label="Nom campagne"
          value={campaignName}
          onChange={(event) => setCampaignName(event.target.value)}
        />
        <Input
          label="Début"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          label="Fin"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
        <Input
          label="Début journée"
          type="time"
          value={dayStartTime}
          onChange={(event) => setDayStartTime(event.target.value)}
        />
        <Input
          label="Fin journée"
          type="time"
          value={dayEndTime}
          onChange={(event) => setDayEndTime(event.target.value)}
        />
        <Input
          label="Salles (csv)"
          value={roomsCsv}
          onChange={(event) => setRoomsCsv(event.target.value)}
          style={{ gridColumn: "span 2" }}
        />
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        {WEEKDAYS.map((day) => {
          const active = weekdays.includes(day);
          return (
            <button
              key={day}
              onClick={() => {
                setWeekdays((prev) =>
                  prev.includes(day)
                    ? prev.filter((item) => item !== day)
                    : [...prev, day],
                );
              }}
              style={{
                border: `1px solid ${active ? A : "var(--border2)"}`,
                background: active ? "var(--chef-dim)" : "var(--surface)",
                color: active ? A : "var(--text2)",
                borderRadius: 999,
                padding: "6px 10px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn accent={A} onClick={savePeriod}>
          Démarrer la période
        </Btn>
        <Btn accent={A} variant="ghost" onClick={runDry}>
          Dry-run planification
        </Btn>
        <Btn accent={A} variant="ghost" onClick={commitPlan}>
          Publier les dates PFE
        </Btn>
        <Btn accent={A} variant="muted" onClick={() => void loadAssignments()}>
          Rafraîchir la liste
        </Btn>
      </div>

      {feedback ? (
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            marginBottom: 16,
            color: "var(--text2)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{
          marginBottom: 14,
          color: "var(--text2)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
        }}
      >
        Département: {departmentName || "-"} | Campagne:{" "}
        {campaignId ? campaignId.slice(0, 8) : "non créée"} | État:{" "}
        {loading ? "chargement" : "prêt"}
      </div>

      {plan ? (
        <div style={{ marginBottom: 18, color: "var(--text2)", fontSize: 13 }}>
          Plan: {plan.stats.assigned_count}/{plan.stats.subjects_total}{" "}
          assignées, {plan.stats.unresolved_count} non résolues,{" "}
          {plan.stats.slots_generated} slots générés.
        </div>
      ) : null}

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 1fr 1fr",
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
          }}
        >
          <div>Date / Heure</div>
          <div>Etudiant</div>
          <div>Sujet</div>
          <div>Jury</div>
        </div>

        {assignments.map((item) => (
          <div
            key={item.subject_id}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 1fr 1fr",
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              gap: 10,
              fontSize: 13,
            }}
          >
            <div
              style={{
                color: "var(--text2)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              {item.slot
                ? `${item.slot.date} ${item.slot.start_time.slice(0, 5)}-${item.slot.end_time.slice(0, 5)} ${item.slot.room}`
                : "-"}
            </div>
            <div>{item.student_name}</div>
            <div>{item.subject_title}</div>
            <div style={{ color: "var(--text2)" }}>
              {item.jury
                .map((member) => `${member.role}: ${member.teacher_name}`)
                .join(" | ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

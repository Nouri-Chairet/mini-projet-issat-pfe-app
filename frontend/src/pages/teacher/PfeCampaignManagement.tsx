import { useEffect, useState } from "react";
import { Btn, Card, Input, Tag } from "../../components/UI";
import type { AppUser } from "../../types/app";
import {
  getTeacherPfeSessionState,
  headGeneratePfeSchedule,
  headStartPfeDateCollection,
  type TeacherPfeSessionState,
} from "../../services/teacherPfe";

const ACCENT = "var(--ens-accent)";

interface TeacherPfeCampaignManagementProps {
  user: AppUser;
}

function parseError(error: unknown): string {
  const e = error as {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.detail ??
    e?.message ??
    "Unexpected error"
  );
}

export default function TeacherPfeCampaignManagement({
  user,
}: TeacherPfeCampaignManagementProps) {
  const [state, setState] = useState<TeacherPfeSessionState | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("PFE Session");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [dailyCap, setDailyCap] = useState(3);
  const [rooms, setRooms] = useState("A1,A2,A3,A4");

  const refresh = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const next = await getTeacherPfeSessionState();
      setState(next);
      if (next.campaign) {
        setName(next.campaign.name);
        setStartDate(next.campaign.start_date);
        setEndDate(next.campaign.end_date);
        setDayStart(next.campaign.day_start_time.slice(0, 5));
        setDayEnd(next.campaign.day_end_time.slice(0, 5));
        setSlotDuration(next.campaign.slot_duration_minutes);
        setBreakDuration(next.campaign.break_duration_minutes);
        setDailyCap(next.campaign.daily_cap_per_teacher ?? 3);
        setRooms(next.campaign.rooms.join(","));
      }
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startScheduling = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const response = await headStartPfeDateCollection({
        name,
        start_date: startDate,
        end_date: endDate,
        day_start_time: dayStart,
        day_end_time: dayEnd,
        slot_duration_minutes: slotDuration,
        break_duration_minutes: breakDuration,
        daily_cap_per_teacher: dailyCap,
        weekdays: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
        rooms: rooms
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setState((current) =>
        current
          ? {
              ...current,
              campaign: response.campaign,
            }
          : current,
      );
      setFeedback(response.message);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const endScheduling = async () => {
    const campaignId = state?.campaign?.id;
    if (!campaignId) {
      setFeedback("Start scheduling first.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await headGeneratePfeSchedule({
        campaign_id: campaignId,
      });
      setState((current) =>
        current
          ? {
              ...current,
              campaign: response.campaign,
            }
          : current,
      );
      setFeedback(
        `${response.message} · Assigned ${response.plan.stats.assigned_count}/${response.plan.stats.subjects_total}`,
      );
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          Chef PFE Control
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Gestion PFE (Chef)</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {user.name} can unlock the campaign window and generate the final PFE
          schedule.
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Btn accent={ACCENT} onClick={refresh}>
          Refresh
        </Btn>
        <Btn accent={ACCENT} variant="ghost" onClick={startScheduling}>
          Start Scheduling
        </Btn>
        <Btn accent={ACCENT} variant="ghost" onClick={endScheduling}>
          End Scheduling
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1.15fr 0.85fr",
        }}
      >
        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Campaign settings
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Input
              label="Campaign name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <Input
              label="Day start"
              type="time"
              value={dayStart}
              onChange={(event) => setDayStart(event.target.value)}
            />
            <Input
              label="Day end"
              type="time"
              value={dayEnd}
              onChange={(event) => setDayEnd(event.target.value)}
            />
            <Input
              label="Slot duration (min)"
              type="number"
              value={slotDuration}
              onChange={(event) =>
                setSlotDuration(Number(event.target.value || 60))
              }
            />
            <Input
              label="Break duration (min)"
              type="number"
              value={breakDuration}
              onChange={(event) =>
                setBreakDuration(Number(event.target.value || 15))
              }
            />
            <Input
              label="Daily cap per teacher"
              type="number"
              value={dailyCap}
              onChange={(event) => setDailyCap(Number(event.target.value || 0))}
            />
            <Input
              label="Rooms (comma separated)"
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
            />
          </div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Current state</div>
          <div style={{ display: "grid", gap: 10 }}>
            <Tag color={ACCENT} bg="var(--ens-dim)">
              Department: {state?.department?.name ?? "None"}
            </Tag>
            <Tag>Campaign: {state?.campaign?.name ?? "Not started"}</Tag>
            <Tag>
              Collection:{" "}
              {state?.campaign?.availability_open ? "Open" : "Closed"}
            </Tag>
            <Tag>
              Schedule:{" "}
              {state?.campaign?.schedule_generated ? "Generated" : "Pending"}
            </Tag>
            <Tag>
              Your supervised PFEs: {state?.my_supervised_pfe_count ?? 0}
            </Tag>
          </div>
        </Card>
      </div>
    </div>
  );
}

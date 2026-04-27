import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Card, Input, Select, Tag } from "../../components/UI";
import type { AppUser } from "../../types/app";
import {
  getTeacherPfeSessionState,
  submitTeacherPfeAvailability,
  type TeacherAvailabilityLevel,
  type TeacherPfeSessionState,
} from "../../services/teacherPfe";

const ACCENT = "var(--ens-accent)";

interface EnseignantDisponibilitesProps {
  user: AppUser;
}

interface SlotRow {
  start: string;
  end: string;
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

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map((part) => Number(part));
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSlots(
  dayStart: string,
  dayEnd: string,
  slotDuration: number,
  breakDuration: number,
): SlotRow[] {
  const start = toMinutes(dayStart);
  const end = toMinutes(dayEnd);
  const step = Math.max(slotDuration, 1) + Math.max(breakDuration, 0);
  const rows: SlotRow[] = [];
  let cursor = start;
  while (cursor + slotDuration <= end) {
    rows.push({
      start: toHHMM(cursor),
      end: toHHMM(cursor + slotDuration),
    });
    cursor += step;
  }
  return rows;
}

function keyFor(date: string, slot: SlotRow): string {
  return `${date}|${slot.start}|${slot.end}`;
}

export default function EnseignantDisponibilites({
  user,
}: EnseignantDisponibilitesProps) {
  const [state, setState] = useState<TeacherPfeSessionState | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [slotLevels, setSlotLevels] = useState<
    Record<string, TeacherAvailabilityLevel>
  >({});

  const reload = useCallback(async () => {
    const response = await getTeacherPfeSessionState();
    setState(response);

    if (response.campaign) {
      if (!selectedDate) {
        setSelectedDate(response.campaign.start_date);
      }
    }

    const map: Record<string, TeacherAvailabilityLevel> = {};
    response.my_entries.forEach((entry) => {
      const key = `${entry.availability_date}|${entry.start_time.slice(0, 5)}|${entry.end_time.slice(0, 5)}`;
      map[key] = entry.level;
    });
    setSlotLevels(map);
  }, [selectedDate]);

  useEffect(() => {
    setBusy(true);
    setFeedback("");
    getTeacherPfeSessionState()
      .then((response) => {
        setState(response);
        if (response.campaign) {
          setSelectedDate(response.campaign.start_date);
        }

        const map: Record<string, TeacherAvailabilityLevel> = {};
        response.my_entries.forEach((entry) => {
          const key = `${entry.availability_date}|${entry.start_time.slice(0, 5)}|${entry.end_time.slice(0, 5)}`;
          map[key] = entry.level;
        });
        setSlotLevels(map);
      })
      .catch((error) => setFeedback(parseError(error)))
      .finally(() => setBusy(false));
  }, []);

  const campaign = state?.campaign;

  const slots = useMemo(() => {
    if (!campaign) {
      return [];
    }
    return buildSlots(
      campaign.day_start_time.slice(0, 5),
      campaign.day_end_time.slice(0, 5),
      campaign.slot_duration_minutes,
      campaign.break_duration_minutes,
    );
  }, [campaign]);

  const currentDateSlots = useMemo(() => {
    if (!selectedDate) {
      return [] as Array<
        SlotRow & { key: string; level: TeacherAvailabilityLevel }
      >;
    }
    return slots.map((slot) => {
      const key = keyFor(selectedDate, slot);
      return {
        ...slot,
        key,
        level: slotLevels[key] ?? "unavailable",
      };
    });
  }, [selectedDate, slots, slotLevels]);

  const submitAvailability = async () => {
    if (!campaign) {
      setFeedback("No active campaign.");
      return;
    }

    const entries = Object.entries(slotLevels).map(([key, level]) => {
      const [availabilityDate, startTime, endTime] = key.split("|");
      return {
        availability_date: availabilityDate,
        start_time: startTime,
        end_time: endTime,
        level,
      };
    });

    if (entries.length === 0) {
      setFeedback("Select at least one hour state before submitting.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await submitTeacherPfeAvailability({
        campaign_id: campaign.id,
        entries,
      });
      setFeedback(`${response.message} (${response.entries_count} entries)`);
      await reload();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const campaignLocked = !state?.can_submit_availability;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1080 }}>
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
          PFE Availability
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Disponibilités PFE</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {user.name} · Mark each proposed slot as preferred, available, or unavailable.
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <Btn accent={ACCENT} variant="ghost" onClick={reload}>
          Refresh
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
        {campaign ? (
          <Tag>Campaign: {campaign.name}</Tag>
        ) : (
          <Tag>No campaign</Tag>
        )}
        {state ? (
          <Tag>My supervised PFEs: {state.my_supervised_pfe_count}</Tag>
        ) : null}
        {state?.has_submitted_availability ? (
          <Tag color={ACCENT} bg="var(--ens-dim)">
            Submitted
          </Tag>
        ) : null}
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      {campaign ? (
        <Card style={{ padding: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Input
              label="Date"
              type="date"
              min={campaign.start_date}
              max={campaign.end_date}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <div>
              <div
                style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}
              >
                Campaign status
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag>{campaign.status.replaceAll("_", " ")}</Tag>
                <Tag>{campaign.rooms.length} room(s)</Tag>
              </div>
            </div>
          </div>

          {campaignLocked ? (
            <div
              style={{
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                color: "var(--text2)",
                marginBottom: 12,
              }}
            >
              Availability submission is locked right now. Admin opens this page automatically when your department campaign starts.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            {currentDateSlots.map((slot) => (
              <div
                key={slot.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {slot.start} - {slot.end}
                </div>
                <Select
                  value={slot.level}
                  disabled={campaignLocked}
                  onChange={(event) => {
                    const level = event.target
                      .value as TeacherAvailabilityLevel;
                    setSlotLevels((previous) => ({
                      ...previous,
                      [slot.key]: level,
                    }));
                  }}
                >
                  <option value="preferred">Available (preferred)</option>
                  <option value="available">Available (not preferred)</option>
                  <option value="unavailable">Not available</option>
                </Select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <Btn accent={ACCENT} onClick={submitAvailability}>
              {state?.has_submitted_availability ? "Update availability" : "Submit availability"}
            </Btn>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 16 }}>
          <div style={{ color: "var(--text2)" }}>
            No PFE session campaign found for your department yet.
          </div>
        </Card>
      )}
    </div>
  );
}

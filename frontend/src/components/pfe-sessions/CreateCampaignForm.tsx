import { Btn, Card, Input, Select, Tag } from "../UI";
import type { CampaignFormState } from "../../hooks/usePfeSessions";
import type { AdminDepartment } from "../../services/admin";

interface Props {
  accent: string;
  departments: AdminDepartment[];
  form: CampaignFormState;
  onChange: (next: CampaignFormState) => void;
  onCreate: () => void;
}

export default function CreateCampaignForm({
  accent,
  departments,
  form,
  onChange,
  onCreate,
}: Props) {
  const set = <K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <Card style={{ padding: 16, alignSelf: "start" }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Create campaign</div>
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Department</div>
          <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <Input label="Campaign name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Start date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        <Input label="End date" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        <Input label="Day start" type="time" value={form.dayStart} onChange={(e) => set("dayStart", e.target.value)} />
        <Input label="Day end" type="time" value={form.dayEnd} onChange={(e) => set("dayEnd", e.target.value)} />
        <Input label="Session length (minutes)" type="number" value={form.slotDuration} onChange={(e) => set("slotDuration", Number(e.target.value || 60))} />
        <Input label="Break (minutes)" type="number" value={form.breakDuration} onChange={(e) => set("breakDuration", Number(e.target.value || 15))} />
        <Input label="Daily cap per teacher" type="number" value={form.dailyCap} onChange={(e) => set("dailyCap", Number(e.target.value || 3))} />
        <Input label="Rooms (comma separated)" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} />
        <Btn accent={accent} onClick={onCreate}>
          Create campaign
        </Btn>
      </div>
    </Card>
  );
}

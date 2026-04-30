import { Card, Input, Select } from "../UI";
import type { SchedulerCampaignForm } from "../../hooks/usePfeScheduler";
import type { AdminDepartment } from "../../services/admin";

interface Props {
  departments: AdminDepartment[];
  selectedDeptId: string;
  onDeptChange: (id: string) => void;
  form: SchedulerCampaignForm;
  onChange: (next: SchedulerCampaignForm) => void;
}

export default function SchedulerCampaignSetup({
  departments,
  selectedDeptId,
  onDeptChange,
  form,
  onChange,
}: Props) {
  const set = <K extends keyof SchedulerCampaignForm>(
    key: K,
    value: SchedulerCampaignForm[K],
  ) => onChange({ ...form, [key]: value });

  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Campaign setup</div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
      >
        <Select
          label="Department"
          value={selectedDeptId}
          onChange={(e) => onDeptChange(e.target.value)}
        >
          <option value="">-- select department --</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Input
          label="Campaign name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Input
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(e) => set("startDate", e.target.value)}
        />
        <Input
          label="End date"
          type="date"
          value={form.endDate}
          onChange={(e) => set("endDate", e.target.value)}
        />
        <Input
          label="Day start"
          type="time"
          value={form.dayStart}
          onChange={(e) => set("dayStart", e.target.value)}
        />
        <Input
          label="Day end"
          type="time"
          value={form.dayEnd}
          onChange={(e) => set("dayEnd", e.target.value)}
        />
        <Input
          label="Slot duration (min)"
          type="number"
          value={form.slotDuration}
          onChange={(e) => set("slotDuration", Number(e.target.value || 60))}
        />
        <Input
          label="Break duration (min)"
          type="number"
          value={form.breakDuration}
          onChange={(e) => set("breakDuration", Number(e.target.value || 15))}
        />
        <Input
          label="Daily cap per teacher"
          type="number"
          value={form.dailyCap}
          onChange={(e) => set("dailyCap", Number(e.target.value || 0))}
        />
        <Input
          label="Rooms (comma separated)"
          value={form.rooms}
          onChange={(e) => set("rooms", e.target.value)}
        />
      </div>
    </Card>
  );
}

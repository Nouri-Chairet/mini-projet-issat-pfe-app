import { Btn, Card, Input, Select, Tag } from "../UI";
import { DataTable, type DataTableColumn } from "../tables/DataTable";
import type {
  ManualTimetablePayload,
  TeacherScheduleItem,
} from "../../services/timetable";

/*
  TimetableManualPanel — manual create + list/delete in one focused
  Card. Stateless: parent owns the form state and roster.
*/

const DAYS = [
  { value: "Lundi", label: "Lundi" },
  { value: "Mardi", label: "Mardi" },
  { value: "Mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "Vendredi", label: "Vendredi" },
  { value: "Samedi", label: "Samedi" },
];

interface TimetableManualPanelProps {
  teachers: Array<{ id: string; username: string }>;
  classes: Array<{ id: string; niveau: string; section: string; num: string }>;
  slots: TeacherScheduleItem[];
  manualForm: ManualTimetablePayload;
  setManualForm: (next: ManualTimetablePayload) => void;
  onSubmit: () => void;
  onDelete: (slotId: string) => void;
  busy: boolean;
}

const A = "var(--chef-accent)";

export const TimetableManualPanel = ({
  teachers,
  classes,
  slots,
  manualForm,
  setManualForm,
  onSubmit,
  onDelete,
  busy,
}: TimetableManualPanelProps) => {
  const update = (patch: Partial<ManualTimetablePayload>) =>
    setManualForm({ ...manualForm, ...patch });

  const columns: DataTableColumn<TeacherScheduleItem>[] = [
    {
      key: "day",
      header: "Jour",
      width: 110,
      render: (row) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {row.day_of_week}
        </span>
      ),
    },
    {
      key: "time",
      header: "Heure",
      width: 130,
      render: (row) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Matière",
      render: (row) => <span style={{ fontWeight: 500 }}>{row.subject}</span>,
    },
    {
      key: "class",
      header: "Classe",
      width: 130,
      render: (row) => (
        <span style={{ color: "var(--blue-soft)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {row.class}
        </span>
      ),
    },
    {
      key: "teacher",
      header: "Enseignant",
      render: (row) => (
        <span style={{ color: "var(--text2)" }}>{row.teacher ?? "—"}</span>
      ),
    },
    {
      key: "room",
      header: "Salle",
      width: 100,
      render: (row) => <span style={{ color: "var(--text2)" }}>{row.room}</span>,
    },
    {
      key: "actions",
      header: "",
      width: 100,
      align: "right",
      render: (row) => (
        <Btn variant="muted" onClick={() => onDelete(row.id)}>
          Supprimer
        </Btn>
      ),
    },
  ];

  return (
    <Card style={{ padding: 18, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: A,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            Step 02 · Édition manuelle
          </div>
          <h3 style={{ margin: "6px 0 0 0", fontSize: 18 }}>Ajouter une séance manuellement</h3>
        </div>
        <Tag color={A} bg="var(--chef-dim)">{slots.length} séance(s) actives</Tag>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <Select
          label="Enseignant"
          accent={A}
          value={manualForm.teacher_id}
          onChange={(event) => update({ teacher_id: event.target.value })}
        >
          <option value="">— sélectionner —</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.username}
            </option>
          ))}
        </Select>
        <Select
          label="Classe"
          accent={A}
          value={manualForm.class_id}
          onChange={(event) => update({ class_id: event.target.value })}
        >
          <option value="">— sélectionner —</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {`${item.niveau}-${item.section}-${item.num}`}
            </option>
          ))}
        </Select>
        <Select
          label="Jour"
          accent={A}
          value={manualForm.day_of_week}
          onChange={(event) => update({ day_of_week: event.target.value })}
        >
          {DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </Select>
        <Input
          label="Matière"
          accent={A}
          value={manualForm.subject}
          onChange={(event) => update({ subject: event.target.value })}
        />
        <Input
          label="Heure début"
          type="time"
          accent={A}
          value={manualForm.start_time}
          onChange={(event) => update({ start_time: event.target.value })}
        />
        <Input
          label="Heure fin"
          type="time"
          accent={A}
          value={manualForm.end_time}
          onChange={(event) => update({ end_time: event.target.value })}
        />
        <Input
          label="Salle"
          accent={A}
          value={manualForm.room}
          onChange={(event) => update({ room: event.target.value })}
        />
        <div style={{ display: "flex", alignItems: "end" }}>
          <Btn accent={A} onClick={onSubmit} disabled={busy}>
            Ajouter la séance
          </Btn>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={slots}
        rowKey={(row) => row.id}
        emptyLabel="Aucune séance enregistrée."
        dense
      />
    </Card>
  );
};

export default TimetableManualPanel;

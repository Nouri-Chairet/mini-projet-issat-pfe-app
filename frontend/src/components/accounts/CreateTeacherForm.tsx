import { Btn, Input } from "../UI";
import type { TeacherFormState } from "../../hooks/useAccounts";

interface Props {
  form: TeacherFormState;
  onChange: (next: TeacherFormState) => void;
  onSubmit: () => void;
}

export default function CreateTeacherForm({ form, onChange, onSubmit }: Props) {
  const set = <K extends keyof TeacherFormState>(
    key: K,
    value: TeacherFormState[K],
  ) => onChange({ ...form, [key]: value });

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 16,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Créer enseignant</h3>
      <div style={{ display: "grid", gap: 10 }}>
        <Input
          label="Username"
          value={form.username}
          onChange={(e) => set("username", e.target.value)}
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <Input
          label="Département"
          value={form.department}
          onChange={(e) => set("department", e.target.value)}
        />
        <Input
          label="NCIN"
          value={form.ncin}
          onChange={(e) => set("ncin", e.target.value)}
        />
        <Input
          label="Age"
          type="number"
          value={form.age}
          onChange={(e) => set("age", Number(e.target.value))}
        />
        <Btn onClick={onSubmit}>Créer enseignant</Btn>
      </div>
    </div>
  );
}

import { Btn, Input, Select } from "../UI";
import type { StudentFormState } from "../../hooks/useAccounts";
import type { AdminClass } from "../../services/admin";

interface Props {
  form: StudentFormState;
  classes: AdminClass[];
  onChange: (next: StudentFormState) => void;
  onSubmit: () => void;
}

export default function CreateStudentForm({
  form,
  classes,
  onChange,
  onSubmit,
}: Props) {
  const set = <K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K],
  ) => onChange({ ...form, [key]: value });

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 16,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Créer étudiant</h3>
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
        <Select
          label="Classe"
          value={form.class_id}
          onChange={(e) => set("class_id", e.target.value)}
        >
          <option value="">-- sélectionner --</option>
          {classes.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >{`${c.niveau}-${c.section}-${c.num}`}</option>
          ))}
        </Select>
        <Input
          label="Contact parent"
          value={form.parent_contact}
          onChange={(e) => set("parent_contact", e.target.value)}
        />
        <Btn onClick={onSubmit}>Créer étudiant</Btn>
      </div>
    </div>
  );
}

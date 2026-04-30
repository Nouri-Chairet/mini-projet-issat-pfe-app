import { Btn, Input, Modal } from "../UI";

interface Props {
  accent: string;
  form: { sujet: string; message: string };
  onChange: (form: { sujet: string; message: string }) => void;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function NewQuestionModal({
  accent,
  form,
  onChange,
  busy,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal title="Nouvelle discussion" onClose={onClose} accent={accent}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Input
          label="Titre"
          accent={accent}
          value={form.sujet}
          onChange={(e) => onChange({ ...form, sujet: e.target.value })}
          placeholder="Sujet de la discussion"
        />
        <div>
          <label
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--text2)",
              display: "block",
              marginBottom: 7,
            }}
          >
            Message
          </label>
          <textarea
            value={form.message}
            onChange={(e) => onChange({ ...form, message: e.target.value })}
            placeholder="Votre message…"
            rows={5}
            style={{
              width: "100%",
              padding: "11px 15px",
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: "var(--r-md)",
              color: "var(--text)",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn onClick={onClose} variant="muted">
          Annuler
        </Btn>
        <Btn onClick={onSubmit} accent={accent} disabled={busy}>
          {busy ? "Publication…" : "Publier"}
        </Btn>
      </div>
    </Modal>
  );
}

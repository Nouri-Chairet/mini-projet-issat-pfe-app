import { useState } from "react";
import { sujets as initialSujets, enseignants } from "../../data/mockData";
import { Avatar, Btn, Select, Modal } from "../../components/UI";
import type { Sujet } from "../../types/app";

const A = "var(--chef-accent)";

export default function ChefJurys() {
  const [sujets, setSujets] = useState<Sujet[]>(initialSujets);
  const [modal, setModal] = useState<Sujet | null>(null);
  const [pres, setPres] = useState<string>("");
  const [rapp, setRapp] = useState<string>("");

  const assign = () => {
    const president = enseignants.find(
      (enseignant) => enseignant.id === Number(pres),
    );
    const rapporteur = enseignants.find(
      (enseignant) => enseignant.id === Number(rapp),
    );
    if (!president || !rapporteur || !modal) {
      return;
    }

    setSujets((prev) =>
      prev.map((sujet) =>
        sujet.id !== modal.id
          ? sujet
          : {
              ...sujet,
              statut: "planifié",
              jury: [
                { id: president.id, name: president.name, role: "président" },
                {
                  id: rapporteur.id,
                  name: rapporteur.name,
                  role: "rapporteur",
                },
              ],
            },
      ),
    );
    setModal(null);
    setPres("");
    setRapp("");
  };

  const withJ = sujets.filter((sujet) => sujet.jury.length > 0);
  const withoutJ = sujets.filter((sujet) => sujet.jury.length === 0);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <div className="fu" style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: 8,
          }}
        >
          ◈ Attribution
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px" }}>
          Gestion des{" "}
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: A,
              fontWeight: 400,
            }}
          >
            jurys
          </span>
        </h1>
      </div>

      <div
        className="fu1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Jurys attribués", value: withJ.length, accent: A },
          {
            label: "À attribuer",
            value: withoutJ.length,
            accent: "var(--warning)",
          },
          {
            label: "Enseignants",
            value: enseignants.length,
            accent: "var(--ens-accent)",
          },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: accent,
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-2px",
                color: "var(--text)",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {withoutJ.length > 0 && (
        <div className="fu2" style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--warning)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: 12,
            }}
          >
            ▲ Jurys à attribuer
          </div>
          {withoutJ.map((sujet) => (
            <div
              key={sujet.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--surface)",
                border: "1px solid rgba(255,181,71,0.2)",
                borderRadius: "var(--r-lg)",
                padding: "16px 20px",
                marginBottom: 10,
              }}
            >
              <Avatar
                initials={sujet.etudiant.avatar}
                accent="var(--warning)"
                size={36}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sujet.titre}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text2)",
                    marginTop: 3,
                  }}
                >
                  {sujet.etudiant.name} · Enc: {sujet.encadreur.name}
                </div>
              </div>
              <Btn
                onClick={() => {
                  setModal(sujet);
                  setPres("");
                  setRapp("");
                }}
                accent={A}
              >
                + Attribuer
              </Btn>
            </div>
          ))}
        </div>
      )}

      <div className="fu3">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 12,
          }}
        >
          ✓ Jurys attribués
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
              padding: "10px 22px",
              borderBottom: "1px solid var(--border)",
              gap: 12,
            }}
          >
            {["Sujet", "Étudiant", "Président", "Rapporteur", ""].map(
              (header) => (
                <div
                  key={header}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "var(--text3)",
                  }}
                >
                  {header}
                </div>
              ),
            )}
          </div>
          {withJ.map((sujet, index) => {
            const president = sujet.jury.find(
              (juryMember) => juryMember.role === "président",
            );
            const rapporteur = sujet.jury.find(
              (juryMember) => juryMember.role === "rapporteur",
            );
            return (
              <div
                key={sujet.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                  padding: "14px 22px",
                  gap: 12,
                  alignItems: "center",
                  borderBottom:
                    index < withJ.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sujet.titre}
                </div>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>
                  {sujet.etudiant.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {president && (
                    <>
                      <Avatar
                        initials={president.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2)}
                        accent="var(--warning)"
                        size={24}
                      />
                      <span style={{ fontSize: 12 }}>
                        {president.name.split(" ").slice(-1)[0]}
                      </span>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {rapporteur && (
                    <>
                      <Avatar
                        initials={rapporteur.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2)}
                        accent="var(--etu-accent)"
                        size={24}
                      />
                      <span style={{ fontSize: 12 }}>
                        {rapporteur.name.split(" ").slice(-1)[0]}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setModal(sujet);
                    setPres(String(president?.id ?? ""));
                    setRapp(String(rapporteur?.id ?? ""));
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "var(--bg2)",
                    border: "1px solid var(--border2)",
                    borderRadius: 8,
                    color: "var(--text2)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Éditer
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <Modal
          title="Attribuer un jury"
          onClose={() => setModal(null)}
          accent={A}
        >
          <div
            style={{
              background: "var(--bg3)",
              borderRadius: "var(--r-md)",
              padding: "12px 14px",
              marginBottom: 18,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text2)",
            }}
          >
            {modal.titre}
            <br />
            <span style={{ color: "var(--text3)", fontSize: 11 }}>
              {modal.etudiant.name}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <Select
              label="Président du jury"
              value={pres}
              onChange={(e) => {
                setPres(e.target.value);
              }}
            >
              <option value="">— Sélectionner —</option>
              {enseignants
                .filter((enseignant) => enseignant.id !== Number(rapp))
                .map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>
                    {enseignant.name}
                  </option>
                ))}
            </Select>
            <Select
              label="Rapporteur"
              value={rapp}
              onChange={(e) => {
                setRapp(e.target.value);
              }}
            >
              <option value="">— Sélectionner —</option>
              {enseignants
                .filter((enseignant) => enseignant.id !== Number(pres))
                .map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>
                    {enseignant.name}
                  </option>
                ))}
            </Select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn onClick={() => setModal(null)} variant="muted">
              Annuler
            </Btn>
            <Btn
              onClick={assign}
              accent={A}
              style={{ opacity: pres && rapp ? 1 : 0.4 }}
            >
              Confirmer
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

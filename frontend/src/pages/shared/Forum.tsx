import { useCallback, useEffect, useState } from "react";
import {
  answerForumQuestion,
  createForumQuestion,
  deleteForumAnswer,
  deleteForumQuestion,
  getForumQuestionDetail,
  getForumQuestions,
  type ForumAnswer,
  type ForumQuestion,
} from "../../services/forum";
import { Avatar, Btn, Modal, Input } from "../../components/UI";
import type { AppUser } from "../../types/app";

const roleIcon = { enseignant: "◆", etudiant: "◉", chef: "◈" } as const;
const roleColor = {
  enseignant: "var(--ens-accent)",
  etudiant: "var(--etu-accent)",
  chef: "var(--chef-accent)",
  // backend role values
  teacher: "var(--ens-accent)",
  student: "var(--etu-accent)",
  admin: "var(--chef-accent)",
} as const;

function roleColorFor(role: string): string {
  return (roleColor as Record<string, string>)[role] ?? "var(--text2)";
}
function roleIconFor(role: string): string {
  return (roleIcon as Record<string, string>)[role] ?? "●";
}
function avatarInitials(author: string): string {
  return author
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ForumProps {
  user: AppUser;
}

export default function Forum({ user }: ForumProps) {
  const accent = roleColorFor(user.role);

  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ sujet: "", message: "" });
  const [newBusy, setNewBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getForumQuestions();
      setQuestions(data);
    } catch {
      setLoadError("Erreur lors du chargement des discussions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const toggleExpanded = async (id: string) => {
    const next = !expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: next }));

    if (next) {
      const q = questions.find((x) => x.id === id);
      if (q && !q.answers) {
        setLoadingAnswers((prev) => ({ ...prev, [id]: true }));
        try {
          const detail = await getForumQuestionDetail(id);
          setQuestions((prev) =>
            prev.map((x) => (x.id === id ? { ...x, answers: detail.answers } : x)),
          );
        } catch {
          setFeedback("Erreur lors du chargement des réponses.");
        } finally {
          setLoadingAnswers((prev) => ({ ...prev, [id]: false }));
        }
      }
    }
  };

  const handleReply = async (questionId: string) => {
    const content = replyText[questionId]?.trim();
    if (!content || submitting[questionId]) return;

    setSubmitting((prev) => ({ ...prev, [questionId]: true }));
    try {
      await answerForumQuestion(questionId, content);
      setReplyText((prev) => ({ ...prev, [questionId]: "" }));
      // reload answers for this question
      const detail = await getForumQuestionDetail(questionId);
      setQuestions((prev) =>
        prev.map((x) =>
          x.id === questionId
            ? { ...x, answers: detail.answers, answers_count: (detail.answers ?? []).length }
            : x,
        ),
      );
    } catch {
      setFeedback("Erreur lors de l'envoi de la réponse.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleDeleteAnswer = async (questionId: string, answerId: string) => {
    try {
      await deleteForumAnswer(answerId);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id !== questionId
            ? q
            : {
                ...q,
                answers: (q.answers ?? []).filter((a) => a.id !== answerId),
                answers_count: Math.max(0, q.answers_count - 1),
              },
        ),
      );
    } catch {
      setFeedback("Erreur lors de la suppression.");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteForumQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch {
      setFeedback("Erreur lors de la suppression.");
    }
  };

  const handleNew = async () => {
    if (!newForm.sujet.trim() || !newForm.message.trim() || newBusy) return;
    setNewBusy(true);
    try {
      await createForumQuestion(newForm.sujet.trim(), newForm.message.trim());
      setNewForm({ sujet: "", message: "" });
      setShowNew(false);
      await loadQuestions();
    } catch {
      setFeedback("Erreur lors de la création de la discussion.");
    } finally {
      setNewBusy(false);
    }
  };

  const canModerate =
    user.role === "chef" || user.role === "enseignant";

  const canDeleteQuestion = (q: ForumQuestion) =>
    canModerate || q.author_id === user.schemaUserId;

  const canDeleteAnswer = (a: ForumAnswer) =>
    canModerate || a.author_id === user.schemaUserId;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 800 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: accent,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: 8,
            }}
          >
            ◎ Discussion
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px", margin: 0 }}>
            Forum{" "}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: accent,
                fontWeight: 400,
              }}
            >
              PFE
            </span>
          </h1>
        </div>
        <Btn accent={accent} onClick={() => setShowNew(true)}>
          + Nouvelle discussion
        </Btn>
      </div>

      {feedback && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--r-md)",
            color: "#ef4444",
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {feedback}
          <button
            onClick={() => setFeedback("")}
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div style={{ color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          Chargement…
        </div>
      )}

      {loadError && (
        <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>{loadError}</div>
      )}

      {!loading && !loadError && questions.length === 0 && (
        <div style={{ color: "var(--text2)", textAlign: "center", padding: "40px 0" }}>
          Aucune discussion pour l'instant. Soyez le premier à poser une question !
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accent}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Avatar
                  initials={avatarInitials(q.author)}
                  accent={roleColorFor(q.author_role)}
                  size={38}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{q.author}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: roleColorFor(q.author_role),
                      }}
                    >
                      {roleIconFor(q.author_role)} {q.author_role}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--text3)",
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(q.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                    {canDeleteQuestion(q) && (
                      <button
                        onClick={() => void handleDeleteQuestion(q.id)}
                        title="Supprimer"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text3)",
                          cursor: "pointer",
                          fontSize: 13,
                          padding: "0 4px",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 8,
                      marginTop: 0,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {q.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                    {q.content}
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <button
                  onClick={() => void toggleExpanded(q.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 14px",
                    border: "1px solid var(--border2)",
                    borderRadius: 40,
                    background: "none",
                    color: "var(--text2)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                >
                  {expanded[q.id] ? "▲" : "▼"} {q.answers_count} réponse
                  {q.answers_count !== 1 ? "s" : ""}
                </button>
              </div>
            </div>

            {/* Answers panel */}
            {expanded[q.id] && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.01)",
                }}
              >
                {loadingAnswers[q.id] && (
                  <div
                    style={{
                      padding: "14px 24px",
                      color: "var(--text3)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    Chargement…
                  </div>
                )}

                {(q.answers ?? []).map((answer: ForumAnswer, index: number) => (
                  <div
                    key={answer.id}
                    style={{
                      padding: "14px 24px 14px 52px",
                      borderBottom:
                        index < (q.answers ?? []).length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <Avatar
                      initials={avatarInitials(answer.author)}
                      accent={roleColorFor(answer.author_role)}
                      size={30}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{answer.author}</span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            color: roleColorFor(answer.author_role),
                          }}
                        >
                          {roleIconFor(answer.author_role)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            color: "var(--text3)",
                          }}
                        >
                          {new Date(answer.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {canDeleteAnswer(answer) && (
                          <button
                            onClick={() => void handleDeleteAnswer(q.id, answer.id)}
                            title="Supprimer"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text3)",
                              cursor: "pointer",
                              fontSize: 12,
                              marginLeft: "auto",
                              padding: "0 4px",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
                        {answer.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Reply box */}
                <div
                  style={{
                    padding: "14px 24px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    borderTop: (q.answers ?? []).length > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <Avatar initials={avatarInitials(user.name)} accent={accent} size={30} />
                  <input
                    value={replyText[q.id] ?? ""}
                    onChange={(e) =>
                      setReplyText((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleReply(q.id);
                      }
                    }}
                    placeholder="Répondre…"
                    disabled={submitting[q.id]}
                    style={{
                      flex: 1,
                      padding: "9px 14px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: 40,
                      color: "var(--text)",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: 13,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = `${accent}60`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                    }}
                  />
                  <button
                    onClick={() => void handleReply(q.id)}
                    disabled={submitting[q.id]}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: submitting[q.id] ? "var(--border)" : accent,
                      border: "none",
                      color: "#000",
                      cursor: submitting[q.id] ? "not-allowed" : "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New question modal */}
      {showNew && (
        <Modal
          title="Nouvelle discussion"
          onClose={() => {
            setShowNew(false);
          }}
          accent={accent}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            <Input
              label="Titre"
              accent={accent}
              value={newForm.sujet}
              onChange={(e) => setNewForm((prev) => ({ ...prev, sujet: e.target.value }))}
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
                value={newForm.message}
                onChange={(e) => setNewForm((prev) => ({ ...prev, message: e.target.value }))}
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
            <Btn onClick={() => setShowNew(false)} variant="muted">
              Annuler
            </Btn>
            <Btn onClick={() => void handleNew()} accent={accent} disabled={newBusy}>
              {newBusy ? "Publication…" : "Publier"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

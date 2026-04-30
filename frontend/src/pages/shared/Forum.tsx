import { Btn } from "../../components/UI";
import Icon from "../../components/Icon";
import QuestionCard from "../../components/forum/QuestionCard";
import NewQuestionModal from "../../components/forum/NewQuestionModal";
import { useForum } from "../../hooks/useForum";
import type { AppUser } from "../../types/app";

const roleColor: Record<string, string> = {
  enseignant: "var(--ens-accent)",
  etudiant: "var(--etu-accent)",
  chef: "var(--chef-accent)",
  teacher: "var(--ens-accent)",
  student: "var(--etu-accent)",
  admin: "var(--chef-accent)",
};

function roleColorFor(role: string): string {
  return roleColor[role] ?? "var(--text2)";
}

interface ForumProps {
  user: AppUser;
}

export default function Forum({ user }: ForumProps) {
  const accent = roleColorFor(user.role);
  const {
    questions,
    loading,
    loadError,
    expanded,
    loadingAnswers,
    replyText,
    setReplyText,
    submitting,
    showNew,
    setShowNew,
    newForm,
    setNewForm,
    newBusy,
    feedback,
    setFeedback,
    canDeleteQuestion,
    canDeleteAnswer,
    toggleExpanded,
    handleReply,
    handleDeleteAnswer,
    handleDeleteQuestion,
    handleNewQuestion,
  } = useForum(user);

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
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="messages" size={14} color={accent} /> Discussion
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
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
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {loading && (
        <div
          style={{
            color: "var(--text2)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          Chargement…
        </div>
      )}

      {loadError && (
        <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>
          {loadError}
        </div>
      )}

      {!loading && !loadError && questions.length === 0 && (
        <div
          style={{
            color: "var(--text2)",
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          Aucune discussion pour l'instant. Soyez le premier à poser une
          question !
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            accent={accent}
            q={q}
            isExpanded={!!expanded[q.id]}
            isLoadingAnswers={!!loadingAnswers[q.id]}
            replyText={replyText[q.id] ?? ""}
            isSubmitting={!!submitting[q.id]}
            userName={user.name}
            canDelete={canDeleteQuestion(q)}
            canDeleteAnswer={canDeleteAnswer}
            onToggle={() => void toggleExpanded(q.id)}
            onReply={() => void handleReply(q.id)}
            onReplyChange={(text) =>
              setReplyText((prev) => ({ ...prev, [q.id]: text }))
            }
            onDeleteQuestion={() => void handleDeleteQuestion(q.id)}
            onDeleteAnswer={(answerId) =>
              void handleDeleteAnswer(q.id, answerId)
            }
          />
        ))}
      </div>

      {showNew && (
        <NewQuestionModal
          accent={accent}
          form={newForm}
          onChange={setNewForm}
          busy={newBusy}
          onClose={() => setShowNew(false)}
          onSubmit={() => void handleNewQuestion()}
        />
      )}
    </div>
  );
}

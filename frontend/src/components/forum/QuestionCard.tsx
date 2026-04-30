import { Avatar } from "../UI";
import Icon from "../Icon";
import type { ForumQuestion, ForumAnswer } from "../../services/forum";

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

function avatarInitials(author: string): string {
  return author
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface QuestionCardProps {
  accent: string;
  q: ForumQuestion;
  isExpanded: boolean;
  isLoadingAnswers: boolean;
  replyText: string;
  isSubmitting: boolean;
  userName: string;
  canDelete: boolean;
  canDeleteAnswer: (a: ForumAnswer) => boolean;
  onToggle: () => void;
  onReply: () => void;
  onReplyChange: (text: string) => void;
  onDeleteQuestion: () => void;
  onDeleteAnswer: (answerId: string) => void;
}

export default function QuestionCard({
  accent,
  q,
  isExpanded,
  isLoadingAnswers,
  replyText,
  isSubmitting,
  userName,
  canDelete,
  canDeleteAnswer,
  onToggle,
  onReply,
  onReplyChange,
  onDeleteQuestion,
  onDeleteAnswer,
}: QuestionCardProps) {
  return (
    <div
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Icon name="shield" size={10} color={roleColorFor(q.author_role)} />
                {q.author_role}
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
              {canDelete && (
                <button
                  onClick={onDeleteQuestion}
                  title="Supprimer"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: "0 4px",
                    display: "flex",
                  }}
                >
                  <Icon name="x" size={14} />
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
            <p
              style={{
                fontSize: 13,
                color: "var(--text2)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
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
            onClick={onToggle}
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
            <Icon
              name={isExpanded ? "chevron-right" : "chevron-right"}
              size={12}
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
              }}
            />{" "}
            {q.answers_count} réponse{q.answers_count !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* Answers panel */}
      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          {isLoadingAnswers && (
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
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {answer.author}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: roleColorFor(answer.author_role),
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Icon name="shield" size={10} color={roleColorFor(answer.author_role)} />
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
                      onClick={() => onDeleteAnswer(answer.id)}
                      title="Supprimer"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text3)",
                        cursor: "pointer",
                        fontSize: 12,
                        marginLeft: "auto",
                        padding: "0 4px",
                        display: "flex",
                      }}
                    >
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text2)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
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
              borderTop:
                (q.answers ?? []).length > 0
                  ? "1px solid var(--border)"
                  : "none",
            }}
          >
            <Avatar initials={avatarInitials(userName)} accent={accent} size={30} />
            <input
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onReply();
              }}
              placeholder="Répondre…"
              disabled={isSubmitting}
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
              onClick={onReply}
              disabled={isSubmitting}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: isSubmitting ? "var(--border)" : accent,
                border: "none",
                color: "#000",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

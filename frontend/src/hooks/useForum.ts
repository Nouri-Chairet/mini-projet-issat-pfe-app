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
} from "../services/forum";
import type { AppUser } from "../types/app";

/**
 * All forum data, UI state, and actions in a single hook.
 * The Forum page becomes a pure rendering component.
 */
export function useForum(user: AppUser) {
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

  const canModerate = user.role === "chef" || user.role === "enseignant";

  const canDeleteQuestion = (q: ForumQuestion) =>
    canModerate || q.author_id === user.schemaUserId;

  const canDeleteAnswer = (a: ForumAnswer) =>
    canModerate || a.author_id === user.schemaUserId;

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

  const handleNewQuestion = async () => {
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

  return {
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
  };
}

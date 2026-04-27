import { useCallback, useEffect, useState } from "react";

import { Btn, Card, Tag } from "../../components/UI";
import { getStudentNotifications, getStudentPfeOverview, markStudentNotificationRead, type StudentNotificationItem, type StudentPfeOverview } from "../../services/studentPfe";
import type { AppUser, PageId } from "../../types/app";

const A = "var(--etu-accent)";

interface EtudiantDashboardProps {
  user: AppUser;
  onNav: (page: PageId) => void;
}

function parseError(error: unknown): string {
  const e = error as {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
  };
  return e?.response?.data?.error ?? e?.response?.data?.detail ?? e?.message ?? "Unexpected error";
}

export default function EtudiantDashboard({ user }: EtudiantDashboardProps) {
  const [overview, setOverview] = useState<StudentPfeOverview["subject"] | null>(null);
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(async () => {
    setBusy(true);
    setFeedback("");
    try {
      const [overviewResponse, notificationsResponse] = await Promise.all([
        getStudentPfeOverview(),
        getStudentNotifications(),
      ]);
      setOverview(overviewResponse.subject);
      setNotifications(notificationsResponse.notifications);
      setUnreadCount(notificationsResponse.unread_count);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = async (notificationId: string) => {
    try {
      await markStudentNotificationRead(notificationId);
      await refresh();
    } catch (error) {
      setFeedback(parseError(error));
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1040 }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          Espace étudiant
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Mon PFE</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          {user.name} · Follow your subject, defense slot, and scheduling updates here.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Btn accent={A} variant="ghost" onClick={refresh}>
          Refresh
        </Btn>
        {busy ? <Tag>Loading...</Tag> : null}
        <Tag color={A} bg="var(--etu-dim)">
          Unread notifications: {unreadCount}
        </Tag>
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Current PFE subject</div>
          {!overview ? (
            <div style={{ color: "var(--text2)" }}>No PFE subject is linked to your account yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{overview.title}</div>
              <div style={{ color: "var(--text2)" }}>Supervisor: {overview.supervisor_name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag>
                  {overview.slot
                    ? `${overview.slot.date} ${overview.slot.start_time.slice(0, 5)}-${overview.slot.end_time.slice(0, 5)}`
                    : "Not scheduled yet"}
                </Tag>
                {overview.slot ? <Tag>Room {overview.slot.room}</Tag> : null}
              </div>
              <div style={{ color: "var(--text2)", fontSize: 14 }}>
                Jury:{" "}
                {overview.jury.length > 0
                  ? overview.jury.map((member) => `${member.role}: ${member.teacher_name}`).join(" · ")
                  : "Not assigned yet"}
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Notifications</div>
          {notifications.length === 0 ? (
            <div style={{ color: "var(--text2)" }}>No notifications yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    padding: "14px 16px",
                    background: notification.is_read ? "transparent" : "var(--etu-dim)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{notification.title}</div>
                      <div style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
                        {notification.message}
                      </div>
                    </div>
                    {!notification.is_read ? (
                      <Btn accent={A} variant="ghost" onClick={() => void markRead(notification.id)}>
                        Mark read
                      </Btn>
                    ) : (
                      <Tag>Read</Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

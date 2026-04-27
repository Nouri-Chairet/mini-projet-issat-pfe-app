import { useCallback, useEffect, useMemo, useState } from "react";

import { Btn, Card, Input, Select, Tag } from "../../components/UI";
import {
  autoFitManagedPfeLeftovers,
  createManagedPfeCampaign,
  generateManagedPfeCampaignSchedule,
  getAdminDepartments,
  getAdminTeachers,
  getManagedPfeCampaignDetail,
  listManagedPfeCampaigns,
  manualAssignManagedPfePresentation,
  type AdminDepartment,
  type AdminTeacher,
  type ManagedPfeCampaignCard,
  type ManagedPfeCampaignDetail,
} from "../../services/admin";

const ACCENT = "var(--chef-accent)";

function parseError(error: unknown): string {
  const e = error as {
    response?: {
      data?: {
        error?: string;
        detail?: string;
        details?: Record<string, string>;
        conflict?: {
          teacher_name?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          room?: string;
        };
      };
    };
    message?: string;
  };
  const data = e?.response?.data;
  if (data?.error) {
    if (data.conflict?.teacher_name) {
      return `${data.error}: ${data.conflict.teacher_name}`;
    }
    if (data.conflict?.date && data.conflict?.start_time && data.conflict?.end_time) {
      return `${data.error}: ${data.conflict.date} ${data.conflict.start_time}-${data.conflict.end_time}${data.conflict.room ? ` in ${data.conflict.room}` : ""}`;
    }
    return data.error;
  }
  return data?.detail ?? e?.message ?? "Unexpected error";
}

function statusLabel(status: ManagedPfeCampaignCard["status"]) {
  return status.replaceAll("_", " ");
}

export default function AdminPfeSessions() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [campaigns, setCampaigns] = useState<ManagedPfeCampaignCard[]>([]);
  const [detail, setDetail] = useState<ManagedPfeCampaignDetail | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("PFE Campaign");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(15);
  const [dailyCap, setDailyCap] = useState(3);
  const [rooms, setRooms] = useState("A1,A2");

  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("08:00");
  const [manualEnd, setManualEnd] = useState("09:00");
  const [manualRoom, setManualRoom] = useState("");
  const [manualRapporteurId, setManualRapporteurId] = useState("");
  const [manualPresidentId, setManualPresidentId] = useState("");

  const roomList = useMemo(
    () => rooms.split(",").map((item) => item.trim()).filter(Boolean),
    [rooms],
  );

  const teacherOptions = useMemo(() => {
    const departmentName = detail?.campaign.department_name;
    return teachers.filter((teacher) => teacher.department === departmentName);
  }, [detail?.campaign.department_name, teachers]);

  const selectedUnresolved = useMemo(
    () => detail?.unresolved.find((item) => item.subject_id === manualSubjectId) ?? null,
    [detail?.unresolved, manualSubjectId],
  );

  const juryTeacherOptions = useMemo(() => {
    if (!selectedUnresolved) {
      return teacherOptions;
    }
    return teacherOptions.filter((teacher) => teacher.id !== selectedUnresolved.supervisor_id);
  }, [selectedUnresolved, teacherOptions]);

  const presidentOptions = useMemo(
    () => juryTeacherOptions.filter((teacher) => teacher.id !== manualRapporteurId),
    [juryTeacherOptions, manualRapporteurId],
  );

  const refreshCampaigns = useCallback(async () => {
    const [departmentsResponse, teachersResponse, campaignsResponse] = await Promise.all([
      getAdminDepartments(),
      getAdminTeachers(),
      listManagedPfeCampaigns(),
    ]);
    setDepartments(departmentsResponse);
    setTeachers(teachersResponse);
    setCampaigns(campaignsResponse);
    if (!departmentId && departmentsResponse.length > 0) {
      setDepartmentId(departmentsResponse[0].id);
    }
    if (!selectedCampaignId && campaignsResponse.length > 0) {
      setSelectedCampaignId(campaignsResponse[0].id);
    }
  }, [departmentId, selectedCampaignId]);

  const loadDetail = useCallback(async (campaignId: string) => {
    if (!campaignId) {
      setDetail(null);
      return;
    }
    const response = await getManagedPfeCampaignDetail(campaignId);
    setDetail(response);
    if (response.unresolved.length > 0) {
      const first = response.unresolved[0];
      setManualSubjectId(first.subject_id);
      setManualDate(response.campaign.start_date);
      setManualRoom(response.campaign.rooms[0] ?? "");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setBusy(true);
    setFeedback("");
    try {
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  }, [refreshCampaigns]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedCampaignId) {
      return;
    }
    setBusy(true);
    setFeedback("");
    getManagedPfeCampaignDetail(selectedCampaignId)
      .then((response) => {
        setDetail(response);
        if (response.unresolved.length > 0) {
          setManualSubjectId(response.unresolved[0].subject_id);
          setManualDate(response.campaign.start_date);
          setManualRoom(response.campaign.rooms[0] ?? "");
        }
      })
      .catch((error) => setFeedback(parseError(error)))
      .finally(() => setBusy(false));
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!detail || !manualSubjectId) {
      return;
    }

    const unresolvedItem = detail.unresolved.find((item) => item.subject_id === manualSubjectId);
    if (!unresolvedItem) {
      return;
    }

    const validTeacherIds = new Set(
      teachers
        .filter(
          (teacher) =>
            teacher.department === detail.campaign.department_name &&
            teacher.id !== unresolvedItem.supervisor_id,
        )
        .map((teacher) => teacher.id),
    );

    if (!validTeacherIds.has(manualRapporteurId)) {
      setManualRapporteurId("");
    }
    if (!validTeacherIds.has(manualPresidentId) || manualPresidentId === manualRapporteurId) {
      setManualPresidentId("");
    }
  }, [
    detail,
    manualSubjectId,
    manualRapporteurId,
    manualPresidentId,
    teachers,
  ]);

  const createCampaign = async () => {
    if (!departmentId || roomList.length === 0 || !startDate || !endDate) {
      setFeedback("Department, dates, and rooms are required.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await createManagedPfeCampaign({
        department_id: departmentId,
        name,
        start_date: startDate,
        end_date: endDate,
        day_start_time: dayStart,
        day_end_time: dayEnd,
        slot_duration_minutes: slotDuration,
        break_duration_minutes: breakDuration,
        rooms: roomList,
        weekdays: ["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi"],
        daily_cap_per_teacher: dailyCap,
      });
      setFeedback(response.message);
      await refreshCampaigns();
      setSelectedCampaignId(response.campaign.id);
      await loadDetail(response.campaign.id);
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const generateSchedule = async () => {
    if (!detail) {
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const response = await generateManagedPfeCampaignSchedule({
        campaign_id: detail.campaign.id,
      });
      setDetail(response);
      setFeedback(
        `${response.message}. Assigned ${response.plan.stats.assigned_count}/${response.plan.stats.subjects_total}.`,
      );
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const manualAssign = async () => {
    if (
      !detail ||
      !manualSubjectId ||
      !manualDate ||
      !manualRoom ||
      !manualRapporteurId ||
      !manualPresidentId
    ) {
      setFeedback("Complete the manual assignment form first.");
      return;
    }
    if (manualRapporteurId === manualPresidentId) {
      setFeedback("Rapporteur and president must be different teachers.");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await manualAssignManagedPfePresentation({
        campaign_id: detail.campaign.id,
        subject_id: manualSubjectId,
        presentation_date: manualDate,
        start_time: manualStart,
        end_time: manualEnd,
        room: manualRoom,
        rapporteur_id: manualRapporteurId,
        president_id: manualPresidentId,
      });
      setDetail(response);
      setFeedback(response.message);
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const autoFitLeftovers = async () => {
    if (!detail) {
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      const response = await autoFitManagedPfeLeftovers({
        campaign_id: detail.campaign.id,
      });
      setDetail(response);
      setFeedback(response.message);
      await refreshCampaigns();
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "34px 38px", maxWidth: 1360 }}>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: 8,
          }}
        >
          PFE Campaigns
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>Manage Campaigns</h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Create campaigns, track teacher submissions, generate schedules, and finish unresolved presentations manually.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Btn accent={ACCENT} onClick={() => void refreshAll()}>
          Refresh
        </Btn>
        {busy ? <Tag>Working...</Tag> : null}
        <Tag color={ACCENT} bg="var(--chef-dim)">
          Campaigns: {campaigns.length}
        </Tag>
      </div>

      {feedback ? (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{feedback}</div>
        </Card>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
        <Card style={{ padding: 16, alignSelf: "start" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Create campaign</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Department</div>
              <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </div>
            <Input label="Campaign name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            <Input label="Day start" type="time" value={dayStart} onChange={(event) => setDayStart(event.target.value)} />
            <Input label="Day end" type="time" value={dayEnd} onChange={(event) => setDayEnd(event.target.value)} />
            <Input
              label="Session length (minutes)"
              type="number"
              value={slotDuration}
              onChange={(event) => setSlotDuration(Number(event.target.value || 60))}
            />
            <Input
              label="Break (minutes)"
              type="number"
              value={breakDuration}
              onChange={(event) => setBreakDuration(Number(event.target.value || 15))}
            />
            <Input
              label="Daily cap per teacher"
              type="number"
              value={dailyCap}
              onChange={(event) => setDailyCap(Number(event.target.value || 3))}
            />
            <Input label="Rooms (comma separated)" value={rooms} onChange={(event) => setRooms(event.target.value)} />
            <Btn accent={ACCENT} onClick={() => void createCampaign()}>
              Create campaign
            </Btn>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                style={{
                  padding: 14,
                  border: selectedCampaignId === campaign.id ? `1px solid ${ACCENT}` : "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <button
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  style={{
                    all: "unset",
                    display: "grid",
                    gap: 10,
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{campaign.name}</div>
                      <div style={{ color: "var(--text2)", fontSize: 13 }}>{campaign.department_name}</div>
                    </div>
                    <Tag color={ACCENT} bg="var(--chef-dim)">
                      {statusLabel(campaign.status)}
                    </Tag>
                  </div>
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>
                    {campaign.start_date} to {campaign.end_date}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Tag>
                      Availability {campaign.progress.submitted_count}/{campaign.progress.total_count}
                    </Tag>
                    <Tag>Unresolved {campaign.unresolved_count}</Tag>
                  </div>
                </button>
              </Card>
            ))}
          </div>

          {detail ? (
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24 }}>{detail.campaign.name}</h2>
                  <div style={{ color: "var(--text2)", marginTop: 6 }}>
                    {detail.campaign.department_name} · {detail.campaign.start_date} to {detail.campaign.end_date}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Tag color={ACCENT} bg="var(--chef-dim)">
                    {detail.progress.submitted_count}/{detail.progress.total_count} submitted
                  </Tag>
                  <Tag>Unresolved {detail.unresolved.length}</Tag>
                  {detail.unresolved.length > 0 ? (
                    <Btn accent={ACCENT} variant="ghost" onClick={() => void autoFitLeftovers()}>
                      Auto-fit leftovers
                    </Btn>
                  ) : null}
                  {detail.progress.submitted_count === detail.progress.total_count &&
                  detail.campaign.status === "collecting_availability" ? (
                    <Btn accent={ACCENT} onClick={() => void generateSchedule()}>
                      Generate schedule
                    </Btn>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Submitted</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {detail.teachers_submitted.length === 0 ? (
                      <div style={{ color: "var(--text2)" }}>Nobody yet.</div>
                    ) : (
                      detail.teachers_submitted.map((teacher) => (
                        <div key={teacher.teacher_id} style={{ color: "var(--text2)", fontSize: 14 }}>
                          {teacher.teacher_name} · {teacher.entries_count} entries
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Pending</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {detail.teachers_pending.length === 0 ? (
                      <div style={{ color: "var(--text2)" }}>Everyone is done.</div>
                    ) : (
                      detail.teachers_pending.map((teacher) => (
                        <div key={teacher.teacher_id} style={{ color: "var(--text2)", fontSize: 14 }}>
                          {teacher.teacher_name} · {teacher.email}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {detail.unresolved.length > 0 ? (
                <Card style={{ padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700 }}>Manual assignment</div>
                    {selectedUnresolved ? (
                      <Tag>
                        Supervisor: {selectedUnresolved.supervisor_name}
                      </Tag>
                    ) : null}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Presentation</div>
                      <Select value={manualSubjectId} onChange={(event) => setManualSubjectId(event.target.value)}>
                        <option value="">Select subject</option>
                        {detail.unresolved.map((item) => (
                          <option key={item.subject_id} value={item.subject_id}>
                            {item.subject_title}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Input label="Date" type="date" value={manualDate} onChange={(event) => setManualDate(event.target.value)} />
                    <Input label="Start time" type="time" value={manualStart} onChange={(event) => setManualStart(event.target.value)} />
                    <Input label="End time" type="time" value={manualEnd} onChange={(event) => setManualEnd(event.target.value)} />
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Room</div>
                      <Select value={manualRoom} onChange={(event) => setManualRoom(event.target.value)}>
                        <option value="">Select room</option>
                        {detail.campaign.rooms.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Rapporteur</div>
                      <Select value={manualRapporteurId} onChange={(event) => setManualRapporteurId(event.target.value)}>
                        <option value="">Select teacher</option>
                        {juryTeacherOptions.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.username}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>President</div>
                      <Select value={manualPresidentId} onChange={(event) => setManualPresidentId(event.target.value)}>
                        <option value="">Select teacher</option>
                        {presidentOptions.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.username}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Btn accent={ACCENT} onClick={() => void manualAssign()}>
                      Assign presentation
                    </Btn>
                  </div>
                </Card>
              ) : null}

              <div style={{ fontWeight: 700, marginBottom: 10 }}>Presentation list</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg2)" }}>
                      <th style={{ textAlign: "left", padding: "12px 14px" }}>Subject</th>
                      <th style={{ textAlign: "left", padding: "12px 14px" }}>Student</th>
                      <th style={{ textAlign: "left", padding: "12px 14px" }}>Supervisor</th>
                      <th style={{ textAlign: "left", padding: "12px 14px" }}>Slot</th>
                      <th style={{ textAlign: "left", padding: "12px 14px" }}>Jury</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.assignments.map((assignment) => (
                      <tr key={assignment.subject_id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 14px" }}>{assignment.subject_title}</td>
                        <td style={{ padding: "12px 14px" }}>{assignment.student_name}</td>
                        <td style={{ padding: "12px 14px" }}>{assignment.supervisor_name}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {assignment.slot
                            ? `${assignment.slot.date} ${assignment.slot.start_time.slice(0, 5)}-${assignment.slot.end_time.slice(0, 5)} · ${assignment.slot.room}`
                            : "Unassigned"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--text2)" }}>
                          {assignment.jury.length > 0
                            ? assignment.jury.map((member) => `${member.role}: ${member.teacher_name}`).join(" · ")
                            : "Not assigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ color: "var(--text2)" }}>Select a campaign card to view progress and scheduling details.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

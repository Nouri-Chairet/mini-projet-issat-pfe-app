import { useEffect, useState } from "react";
import { Btn, Card, Input, Select, Tag } from "../../components/UI";
import {
  getAdminDepartments,
  getPfeCampaign,
  importBookedPfeExcelCommit,
  importBookedPfeExcelDryRun,
  listDepartmentPfeSubjects,
  type AdminDepartment,
  type BookedPfeImportCommitResponse,
  type BookedPfeImportDryRunResponse,
  type PfeSubjectItem,
} from "../../services/admin";

const A = "var(--chef-accent)";

function parseError(error: unknown): string {
  const e = error as {
    response?: { data?: { error?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.detail ??
    e?.message ??
    "Unexpected error"
  );
}

export default function AdminPfeImportExcel() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [subjects, setSubjects] = useState<PfeSubjectItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [dryRun, setDryRun] = useState<BookedPfeImportDryRunResponse | null>(
    null,
  );
  const [commitResult, setCommitResult] =
    useState<BookedPfeImportCommitResponse | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const deps = await getAdminDepartments();
        if (!mounted) {
          return;
        }
        setDepartments(deps);
        if (deps[0]) {
          setSelectedDepartmentId(deps[0].id);
        }
      } catch {
        if (mounted) {
          setFeedback("Unable to load departments.");
        }
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDepartmentContext() {
      if (!selectedDepartmentId) {
        setCampaignId("");
        setSubjects([]);
        return;
      }

      try {
        const [campaign, departmentSubjects] = await Promise.all([
          getPfeCampaign({ department_id: selectedDepartmentId }).catch(
            () => null,
          ),
          listDepartmentPfeSubjects(selectedDepartmentId),
        ]);
        if (!mounted) {
          return;
        }
        setCampaignId(campaign?.id ?? "");
        setSubjects(departmentSubjects);
      } catch {
        if (mounted) {
          setFeedback("Unable to load department PFE data.");
        }
      }
    }

    void loadDepartmentContext();
    return () => {
      mounted = false;
    };
  }, [selectedDepartmentId]);

  const runDryRun = async () => {
    if (!file) {
      setFeedback("Please select an Excel file first.");
      return;
    }

    try {
      setBusy(true);
      setFeedback("");
      setCommitResult(null);
      const response = await importBookedPfeExcelDryRun({
        file,
        department_id: selectedDepartmentId || undefined,
        campaign_id: campaignId || undefined,
      });
      setDryRun(response);
      if (response.valid) {
        setFeedback("Dry-run completed successfully.");
      } else {
        setFeedback("Dry-run completed with validation errors.");
      }
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  const commitImport = async () => {
    if (!file) {
      setFeedback("Please select an Excel file first.");
      return;
    }

    try {
      setBusy(true);
      setFeedback("");
      const response = await importBookedPfeExcelCommit({
        file,
        replace_existing: replaceExisting,
        department_id: selectedDepartmentId || undefined,
        campaign_id: campaignId || undefined,
      });
      setCommitResult(response);
      setFeedback("Excel import committed.");
      setSubjects(await listDepartmentPfeSubjects(selectedDepartmentId));
    } catch (error) {
      setFeedback(parseError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
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
          Import Booked PFEs
        </div>
        <h1 style={{ margin: 0, fontSize: 30 }}>
          Import booked PFE assignments from Excel
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Required columns: subject_title/sujet_pfe, student_cin, teacher_cin.
        </p>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            color: "var(--text2)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <Select
            label="Department"
            value={selectedDepartmentId}
            onChange={(event) => setSelectedDepartmentId(event.target.value)}
          >
            <option value="">-- select --</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Input
            label="Campaign (auto)"
            value={campaignId ? campaignId.slice(0, 8) : "No active campaign"}
            readOnly
          />
          <Input
            label="Excel file (.xlsx)"
            type="file"
            accept=".xlsx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setReplaceExisting((state) => !state)}
            style={{
              borderRadius: 999,
              border: `1px solid ${replaceExisting ? `${A}50` : "var(--border2)"}`,
              background: replaceExisting ? "var(--chef-dim)" : "var(--bg2)",
              color: replaceExisting ? A : "var(--text2)",
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            Replace existing department PFEs: {replaceExisting ? "ON" : "OFF"}
          </button>
          <Btn accent={A} onClick={runDryRun}>
            Dry-run
          </Btn>
          <Btn accent={A} variant="ghost" onClick={commitImport}>
            Commit import
          </Btn>
          <Tag color={A} bg="var(--chef-dim)">
            Current subjects: {subjects.length}
          </Tag>
          {busy ? <Tag>Working...</Tag> : null}
        </div>
      </Card>

      {dryRun ? (
        <Card style={{ padding: 16, marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <Tag
              color={dryRun.valid ? "var(--chef-accent)" : "var(--danger)"}
              bg="var(--bg2)"
            >
              {dryRun.valid ? "Valid" : "Invalid"}
            </Tag>
            <Tag>Parsed: {dryRun.parsed_count}</Tag>
            <Tag>Create: {dryRun.stats.create}</Tag>
            <Tag>Update: {dryRun.stats.update}</Tag>
            <Tag>Unchanged: {dryRun.stats.unchanged}</Tag>
          </div>

          {dryRun.errors.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Validation errors
              </div>
              {dryRun.errors.map((error) => (
                <div
                  key={error}
                  style={{ color: "var(--danger)", fontSize: 13 }}
                >
                  {error}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 6 }}>
            {dryRun.preview.map((item) => (
              <div
                key={`${item.row_number}-${item.student_cin}`}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 10px",
                  background: "var(--surface)",
                  fontSize: 13,
                }}
              >
                <strong>#{item.row_number}</strong> {item.subject_title} |{" "}
                {item.student_name} ({item.student_cin})
                <div style={{ color: "var(--text2)", fontSize: 12 }}>
                  Encadrant: {item.encadreur_name} ({item.encadreur_cin}) -
                  action: {item.action}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {commitResult ? (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {commitResult.message}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag>Parsed: {commitResult.stats.parsed}</Tag>
            <Tag>Deleted: {commitResult.stats.deleted}</Tag>
            <Tag>Create: {commitResult.stats.created}</Tag>
            <Tag>Update: {commitResult.stats.updated}</Tag>
            <Tag>Unchanged: {commitResult.stats.unchanged}</Tag>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

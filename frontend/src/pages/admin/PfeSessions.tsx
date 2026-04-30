import { Btn, Card, Tag } from "../../components/UI";
import { usePfeSessions } from "../../hooks/usePfeSessions";
import CreateCampaignForm from "../../components/pfe-sessions/CreateCampaignForm";
import CampaignCardGrid from "../../components/pfe-sessions/CampaignCardGrid";
import CampaignDetailPanel from "../../components/pfe-sessions/CampaignDetailPanel";

const ACCENT = "var(--chef-accent)";

export default function AdminPfeSessions() {
  const {
    departments,
    campaigns,
    detail,
    selectedCampaignId,
    busy,
    feedback,
    campaignForm,
    setCampaignForm,
    manualForm,
    setManualForm,
    selectedUnresolved,
    juryTeacherOptions,
    presidentOptions,
    setSelectedCampaignId,
    setFeedback,
    refreshAll,
    createCampaign,
    generateSchedule,
    manualAssign,
    autoFitLeftovers,
  } = usePfeSessions();

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
          Create campaigns, track teacher submissions, generate schedules, and
          finish unresolved presentations manually.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 16,
        }}
      >
        <CreateCampaignForm
          accent={ACCENT}
          departments={departments}
          form={campaignForm}
          onChange={setCampaignForm}
          onCreate={() => void createCampaign()}
        />

        <div style={{ display: "grid", gap: 16 }}>
          <CampaignCardGrid
            accent={ACCENT}
            campaigns={campaigns}
            selectedId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
          />

          {detail ? (
            <CampaignDetailPanel
              accent={ACCENT}
              detail={detail}
              form={manualForm}
              onChange={setManualForm}
              selectedUnresolved={selectedUnresolved}
              juryTeacherOptions={juryTeacherOptions}
              presidentOptions={presidentOptions}
              onAssign={() => void manualAssign()}
              onAutoFit={() => void autoFitLeftovers()}
              onGenerate={() => void generateSchedule()}
            />
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ color: "var(--text2)" }}>
                Select a campaign card to view progress and scheduling details.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

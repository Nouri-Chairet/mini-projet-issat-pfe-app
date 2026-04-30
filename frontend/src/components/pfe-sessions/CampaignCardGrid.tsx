import { Card, Tag } from "../UI";
import type { ManagedPfeCampaignCard } from "../../services/admin";

function statusLabel(status: ManagedPfeCampaignCard["status"]) {
  return status.replaceAll("_", " ");
}

interface Props {
  accent: string;
  campaigns: ManagedPfeCampaignCard[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CampaignCardGrid({
  accent,
  campaigns,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {campaigns.map((campaign) => (
        <Card
          key={campaign.id}
          style={{
            padding: 14,
            border:
              selectedId === campaign.id
                ? `1px solid ${accent}`
                : "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <button
            onClick={() => onSelect(campaign.id)}
            style={{
              all: "unset",
              display: "grid",
              gap: 10,
              width: "100%",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{campaign.name}</div>
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  {campaign.department_name}
                </div>
              </div>
              <Tag color={accent} bg="var(--chef-dim)">
                {statusLabel(campaign.status)}
              </Tag>
            </div>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              {campaign.start_date} to {campaign.end_date}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag>
                Availability {campaign.progress.submitted_count}/
                {campaign.progress.total_count}
              </Tag>
              <Tag>Unresolved {campaign.unresolved_count}</Tag>
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}

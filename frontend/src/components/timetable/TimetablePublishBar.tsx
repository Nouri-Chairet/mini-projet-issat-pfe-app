import { Btn, Tag } from "../UI";
import type { TimetablePublicationStatus } from "../../services/timetable";

/*
  TimetablePublishBar — purely presentational. Owns no state. Reads
  the publication status from the parent page and forwards user
  actions (publish/unpublish/export-ICS/print) back up.
*/

interface TimetablePublishBarProps {
  status: TimetablePublicationStatus | null;
  onTogglePublish: () => void;
  onDownloadIcs: () => void;
  onPrint: () => void;
  busy?: boolean;
}

const A = "var(--chef-accent)";

export const TimetablePublishBar = ({
  status,
  onTogglePublish,
  onDownloadIcs,
  onPrint,
  busy = false,
}: TimetablePublishBarProps) => {
  const isPublished = Boolean(status?.is_published);
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 14,
        marginBottom: 16,
        background: "var(--surface)",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Tag
        color={isPublished ? "var(--chef-accent)" : "var(--text2)"}
        bg={isPublished ? "var(--chef-dim)" : "var(--bg2)"}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isPublished ? "var(--chef-accent)" : "var(--text3)",
            display: "inline-block",
            boxShadow: isPublished ? "0 0 8px var(--chef-accent)" : "none",
            animation: isPublished ? "pulse 2s infinite" : "none",
          }}
        />
        {isPublished ? "Publié" : "Brouillon"}
      </Tag>
      {status?.published_at ? (
        <span
          style={{
            color: "var(--text3)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.5px",
          }}
        >
          publié le {new Date(status.published_at).toLocaleString("fr-FR")}
        </span>
      ) : null}
      <div style={{ flex: 1 }} />
      <Btn accent={A} onClick={onTogglePublish} disabled={busy}>
        {isPublished ? "Dépublier" : "Publier"}
      </Btn>
      <Btn accent={A} variant="ghost" onClick={onDownloadIcs}>
        Export ICS
      </Btn>
      <Btn accent={A} variant="muted" onClick={onPrint}>
        Imprimer
      </Btn>
    </div>
  );
};

export default TimetablePublishBar;

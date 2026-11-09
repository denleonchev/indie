import { getExportDownloadUrl, type ExportStatus, type OwnExport } from "@/data/exports";
import TimeAgo from "./time-ago";

type Label = { text: string; className: string; downloadable?: boolean };

const statusLabels: Record<ExportStatus, Label> = {
  pending: { text: "Preparing…", className: "text-muted" },
  ready: { text: "Download", className: "underline", downloadable: true },
  failed: { text: "Failed, request it again", className: "text-danger" },
};

const unavailableLabel: Label = { text: "Unavailable", className: "text-muted" };

function formatDay(iso: string) {
  return iso.slice(0, 10);
}

async function ExportStatusCell({ item }: { item: OwnExport }) {
  const label = statusLabels[item.status];
  if (!label.downloadable) return <span className={label.className}>{label.text}</span>;

  const url = await getExportDownloadUrl(item.id);
  if (!url) return <span className={unavailableLabel.className}>{unavailableLabel.text}</span>;
  return (
    <a href={url} download className={label.className}>
      {label.text}
    </a>
  );
}

export default function ExportList({ exports, now }: { exports: OwnExport[]; now: number }) {
  if (exports.length === 0) return <p className="text-sm text-muted">No exports yet</p>;

  return (
    <ul className="divide-y divide-line text-sm">
      {exports.map((item) => (
        <li key={item.id} className="flex flex-wrap gap-x-4 py-2">
          <TimeAgo iso={item.createdAt} serverNow={now} className="w-28 text-muted" />
          <span className="w-56 font-mono">
            {formatDay(item.periodStart)} – {formatDay(item.periodEnd)}
          </span>
          <span className="w-24">{item.tokenSymbol ?? "All tokens"}</span>
          <ExportStatusCell item={item} />
        </li>
      ))}
    </ul>
  );
}

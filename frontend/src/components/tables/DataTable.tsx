import type { CSSProperties, ReactNode } from "react";

/*
  DataTable — small typed table primitive.

  Avoids reinventing 8 different ad-hoc tables across the app.
  Consumers pass a typed `columns` definition + a typed `rows` array.
*/

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyLabel?: string;
  rowKey: (row: T, index: number) => string;
  rowStyle?: (row: T, index: number) => CSSProperties | undefined;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  emptyLabel = "Aucune donnée à afficher.",
  rowKey,
  rowStyle,
  dense = false,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "28px 16px",
          textAlign: "center",
          color: "var(--text3)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.5px",
          border: "1px dashed var(--border2)",
          borderRadius: "var(--r-md)",
        }}
      >
        {emptyLabel}
      </div>
    );
  }

  const cellPadding = dense ? "8px 12px" : "12px 14px";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns
            .map((col) => (typeof col.width === "number" ? `${col.width}px` : col.width || "1fr"))
            .join(" "),
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border2)",
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{
              padding: cellPadding,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--text3)",
              textAlign: col.align ?? "left",
              fontWeight: 600,
            }}
          >
            {col.header}
          </div>
        ))}
      </div>
      {rows.map((row, index) => (
        <div
          key={rowKey(row, index)}
          style={{
            display: "grid",
            gridTemplateColumns: columns
              .map((col) => (typeof col.width === "number" ? `${col.width}px` : col.width || "1fr"))
              .join(" "),
            borderBottom:
              index === rows.length - 1 ? "none" : "1px solid var(--border)",
            ...(rowStyle?.(row, index) ?? {}),
          }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              style={{
                padding: cellPadding,
                color: "var(--text)",
                fontSize: 13,
                textAlign: col.align ?? "left",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  col.align === "right"
                    ? "flex-end"
                    : col.align === "center"
                      ? "center"
                      : "flex-start",
              }}
            >
              {col.render(row, index)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default DataTable;

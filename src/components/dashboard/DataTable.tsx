"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/flash/Icon";
import { cn } from "@/lib/utils";

export type TableColumn = {
  label: string;
  className?: string;
};

export type TableRow = {
  id: string;
  cells: ReactNode[];
  /** Plain text used by the search box. */
  search: string;
  /** The value the filter menu matches against. */
  filterValue?: string;
  /** Values in column order, used by the CSV export. */
  export?: (string | number)[];
  /** Shown beneath the row when it is expanded. */
  details?: ReactNode;
  actions?: ReactNode;
};

/** A consistent action button, used inside the row menu and as a toolbar button. */
export function TableButton({
  children,
  onClick,
  tone = "neutral",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] px-2.5 text-[12px] font-semibold transition disabled:opacity-50",
        tone === "primary" && "bg-brand-solid text-white hover:bg-brand-solid-hover",
        tone === "danger" && "bg-danger-soft text-danger-ink hover:bg-danger/15",
        tone === "neutral" && "border border-line bg-surface text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function downloadCsv(filename: string, columns: TableColumn[], rows: TableRow[]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [columns.map((column) => escape(column.label)).join(",")];

  for (const row of rows) {
    if (row.export) lines.push(row.export.map(escape).join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * The console data table.
 *
 * One framed panel with its title and tools in the header. Rows open to show
 * the full record; the trailing menu holds the actions that change it. Search,
 * filter and export work on plain values supplied by the owning table, so the
 * component holds no entity knowledge.
 */
export function DataTable({
  id,
  title,
  columns,
  rows,
  empty,
  description,
  action,
}: {
  id?: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  empty: string;
  description?: string;
  action?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
      setMenuOpen(null);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const options = useMemo(
    () => [...new Set(rows.map((row) => row.filterValue).filter(Boolean) as string[])],
    [rows],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery = !needle || row.search.toLowerCase().includes(needle);
      const matchesFilter = !filter || row.filterValue === filter;
      return matchesQuery && matchesFilter;
    });
  }, [rows, query, filter]);

  const toggle = (rowId: string) => setExpanded((current) => (current === rowId ? null : rowId));
  const colSpan = columns.length + (rows.some((row) => row.actions) ? 1 : 0);

  return (
    <section id={id} className="scroll-mt-5">
      {description ? (
        <p className="mb-3 text-[13px] leading-snug text-muted">{description}</p>
      ) : null}

      <div className="overflow-hidden rounded-[16px] border border-line/90 bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-4 py-3.5">
          <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">{title}</h2>

          <div className="flex flex-wrap items-center gap-2">
            {action}
            <div className="flex h-9 w-[210px] items-center gap-2 rounded-[10px] border border-line bg-paper px-3 focus-within:border-brand/50">
              <Icon name="search" size={15} className="shrink-0 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                aria-label={`Search ${title}`}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((open) => !open)}
                aria-label="Filter rows"
                aria-expanded={filterOpen}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-[10px] border transition",
                  filter
                    ? "border-brand/40 bg-brand-soft text-brand-ink"
                    : "border-line bg-paper text-icon-idle hover:border-line-strong",
                )}
              >
                <Icon name="filter" size={16} />
              </button>

              {filterOpen ? (
                <div className="absolute right-0 top-11 z-20 w-44 rounded-[12px] border border-line bg-surface p-1.5 shadow-raised">
                  <button
                    type="button"
                    onClick={() => {
                      setFilter(null);
                      setFilterOpen(false);
                    }}
                    className="flex w-full items-center rounded-[9px] px-2.5 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-2"
                  >
                    All
                  </button>
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFilter(option);
                        setFilterOpen(false);
                      }}
                      className="flex w-full items-center rounded-[9px] px-2.5 py-2 text-left text-[13px] text-ink-soft hover:bg-surface-2"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => downloadCsv(title.toLowerCase().replace(/\s+/g, "-"), columns, visible)}
              aria-label={`Export ${title}`}
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-line bg-paper text-icon-idle transition hover:border-line-strong"
            >
              <Icon name="download" size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line/80 bg-paper/40">
                {columns.map((column) => (
                  <th
                    key={column.label}
                    className={cn(
                      "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted",
                      column.className,
                    )}
                  >
                    {column.label}
                  </th>
                ))}
                {rows.some((row) => row.actions) ? (
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Action
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <FragmentRow
                  key={row.id}
                  row={row}
                  expanded={expanded === row.id}
                  onToggle={() => toggle(row.id)}
                  menuOpen={menuOpen === row.id}
                  onMenu={() => setMenuOpen((current) => (current === row.id ? null : row.id))}
                  colSpan={colSpan}
                />
              ))}
            </tbody>
          </table>

          {visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">{empty}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FragmentRow({
  row,
  expanded,
  onToggle,
  menuOpen,
  onMenu,
  colSpan,
}: {
  row: TableRow;
  expanded: boolean;
  onToggle: () => void;
  menuOpen: boolean;
  onMenu: () => void;
  colSpan: number;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        aria-expanded={expanded}
        className={cn(
          "cursor-pointer border-b border-line/60 transition-colors last:border-b-0 hover:bg-paper/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          expanded && "bg-paper/70",
        )}
      >
        {row.cells.map((cell, index) => (
          <td key={index} className="px-4 py-3.5 align-middle text-[13px] text-ink-soft">
            {cell}
          </td>
        ))}
        {row.actions ? (
          <td className="px-4 py-3.5 text-right" onClick={(event) => event.stopPropagation()}>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={onMenu}
                aria-label="Row actions"
                aria-expanded={menuOpen}
                className="grid h-8 w-8 place-items-center rounded-[9px] text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="more" size={17} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-9 z-20 flex min-w-[120px] flex-col gap-1 rounded-[12px] border border-line bg-surface p-1.5 shadow-raised">
                  {row.actions}
                </div>
              ) : null}
            </div>
          </td>
        ) : null}
      </tr>

      {expanded && row.details ? (
        <tr className="border-b border-line/60 bg-paper/50 last:border-b-0">
          <td colSpan={colSpan} className="px-4 py-4">
            {row.details}
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** A compact definition list used inside expanded rows. */
export function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 text-[13px] text-ink-soft">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

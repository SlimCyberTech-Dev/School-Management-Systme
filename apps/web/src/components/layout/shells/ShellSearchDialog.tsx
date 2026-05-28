"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Search, Users } from "lucide-react";
import { NAV_ICON_MAP } from "./navIconMap";
import type { RoleShellConfig } from "./types";
import { useNavigationLoading } from "@/components/navigation/NavigationProvider";
import { apiGet } from "@/lib/api";
import {
  buildShellSearchIndex,
  filterShellSearchEntries,
  studentToSearchEntry,
  type ShellSearchEntry,
  type StudentSearchHit,
} from "@/lib/shellSearch";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: RoleShellConfig;
};

const MIN_STUDENT_QUERY = 2;

export function ShellSearchDialog({ open, onOpenChange, config }: Props) {
  const router = useRouter();
  const { startNavigation } = useNavigationLoading();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const staticIndex = useMemo(() => buildShellSearchIndex(config), [config]);
  const staticResults = useMemo(
    () => filterShellSearchEntries(staticIndex, query),
    [staticIndex, query],
  );

  const studentQuery = query.trim();
  const canSearchStudents = studentQuery.length >= MIN_STUDENT_QUERY;

  const studentsQ = useQuery({
    queryKey: ["shell-search-students", studentQuery],
    queryFn: () =>
      apiGet<StudentSearchHit[]>(`/students/search?q=${encodeURIComponent(studentQuery)}`),
    enabled: open && canSearchStudents,
    staleTime: 30_000,
  });

  const studentResults = useMemo(() => {
    if (!canSearchStudents) return [];
    return (studentsQ.data ?? []).map((s) => studentToSearchEntry(config.role, s));
  }, [canSearchStudents, studentsQ.data, config.role]);

  const results = useMemo(() => {
    if (!query.trim()) return staticIndex.slice(0, 12);
    return [...staticResults, ...studentResults];
  }, [query, staticIndex, staticResults, studentResults]);

  const grouped = useMemo(() => {
    const pages: ShellSearchEntry[] = [];
    const actions: ShellSearchEntry[] = [];
    const students: ShellSearchEntry[] = [];
    for (const r of results) {
      if (r.type === "student") students.push(r);
      else if (r.type === "action") actions.push(r);
      else pages.push(r);
    }
    return { pages, actions, students };
  }, [results]);

  const flatResults = useMemo(
    () => [...grouped.pages, ...grouped.actions, ...grouped.students],
    [grouped],
  );

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
  }, [onOpenChange]);

  const navigate = useCallback(
    (entry: ShellSearchEntry) => {
      close();
      startNavigation();
      router.push(entry.href);
    },
    [close, router, startNavigation],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (flatResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = flatResults[activeIndex];
        if (hit) navigate(hit);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatResults, activeIndex, close, navigate]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  const showStudentLoading = canSearchStudents && studentsQ.isFetching;
  const showEmpty =
    query.trim().length > 0 &&
    flatResults.length === 0 &&
    !showStudentLoading;

  let rowIndex = 0;

  function renderRow(entry: ShellSearchEntry) {
    const idx = rowIndex++;
    const active = idx === activeIndex;
    const Icon = entry.icon ? NAV_ICON_MAP[entry.icon] : entry.type === "student" ? Users : FileText;
    return (
      <button
        key={entry.id}
        type="button"
        data-index={idx}
        role="option"
        aria-selected={active}
        onMouseEnter={() => setActiveIndex(idx)}
        onClick={() => navigate(entry)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-ui ${
          active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            active ? "border-border bg-card" : "border-transparent bg-muted"
          }`}
        >
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{entry.label}</span>
          {entry.description ? (
            <span className="block truncate text-xs text-muted-foreground">{entry.description}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {entry.type === "student" ? "Student" : entry.type === "action" ? "Action" : "Page"}
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-[2px]"
      role="presentation"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions, or students…"
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[min(24rem,50vh)] overflow-y-auto p-2" role="listbox">
          {!query.trim() ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Type to filter · {staticIndex.length} shortcuts · students after {MIN_STUDENT_QUERY} characters
            </p>
          ) : null}

          {grouped.pages.length > 0 ? (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pages
              </p>
              {grouped.pages.map(renderRow)}
            </div>
          ) : null}

          {grouped.actions.length > 0 ? (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick actions
              </p>
              {grouped.actions.map(renderRow)}
            </div>
          ) : null}

          {grouped.students.length > 0 ? (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Students
              </p>
              {grouped.students.map(renderRow)}
            </div>
          ) : null}

          {showStudentLoading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching students…
            </div>
          ) : null}

          {showEmpty ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border bg-card px-1">↑↓</kbd> navigate
            <span className="mx-2">·</span>
            <kbd className="rounded border border-border bg-card px-1">↵</kbd> open
          </span>
          <span className="hidden sm:inline">
            <kbd className="rounded border border-border bg-card px-1">⌘</kbd>
            <kbd className="ml-0.5 rounded border border-border bg-card px-1">K</kbd> anytime
          </span>
        </footer>
      </div>
    </div>
  );
}

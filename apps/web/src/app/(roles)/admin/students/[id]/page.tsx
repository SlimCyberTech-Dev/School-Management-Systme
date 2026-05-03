"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Student } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FeeBalanceCard } from "@/components/fees/FeeBalanceCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiDelete, apiGet } from "@/lib/api";

function resolvePhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http")) return photoUrl;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
}

function statusTone(s: Student["status"]): "success" | "warning" | "neutral" {
  if (s === "active") return "success";
  if (s === "withdrawn" || s === "transferred") return "warning";
  return "neutral";
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-4 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
      <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

export default function AdminStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String(params["id"]);
  const [st, setSt] = useState<Student | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setOk("Student enrolled successfully.");
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      try {
        const row = await apiGet<Student>(`/students/${encodeURIComponent(id)}`);
        setSt(row);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const initials = useMemo(() => {
    if (!st?.fullName) return "?";
    const parts = st.fullName.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${a}${b}`.toUpperCase() || "?";
  }, [st?.fullName]);

  const photoSrc = st ? resolvePhotoUrl(st.photoUrl) : null;

  const handleDelete = async () => {
    setDeleting(true);
    setErr(null);
    setOk(null);
    try {
      await apiDelete<{ deleted: boolean }>(`/students/${encodeURIComponent(id)}`);
      setConfirmDel(false);
      router.push("/admin/students");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
      setConfirmDel(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageWrapper title="Student profile" description="Enrollment, guardian details, and fees">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/students"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-ui hover:text-foreground"
          >
            <span aria-hidden>←</span>
            Back to students
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/students/${encodeURIComponent(id)}/edit`}>
              <Button className="w-full sm:w-auto">Edit enrollment</Button>
            </Link>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setConfirmDel(true)}>
              Delete record
            </Button>
          </div>
        </div>

        <ConfirmDialog
          open={confirmDel}
          title="Delete this enrollment?"
          description="This permanently removes this learner's enrollment and related attendance, assessments, and fee records. This cannot be undone."
          confirmLabel="Delete permanently"
          danger
          loading={deleting}
          onCancel={() => {
            if (!deleting) setConfirmDel(false);
          }}
          onConfirm={() => void handleDelete()}
        />

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-36 rounded-xl bg-muted" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-64 rounded-xl bg-muted lg:col-span-2" />
              <div className="h-40 rounded-xl bg-muted" />
            </div>
          </div>
        ) : null}

        {!loading ? (
          <div className="space-y-4">
            {ok ? <Alert tone="success">{ok}</Alert> : null}
            {err ? <Alert tone="error">{err}</Alert> : null}
          </div>
        ) : null}

        {st ? (
          <>
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-2xl font-semibold text-muted-foreground sm:mx-0">
                  {photoSrc ? (
                    <Image src={photoSrc} alt="" fill className="object-cover" sizes="112px" unoptimized />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {st.fullName}
                    </h2>
                    <Badge tone={statusTone(st.status)}>{st.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">{st.studentNumber}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {st.dateOfBirth}
                    <span className="mx-2 text-border">·</span>
                    <span className="capitalize">{st.gender}</span>
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card title="Enrollment">
                  <dl className="grid gap-6 sm:grid-cols-2">
                    <DetailItem label="Class ID">{st.classId ?? "—"}</DetailItem>
                    <DetailItem label="Combination ID">{st.combinationId ?? "—"}</DetailItem>
                    <DetailItem label="Enrolled">{new Date(st.enrolledAt).toLocaleString()}</DetailItem>
                    <DetailItem label="Notes">{st.transferReason ? <span className="whitespace-pre-wrap font-normal">{st.transferReason}</span> : "—"}</DetailItem>
                  </dl>
                </Card>

                <Card title="Guardian & contact">
                  <dl className="grid gap-6 sm:grid-cols-2">
                    <DetailItem label="Guardian">{st.guardianName}</DetailItem>
                    <DetailItem label="Contact">{st.guardianContact}</DetailItem>
                    <DetailItem label="Email">{st.guardianEmail ?? "—"}</DetailItem>
                    <DetailItem label="Previous school">{st.previousSchool ?? "—"}</DetailItem>
                    <div className="sm:col-span-2">
                      <DetailItem label="Address">{st.address ? <span className="whitespace-pre-wrap font-normal">{st.address}</span> : "—"}</DetailItem>
                    </div>
                  </dl>
                </Card>
              </div>

              <div className="lg:sticky lg:top-6 lg:self-start">
                <FeeBalanceCard studentId={st.id} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PageWrapper>
  );
}

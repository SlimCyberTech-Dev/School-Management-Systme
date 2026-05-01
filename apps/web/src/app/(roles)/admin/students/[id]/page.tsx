"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Student } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FeeBalanceCard } from "@/components/fees/FeeBalanceCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { apiDelete, apiGet } from "@/lib/api";

export default function AdminStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params["id"]);
  const [st, setSt] = useState<Student | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    setErr(null);
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
    <PageWrapper title="Student profile" description="Enrollment details and fees">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={`/admin/students/${encodeURIComponent(id)}/edit`}>
          <Button>Edit enrollment</Button>
        </Link>
        <Button type="button" variant="secondary" onClick={() => setConfirmDel(true)}>
          Delete record
        </Button>
      </div>

      <Modal
        open={confirmDel}
        title="Delete this enrollment?"
        onClose={() => {
          if (!deleting) setConfirmDel(false);
        }}
      >
        <p className="mb-4 text-sm text-slate-600">
          This permanently removes this learner&apos;s enrollment and related attendance, assessments, and fee records.
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={deleting} onClick={() => setConfirmDel(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={deleting}
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            onClick={() => void handleDelete()}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>

      {loading ? <p className="text-slate-600">Loading…</p> : null}
      {err ? <p className="mb-4 text-red-600">{err}</p> : null}
      {st ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Enrollment & bio">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Student #</dt>
                <dd className="font-medium">{st.studentNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium">{st.fullName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">DOB / Gender</dt>
                <dd>
                  {st.dateOfBirth} — {st.gender}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Guardian</dt>
                <dd>
                  {st.guardianName} ({st.guardianContact})
                  {st.guardianEmail ? (
                    <>
                      <br />
                      <span className="text-slate-600">{st.guardianEmail}</span>
                    </>
                  ) : null}
                </dd>
              </div>
              {st.address ? (
                <div>
                  <dt className="text-slate-500">Address</dt>
                  <dd className="whitespace-pre-wrap">{st.address}</dd>
                </div>
              ) : null}
              {st.previousSchool ? (
                <div>
                  <dt className="text-slate-500">Previous school</dt>
                  <dd>{st.previousSchool}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>{st.status}</dd>
              </div>
              {st.transferReason ? (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="whitespace-pre-wrap">{st.transferReason}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Enrolled</dt>
                <dd>{new Date(st.enrolledAt).toLocaleString()}</dd>
              </div>
            </dl>
          </Card>
          <FeeBalanceCard studentId={st.id} />
        </div>
      ) : null}
    </PageWrapper>
  );
}

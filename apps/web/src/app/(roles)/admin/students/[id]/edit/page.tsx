"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Student } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StudentEditForm } from "@/components/students/StudentEditForm";
import { apiGet } from "@/lib/api";

export default function AdminStudentEditPage() {
  const params = useParams();
  const id = String(params["id"]);
  const [st, setSt] = useState<Student | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <PageWrapper title="Edit enrollment" description="Update student record and placement">
      {loading ? <p className="text-slate-600">Loading…</p> : null}
      {err ? <p className="text-red-600">{err}</p> : null}
      {st ? <StudentEditForm key={id} studentId={id} initial={st} /> : null}
    </PageWrapper>
  );
}

import type { ReactNode } from "react";

export function PageWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

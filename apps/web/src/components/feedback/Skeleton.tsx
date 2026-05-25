import type { HTMLAttributes } from "react";

function base(className: string) {
  return `animate-pulse rounded bg-muted ${className}`.trim();
}

export function Line({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={base(`h-3 ${className}`)} {...rest} />;
}

export function Block({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={base(className)} {...rest} />;
}

export function Circle({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={base(`rounded-full ${className}`)} {...rest} />;
}

export const Skeleton = { Line, Block, Circle };

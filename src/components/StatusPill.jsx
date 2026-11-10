import React from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  dipinjam: "bg-blue-50 text-blue-700 border-blue-200",
  dikembalikan: "bg-emerald-50 text-emerald-700 border-emerald-200",
  terlambat: "bg-amber-50 text-amber-700 border-amber-200",
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  nonaktif: "bg-slate-100 text-slate-600 border-slate-200",
  default: "bg-secondary text-secondary-foreground border-border",
};

export default function StatusPill({ value, className }) {
  const cls = VARIANTS[value] || VARIANTS.default;
  const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        cls,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
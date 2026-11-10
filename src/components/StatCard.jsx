import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, tone = "primary", hint, onClick }) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-[hsl(var(--success))] text-white",
    light: "bg-secondary text-secondary-foreground",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-shadow hover:shadow-md",
        onClick && "hover:border-primary/40"
      )}
    >
      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0", tones[tone])}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display font-extrabold text-2xl text-foreground leading-tight mt-0.5">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </div>
    </Comp>
  );
}
import { AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function WarningNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-mint-soft px-4 py-3 text-sm text-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

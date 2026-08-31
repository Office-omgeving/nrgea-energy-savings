import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { measureAndPost } from "../IframeResizeReporter";

/** Ingeklapte sectie voor optionele, technische aanpassingen. */
export function AdvancedSection({
  title = "Geavanceerde instellingen",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          requestAnimationFrame(measureAndPost);
        }}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? <div className="space-y-4 border-t border-border px-4 py-4">{children}</div> : null}
    </div>
  );
}

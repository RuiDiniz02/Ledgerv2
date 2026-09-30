"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DialogContent } from "@/components/ui/dialog";

// Safari's layout viewport stays tall when the software keyboard opens.
// Size the scrollable form against the visible viewport instead.
export function FormDialogContent({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<CSSProperties>({});
  useEffect(() => {
    const visual = window.visualViewport;
    if (!visual) return;
    let frame = 0;
    const update = () => {
      setViewport({
        "--form-viewport-height": `${visual.height}px`,
        "--form-viewport-top": `${visual.offsetTop}px`,
      } as CSSProperties);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !content.current?.contains(active)) return;
        const field = active.getBoundingClientRect();
        const box = content.current.getBoundingClientRect();
        if (field.bottom > box.bottom - 16) content.current.scrollTop += field.bottom - box.bottom + 16;
        else if (field.top < box.top + 16) content.current.scrollTop += field.top - box.top - 16;
      });
    };
    update();
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <DialogContent
      ref={content}
      className="ledger-dialog"
      style={viewport}
      showCloseButton={false}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        content.current?.focus({ preventScroll: true });
      }}
    >
      {children}
    </DialogContent>
  );
}

import { Layers3 } from "lucide-react";
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="Ledger — início">
      <span className="brand-mark">
        <Layers3 size={23} />
      </span>
      ledger<span className="brand-period">.</span>
    </a>
  );
}

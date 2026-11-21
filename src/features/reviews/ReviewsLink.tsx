import Link from "next/link";

/**
 * Klikalny link do /opinie w delikatnej ramce z przyciskiem „KLIK →”.
 * Na telefonie tylko krótkie hasło (jedna linia), od sm wzwyż pełne zdanie.
 */
export function ReviewsLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/opinie"
      className={`group flex w-full items-center gap-3 rounded-2xl border border-teal-500/40 bg-teal-500/5 px-4 py-2.5 text-sm text-foreground shadow-sm transition-colors hover:border-teal-500 hover:bg-teal-500/10 ${className}`}
    >
      <span className="flex-1">
        <strong className="font-bold">Niezdecydowany? No bez jaj.</strong>
        <span className="hidden sm:inline"> Zobacz opinie ludzi, którzy już zaryzykowali</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white transition-transform group-hover:translate-x-0.5">
        Klik →
      </span>
    </Link>
  );
}

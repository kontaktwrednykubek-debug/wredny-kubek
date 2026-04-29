import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Strzałka powrotna do podanej strony (lub ogólnie wstecz).
 * Server Component — używa <Link>, bez interaktywności.
 */
export function BackLink({
  href = "/account",
  label = "Wróć",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

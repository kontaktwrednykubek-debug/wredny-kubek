import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExportEmailsButton } from "./ExportEmailsButton";

export const metadata = { title: "Użytkownicy" };

export default async function AdminUsersPage() {
  const supabase = createSupabaseServerClient();
  // RLS pozwoli adminowi czytać wszystkie profile (polityka admin: full access via is_admin()).
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Użytkownicy</h1>
        {profiles?.length ? (
          <ExportEmailsButton
            rows={profiles.map((p) => ({
              email: p.email,
              full_name: p.full_name,
            }))}
          />
        ) : null}
      </div>
      {!profiles?.length ? (
        <p className="text-muted-foreground">Brak użytkowników.</p>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Nazwa</th>
                  <th className="p-3">Rola</th>
                  <th className="p-3">Zarejestrowany</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">{p.email ?? "—"}</td>
                    <td className="p-3">{p.full_name ?? "—"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.role === "ADMIN"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pl-PL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: karty */}
          <div className="space-y-3 md:hidden">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="break-all text-sm font-medium">
                    {p.email ?? "—"}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.role === "ADMIN"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.full_name ?? "—"} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("pl-PL")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

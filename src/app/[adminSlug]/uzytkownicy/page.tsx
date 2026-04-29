import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <h1 className="text-2xl font-bold">Użytkownicy</h1>
      {!profiles?.length ? (
        <p className="text-muted-foreground">Brak użytkowników.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
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
      )}
    </div>
  );
}

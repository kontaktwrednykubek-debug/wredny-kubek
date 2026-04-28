import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Panel administratora" };

const stats = [
  { label: "Zamówienia (dzisiaj)", value: "0" },
  { label: "Przychód (msc)", value: "0,00 zł" },
  { label: "Aktywni użytkownicy", value: "0" },
  { label: "W produkcji", value: "0" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Koszyk" };

export default function CartPage() {
  return (
    <section className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Twój koszyk</h1>
      <p className="mt-3 text-muted-foreground">
        Koszyk jest pusty. Stwórz swój pierwszy projekt!
      </p>
      <Link href="/edytor" className="mt-6 inline-block">
        <Button size="lg">Otwórz edytor</Button>
      </Link>
    </section>
  );
}

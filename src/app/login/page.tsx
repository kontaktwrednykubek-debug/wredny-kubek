"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMsg(error ? error.message : "Zalogowano!");
    if (!error) window.location.href = "/account";
  }

  async function signUp() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : "Sprawdź email i potwierdź konto.");
  }

  return (
    <section className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Zaloguj się</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" className="w-full">
              Zaloguj
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={signUp}
              className="w-full"
            >
              Załóż konto
            </Button>
            {msg && (
              <p className="text-center text-sm text-muted-foreground">{msg}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

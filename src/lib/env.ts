import { z } from "zod";

/**
 * Walidacja zmiennych środowiskowych (fail-fast).
 * Importuj `env` zamiast `process.env` w całej aplikacji.
 */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Tajny slug panelu administratora — NIE daj tego nikomu.
  // Admin dostępny pod http://domena/${ADMIN_URL_SECRET}
  // Zmień na cokolwiek — min. 6 znaków.
  ADMIN_URL_SECRET: z.string().min(6).default("kubeczek-a7f9x2k"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Kubkomania"),
});

const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
};

const isServer = typeof window === "undefined";

const parsedClient = clientSchema.safeParse(clientEnv);
if (!parsedClient.success) {
  console.error(
    "❌ Niepoprawne publiczne zmienne środowiskowe:",
    parsedClient.error.flatten().fieldErrors,
  );
  throw new Error("Invalid public environment variables");
}

let parsedServer: Partial<z.infer<typeof serverSchema>> = {};
if (isServer) {
  const r = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ADMIN_URL_SECRET: process.env.ADMIN_URL_SECRET,
  });
  if (!r.success) {
    console.error(
      "❌ Niepoprawne serwerowe zmienne środowiskowe:",
      r.error.flatten().fieldErrors,
    );
    throw new Error("Invalid server environment variables");
  }
  parsedServer = r.data;
}

export const env = {
  ...parsedClient.data,
  ...parsedServer,
};

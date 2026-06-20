"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Tag, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart, cartTotalGr } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/utils";
import { isValidPhone } from "@/lib/phone";

export type ShippingTier = {
  id: string;
  min_quantity: number;
  price_grosze: number;
};

export type CheckoutShippingMethod = {
  code: string;
  name: string;
  description: string;
  priceGrosze: number;
  freeShippingThresholdGrosze: number | null;
  requiresParcelCode: boolean;
  tiers: ShippingTier[];
};

export type ShippingCountryMethod = {
  id: string;
  name: string;
  priceGrosze: number;
  requiresParcelCode: boolean;
  tiers?: ShippingTier[];
};

/** Cena metody zagranicznej wg progów liczby sztuk (fallback: cena bazowa). */
function calcCountryMethodPrice(m: ShippingCountryMethod | null, totalQty: number): number {
  if (!m) return 0;
  const tiers = m.tiers ?? [];
  if (tiers.length === 0) return m.priceGrosze;
  const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
  const tier = sorted.find((t) => t.min_quantity <= totalQty);
  return tier?.price_grosze ?? m.priceGrosze;
}

export type ShippingCountry = {
  id: string;
  code: string;
  name: string;
  methods: ShippingCountryMethod[];
};

/** Sentinel dla dostawy krajowej (Polska) w selektorze kraju. */
const DOMESTIC = "PL";

function calcShippingPrice(
  method: CheckoutShippingMethod | undefined,
  totalQty: number,
): number {
  if (!method) return 0;
  if (!method.tiers || method.tiers.length === 0) return method.priceGrosze;
  const sorted = [...method.tiers].sort((a, b) => b.min_quantity - a.min_quantity);
  const tier = sorted.find((t) => t.min_quantity <= totalQty);
  return tier?.price_grosze ?? method.priceGrosze;
}

export function CheckoutClient({
  methods,
  countries = [],
  userEmail,
}: {
  methods: CheckoutShippingMethod[];
  countries?: ShippingCountry[];
  userEmail?: string | null;
}) {
  const router = useRouter();
  const { items } = useCart();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stockError, setStockError] = React.useState<{ label: string; available: number; requested: number } | null>(null);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [zipError, setZipError] = React.useState<string | null>(null);
  const [parcelCodeError, setParcelCodeError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const firstErrorRef = React.useRef<HTMLDivElement>(null);

  // Kod rabatowy
  const [discountInput, setDiscountInput] = React.useState("");
  const [discount, setDiscount] = React.useState<{
    code: string;
    type: "percent" | "fixed" | "free_shipping";
    value: number | null;
    grosze: number;
  } | null>(null);
  const [discountError, setDiscountError] = React.useState<string | null>(null);
  const [discountChecking, setDiscountChecking] = React.useState(false);

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: userEmail ?? "",
    phone: "",
    street: "",
    houseNumber: "",
    city: "",
    zip: "",
    parcelCode: "",
    // Pełny adres zagranicznego punktu odbioru / automatu (gdy kraj != PL)
    pickupName: "",
    pickupStreet: "",
    pickupHouse: "",
    pickupApt: "",
    pickupZip: "",
    pickupCity: "",
    note: "",
  });
  // Wybór kraju: "PL" = dostawa krajowa (Polska), inaczej id kraju zagranicznego.
  const [country, setCountry] = React.useState<string>(DOMESTIC);
  const selectedCountry = countries.find((c) => c.id === country) ?? null;
  const isInternational = country !== DOMESTIC;

  // shippingMethod: kod metody krajowej LUB "intl:<methodId>".
  const [shippingMethod, setShippingMethod] = React.useState<string>(
    methods[0]?.code ?? "",
  );

  // Przy zmianie kraju ustaw pierwszą dostępną metodę tego kraju.
  const onCountryChange = (value: string) => {
    setCountry(value);
    if (value === DOMESTIC) {
      setShippingMethod(methods[0]?.code ?? "");
    } else {
      const c = countries.find((x) => x.id === value);
      setShippingMethod(c?.methods[0] ? `intl:${c.methods[0].id}` : "");
    }
  };

  const itemsTotal = cartTotalGr(items);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // Aktualnie wybrana metoda zagraniczna (gdy dotyczy)
  const intlMethod = isInternational
    ? selectedCountry?.methods.find((m) => `intl:${m.id}` === shippingMethod) ?? null
    : null;

  const method = isInternational ? undefined : methods.find((m) => m.code === shippingMethod);
  const shippingPrice = isInternational
    ? calcCountryMethodPrice(intlMethod, totalQty)
    : calcShippingPrice(method, totalQty);
  const isFreeShippingDiscount = discount?.type === "free_shipping";
  // Próg darmowej dostawy obowiązuje tylko dla dostawy krajowej.
  const isFreeShippingThreshold =
    !isInternational &&
    method?.freeShippingThresholdGrosze != null &&
    itemsTotal >= method.freeShippingThresholdGrosze;
  const isFreeShipping = isFreeShippingDiscount || isFreeShippingThreshold;
  const effectiveShipping = isFreeShipping ? 0 : shippingPrice;
  const discountGrosze = isFreeShipping ? 0 : (discount?.grosze ?? 0);
  const total = Math.max(0, itemsTotal - discountGrosze) + effectiveShipping;
  const requiresParcelCode = isInternational
    ? intlMethod?.requiresParcelCode ?? false
    : method?.requiresParcelCode ?? false;
  // Pełny adres punktu (Nazwa/Ulica/Nr/Kod/Miasto) dotyczy tylko zagranicznego
  // automatu DPD — rozpoznawanego po słowie "automat" w nazwie. Pozostałe metody
  // wymagające punktu (np. Paczkomat InPost) używają zwykłego pola kodu.
  const isIntlPickupAutomat =
    isInternational && (intlMethod?.name?.toLowerCase().includes("automat") ?? false);

  React.useEffect(() => {
    if (items.length === 0) {
      router.replace("/koszyk");
    }
  }, [items.length, router]);

  // Ponowna walidacja rabatu gdy zmienia się koszyk/dostawa
  React.useEffect(() => {
    if (!discount) return;
    void revalidateDiscount(discount.code, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsTotal, shippingPrice]);

  if (items.length === 0) return null;

  async function revalidateDiscount(code: string, showError: boolean) {
    setDiscountChecking(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          itemsTotalGrosze: itemsTotal,
          shippingGrosze: shippingPrice,
        }),
      });
      const j = await res.json();
      if (!j.valid) {
        if (showError) setDiscountError(j.error ?? "Nieprawid\u0142owy kod.");
        setDiscount(null);
        return;
      }
      setDiscount({
        code: j.code.code,
        type: j.code.type,
        value: j.code.value,
        grosze: j.discountGrosze,
      });
    } catch {
      if (showError) setDiscountError("B\u0142\u0105d po\u0142\u0105czenia. Spr\u00f3buj ponownie.");
    } finally {
      setDiscountChecking(false);
    }
  }

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    await revalidateDiscount(code, true);
  }

  function removeDiscount() {
    setDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  }

  function validatePhone(value: string) {
    if (!value) return setPhoneError(null);
    setPhoneError(
      isValidPhone(value)
        ? null
        : "Nieprawidłowy numer. Przykłady: 600 100 200, +48 600 100 200, +41 78 206 73 79.",
    );
  }
  function validateZip(value: string) {
    if (!value) return setZipError(null);
    // Akceptuj polski format (00-000) lub międzynarodowy (3-6 cyfr bez myślnika)
    const isValid = /^\d{2}-\d{3}$/.test(value) || /^\d{3,6}$/.test(value);
    setZipError(
      isValid ? null : "Format: 00-000 (PL) lub 1234 (międzynarodowy).",
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStockError(null);
    setParcelCodeError(null);

    // Walidacja wszystkich pól
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Imię jest wymagane";
    if (!form.lastName.trim()) errs.lastName = "Nazwisko jest wymagane";
    if (!form.email.trim()) errs.email = "Adres e-mail jest wymagany";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Nieprawidłowy adres e-mail";
    if (!form.phone.trim()) errs.phone = "Numer telefonu jest wymagany";
    else if (!isValidPhone(form.phone)) errs.phone = "Nieprawidłowy numer. Przykład: 600 100 200 lub +48 600 100 200";
    if (!form.street.trim()) errs.street = "Ulica jest wymagana";
    if (!form.houseNumber.trim()) errs.houseNumber = "Nr domu jest wymagany";
    if (!form.city.trim()) errs.city = "Miasto jest wymagane";
    if (!form.zip.trim()) errs.zip = "Kod pocztowy jest wymagany";
    else if (!isInternational && !/^\d{2}-\d{3}$/.test(form.zip) && !/^\d{3,6}$/.test(form.zip))
      errs.zip = "Format: 00-000 (PL) lub 1234 (międzynarodowy)";
    if (isIntlPickupAutomat) {
      // Zagraniczny automat DPD: pełny adres punktu odbioru (Nr lokalu opcjonalny)
      if (!form.pickupName.trim()) errs.pickupName = "Podaj nazwę punktu odbioru";
      if (!form.pickupStreet.trim()) errs.pickupStreet = "Podaj ulicę";
      if (!form.pickupHouse.trim()) errs.pickupHouse = "Podaj nr domu";
      if (!form.pickupZip.trim()) errs.pickupZip = "Podaj kod pocztowy";
      if (!form.pickupCity.trim()) errs.pickupCity = "Podaj miasto";
    } else if (requiresParcelCode && !form.parcelCode.trim()) {
      errs.parcelCode = "Wpisz kod paczkomatu (np. WAW123M)";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: {
            fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
            email: form.email || undefined,
            phone: form.phone,
            address: `${form.street.trim()} ${form.houseNumber.trim()}`.trim(),
            city: form.city,
            zip: form.zip,
            shippingMethod,
            country: isInternational ? selectedCountry?.name : "Polska",
            // Zagraniczny punkt odbioru: składamy pełny adres jako parcelCode
            // (widoczny w panelu/mailu) + przekazujemy pola osobno.
            parcelCode:
              isIntlPickupAutomat
                ? [
                    form.pickupName.trim(),
                    `ul. ${form.pickupStreet.trim()} ${form.pickupHouse.trim()}${form.pickupApt.trim() ? `/${form.pickupApt.trim()}` : ""}`,
                    `${form.pickupZip.trim()} ${form.pickupCity.trim()}`,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : form.parcelCode || undefined,
            pickupPoint:
              isIntlPickupAutomat
                ? {
                    name: form.pickupName.trim(),
                    street: form.pickupStreet.trim(),
                    house: form.pickupHouse.trim(),
                    apt: form.pickupApt.trim() || undefined,
                    zip: form.pickupZip.trim(),
                    city: form.pickupCity.trim(),
                  }
                : undefined,
            note: form.note || undefined,
          },
          items: items.map((i) => {
          const item = {
            designId: i.designId,
            productId: i.productId,
            label: i.label,
            variantColor: i.variant?.color,
            quantity: i.quantity,
            unitPriceGr: i.unitPriceGr,
            previewUrl: i.previewUrl ?? null,
          };
          console.log("[CheckoutClient] Item payload:", item);
          
          // Validation: shop products must have variantColor
          if (i.productId.startsWith("shop:") && !item.variantColor) {
            console.error("[CheckoutClient] Shop product without variantColor:", i);
            throw new Error(`Produkt "${i.label}" wymaga wyboru wariantu koloru. Usuń go z koszyka i dodaj ponownie.`);
          }
          
          return item;
        }),
          discountCode: discount?.code ?? null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "OUT_OF_STOCK") {
          setStockError({
            label: body.label ?? body.error ?? "Produkt",
            available: body.available ?? 0,
            requested: body.requested ?? 0,
          });
          setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        } else {
          setError(body.error ?? "Nie udało się rozpocząć płatności. Spróbuj ponownie.");
        }
        return;
      }
      const { orderId, orderIds } = body;

      // Utwórz sesję Stripe Checkout i przekieruj na stronę płatności
      const sessionRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderIds: orderIds ?? [orderId] }),
      });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        setError(
          err.error ?? "Nie udało się rozpocząć płatności. Spróbuj ponownie.",
        );
        return;
      }
      const { url } = await sessionRes.json();
      if (!url) {
        setError("Brak adresu płatności Stripe.");
        return;
      }

      // Przekierowanie na Stripe. UWAGA: używamy window.location.assign z PEŁNYM
      // url-em (zawiera fragment #... ze stanem sesji). NIE używać form.submit()
      // method=GET — gubi fragment i query, przez co Safari nie ładuje checkoutu.
      // Koszyk czyścimy dopiero na stronie sukcesu (po potwierdzeniu płatności),
      // żeby nie wyścigować z nawigacją i żeby po anulowaniu dało się ponowić.
      window.location.assign(url);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zamówienia");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  function fieldCls(name: string) {
    return fieldErrors[name]
      ? `${inputCls} border-destructive ring-2 ring-destructive/20`
      : inputCls;
  }

  function FieldError({ name }: { name: string }) {
    if (!fieldErrors[name]) return null;
    return (
      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
        <AlertTriangle className="h-3 w-3 shrink-0" />
        {fieldErrors[name]}
      </span>
    );
  }

  return (
    <section className="container mx-auto max-w-4xl overflow-x-hidden px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Zamówienie</h1>

      {/* OUT OF STOCK alert */}
      {stockError && (
        <div ref={firstErrorRef} className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Produkt niedostępny w tej ilości</p>
            <p className="mt-1 text-sm text-destructive/80">
              <strong>{stockError.label}</strong> — chcesz kupić{" "}
              <strong>{stockError.requested} szt.</strong>, a dostępne jest tylko{" "}
              <strong>{stockError.available} szt.</strong>
            </p>
            <p className="mt-1 text-sm text-destructive/80">Zmień ilość w koszyku i spróbuj ponownie.</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]" style={{ minWidth: 0 }}>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dane do wysyłki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Imię</span>
                  <input
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, firstName: e.target.value }));
                      if (fieldErrors.firstName) setFieldErrors((fe) => ({ ...fe, firstName: "" }));
                    }}
                    className={fieldCls("firstName")}
                  />
                  <FieldError name="firstName" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Nazwisko</span>
                  <input
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, lastName: e.target.value }));
                      if (fieldErrors.lastName) setFieldErrors((fe) => ({ ...fe, lastName: "" }));
                    }}
                    className={fieldCls("lastName")}
                  />
                  <FieldError name="lastName" />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Adres e-mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="twoj@email.pl"
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }));
                    if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: "" }));
                  }}
                  className={fieldCls("email")}
                />
                <FieldError name="email" />
                {!userEmail && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Wyślemy na ten adres potwierdzenie zamówienia.
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Telefon</span>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="600 100 200"
                  value={form.phone}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, phone: e.target.value }));
                    validatePhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((fe) => ({ ...fe, phone: "" }));
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  className={phoneError || fieldErrors.phone ? `${inputCls} border-destructive ring-2 ring-destructive/20` : inputCls}
                  aria-invalid={Boolean(phoneError || fieldErrors.phone)}
                />
                {(phoneError || fieldErrors.phone) && (
                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {phoneError || fieldErrors.phone}
                  </span>
                )}
              </label>

              <div className="grid grid-cols-[1fr_120px] gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Ulica</span>
                  <input
                    required
                    value={form.street}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, street: e.target.value }));
                      if (fieldErrors.street) setFieldErrors((fe) => ({ ...fe, street: "" }));
                    }}
                    className={fieldCls("street")}
                  />
                  <FieldError name="street" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Nr domu</span>
                  <input
                    required
                    placeholder="np. 12/3"
                    value={form.houseNumber}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, houseNumber: e.target.value }));
                      if (fieldErrors.houseNumber) setFieldErrors((fe) => ({ ...fe, houseNumber: "" }));
                    }}
                    className={fieldCls("houseNumber")}
                  />
                  <FieldError name="houseNumber" />
                </label>
              </div>

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Miasto</span>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, city: e.target.value }));
                      if (fieldErrors.city) setFieldErrors((fe) => ({ ...fe, city: "" }));
                    }}
                    className={fieldCls("city")}
                  />
                  <FieldError name="city" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Kod pocztowy
                  </span>
                  <input
                    required
                    placeholder="00-000"
                    value={form.zip}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, zip: e.target.value }));
                      validateZip(e.target.value);
                      if (fieldErrors.zip) setFieldErrors((fe) => ({ ...fe, zip: "" }));
                    }}
                    onBlur={(e) => validateZip(e.target.value)}
                    className={zipError || fieldErrors.zip ? `${inputCls} border-destructive ring-2 ring-destructive/20` : inputCls}
                    aria-invalid={Boolean(zipError || fieldErrors.zip)}
                  />
                  {(zipError || fieldErrors.zip) && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {zipError || fieldErrors.zip}
                    </span>
                  )}
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Uwagi do zamówienia (opcjonalne)
                </span>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  className={inputCls}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Sposób dostawy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Wybór kraju wysyłki — Polska (krajowa) lub kraj zagraniczny */}
              {countries.length > 0 && (
                <label className="block pb-1">
                  <span className="mb-1 block text-sm font-medium">Kraj wysyłki</span>
                  <select
                    value={country}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className={inputCls}
                  >
                    <option value={DOMESTIC}>Polska (dostawa krajowa)</option>
                    <optgroup label="Zagranica">
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
              )}

              {/* DOSTAWA KRAJOWA */}
              {!isInternational && (
                <>
                  {methods.length === 0 && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                      Brak dostępnych metod dostawy. Skontaktuj się z obsługą.
                    </p>
                  )}
                  {methods.map((m) => {
                    const checked = shippingMethod === m.code;
                    return (
                      <label
                        key={m.code}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={m.code}
                            checked={checked}
                            onChange={() => setShippingMethod(m.code)}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {(m.freeShippingThresholdGrosze != null && itemsTotal >= m.freeShippingThresholdGrosze) || calcShippingPrice(m, totalQty) === 0
                            ? "Gratis"
                            : formatPrice(calcShippingPrice(m, totalQty))}
                        </span>
                      </label>
                    );
                  })}
                </>
              )}

              {/* DOSTAWA ZAGRANICZNA — metody wybranego kraju */}
              {isInternational && (
                <>
                  {(selectedCountry?.methods.length ?? 0) === 0 && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                      Brak metod wysyłki do tego kraju.
                    </p>
                  )}
                  {selectedCountry?.methods.map((m) => {
                    const value = `intl:${m.id}`;
                    const checked = shippingMethod === value;
                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={value}
                            checked={checked}
                            onChange={() => setShippingMethod(value)}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            {m.requiresParcelCode && (
                              <p className="text-xs text-muted-foreground">Wymaga kodu punktu odbioru</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {calcCountryMethodPrice(m, totalQty) === 0
                            ? "Gratis"
                            : formatPrice(calcCountryMethodPrice(m, totalQty))}
                        </span>
                      </label>
                    );
                  })}
                </>
              )}

              {/* ZAGRANICZNY automat DPD — pełny adres (niezależnie od flagi kodu) */}
              {isIntlPickupAutomat && (
                <div className="block space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-semibold">
                    Adres punktu odbioru / automatu <span className="text-destructive">*</span>
                  </p>
                  <p className="-mt-2 text-xs text-muted-foreground">
                    Za granicą podaj pełny adres punktu (znajdziesz go na stronie przewoźnika).
                  </p>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Nazwa punktu odbioru</span>
                    <input
                      value={form.pickupName}
                      onChange={(e) => { setForm((f) => ({ ...f, pickupName: e.target.value })); if (fieldErrors.pickupName) setFieldErrors((fe) => ({ ...fe, pickupName: "" })); }}
                      className={fieldCls("pickupName")}
                    />
                    <FieldError name="pickupName" />
                  </label>
                  <div className="grid grid-cols-[1fr_100px_100px] gap-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Ulica</span>
                      <input
                        value={form.pickupStreet}
                        onChange={(e) => { setForm((f) => ({ ...f, pickupStreet: e.target.value })); if (fieldErrors.pickupStreet) setFieldErrors((fe) => ({ ...fe, pickupStreet: "" })); }}
                        className={fieldCls("pickupStreet")}
                      />
                      <FieldError name="pickupStreet" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Nr domu</span>
                      <input
                        value={form.pickupHouse}
                        onChange={(e) => { setForm((f) => ({ ...f, pickupHouse: e.target.value })); if (fieldErrors.pickupHouse) setFieldErrors((fe) => ({ ...fe, pickupHouse: "" })); }}
                        className={fieldCls("pickupHouse")}
                      />
                      <FieldError name="pickupHouse" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Nr lokalu</span>
                      <input
                        placeholder="opcj."
                        value={form.pickupApt}
                        onChange={(e) => setForm((f) => ({ ...f, pickupApt: e.target.value }))}
                        className={inputCls}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Kod pocztowy</span>
                      <input
                        value={form.pickupZip}
                        onChange={(e) => { setForm((f) => ({ ...f, pickupZip: e.target.value })); if (fieldErrors.pickupZip) setFieldErrors((fe) => ({ ...fe, pickupZip: "" })); }}
                        className={fieldCls("pickupZip")}
                      />
                      <FieldError name="pickupZip" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Miasto</span>
                      <input
                        value={form.pickupCity}
                        onChange={(e) => { setForm((f) => ({ ...f, pickupCity: e.target.value })); if (fieldErrors.pickupCity) setFieldErrors((fe) => ({ ...fe, pickupCity: "" })); }}
                        className={fieldCls("pickupCity")}
                      />
                      <FieldError name="pickupCity" />
                    </label>
                  </div>
                </div>
              )}

              {/* Paczkomat/punkt z kodem — krajowy oraz zagraniczny inny niż automat DPD */}
              {requiresParcelCode && !isIntlPickupAutomat && (
                <div className="block pt-2 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">
                      Kod paczkomatu / punktu odbioru <span className="text-destructive">*</span>
                    </span>
                    <input
                      required
                      placeholder="np. WAW123M"
                      value={form.parcelCode}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, parcelCode: e.target.value }));
                        setParcelCodeError(null);
                        if (fieldErrors.parcelCode) setFieldErrors((fe) => ({ ...fe, parcelCode: "" }));
                      }}
                      className={(parcelCodeError || fieldErrors.parcelCode) ? `${inputCls} border-destructive ring-2 ring-destructive/20` : inputCls}
                      aria-invalid={Boolean(parcelCodeError || fieldErrors.parcelCode)}
                    />
                    {(parcelCodeError || fieldErrors.parcelCode) && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {parcelCodeError || fieldErrors.parcelCode}
                      </span>
                    )}
                  </label>

                  {(() => {
                    const nm = (method?.name ?? intlMethod?.name)?.toLowerCase() ?? "";
                    const isDpd = nm.includes("dpd");
                    const isInpost = nm.includes("paczkomat") || nm.includes("inpost");
                    const showInpost = isInpost || (!isDpd && !isInpost);
                    const showDpd = isDpd || (!isDpd && !isInpost);
                    return (
                      <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <p className="text-sm font-semibold text-foreground">
                          📍 Znajdź swój punkt odbioru
                        </p>
                        {showInpost && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => window.open("https://inpost.pl/znajdz-paczkomat", "_blank", "noopener,noreferrer")}
                          >
                            Otwórz mapę paczkomatów InPost
                          </Button>
                        )}
                        {showDpd && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => window.open("https://www.dpd.com/pl/pl/znajd-automat-paczkowy-dpd-pickup/", "_blank", "noopener,noreferrer")}
                          >
                            Otwórz mapę automatów DPD Pickup
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {Object.keys(fieldErrors).some((k) => fieldErrors[k]) && (
            <div ref={stockError || error ? undefined : firstErrorRef} className="flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive font-medium">Uzupełnij wymagane pola zaznaczone na czerwono.</p>
            </div>
          )}
        </div>

        <aside className="h-fit min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Podsumowanie
          </h2>
          <ul className="space-y-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {i.label} ×{i.quantity}
                </span>
                <span className="shrink-0">
                  {formatPrice(i.unitPriceGr * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Produkty</span>
            <span>{formatPrice(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Dostawa ({isInternational ? intlMethod?.name ?? selectedCountry?.name : method?.name})
            </span>
            <span className={isFreeShipping ? "line-through text-muted-foreground" : ""}>
              {shippingPrice === 0 ? "Gratis" : formatPrice(shippingPrice)}
            </span>
          </div>
          {isFreeShipping && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">
                {isFreeShippingThreshold ? "Darmowa dostawa (próg kwoty)" : "Dostawa po rabacie"}
              </span>
              <span className="font-semibold text-emerald-600">Gratis</span>
            </div>
          )}
          {!isFreeShipping && method?.freeShippingThresholdGrosze != null && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-primary">
                Jeszcze {formatPrice(method.freeShippingThresholdGrosze - itemsTotal)}
              </span>{" "}
              do darmowej dostawy!
            </div>
          )}
          {discount && discount.type !== "free_shipping" && discountGrosze > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Rabat ({discount.code})</span>
              <span className="font-semibold">− {formatPrice(discountGrosze)}</span>
            </div>
          )}

          {/* Pole kodu rabatowego */}
          <div className="border-t border-border pt-3">
            {!discount ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  <Tag className="mr-1 inline h-3 w-3" /> Kod rabatowy
                </label>
                <div className="flex min-w-0 gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value.toUpperCase());
                      setDiscountError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyDiscount();
                      }
                    }}
                    placeholder="WPISZ KOD"
                    className={`${inputCls} min-w-0 font-mono text-xs uppercase`}
                    disabled={discountChecking}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyDiscount}
                    disabled={discountChecking || !discountInput.trim()}
                  >
                    {discountChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Zastosuj"}
                  </Button>
                </div>
                {discountError && (
                  <p className="mt-1 text-xs text-destructive">⚠️ {discountError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-2 text-sm">
                <span className="flex items-center gap-1.5 font-mono font-semibold text-emerald-700">
                  <Check className="h-4 w-4" /> {discount.code}
                </span>
                <button
                  type="button"
                  onClick={removeDiscount}
                  className="text-emerald-700/70 hover:text-emerald-700"
                  aria-label="Usuń kod"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Razem</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || Boolean(phoneError) || Boolean(zipError) || Boolean(parcelCodeError) || Object.values(fieldErrors).some(Boolean)}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Złóż zamówienie
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Zamówienie zostanie utworzone ze statusem „oczekujące". Płatność —
            wkrótce (Stripe).
          </p>
        </aside>
      </form>
    </section>
  );
}

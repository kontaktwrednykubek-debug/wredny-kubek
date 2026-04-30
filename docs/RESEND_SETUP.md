# Konfiguracja Resend dla emaili o wysyłce

## Kroki konfiguracji:

### 1. Załóż konto w Resend
- Przejdź na https://resend.com
- Zarejestruj się (darmowy plan: 100 emaili/dzień, 3000/miesiąc)

### 2. Zweryfikuj domenę
- W panelu Resend przejdź do **Domains**
- Dodaj swoją domenę (np. `wrednykubek.pl`)
- Dodaj rekordy DNS (SPF, DKIM, DMARC) w swoim dostawcy domeny
- Poczekaj na weryfikację (może potrwać do 48h)

### 3. Wygeneruj klucz API
- W panelu Resend przejdź do **API Keys**
- Kliknij **Create API Key**
- Skopiuj klucz (zaczyna się od `re_`)

### 4. Dodaj klucz do `.env.local`
```bash
RESEND_API_KEY=re_twoj_klucz_api
RESEND_FROM_EMAIL=zamowienia@wrednykubek.pl
NEXT_PUBLIC_SITE_URL=https://wrednykubek.pl
```

### 5. Testowanie w development
W trybie development możesz użyć adresu `onboarding@resend.dev` jako nadawcy (nie wymaga weryfikacji domeny):
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Jak działa wysyłanie emaili:

1. Admin zmienia status zamówienia na **"Wysłane"** (SHIPPED)
2. Pojawia się przycisk **"Wyślij email o wysyłce"**
3. Po kliknięciu, email jest wysyłany do klienta z:
   - Potwierdzeniem wysyłki
   - Szczegółami zamówienia
   - Linkiem do śledzenia statusu
   - Kodem paczkomatu (jeśli dotyczy)

## Przykładowy email:
- **Temat:** 🎉 Twoje zamówienie zostało wysłane!
- **Treść:** Powitanie, szczegóły zamówienia, przycisk "Sprawdź status zamówienia"
- **Link:** Przekierowuje do `/account/zamowienia?highlight={orderId}`

## Troubleshooting:

### Email nie wysyła się
- Sprawdź czy `RESEND_API_KEY` jest poprawny
- Sprawdź czy domena jest zweryfikowana (jeśli używasz własnej domeny)
- Sprawdź logi w konsoli przeglądarki i terminalu

### Email trafia do SPAM
- Upewnij się, że domena ma poprawnie skonfigurowane rekordy SPF, DKIM, DMARC
- Dodaj link do wypisania się z newslettera (jeśli wysyłasz masowo)
- Unikaj spamowych słów w temacie i treści

### Limit emaili
- Darmowy plan: 100 emaili/dzień, 3000/miesiąc
- Płatny plan: od $20/miesiąc za 50,000 emaili

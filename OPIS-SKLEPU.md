# WrednyKubek — opis sklepu

**WrednyKubek** to autorski sklep internetowy z personalizowanymi kubkami i gadżetami,
zbudowany jako nowoczesna aplikacja webowa (PWA) z pełnym panelem administracyjnym.
Klient może kupować gotowe produkty, projektować własne kubki w edytorze online,
oglądać filmy z TikToka bez wychodzenia ze sklepu i płacić online przez Stripe.

Poniżej pełny przegląd tego, co sklep potrafi.

---

## 🛍️ Sklep i produkty

- **Katalog produktów** z kategoriami i podkategoriami (popkultura, zodiak, okazje itd.).
- **Karta produktu** ze zdjęciami, opisem, oceną i opiniami klientów.
- **Warianty produktów** — kolory kubka (z miniaturami), pojemności (np. 330/450 ml),
  rozmiary. Każdy wariant ma własny stan magazynowy.
- **Stany magazynowe na żywo** — ilość dostępnych sztuk pobierana z bazy w czasie
  rzeczywistym; przy zamówieniu rezerwacja jest atomowa (zabezpieczenie przed
  sprzedażą tego samego egzemplarza dwóm osobom).
- **Produkty powiązane / polecane** — sekcja „Hit zamówień" oraz „Wredne Hity"
  (ręcznie wybierane przez administratora).
- **Wyszukiwarka** produktów oraz **wyszukiwanie semantyczne** (embeddingi) wspierane AI.
- **Lista życzeń (ulubione)** dla zalogowanych klientów.

## 🎨 Edytor projektów (personalizacja)

- **Edytor online** oparty o canvas (Konva) — klient dodaje tekst, grafiki, zdjęcia
  i układa własny projekt kubka.
- **Czcionki, kolory, warstwy, transformacje** elementów.
- **Eksport w wysokiej rozdzielczości** (300 DPI, z lustrzanym odbiciem dla sublimacji
  kubków) — gotowy do druku.
- **Zapisywanie projektów** na koncie klienta („Moje projekty").

## 🛒 Koszyk i promocje

- **Inteligentny koszyk** scalający duplikaty (ten sam produkt + wariant = jedna pozycja).
- **Promocja „Kup X, dostaniesz Y gratis"** — w pełni konfigurowalna z panelu admina
  (np. kup 3, czwarty gratis). Liczona od łącznej liczby sztuk w koszyku.
  - Pozycja gratis dodawana automatycznie (najtańszy produkt), oznaczona „GRATIS".
  - **Pasek postępu** w koszyku: „Dobierz jeszcze X szt. i dostaniesz kolejny kubek gratis!".
- **Kubek w ciemno (losowy wzór)** — dokupka jednym kliknięciem w koszyku (cena i widoczność
  ustawiane w panelu admina).
- **Kody rabatowe** — procentowe, kwotowe i darmowa dostawa, synchronizowane ze Stripe
  (limit użyć, data ważności, minimalna wartość koszyka, jeden na klienta).

## 🚚 Dostawa

- **Metody dostawy krajowe** z **progami cenowymi wg ilości sztuk** (np. inna cena
  za 1–3 szt., inna za 4+).
- **Darmowa dostawa od progu kwotowego**.
- **Paczkomaty / punkty odbioru** — metody wymagające kodu punktu, z linkiem do mapy InPost.
- **Przesyłki zagraniczne** — pełna obsługa: lista krajów wysyłki, a do każdego kraju
  własne metody (kurier zawsze, paczkomat tam, gdzie dostępny). Klient w koszyku wybiera
  kraj → potem metodę.

## 💳 Płatności i zamówienia

- **Płatności online przez Stripe** (karta, BLIK).
- **Zakupy bez rejestracji** (guest checkout) oraz dla zalogowanych.
- **Strona podziękowania** z animacją konfetti na pełnym ekranie i automatycznym
  potwierdzeniem płatności (z ponawianiem, odporne na opóźnienia Stripe i Safari).
- **Webhook Stripe** automatycznie oznacza zamówienie jako opłacone i wysyła maile.
- **Panel „Moje zamówienia"** dla klienta — wszystkie pozycje z jednego zakupu
  zgrupowane w jedno zamówienie z podsumowaniem kwot i statusem.
- **E-maile transakcyjne** (Resend) — potwierdzenie zamówienia dla klienta,
  powiadomienie dla administratora, powiadomienie o wysyłce.

## 📱 Sekcja TikTok / Social media

- **Karuzela filmów z TikToka** na stronie głównej — okładki pobierane automatycznie
  i zapisywane na stałe (nie znikają, gdy TikTok wygasi link).
- **Okno modalne na pełny ekran** (telefon i komputer) z odtwarzaczem — film gra
  **wewnątrz sklepu**, zapętla się i nie wyciąga klienta na tiktok.com.
- **Powiązane produkty pod filmem** z przyciskiem „Kup" prowadzącym wprost do produktu.
- Wszystko dodawane z panelu admina przez wklejenie linku do filmu.

## 🔧 Panel administracyjny

Rozbudowane zaplecze pod adresem z indywidualnym, trudnym do odgadnięcia slugiem:

- **Dashboard** — przegląd.
- **Zamówienia** — lista zgrupowanych zamówień, statusy, zarządzanie wysyłką, eksport.
- **Produkty** — dodawanie/edycja, zdjęcia, warianty, oznaczanie jako „polecane".
- **Kategorie** i **Warianty** (kolory/pojemności).
- **Dostawa** — metody krajowe (z progami) i przesyłki zagraniczne.
- **Rabaty** — promocje automatyczne, kody rabatowe, „Kubek w ciemno".
- **Użytkownicy** — lista klientów, eksport adresów e-mail.
- **Opinie** — moderacja recenzji produktów.
- **Banery / Promocje** — slider na stronie głównej.
- **TikTok / Social** — zarządzanie karuzelą filmów.

## ⚙️ Pod maską (technologia)

- **Next.js 14 (App Router)** + **React** + **TypeScript**.
- **Tailwind CSS** + komponenty UI (shadcn/ui), tryb jasny/ciemny.
- **Supabase** — baza danych (PostgreSQL), autoryzacja, storage zdjęć, RLS.
- **Stripe** — płatności i kody rabatowe.
- **Resend** — e-maile transakcyjne.
- **Konva** — edytor canvas.
- **Lottie** — animacje (konfetti, widżety).
- **AI (embeddingi)** — wyszukiwanie semantyczne produktów.
- **PWA** — instalacja jako aplikacja, service worker, działanie offline (częściowe).
- **Responsywność** — pełne wsparcie mobile (dolna nawigacja, drawer w panelu admina).
- **Logowanie** — Google OAuth oraz e-mail.

## ✨ Najważniejsze atuty

- Klient może **kupić gotowy produkt** albo **zaprojektować własny** w kilka minut.
- **Promocje i upsell** zwiększające wartość koszyka (gratisy, kubek w ciemno, kody).
- **Sprzedaż krajowa i zagraniczna** z elastycznymi metodami dostawy.
- **Integracja z TikTokiem** zamieniająca treści social media w bezpośrednią sprzedaż.
- **Pełna kontrola z panelu admina** — niemal wszystko konfigurowalne bez dotykania kodu.
- **Bezpieczne, automatyczne płatności** z potwierdzeniami i e-mailami.

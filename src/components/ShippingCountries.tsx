/**
 * Baner „Wysyłamy za granicę” — lista krajów z flagami (SVG, bez emoji,
 * żeby flagi wyświetlały się też na Windowsie).
 */

type Flag =
  | { kind: "h"; colors: string[]; ratios?: number[] } // pasy poziome
  | { kind: "v"; colors: string[]; ratios?: number[] } // pasy pionowe
  | { kind: "cross"; bg: string; cross: string; inner?: string } // krzyż skandynawski
  | { kind: "custom"; render: () => React.ReactNode };

const COUNTRIES: { name: string; flag: Flag }[] = [
  { name: "Austria", flag: { kind: "h", colors: ["#C8102E", "#fff", "#C8102E"] } },
  { name: "Belgia", flag: { kind: "v", colors: ["#000", "#FDDA24", "#EF3340"] } },
  { name: "Bułgaria", flag: { kind: "h", colors: ["#fff", "#00966E", "#D62612"] } },
  { name: "Chorwacja", flag: { kind: "h", colors: ["#FF0000", "#fff", "#171796"] } },
  {
    name: "Czechy",
    flag: {
      kind: "custom",
      render: () => (
        <>
          <rect width="30" height="10" fill="#fff" />
          <rect y="10" width="30" height="10" fill="#D7141A" />
          <path d="M0 0L15 10L0 20Z" fill="#11457E" />
        </>
      ),
    },
  },
  { name: "Dania", flag: { kind: "cross", bg: "#C8102E", cross: "#fff" } },
  { name: "Estonia", flag: { kind: "h", colors: ["#0072CE", "#000", "#fff"] } },
  { name: "Finlandia", flag: { kind: "cross", bg: "#fff", cross: "#002F6C" } },
  { name: "Francja", flag: { kind: "v", colors: ["#002395", "#fff", "#ED2939"] } },
  {
    name: "Grecja",
    flag: {
      kind: "custom",
      render: () => (
        <>
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} y={(i * 20) / 9} width="30" height={20 / 9 + 0.05} fill={i % 2 ? "#fff" : "#0D5EAF"} />
          ))}
          <rect width={(20 / 9) * 5} height={(20 / 9) * 5} fill="#0D5EAF" />
          <rect x={(20 / 9) * 2} width={20 / 9} height={(20 / 9) * 5} fill="#fff" />
          <rect y={(20 / 9) * 2} width={(20 / 9) * 5} height={20 / 9} fill="#fff" />
        </>
      ),
    },
  },
  { name: "Hiszpania", flag: { kind: "h", colors: ["#AA151B", "#F1BF00", "#AA151B"], ratios: [1, 2, 1] } },
  { name: "Holandia", flag: { kind: "h", colors: ["#AE1C28", "#fff", "#21468B"] } },
  { name: "Irlandia", flag: { kind: "v", colors: ["#169B62", "#fff", "#FF883E"] } },
  { name: "Litwa", flag: { kind: "h", colors: ["#FDB913", "#006A44", "#C1272D"] } },
  { name: "Luksemburg", flag: { kind: "h", colors: ["#EF3340", "#fff", "#00A3E0"] } },
  { name: "Łotwa", flag: { kind: "h", colors: ["#9E3039", "#fff", "#9E3039"], ratios: [2, 1, 2] } },
  { name: "Niemcy", flag: { kind: "h", colors: ["#000", "#DD0000", "#FFCE00"] } },
  { name: "Portugalia", flag: { kind: "v", colors: ["#006600", "#FF0000"], ratios: [2, 3] } },
  { name: "Rumunia", flag: { kind: "v", colors: ["#002B7F", "#FCD116", "#CE1126"] } },
  { name: "Słowacja", flag: { kind: "h", colors: ["#fff", "#0B4EA2", "#EE1C25"] } },
  { name: "Słowenia", flag: { kind: "h", colors: ["#fff", "#005DA4", "#ED1C24"] } },
  { name: "Szwecja", flag: { kind: "cross", bg: "#006AA7", cross: "#FECC02" } },
  { name: "Węgry", flag: { kind: "h", colors: ["#CE2939", "#fff", "#477050"] } },
  { name: "Włochy", flag: { kind: "v", colors: ["#009246", "#fff", "#CE2B37"] } },
];

function stripes(colors: string[], ratios: number[] | undefined, total: number) {
  const r = ratios ?? colors.map(() => 1);
  const sum = r.reduce((a, b) => a + b, 0);
  let pos = 0;
  return colors.map((c, i) => {
    const size = (r[i] / sum) * total;
    const start = pos;
    pos += size;
    return { c, start, size };
  });
}

function FlagIcon({ flag }: { flag: Flag }) {
  let content: React.ReactNode;
  if (flag.kind === "h") {
    content = stripes(flag.colors, flag.ratios, 20).map((s, i) => (
      <rect key={i} y={s.start} width="30" height={s.size + 0.05} fill={s.c} />
    ));
  } else if (flag.kind === "v") {
    content = stripes(flag.colors, flag.ratios, 30).map((s, i) => (
      <rect key={i} x={s.start} width={s.size + 0.05} height="20" fill={s.c} />
    ));
  } else if (flag.kind === "cross") {
    content = (
      <>
        <rect width="30" height="20" fill={flag.bg} />
        <rect x="9" width="4" height="20" fill={flag.cross} />
        <rect y="8" width="30" height="4" fill={flag.cross} />
      </>
    );
  } else {
    content = flag.render();
  }
  return (
    <svg
      viewBox="0 0 30 20"
      className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10"
      aria-hidden
    >
      {content}
    </svg>
  );
}

export function ShippingCountries() {
  return (
    <section className="bg-background pb-8 sm:pb-10">
      <div className="container mx-auto px-5 sm:px-6 lg:px-10 xl:px-12">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="#11C2BB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="32" cy="32" r="26" />
                  <path d="M6 32h52" />
                  <path d="M32 6c8 8 12 17 12 26s-4 18-12 26c-8-8-12-17-12-26s4-18 12-26z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">Wysyłka za granicę</p>
                <p className="text-xs text-muted-foreground">
                  Wysyłamy do {COUNTRIES.length} krajów UE
                </p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs"
                >
                  <FlagIcon flag={c.flag} />
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

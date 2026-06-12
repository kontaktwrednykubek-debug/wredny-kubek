"use client";

const texts = [
  { text: "PANIE GORZEJ BYŁO I BRAWO BILI", sep: "teal" },
  { text: "PREZENT Z CHARAKTEREM",          sep: "orange" },
  { text: "WREDNE, ALE Z MIŁOŚCIĄ",         sep: "teal" },
  { text: "NADRUK NA LATA",                 sep: "orange" },
];

function Group() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "34px",
        paddingRight: "34px",
        fontFamily: "'Archivo', sans-serif",
        fontWeight: 800,
        fontSize: "19px",
        color: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {texts.map((item, i) => (
        <>
          <span key={`t${i}`}>{item.text}</span>
          <span key={`s${i}`} style={{ color: item.sep === "teal" ? "#11C2BB" : "#FF6A00" }}>
            ✺
          </span>
        </>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <>
      <style>{`
        @keyframes wk-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .wk-marquee-track {
          animation: wk-marquee 26s linear infinite;
        }
      `}</style>

      <div
        style={{
          background: "#181B20",
          overflow: "hidden",
          padding: "18px 0",
          transform: "rotate(-1deg)",
          width: "120%",
          marginLeft: "-10%",
          marginTop: "40px",
          marginBottom: "40px",
        }}
      >
        <div
          className="wk-marquee-track"
          style={{ display: "flex", width: "max-content" }}
        >
          <Group />
          <Group />
        </div>
      </div>
    </>
  );
}

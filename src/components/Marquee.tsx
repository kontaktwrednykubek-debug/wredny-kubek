"use client";

export default function Marquee() {
  const texts = [
    { text: "PANIE GORZEJ BYŁO I BRAWO BILI", sep: "teal" },
    { text: "PREZENT Z CHARAKTEREM",          sep: "orange" },
    { text: "WREDNE, ALE Z MIŁOŚCIĄ",         sep: "teal" },
    { text: "NADRUK NA LATA",                 sep: "orange" },
  ];

  const Group = () => (
    <div className="marquee-group">
      {texts.map((item, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span>{item.text}</span>
          <span style={{ color: item.sep === "teal" ? "#11C2BB" : "#FF6A00" }}>✺</span>
        </span>
      ))}
    </div>
  );

  return (
    <>
      <div className="marquee-wrapper">
        <div className="marquee-track">
          <Group />
          <Group />
        </div>
      </div>

      <style jsx>{`
        .marquee-wrapper {
          background: #181B20;
          overflow: hidden;
          padding: 18px 0;
          transform: rotate(-1deg);
          width: 120%;
          margin-left: -10%;
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 26s linear infinite;
        }
        .marquee-group {
          display: flex;
          align-items: center;
          gap: 34px;
          padding-right: 34px;
          font-family: 'Archivo', sans-serif;
          font-weight: 800;
          font-size: 19px;
          color: #fff;
          white-space: nowrap;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}

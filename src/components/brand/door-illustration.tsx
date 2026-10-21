import { Seal } from "./seal";

/**
 * Visuel principal de l'accueil : une porte entrouverte, la lumière sur le seuil, une branche de
 * bougainvillier, et le sceau de vérification. Il porte la marque, jamais un métier.
 */
export function DoorIllustration({ className = "" }: { className?: string }) {
  const diamonds = [160, 137, 113.5, 90, 66.5, 43, 20].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: 220 + 142 * Math.cos(rad), y: 198 - 142 * Math.sin(rad) };
  });

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 440 500"
        className="h-auto w-full"
        role="img"
        aria-label="Une porte entrouverte d’où sort la lumière, une branche de bougainvillier, et le sceau Vérifié par Dorwar."
      >
        {/* Lumière qui se répand sur le seuil */}
        <path d="M188 432h130l112 68H150z" fill="#fbebd0" />
        <path d="M188 432h130l60 36H176z" fill="#e8a33d" fillOpacity="0.28" />

        {/* Ornement du linteau */}
        {diamonds.map((d, i) => (
          <rect
            key={i}
            x={d.x - 4.5}
            y={d.y - 4.5}
            width="9"
            height="9"
            transform={`rotate(45 ${d.x} ${d.y})`}
            fill="#b4532e"
            fillOpacity={i % 2 ? 0.45 : 0.8}
          />
        ))}

        {/* Encadrement de la porte */}
        <path
          d="M96 432V198a124 124 0 0 1 248 0v234"
          fill="#f2eadc"
          stroke="#273150"
          strokeWidth="3"
        />
        {/* Ouverture : l'intérieur, dans la lumière */}
        <path
          d="M122 432V200a98 98 0 0 1 196 0v232z"
          fill="#fbebd0"
          stroke="#273150"
          strokeWidth="2"
        />
        <path
          d="M200 404h118M214 380h104"
          stroke="#e8a33d"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Battant ouvert vers l'intérieur */}
        <path
          d="M122 432V200c0-38 20-70 66-86v304z"
          fill="#b4532e"
          stroke="#273150"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M136 404V214c0-24 12-48 38-62v240z"
          fill="none"
          stroke="#9c4526"
          strokeWidth="1.6"
        />
        <circle cx="177" cy="292" r="4.5" fill="#e8a33d" stroke="#273150" strokeWidth="1.5" />

        {/* Seuil */}
        <path d="M78 432h284" stroke="#273150" strokeWidth="3" strokeLinecap="round" />

        {/* Bougainvillier au-dessus de l'arc */}
        <path
          d="M430 34c-36 6-70 22-96 50-12 13-26 22-44 26"
          fill="none"
          stroke="#3f6b4a"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M372 52c-6-12-2-22 8-28M340 82c10 2 18 10 18 22M306 104c-2 10-10 16-20 18"
          fill="none"
          stroke="#3f6b4a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[
          [398, 40],
          [362, 60],
          [338, 76],
          [314, 98],
          [290, 110],
          [384, 30],
          [352, 46],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37})`}>
            <path d="M0-7c4 0 6 5 0 7-6-2-4-7 0-7z" fill="#b4532e" />
            <path d="M6 3.5c-2 3.5-7 3-6-3.5 6-1.5 8 2.5 6 3.5z" fill="#b4532e" fillOpacity="0.8" />
            <path d="M-6 3.5c-2-1 0-5 6-3.5 1 6.5-4 7-6 3.5z" fill="#e8a33d" fillOpacity="0.9" />
          </g>
        ))}

        {/* Plante en pot, à gauche de la porte */}
        <path
          d="M30 432l7-36h46l7 36z"
          fill="#e9ddc8"
          stroke="#273150"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M33 404h54" stroke="#273150" strokeWidth="1.5" />
        <path
          d="M60 396c-2-34-6-60-18-84M60 396c4-30 12-52 26-70M60 396c0-26 0-48 6-72"
          fill="none"
          stroke="#3f6b4a"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M42 312c-6 8-6 18 0 26M86 326c-2 10-8 16-16 18M66 324c6 6 8 16 4 24"
          fill="none"
          stroke="#3f6b4a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <Seal
        size={124}
        className="absolute right-[2%] bottom-[9%] w-[27%] -rotate-[9deg] drop-shadow-sm"
        label=""
      />
    </div>
  );
}

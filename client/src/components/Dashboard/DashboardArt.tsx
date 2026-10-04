import { useId } from "react";

export type ArtKind =
  | "fire"
  | "ice"
  | "key"
  | "premium"
  | "rank"
  | "graph"
  | "notebook"
  | "star"
  | "pyramid"
  | "platform";

/** Original vector illustrations. No external assets, fonts or image requests. */
export default function DashboardArt({
  kind,
  className = "",
  muted = false,
}: {
  kind: ArtKind;
  className?: string;
  muted?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const fill = (name: string) => `url(#${id}-${name})`;
  return (
    <svg
      className={`nh-art block h-full w-full shrink-0 ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`${id}-fire`}
          x1="60"
          y1="12"
          x2="60"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={muted ? "#e1e1e1" : "#ff8516"} />
          <stop offset="1" stopColor={muted ? "#bcbcbc" : "#ff4c16"} />
        </linearGradient>
        <linearGradient
          id={`${id}-ice`}
          x1="20"
          y1="12"
          x2="100"
          y2="104"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d5f5ff" />
          <stop offset=".48" stopColor="#80c7ff" />
          <stop offset="1" stopColor="#368aff" />
        </linearGradient>
        <linearGradient
          id={`${id}-silver`}
          x1="20"
          y1="24"
          x2="88"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f1f1ef" />
          <stop offset=".5" stopColor="#bcbdb9" />
          <stop offset="1" stopColor="#888985" />
        </linearGradient>
        <linearGradient
          id={`${id}-purple`}
          x1="14"
          y1="25"
          x2="104"
          y2="96"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b8a0ff" />
          <stop offset=".5" stopColor="#7557ff" />
          <stop offset="1" stopColor="#3c48cb" />
        </linearGradient>
      </defs>
      {kind === "fire" && (
        <>
          <path
            d="M64 10C58 34 77 34 78 54C86 49 86 39 84 34C107 57 108 82 94 98C78 117 41 114 27 96C11 74 29 52 39 38C35 56 43 59 46 50C50 37 48 22 64 10Z"
            fill={fill("fire")}
          />
          <path
            d="M61 52C59 70 73 66 73 80C79 75 81 69 80 65C96 86 80 105 62 105C41 105 30 87 42 69C42 79 48 82 53 71Z"
            fill={muted ? "#d7d7d7" : "#ffd642"}
          />
          {!muted && (
            <path
              d="M60 76C62 86 74 84 73 94C72 108 44 106 48 91C50 87 55 90 60 76Z"
              fill="#fffbe7"
            />
          )}
          {muted && (
            <path
              d="M31 95C45 111 77 114 94 97"
              stroke="#aaa"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </>
      )}
      {kind === "ice" && (
        <>
          <path d="M60 7 108 32V89L60 115 12 89V32Z" fill="#deefff" />
          <path d="M60 12 103 35V86L60 109 17 86V35Z" fill={fill("ice")} />
          <path
            d="m17 35 16 10 27-17V12Zm86 0L87 45 60 28V12Z"
            fill="#e8f9ff"
          />
          <path d="m17 86 16-9 27 17v15Zm86 0L87 77 60 94v15Z" fill="#63b6fc" />
          <path d="M33 45 60 28 87 45V77L60 94 33 77Z" fill="#b6e4ff" />
          <path
            d="M62 27C57 44 68 48 71 58L78 49C94 76 77 92 59 91C37 91 29 68 47 49C45 61 49 62 52 54Z"
            fill="#155dfc"
          />
          <path d="M60 59C58 70 70 69 68 77C65 89 48 83 51 75Z" fill="white" />
        </>
      )}
      {kind === "key" && (
        <>
          <path
            d="m54 20 25-8v16l-12 4v10l12-4v14l-12 4v23l17 10v18l-25 12-25-14V87l20-12Z"
            fill="#b58b00"
            transform="translate(0 -7)"
          />
          <path
            d="m52 11 25-7v15l-13 4v10l13-4v14l-13 4v27l18 10v16l-25 12-25-14V82l20-12Z"
            fill="#ffd443"
          />
          <path d="m52 11 12 5v58L52 80Z" fill="#ffe882" />
          <path d="m45 86 13-7 12 7v8l-12 6-13-7Z" fill="white" />
          <path d="m32 98 25 14v-12L45 93l-13-7Z" fill="#e9af04" />
        </>
      )}
      {kind === "premium" && (
        <>
          <path
            d="m81 24 21 12 9 29-19 27-27-5-13-25 10-27Z"
            fill={fill("purple")}
          />
          <path
            d="m81 24 10 16 11-4M91 40 83 64l28 1M83 64l9 28M62 35l10 13-20 14M72 48l11 16-18 23"
            stroke="#c5b9ff"
            strokeWidth="3"
          />
          <path
            d="M72 66V53a13 13 0 0 1 26 0v13"
            stroke="#432c92"
            strokeWidth="7"
          />
          <rect x="69" y="61" width="32" height="27" rx="5" fill="#ffe273" />
          <path d="M84 69a4 4 0 1 0 0 8v4" stroke="#997118" strokeWidth="4" />
          <path
            d="m14 77 15-15a18 18 0 1 1 14 11l-8 8-7-1-1 8-9 7-9-9Z"
            fill="#c69209"
          />
          <path
            d="m12 70 15-15a18 18 0 1 1 14 11l-8 8-7-1-1 8-9 7-9-9Z"
            fill="#ffd651"
          />
          <circle cx="42" cy="48" r="8" fill="#fff8c9" />
          <path
            d="m49 56 30 11"
            stroke="#ffe68b"
            strokeWidth="8"
            strokeLinecap="square"
          />
          <path d="m69 64-3 10m11-7-2 8" stroke="#d4a122" strokeWidth="5" />
          <path
            d="m12 24 3 7 7 2-7 3-3 7-2-7-7-3 7-2Zm94-15 2 7 7 2-7 2-2 7-2-7-6-2 6-2Z"
            fill="#ffd35a"
          />
        </>
      )}
      {kind === "rank" && (
        <>
          <path
            d="m15 17 45 38 45-38-4 31-41 35-41-35Z"
            fill={fill("silver")}
          />
          <path
            d="m20 54 40 34 40-34-3 23-37 33-37-33Z"
            fill={fill("silver")}
          />
          <path
            d="m15 17 45 38v16L22 39Zm45 71v15L26 75l-6-21Z"
            fill="#9c9d99"
          />
          <path
            d="m23 27 37 32 37-32M25 63l35 29 35-29"
            stroke="#fafaf8"
            strokeWidth="4"
          />
          <path d="m60 55 45-38-4 12-41 36Z" fill="#e4e5e2" />
        </>
      )}
      {kind === "graph" && (
        <>
          {Array.from({ length: 5 }, (_, y) =>
            Array.from({ length: 5 }, (_, x) => (
              <rect
                key={`${x}-${y}`}
                x={22 + x * 15}
                y={23 + y * 15}
                width="14"
                height="14"
                rx="1"
                fill={
                  y === 2 || y === 3
                    ? x % 2
                      ? "#ffd854"
                      : "#f7d363"
                    : x % 2
                      ? "#cdd5ff"
                      : "#bbc8ff"
                }
              />
            )),
          )}
          <path d="M21 17v81h79" stroke="#496bff" strokeWidth="2.6" />
          <path d="m21 11-5 9h10ZM106 98l-9-5v10Z" fill="#496bff" />
          {[
            [34, 28],
            [47, 43],
            [63, 55],
            [81, 61],
            [99, 65],
          ].map(([x, y], index) => (
            <g key={x}>
              <circle
                cx={x}
                cy={y + 2}
                r="6.8"
                fill={index < 2 ? "#354eda" : "#b08803"}
              />
              <circle
                cx={x}
                cy={y}
                r="6.5"
                fill={index < 2 ? "#4a68ff" : "#e6b719"}
              />
              <circle
                cx={x - 1.7}
                cy={y - 2.5}
                r="1.7"
                fill={index < 2 ? "#9eaeff" : "#fff09f"}
              />
            </g>
          ))}
        </>
      )}
      {kind === "notebook" && (
        <>
          <path d="m27 17 65-4 10 90-67 6Z" fill="#dd6634" />
          <path d="m25 13 64-4 9 89-66 7Z" fill="#ffb77c" />
          <path d="m33 96 63-4-1 6-62 6Z" fill="#fff0d7" />
          {[24, 44, 64, 84].map((y) => (
            <path
              key={y}
              d={`M23 ${y}h14`}
              stroke="#a96a2b"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
          <path d="m42 70 12-24 9 10 16-28 7 40Z" fill="#fff8e7" />
          <path d="M47 80h30" stroke="#de8149" strokeWidth="3" />
          <path d="m96 23 4 52 6 8 3-9-6-52Z" fill="#775bd2" />
        </>
      )}
      {kind === "star" && (
        <>
          <path
            d="m60 6 10 33 22-17-10 27 31 11-31 10 11 27-24-18-9 35-10-34-23 16 11-27L6 60l33-10-12-28 23 18Z"
            fill={fill("purple")}
          />
          <path
            d="m60 6 1 53 52 1-42 10-11 44-1-53-53-1 44-10Z"
            fill="#657bff"
          />
          <path d="m60 24 1 35 29 1-30 3-17 24 14-28Z" fill="#d3ceff" />
          <path d="m18 94 3 7 7 2-7 2-3 7-2-7-6-2 6-2Z" fill="#ffca4d" />
        </>
      )}
      {kind === "pyramid" && (
        <>
          <path d="M18 94 54 12l20 91Z" fill="#ff7833" />
          <path d="m54 12 0 86 20 5Z" fill="#ec4230" />
          <path d="m50 100 33-49 24 57Z" fill="#ffba3b" />
          <path d="m83 51-1 53 25 4Z" fill="#ef8122" />
          <path d="M6 94 28 52l9 47Z" fill="#ffa347" />
          <path d="m28 52-4 42 13 5Z" fill="#f46731" />
          <path d="m54 12-8 65-28 17Z" fill="#ffb48b" />
        </>
      )}
      {kind === "platform" && (
        <>
          <ellipse
            cx="60"
            cy="91"
            rx="44"
            ry="9"
            fill={muted ? "#efefef" : "#e9edff"}
          />
          <path
            d="m19 61 41-17 42 17v23l-42 17-41-17Z"
            fill={muted ? "#9d9d9b" : "#7284d7"}
          />
          <path
            d="m19 61 41 16 42-16-42-17Z"
            fill={muted ? "#d8d8d6" : "#cbd6ff"}
          />
          <path
            d="m25 59 35-14 35 14v12L60 85 25 72Z"
            fill={muted ? "#b6b6b4" : "#789cff"}
          />
          <path
            d="m25 59 35 14 35-14-35-14Z"
            fill={muted ? "#e0e0de" : "#e4edff"}
          />
          <path
            d="m25 71 35 14 35-14"
            stroke={muted ? "#f5f5f3" : "#fff"}
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}

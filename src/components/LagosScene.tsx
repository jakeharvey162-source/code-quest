// A lightweight, local scene. Every repair is derived from saved compiler achievements.
export default function LagosScene({ repaired }: { repaired: number }) {
  return (
    <svg
      className="lagos-scene"
      viewBox="0 0 900 380"
      role="img"
      aria-label={`Rookie Street: ${repaired >= 1 ? "streetlights glowing" : "streetlights waiting for power"}, ${repaired >= 2 ? "shop open" : "shop closed"}, ${repaired >= 3 ? "network connected" : "network offline"}`}
    >
      <defs>
        <linearGradient id="lagos-sky" x2="0" y2="1">
          <stop stopColor="#173e3c" />
          <stop offset="1" stopColor="#39665b" />
        </linearGradient>
        <pattern
          id="lagos-windows"
          width="24"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="8"
            y="7"
            width="7"
            height="11"
            rx="1"
            fill="#9ac1a4"
            opacity=".45"
          />
        </pattern>
        <radialGradient id="lagos-glow">
          <stop stopColor="#ffe194" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffe194" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="900" height="380" rx="20" fill="url(#lagos-sky)" />
      <circle cx="741" cy="64" r="31" fill="#f7d989" />
      <g fill="#b6d5bf" opacity=".65">
        <circle cx="65" cy="43" r="2" />
        <circle cx="395" cy="49" r="2" />
        <circle cx="590" cy="28" r="2" />
        <circle cx="815" cy="101" r="2" />
      </g>
      <path
        d="M0 208V137H57V105H115V152H151V72H210V184H244V128H297V175H340V113H390V162H450V91H503V155H550V119H605V180H650V133H717V168H780V119H843V157H900V268H0Z"
        fill="#244d45"
      />
      <path
        d="M0 208V137H57V105H115V152H151V72H210V184H244V128H297V175H340V113H390V162H450V91H503V155H550V119H605V180H650V133H717V168H780V119H843V157H900V268H0Z"
        fill="url(#lagos-windows)"
      />
      <path d="M0 295L900 270V380H0Z" fill="#173630" />
      <path
        d="M-15 332Q230 299 451 330T920 320"
        fill="none"
        stroke="#688575"
        strokeWidth="32"
      />
      <path
        className="lagos-road"
        d="M-15 332Q230 299 451 330T920 320"
        fill="none"
        stroke={repaired === 3 ? "#efd185" : "#c8cc9d"}
        strokeWidth="2"
        strokeDasharray="12 12"
      />
      <g transform="translate(70 138)">
        <path d="M0 136V24H122V136" fill="#d1a774" />
        <path d="M-8 24L61-9L130 24Z" fill="#b76d50" />
        <rect
          x="17"
          y="48"
          width="31"
          height="39"
          fill={repaired ? "#ffe194" : "#446357"}
        />
        <rect
          x="75"
          y="48"
          width="31"
          height="39"
          fill={repaired ? "#ffe194" : "#446357"}
        />
        <rect x="48" y="99" width="28" height="37" fill="#375e50" />
      </g>
      <g transform="translate(320 135)">
        <rect x="0" y="0" width="230" height="144" rx="3" fill="#d5bd8c" />
        <rect
          x="10"
          y="42"
          width="210"
          height="90"
          fill={repaired >= 2 ? "#f7d989" : "#47685b"}
        />
        <path d="M-9 34H239L225 4H5Z" fill="#dc825f" />
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <path
            key={n}
            d={`M${n * 35 - 9} 34h18L${n * 35 + 9} 4h-14Z`}
            fill="#f3e4bb"
          />
        ))}
        <rect x="75" y="66" width="80" height="27" rx="4" fill="#234939" />
        <text
          x="115"
          y="84"
          textAnchor="middle"
          fill="#fff0c9"
          fontSize="13"
          fontFamily="monospace"
        >
          {repaired >= 2 ? "OPEN" : "CLOSED"}
        </text>
        <text
          x="115"
          y="-11"
          textAnchor="middle"
          fill="#f7ead0"
          fontSize="15"
          fontWeight="700"
        >
          ROOKIE MARKET
        </text>
        {repaired >= 2 && (
          <g fill="#ae613e">
            <rect x="20" y="105" width="36" height="27" />
            <rect x="169" y="105" width="36" height="27" />
          </g>
        )}
      </g>
      <g
        transform="translate(699 112)"
        stroke={repaired >= 3 ? "#90ddc0" : "#87a698"}
        strokeWidth="5"
        fill="none"
      >
        <path d="M0 165L36 0L73 165M11 119H62L22 70H52L11 119M22 70L45 35" />
        <circle
          cx="36"
          cy="-4"
          r="7"
          fill={repaired >= 3 ? "#f7d989" : "#87a698"}
        />
        {repaired >= 3 && (
          <g className="lagos-signal">
            <path d="M14-23Q36-46 59-23M0-36Q36-72 74-36" strokeWidth="3" />
          </g>
        )}
      </g>
      {[259, 610].map((x) => (
        <g key={x}>
          {repaired >= 1 && (
            <circle
              className="lagos-light"
              cx={x + 17}
              cy="170"
              r="74"
              fill="url(#lagos-glow)"
            />
          )}
          <path
            d={`M${x} 289V165Q${x} 154 ${x + 17} 154h17`}
            fill="none"
            stroke="#a6b9a1"
            strokeWidth="5"
          />
          <path
            d={`M${x + 14} 157h28l-4 12h-20Z`}
            fill={repaired >= 1 ? "#ffe194" : "#809d88"}
          />
        </g>
      ))}
      <g transform="translate(173 287)">
        <rect width="82" height="30" rx="7" fill="#eabc48" />
        <path d="M14 0L24-15H56L69 0" fill="#eabc48" />
        <path d="M27-12H53L62 0H20Z" fill="#254e43" />
        <circle cx="17" cy="31" r="8" fill="#112e29" />
        <circle cx="65" cy="31" r="8" fill="#112e29" />
      </g>
      <text
        x="28"
        y="360"
        fill="#e6e4bb"
        fontSize="11"
        fontFamily="monospace"
        letterSpacing="2"
      >
        LAGOS / ROOKIE STREET
      </text>
      <text
        x="870"
        y="360"
        textAnchor="end"
        fill="#e6e4bb"
        fontSize="11"
        fontFamily="monospace"
      >
        {repaired}/3 REPAIRED
      </text>
    </svg>
  );
}

import { illustrationNotes, type IllustrationTheme } from "@/lib/visuals";
import { InfrastructureArt } from "./infrastructure-art";
// Original, scalable artwork. No publisher imagery, event reconstruction, or status encoding.
export function Illustration({ theme }: { theme: IllustrationTheme }) {
  if (theme === "dns" || theme === "planning")
    return <InfrastructureArt theme={theme} />;
  return (
    <svg
      className={`editorial-art art-${theme}`}
      viewBox="0 0 800 500"
      role="img"
      aria-label={illustrationNotes[theme].alt}
      xmlns="http://www.w3.org/2000/svg"
    >
      {theme === "device" ? (
        <>
          <path fill="#31533D" d="M0 0h800v500H0z" />
          <path fill="#264732" d="M0 415 800 65v435H0z" />
          <circle cx="644" cy="112" r="64" fill="#F3CF56" />
          <path d="M39 409 239 337 677 500H296z" fill="#1D211B" />
          <g transform="translate(267 58) rotate(-13 130 190)">
            <rect width="254" height="378" rx="28" fill="#1D211B" />
            <rect
              x="11"
              y="10"
              width="232"
              height="352"
              rx="20"
              fill="#F6F4EC"
            />
            <path d="M30 36h194v289H30z" fill="#D8D6CC" />
            <path d="M92 90h83v234H92z" fill="#31533D" />
            <path d="m175 90 60 29v204l-60 1z" fill="#D9503D" />
            <circle cx="187" cy="225" r="5" fill="#F6F4EC" />
            <path
              d="M97 19h58"
              stroke="#1D211B"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M89 344h76"
              stroke="#1D211B"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(79 261) rotate(-29)">
            <circle
              cx="55"
              cy="55"
              r="45"
              stroke="#F3CF56"
              strokeWidth="23"
              fill="none"
            />
            <path d="M99 55h181v31h-28V69h-31v29h-27V69H99z" fill="#F3CF56" />
          </g>
          <path d="M590 319h106M643 266v106" stroke="#F6F4EC" strokeWidth="2" />
          <path
            d="m680 420 40-14M686 435l42-5"
            stroke="#F3CF56"
            strokeWidth="3"
          />
        </>
      ) : theme === "ai" ? (
        <>
          <path fill="#E4DCF7" d="M0 0h800v500H0z" />
          <path d="M0 380h800v120H0" fill="#D6CBEF" />
          <path
            d="M80 300C180 40 295 455 394 235S627 65 734 279"
            stroke="#31533D"
            strokeWidth="13"
            fill="none"
          />
          <path
            d="m727 250 17 35-37 1"
            stroke="#31533D"
            strokeWidth="9"
            fill="none"
          />
          <rect
            x="70"
            y="210"
            width="116"
            height="116"
            fill="#F6F4EC"
            transform="rotate(-12 128 268)"
          />
          <g transform="translate(320 118)">
            <path d="m0 62 92-53 113 65-95 55z" fill="#F3CF56" />
            <path d="M0 62v151l110 64V129z" fill="#D9503D" />
            <path d="M110 129v148l95-58V74z" fill="#31533D" />
            <path
              d="M25 110v89m23-77v90m23-75v90"
              stroke="#F6F4EC"
              strokeWidth="3"
            />
          </g>
          <circle cx="667" cy="259" r="59" fill="#F3CF56" />
          <text
            x="71"
            y="402"
            fill="#31533D"
            fontFamily="var(--font-plex-sans),sans-serif"
            fontSize="22"
          >
            Input
          </text>
          <text
            x="343"
            y="438"
            fill="#31533D"
            fontFamily="var(--font-plex-sans),sans-serif"
            fontSize="22"
          >
            Model
          </text>
          <text
            x="640"
            y="402"
            fill="#31533D"
            fontFamily="var(--font-plex-sans),sans-serif"
            fontSize="22"
          >
            Output
          </text>
          <path
            d="m697 97 30-18m-15 38 38-3"
            stroke="#D9503D"
            strokeWidth="4"
          />
        </>
      ) : theme === "security" ? (
        <>
          <path fill="#F3CF56" d="M0 0h800v500H0z" />
          <g fill="none" stroke="#31533D" strokeWidth="2">
            <path d="M165 75h470v350H165z" />
            <path d="M217 112h367v276H217z" />
            <path d="M271 154h257v193H271z" />
          </g>
          <path fill="#31533D" d="m0 373 800-111v238H0z" />
          <g transform="rotate(-17 400 250)">
            <circle cx="285" cy="244" r="94" fill="#F6F4EC" />
            <circle cx="285" cy="244" r="38" fill="#31533D" />
            <path
              fill="#F6F4EC"
              d="M363 219h276v49h-37v46h-49v-46h-45v35h-43v-35H363z"
            />
          </g>
          <path
            fill="#D9503D"
            d="m596 86 14 31 34 4-25 23 7 34-30-17-31 17 7-34-25-23 35-4z"
          />
        </>
      ) : theme === "code" ? (
        <>
          <path fill="#EFE9DA" d="M0 0h800v500H0z" />
          <path fill="#D9503D" d="M0 0h206v500H0z" />
          <path
            d="M150 100h310v160h185v133"
            stroke="#31533D"
            strokeWidth="12"
            fill="none"
          />
          <path
            d="M460 260v135H290"
            stroke="#31533D"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M238 107h186v180H238z"
            fill="#F3CF56"
            transform="rotate(-8 331 197)"
          />
          <text
            x="255"
            y="240"
            fill="#1D211B"
            fontFamily="var(--font-plex-mono),monospace"
            fontSize="100"
          >{`{ }`}</text>
          <circle cx="647" cy="393" r="45" fill="#31533D" />
          <path
            d="m625 392 15 15 30-33"
            stroke="#F6F4EC"
            strokeWidth="7"
            fill="none"
          />
          <path fill="#E4DCF7" d="m182 367 52-30 52 30v60l-52 30-52-30z" />
          <path
            d="m104 82-23 27 23 27m34-54 23 27-23 27"
            fill="none"
            stroke="#F6F4EC"
            strokeWidth="5"
          />
          <path d="M568 78h135m-135 19h96" stroke="#31533D" strokeWidth="2" />
        </>
      ) : null}
    </svg>
  );
}

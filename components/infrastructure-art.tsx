import { illustrationNotes } from "@/lib/visuals";
export function InfrastructureArt({ theme }: { theme: "dns" | "planning" }) {
  return (
    <>
      <svg
        className={`editorial-art art-${theme}`}
        viewBox="0 0 800 340"
        role="img"
        aria-label={illustrationNotes[theme].alt}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="800"
          height="340"
          fill={theme === "dns" ? "#DDE6D9" : "#E8E1F2"}
        />
        {theme === "dns" ? (
          <>
            <path d="M0 279H800" stroke="#B7C9B3" />
            <g stroke="#2E5241" strokeWidth="3" fill="#F7F5EF">
              <rect x="42" y="107" width="166" height="118" rx="4" />
              <path d="M42 133H208M88 247H165M125 225V247" />
              <rect x="319" y="88" width="169" height="157" rx="4" />
              <path d="M336 119H469M336 163H469M336 207H469" />
              <rect x="609" y="111" width="145" height="114" rx="4" />
              <path d="M609 139H754" />
            </g>
            <g fill="#2E5241">
              <circle cx="55" cy="120" r="3" />
              <circle cx="66" cy="120" r="3" />
              <circle cx="77" cy="120" r="3" />
              <circle cx="352" cy="141" r="5" />
              <circle cx="352" cy="185" r="5" />
              <circle cx="352" cy="228" r="5" />
            </g>
            <g stroke="#2E5241" strokeWidth="3" fill="none">
              <path d="M221 147H299L289 139M299 147L289 155M300 193H222L232 185M222 193L232 201" />
              <path d="M205 71C338 24 522 25 652 84" strokeDasharray="7 7" />
              <path d="M640 71L652 84L635 86" />
            </g>
            <g fill="#20231F" fontFamily="Arial,sans-serif" textAnchor="middle">
              <text x="125" y="176" fontSize="21">
                website name
              </text>
              <text x="125" y="307" fontSize="27">
                Reader
              </text>
              <text x="403" y="307" fontSize="27">
                DNS lookup
              </text>
              <text x="681" y="307" fontSize="27">
                Destination
              </text>
              <text x="259" y="133" fontSize="17">
                asks
              </text>
              <text x="259" y="220" fontSize="17">
                address
              </text>
              <text x="425" y="29" fontSize="18">
                Then: connect to the website
              </text>
              <text x="680" y="181" fontSize="20">
                Website
              </text>
            </g>
          </>
        ) : (
          <>
            <g transform="translate(110 67) rotate(-8 100 105)">
              <path d="M16 17H209V227H16Z" fill="#B8ABC9" />
              <path
                d="M0 0H194V211H0Z"
                fill="#F7F5EF"
                stroke="#20231F"
                strokeWidth="3"
              />
              <path
                d="M27 67H160M27 86H160M27 105H125M27 166H139"
                stroke="#797267"
                strokeWidth="3"
              />
              <text
                x="27"
                y="40"
                fill="#2E5241"
                fontFamily="Arial,sans-serif"
                fontSize="20"
              >
                PLANNING
              </text>
              <rect x="27" y="123" width="66" height="24" fill="#DDE6D9" />
            </g>
            <path
              d="M344 169H411V111H480V213H537"
              fill="none"
              stroke="#2E5241"
              strokeWidth="4"
              strokeDasharray="8 8"
            />
            <circle cx="411" cy="169" r="10" fill="#D7523E" />
            <g fill="#2E5241" stroke="#20231F" strokeWidth="3">
              <path d="M556 89H635V272H556Z" />
              <path d="M644 63H723V272H644Z" />
            </g>
            <g stroke="#F7F5EF" strokeWidth="3">
              <path d="M570 119H621M570 151H621M570 183H621M570 215H621M658 93H709M658 125H709M658 157H709M658 189H709M658 221H709" />
            </g>
            <path d="M530 285H745" stroke="#20231F" strokeWidth="3" />
            <text
              x="407"
              y="308"
              textAnchor="middle"
              fontFamily="Arial,sans-serif"
              fontSize="22"
              fill="#20231F"
            >
              The paperwork behind the infrastructure
            </text>
          </>
        )}
      </svg>
      {theme === "dns" && (
        <div className="dns-mobile">
          <p>From a name to a website</p>
          <ol>
            <li>
              <strong>Reader</strong>Asks for a website’s address.
            </li>
            <li>
              <strong>DNS lookup</strong>A resolver looks up the name and
              returns an address.
            </li>
            <li>
              <strong>Destination</strong>The browser uses the address to
              connect.
            </li>
          </ol>
        </div>
      )}
    </>
  );
}

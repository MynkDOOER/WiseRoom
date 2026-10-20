/** Original WiseRoom artwork, with its paths and proportions preserved. */
export default function WiseRoomLogo() {
  return (
    <svg
      className="wiseroom-logo"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      focusable="false"
    >
      <g className="logo-document">
        <path
          fill="#FF5A1F"
          d="M350 120H700V245Q700 300 755 300H880V665Q880 750 795 750V895L650 785H350Q285 785 285 720V185Q285 120 350 120Z"
        />
        <path fill="#FFF8EE" d="M735 120L880 265H775Q735 265 735 225Z" />
        <rect x="430" y="205" width="190" height="42" rx="21" fill="#151517" />
        <rect x="430" y="280" width="190" height="42" rx="21" fill="#151517" />
      </g>
      <path
        className="logo-conversation"
        fill="#FFF8EE"
        d="M165 300H405Q450 300 475 340L595 545Q620 590 590 630L500 750Q475 785 430 785H300L175 875V785H165Q95 785 95 715V370Q95 300 165 300Z"
      />
      <path
        className="logo-letter"
        pathLength="1"
        fill="none"
        stroke="#151517"
        strokeWidth="78"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M225 430L340 665L485 490L610 665L755 430"
      />
    </svg>
  );
}

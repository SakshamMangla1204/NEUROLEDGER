export default function NeuroLedgerLogo({ className = "", compact = false }) {
  return (
    <div className={`neuro-logo${compact ? " neuro-logo-compact" : ""}${className ? ` ${className}` : ""}`}>
      <svg
        className="neuro-logo-mark"
        viewBox="0 0 72 72"
        role="img"
        aria-label="NeuroLedger logo"
      >
        <defs>
          <linearGradient id="neuro-ledger-frame" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#8bd9ff" />
            <stop offset="45%" stopColor="#5ea4ff" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
          <linearGradient id="neuro-ledger-signal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f8fbff" />
            <stop offset="100%" stopColor="#9fe6ff" />
          </linearGradient>
        </defs>

        <rect
          x="7"
          y="7"
          width="58"
          height="58"
          rx="18"
          fill="rgba(8, 18, 33, 0.18)"
          stroke="url(#neuro-ledger-frame)"
          strokeWidth="2.4"
        />

        <path
          d="M20 44 L28 44 L33 30 L38 47 L44 25 L48 36 L53 36"
          fill="none"
          stroke="url(#neuro-ledger-signal)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="28" cy="44" r="2.3" fill="#8bd9ff" />
        <circle cx="38" cy="47" r="2.3" fill="#c4b5fd" />
        <circle cx="44" cy="25" r="2.3" fill="#ffffff" />
      </svg>

      <div className="neuro-logo-copy">
        <span className="neuro-logo-name">NeuroLedger</span>
        {!compact ? <span className="neuro-logo-tag">Healthcare trust platform</span> : null}
      </div>
    </div>
  );
}

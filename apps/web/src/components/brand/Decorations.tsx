// Decorative SVG elements matching GRAFICA SLP brand language

export function Sparkle({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function SparkleSmall({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1L9 6.5L14.5 7.5L9 8.5L8 14L7 8.5L1.5 7.5L7 6.5L8 1Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className={className}>
      <path d="M2 12C10 4 18 20 26 12C34 4 42 20 50 12C58 4 66 20 74 12"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function WavyLine({ className = '' }: { className?: string }) {
  return (
    <svg width="120" height="32" viewBox="0 0 120 32" fill="none" className={className}>
      <path d="M4 16C16 4 28 28 40 16C52 4 64 28 76 16C88 4 100 28 112 16"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DotCluster({ className = '' }: { className?: string }) {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" className={className}>
      <circle cx="6"  cy="6"  r="3" fill="currentColor" />
      <circle cx="18" cy="4"  r="2" fill="currentColor" opacity="0.6" />
      <circle cx="28" cy="8"  r="3" fill="currentColor" />
      <circle cx="10" cy="20" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}

// The organic wavy blob shape for the sidebar
export function SidebarBlob({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 900" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} preserveAspectRatio="none">
      <path d="M0 0H180C180 0 220 80 200 200C180 320 220 380 210 500C200 620 240 700 200 800C160 900 0 900 0 900V0Z"
        fill="white" fillOpacity="0.08" />
    </svg>
  );
}

// Print roll illustration — more relevant to a printing company
export function PrintRollIllustration({ className = '' }: { className?: string }) {
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none" className={className}>
      {/* Roll tube */}
      <ellipse cx="48" cy="68" rx="28" ry="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="76" y1="24" x2="76" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="48" cy="24" rx="28" ry="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Design lines on roll */}
      <line x1="30" y1="36" x2="66" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="30" y1="44" x2="58" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="30" y1="52" x2="62" y2="52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* Sparkle above */}
      <path d="M80 8L81.5 13L87 14L81.5 15L80 20L78.5 15L73 14L78.5 13L80 8Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// G lettermark
export function GLettermark({ className = '' }: { className?: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className={className}>
      <text x="4" y="44" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="48"
        fontWeight="800" fill="currentColor">G</text>
      <circle cx="44" cy="42" r="5" fill="currentColor" />
      <circle cx="44" cy="30" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

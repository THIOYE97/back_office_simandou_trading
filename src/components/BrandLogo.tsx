const BLUE = '#0A3D91';
const ORANGE = '#FF7A00';

// Marque Simandou Trading : boucle d'échange infinie + wordmark.
// `light` (fond navy de la sidebar) : boucle claire + wordmark blanc.
export function BrandLogo({ size = 22, light = false }: { size?: number; light?: boolean }) {
  const iconH = size * 1.05;
  const iconW = iconH * 1.515;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={iconW} height={iconH} viewBox="0 0 100 66" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M 50,33 C 59,52 86,51 86,33 C 86,15 59,14 50,33 Z"
          stroke={ORANGE}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 50,33 C 41,14 14,15 14,33 C 14,51 41,52 50,33 Z"
          stroke={light ? '#FFFFFF' : BLUE}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.3, color: light ? '#fff' : BLUE }}>
          Simandou
        </span>
        <span style={{ fontSize: size * 0.34, letterSpacing: 4, color: ORANGE, marginTop: 3, fontWeight: 700 }}>
          TRADING
        </span>
      </div>
    </div>
  );
}

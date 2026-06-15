export function BrandLogo({ size = 22, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: 1,
          background: light
            ? 'linear-gradient(90deg,#7FD4FF,#2EA6FF)'
            : 'linear-gradient(90deg,#2FE0F2,#2EA6FF,#0B5FD0)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        AYOUB
      </span>
      <span
        style={{
          fontSize: size * 0.36,
          letterSpacing: 3,
          color: light ? 'rgba(255,255,255,0.55)' : '#8A99AD',
          marginTop: 2,
        }}
      >
        CORPORATION
      </span>
    </div>
  );
}

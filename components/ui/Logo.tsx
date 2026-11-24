/** The mark: a stone flower inside a diamond. Petals in Carrara, brass centre. */
export const PETAL_PATH = "M0 0 C 7 -5, 7 -18, 0 -26 C -7 -18, -7 -5, 0 0 Z";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden>
      <rect x="-34" y="-34" width="68" height="68" transform="rotate(45)" fill="none" stroke="currentColor" strokeWidth="2.2" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={PETAL_PATH} transform={`rotate(${i * 45}) translate(0 -5)`} fill="currentColor" opacity={i % 2 ? 0.55 : 1} />
      ))}
      <circle r="4.2" fill="var(--brass)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`logo ${className ?? ""}`}>
      <LogoMark size={30} />
      <span className="logo__word">
        MOSAIC<span className="logo__dot">.</span>KZ
      </span>
    </span>
  );
}

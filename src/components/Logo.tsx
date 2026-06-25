// Logo oficial Porto Real, recriado como SVG (nítido em qualquer tamanho e
// temável). O ícone — círculo vermelho com a casinha branca — entra no lugar
// do "o" de "Porto", formando "Port●Real", igual à marca da empresa.

interface MarkProps {
  size?: number
  className?: string
}

// Apenas o símbolo (círculo + casa). Útil para favicons, avatares, loading.
export function PortoRealMark({ size = 28, className = '' }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Porto Real"
    >
      <circle cx="50" cy="50" r="50" fill="#EB3238" />
      {/* Casa branca limpa (telhado em pico + corpo) */}
      <path
        d="M50 23 L77 49 L77 78 L23 78 L23 49 Z"
        fill="#ffffff"
      />
    </svg>
  )
}

interface LogoProps {
  /** Tamanho do ícone (px). O texto acompanha via `fontSize`. */
  iconSize?: number
  /** Classe de cor + tamanho do texto. Em fundo escuro use texto branco. */
  textClassName?: string
  /** Tamanho da fonte do wordmark (classe Tailwind). */
  fontSize?: string
  className?: string
}

export default function Logo({
  iconSize = 26,
  textClassName = 'text-[#33415C]',
  fontSize = 'text-[19px]',
  className = '',
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-[-0.01em] leading-none select-none ${fontSize} ${textClassName} ${className}`}
    >
      <span>Port</span>
      <PortoRealMark size={iconSize} className="mx-[1px] -translate-y-[1px]" />
      <span>Real</span>
    </span>
  )
}

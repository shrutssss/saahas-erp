export default function SaahasLogo({ size = 48, style = {} }) {
  return (
    <img
      src="/saahas-logo.png"
      alt="Saahas"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
    />
  )
}

export const brandFont = "'Libre Baskerville', Georgia, 'Times New Roman', serif"

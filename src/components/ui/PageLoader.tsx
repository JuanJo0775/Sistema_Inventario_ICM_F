import { Loader2 } from 'lucide-react'

export const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      background: 'var(--bg)',
    }}
  >
    <Loader2
      style={{
        width: 32,
        height: 32,
        color: 'var(--teal-600)',
      }}
      className="animate-spin"
    />
    <p style={{ color: 'var(--ink-40)', fontSize: '0.875rem', margin: 0 }}>
      Cargando...
    </p>
  </div>
)

export default PageLoader

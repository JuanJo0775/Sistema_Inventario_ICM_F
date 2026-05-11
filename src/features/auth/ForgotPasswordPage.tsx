import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'

function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recuperar acceso"
      subtitle="Este flujo estara disponible en la siguiente fase."
    >
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Por ahora contacta al administrador para restablecer tu acceso.
        </p>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
        >
          Volver al login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage

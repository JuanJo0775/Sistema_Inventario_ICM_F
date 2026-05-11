import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'

function RegisterPage() {
  return (
    <AuthLayout
      title="Registro"
      subtitle="Este modulo estara disponible en la siguiente etapa."
    >
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Por ahora, usa tus credenciales existentes para acceder.
        </p>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(14,74,80,0.7)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-dark)]"
        >
          Volver al login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage

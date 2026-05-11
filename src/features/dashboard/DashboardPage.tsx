import useAuthStore from '../../store/useAuthStore'

function DashboardPage() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg)] px-6">
      <div className="w-full max-w-xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 text-center shadow-[0_20px_40px_-30px_rgba(14,74,80,0.6)]">
        <h1 className="font-display text-3xl text-[color:var(--color-text)]">
          Acceso confirmado
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-text-muted)]">
          Esta vista es temporal mientras continuamos con los modulos siguientes.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}

export default DashboardPage

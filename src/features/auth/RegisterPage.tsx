import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/layout/AuthLayout'

function RegisterPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
    >
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {t('auth.register.note')}
        </p>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(14,74,80,0.7)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-dark)]"
        >
          {t('auth.register.back')}
        </Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage

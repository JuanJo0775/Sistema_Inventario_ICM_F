import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/layout/AuthLayout'

function ForgotPasswordPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
    >
      <div className="space-y-6">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {t('auth.forgot.note')}
        </p>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
        >
          {t('auth.forgot.back')}
        </Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage

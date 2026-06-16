import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/layout/AuthLayout'
import PhysioInput from '../../components/ui/PhysioInput'
import PhysioButton from '../../components/ui/PhysioButton'
import { forgotPassword } from '../../services/auth'

type ForgotFormValues = {
  email: string
}

function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const forgotSchema = z.object({
    email: z.string().email(t('auth.login.errors.identifierMax')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormValues) => {
    setFormError(null)
    try {
      await forgotPassword({ email: data.email.trim() })
      setSent(true)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('auth.login.errors.fallback')
      setFormError(message)
    }
  }

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {sent ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-[color:var(--color-success)] bg-[#f0faf5] px-4 py-3 text-sm text-[color:var(--color-success)]">
              {t('auth.forgot.success')}
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
            >
              {t('auth.forgot.back')}
            </Link>
          </div>
        ) : (
          <>
            <PhysioInput
              label={t('auth.forgot.emailLabel')}
              type="email"
              placeholder={t('auth.forgot.emailPlaceholder')}
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            {formError ? (
              <div
                className="rounded-lg border border-[color:var(--color-danger)] bg-[#fdf3f2] px-4 py-3 text-xs text-[color:var(--color-danger)]"
                role="alert"
              >
                {formError}
              </div>
            ) : null}
            <PhysioButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              {t('auth.forgot.submit')}
            </PhysioButton>
            <div className="text-center text-sm">
              <Link
                to="/login"
                className="text-[color:var(--color-accent)] hover:underline"
              >
                {t('auth.forgot.back')}
              </Link>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage

import { Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/layout/AuthLayout'
import PhysioInput from '../../components/ui/PhysioInput'
import PhysioButton from '../../components/ui/PhysioButton'
import PasswordStrengthBar, { getStrength } from '../../components/ui/PasswordStrengthBar'
import { resetPassword } from '../../services/auth'

type ResetFormValues = {
  new_password: string
  new_password_confirm: string
}

const errMsg = (e: unknown): string | undefined =>
  typeof e === 'string' ? e : undefined

function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const resetSchema = z.object({
    new_password: z.string().min(1),
    new_password_confirm: z.string().min(1),
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  const watchedPassword = watch('new_password')

  const onSubmit = async (data: ResetFormValues) => {
    setFormError(null)
    if (!token) {
      setFormError(t('auth.reset.errors.noToken'))
      return
    }
    if (data.new_password.length < 8) {
      setFormError(t('auth.reset.errors.minLength'))
      return
    }
    if (!/[A-Z]/.test(data.new_password)) {
      setFormError(t('auth.reset.errors.uppercase'))
      return
    }
    if (!/[a-z]/.test(data.new_password)) {
      setFormError(t('auth.reset.errors.lowercase'))
      return
    }
    if (!/[0-9]/.test(data.new_password)) {
      setFormError(t('auth.reset.errors.number'))
      return
    }
    if (!/[^A-Za-z0-9]/.test(data.new_password)) {
      setFormError(t('auth.reset.errors.specialChar'))
      return
    }
    const { level } = getStrength(data.new_password)
    if (level === 'weak') {
      setFormError(t('auth.reset.errors.weak'))
      return
    }
    if (data.new_password !== data.new_password_confirm) {
      setFormError(t('auth.reset.errors.mismatch'))
      return
    }
    try {
      await resetPassword({
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      })
      setDone(true)
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t('auth.reset.errors.fallback')
      setFormError(msg)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title={t('auth.reset.title')}
        subtitle={t('auth.reset.subtitle')}
      >
        <div className="space-y-6">
          <div
            className="rounded-lg border border-[color:var(--color-danger)] bg-[#fdf3f2] px-4 py-3 text-xs text-[color:var(--color-danger)]"
            role="alert"
          >
            {t('auth.reset.errors.noToken')}
          </div>
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
          >
            {t('auth.forgot.back')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {done ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-[color:var(--color-success)] bg-[#f0faf5] px-4 py-3 text-sm text-[color:var(--color-success)]">
              {t('auth.reset.success')}
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-primary-light)]"
            >
              {t('auth.reset.login')}
            </Link>
          </div>
        ) : (
          <>
            <PhysioInput
              label={t('auth.reset.passwordLabel')}
              type="password"
              placeholder={t('auth.reset.passwordPlaceholder')}
              icon={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={errMsg(errors.new_password?.message)}
              {...register('new_password')}
            />
            <PasswordStrengthBar password={watchedPassword ?? ''} />
            <PhysioInput
              label={t('auth.reset.confirmLabel')}
              type="password"
              placeholder={t('auth.reset.confirmPlaceholder')}
              icon={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={errMsg(errors.new_password_confirm?.message)}
              {...register('new_password_confirm')}
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
              {t('auth.reset.submit')}
            </PhysioButton>
          </>
        )}
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage

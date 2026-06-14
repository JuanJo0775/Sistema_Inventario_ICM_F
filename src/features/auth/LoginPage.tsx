import { Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../../components/layout/AuthLayout'
import PhysioInput from '../../components/ui/PhysioInput'
import PhysioButton from '../../components/ui/PhysioButton'
import useAuthStore from '../../store/useAuthStore'

type LoginFormValues = {
  identifier: string
  password: string
}

const errMsg = (e: unknown): string | undefined =>
  typeof e === 'string' ? e : undefined

function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [formError, setFormError] = useState<string | null>(null)
  const { t } = useTranslation()

  const loginSchema = z.object({
    identifier: z
      .string()
      .min(3, t('auth.login.errors.identifierMin'))
      .max(254, t('auth.login.errors.identifierMax')),
    password: z.string().min(8, t('auth.login.errors.passwordMin')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null)
    try {
      const identifier = data.identifier.trim()
      const payload = identifier.includes('@')
        ? { email: identifier, password: data.password }
        : { username: identifier, password: data.password }
      await login(payload)
      navigate('/app', { replace: true })
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
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <PhysioInput
          label={t('auth.login.identifierLabel')}
          type="text"
          placeholder={t('auth.login.identifierPlaceholder')}
          icon={<Mail className="h-4 w-4" />}
          error={errMsg(errors.identifier?.message)}
          {...register('identifier')}
        />
        <PhysioInput
          label={t('auth.login.passwordLabel')}
          type="password"
          placeholder={t('auth.login.passwordPlaceholder')}
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          error={errMsg(errors.password?.message)}
          {...register('password')}
        />
        <div className="flex justify-end text-sm">
          <Link
            to="/forgot-password"
            className="text-[color:var(--color-accent)] hover:underline"
          >
            {t('auth.login.forgot')}
          </Link>
        </div>
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
          {t('auth.login.submit')}
        </PhysioButton>
        <div className="text-center text-sm text-[color:var(--color-text-muted)]">
          {t('auth.login.managedAccess')}
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage

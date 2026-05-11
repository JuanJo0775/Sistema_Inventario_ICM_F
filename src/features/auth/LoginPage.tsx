import { Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthLayout from '../../components/layout/AuthLayout'
import PhysioInput from '../../components/ui/PhysioInput'
import PhysioButton from '../../components/ui/PhysioButton'
import useAuthStore from '../../store/useAuthStore'

type LoginFormValues = {
  identifier: string
  password: string
}

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Ingresa tu usuario o correo')
    .max(254, 'Ingresa un usuario o correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [formError, setFormError] = useState<string | null>(null)

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
          : 'No se pudo iniciar sesión'
      setFormError(message)
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Accede con tu usuario o correo y contraseña para continuar."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <PhysioInput
          label="Usuario o correo"
          type="text"
          placeholder="usuario o nombre@empresa.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <PhysioInput
          label="Contraseña"
          type="password"
          placeholder="Ingresa tu contraseña"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end text-sm">
          <Link
            to="/forgot-password"
            className="text-[color:var(--color-accent)] hover:underline"
          >
            Olvidé mi contraseña
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
          Iniciar sesión
        </PhysioButton>
        <div className="text-center text-sm text-[color:var(--color-text-muted)]">
          El acceso es gestionado por un administrador.
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage

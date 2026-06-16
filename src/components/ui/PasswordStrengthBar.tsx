import { useTranslation } from 'react-i18next'

type StrengthLevel = 'weak' | 'medium' | 'strong'

function getStrength(password: string): { level: StrengthLevel; score: number } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const level: StrengthLevel = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
  return { level, score }
}

type Props = {
  password: string
}

function PasswordStrengthBar({ password }: Props) {
  const { t } = useTranslation()
  const { level, score } = getStrength(password)

  if (!password) return null

  const colors: Record<StrengthLevel, string> = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const labels: Record<StrengthLevel, string> = {
    weak: t('auth.reset.strength.weak'),
    medium: t('auth.reset.strength.medium'),
    strong: t('auth.reset.strength.strong'),
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              i < score ? colors[level] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[11px] font-medium ${
          level === 'weak'
            ? 'text-red-500'
            : level === 'medium'
              ? 'text-yellow-600'
              : 'text-green-600'
        }`}
      >
        {labels[level]}
      </span>
    </div>
  )
}

export { getStrength }
export default PasswordStrengthBar

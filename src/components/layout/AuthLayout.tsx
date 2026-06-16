import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language

  const handleLanguageChange = (next: 'es' | 'en') => {
    if (next !== language) {
      i18n.changeLanguage(next)
    }
  }

  return (
    <div className="grid min-h-screen bg-[color:var(--color-bg)] lg:grid-cols-[3fr_2fr]">
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-end">
            <fieldset className="lang-switch">
              <legend className="sr-only">
                {t('common.languageSwitcher.label')}
              </legend>
              <button
                className={`btn btn--ghost btn--sm${language === 'es' ? ' active' : ''}`}
                type="button"
                onClick={() => handleLanguageChange('es')}
                aria-pressed={language === 'es'}
              >
                ES
              </button>
              <button
                className={`btn btn--ghost btn--sm${language === 'en' ? ' active' : ''}`}
                type="button"
                onClick={() => handleLanguageChange('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
            </fieldset>
          </div>
          <div className="fade-slide-up" style={{ animationDelay: '40ms' }}>
            <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-primary)] text-white shadow-[0_10px_24px_-14px_rgba(14,74,80,0.8)]">
                <span className="font-mono text-lg">ICM</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  {t('auth.brand.name')}
                </p>
                <p className="text-sm font-semibold text-[color:var(--color-primary-dark)]">
                  {t('auth.brand.tagline')}
                </p>
              </div>
            </Link>
          </div>
          <div className="fade-slide-up" style={{ animationDelay: '120ms' }}>
            <h1 className="font-display text-4xl text-[color:var(--color-text)]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {subtitle}
            </p>
          </div>
          <div className="fade-slide-up" style={{ animationDelay: '200ms' }}>
            {children}
          </div>
        </div>
      </div>
      <aside className="auth-visual hidden items-center justify-center lg:flex">
        <div className="relative z-10 flex max-w-xs flex-col items-center text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 text-2xl font-semibold shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)]">
            ICM
          </div>
          <h2 className="mt-6 font-display text-3xl">
            {t('auth.panel.title')}
          </h2>
          <p className="mt-3 text-sm text-white/70">
            {t('auth.panel.subtitle')}
          </p>
        </div>
      </aside>
    </div>
  )
}

export default AuthLayout

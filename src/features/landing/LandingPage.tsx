import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  ArrowRight,
  Cpu,
  Hand,
  Mail,
  MapPin,
  Package,
  Phone,
  ScanLine,
  ShieldCheck,
  Table2,
  CheckCircle2,
  Thermometer,
  Zap,
} from 'lucide-react'

type CategoryItem = { name: string; description: string }
type BenefitItem = { title: string; description: string }

const categoryIcons = [Zap, Hand, Table2, Activity, Package, Cpu]
const benefitIcons = [ShieldCheck, ScanLine, CheckCircle2, Thermometer]

function LandingPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language

  const handleLanguageChange = (next: 'es' | 'en') => {
    if (next !== language) {
      i18n.changeLanguage(next)
    }
  }

  const categories = t('landing.categories.items', { returnObjects: true }) as CategoryItem[]
  const benefits = t('landing.benefits.items', { returnObjects: true }) as BenefitItem[]
  const checks = t('landing.quality.checks', { returnObjects: true }) as string[]

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-primary)] text-white">
              <span className="font-mono text-xs font-semibold">ICM</span>
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight text-[color:var(--color-primary-dark)]">
                {t('auth.brand.name')}
              </p>
              <p className="text-[10px] leading-tight text-[color:var(--color-text-muted)]">
                {t('auth.brand.tagline')}
              </p>
            </div>
          </Link>

          <nav className="landing-nav__links" aria-label={t('landing.nav.categories')}>
            <a href="#categorias" className="landing-nav__link">{t('landing.nav.categories')}</a>
            <a href="#beneficios" className="landing-nav__link">{t('landing.nav.benefits')}</a>
            <a href="#calidad" className="landing-nav__link">{t('landing.nav.quality')}</a>
            <a href="#contacto" className="landing-nav__link">{t('landing.nav.contact')}</a>
          </nav>

          <div className="landing-nav__actions">
            <fieldset className="lang-switch">
              <legend className="sr-only">{t('common.languageSwitcher.label')}</legend>
              <button
                type="button"
                className={`btn btn--ghost btn--sm${language === 'es' ? ' active' : ''}`}
                onClick={() => handleLanguageChange('es')}
                aria-pressed={language === 'es'}
              >
                ES
              </button>
              <button
                type="button"
                className={`btn btn--ghost btn--sm${language === 'en' ? ' active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
            </fieldset>
            <Link to="/login" className="btn btn--primary btn--sm" style={{ textDecoration: 'none' }}>
              {t('landing.nav.login')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" aria-label={t('common.main.ariaLabel')}>
        {/* Hero */}
        <section className="landing-section">
          <div className="landing-hero fade-slide-up">
            <div>
              <p className="landing-section__eyebrow">{t('landing.hero.eyebrow')}</p>
              <h1 className="font-display" style={{ fontSize: 44, lineHeight: 1.08, color: 'var(--ink)', margin: '0 0 16px' }}>
                {t('landing.hero.title')}
              </h1>
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-50)', maxWidth: 540 }}>
                {t('landing.hero.subtitle')}
              </p>

              <div className="landing-hero__actions">
                <Link to="/login" className="btn btn--primary btn--lg" style={{ textDecoration: 'none' }}>
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight />
                </Link>
                <a href="#categorias" className="btn btn--outline btn--lg">
                  {t('landing.hero.ctaTertiary')}
                </a>
              </div>

              <div className="metric-strip" style={{ marginTop: 36, marginBottom: 0, maxWidth: 540 }}>
                <div className="metric-cell metric-cell--light">
                  <p className="metric-cell__eyebrow">{t('landing.hero.stat1Label')}</p>
                  <p className="metric-cell__val" style={{ fontSize: 26 }}>{t('landing.hero.stat1Value')}</p>
                </div>
                <div className="metric-cell metric-cell--light">
                  <p className="metric-cell__eyebrow">{t('landing.hero.stat2Label')}</p>
                  <p className="metric-cell__val" style={{ fontSize: 26 }}>{t('landing.hero.stat2Value')}</p>
                </div>
                <div className="metric-cell metric-cell--light">
                  <p className="metric-cell__eyebrow">{t('landing.hero.stat3Label')}</p>
                  <p className="metric-cell__val" style={{ fontSize: 26 }}>{t('landing.hero.stat3Value')}</p>
                </div>
              </div>
            </div>

            <div className="auth-visual landing-hero__visual">
              <div className="relative z-10 flex max-w-xs flex-col items-center text-center text-white">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 text-2xl font-semibold shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)]">
                  ICM
                </div>
                <h2 className="mt-6 font-display text-3xl">{t('auth.panel.title')}</h2>
                <p className="mt-3 text-sm text-white/70">{t('auth.panel.subtitle')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categorias" className="landing-section landing-section--tight">
          <div className="landing-section__head">
            <p className="landing-section__eyebrow">{t('landing.categories.eyebrow')}</p>
            <h2 className="landing-section__title">{t('landing.categories.title')}</h2>
            <p className="landing-section__subtitle">{t('landing.categories.subtitle')}</p>
          </div>
          <div className="landing-categories-grid">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length]
              return (
                <div className="entity-card" key={category.name}>
                  <div className="entity-card__icon entity-card__icon--category">
                    <Icon />
                  </div>
                  <div className="entity-card__info">
                    <p className="entity-card__name">{category.name}</p>
                    <p className="entity-card__desc" style={{ whiteSpace: 'normal' }}>
                      {category.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Benefits */}
        <section id="beneficios" className="landing-section landing-section--tight">
          <div className="landing-section__head">
            <p className="landing-section__eyebrow">{t('landing.benefits.eyebrow')}</p>
            <h2 className="landing-section__title">{t('landing.benefits.title')}</h2>
            <p className="landing-section__subtitle">{t('landing.benefits.subtitle')}</p>
          </div>
          <div className="landing-benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefitIcons[index % benefitIcons.length]
              return (
                <div className="benefit-card" key={benefit.title}>
                  <div className="catalog-kpi__icon">
                    <Icon />
                  </div>
                  <p className="benefit-card__title">{benefit.title}</p>
                  <p className="benefit-card__desc">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quality */}
        <section id="calidad" className="landing-section landing-section--tight">
          <div className="landing-quality">
            <div>
              <p className="landing-section__eyebrow">{t('landing.quality.eyebrow')}</p>
              <h2 className="landing-section__title">{t('landing.quality.title')}</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-50)' }}>
                {t('landing.quality.description')}
              </p>
            </div>
            <ul className="landing-quality__checks">
              {checks.map((check) => (
                <li className="landing-quality__check" key={check}>
                  <CheckCircle2 size={18} />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-section landing-section--tight">
          <div className="landing-cta">
            <div>
              <p className="landing-cta__title">{t('landing.cta.title')}</p>
              <p className="landing-cta__subtitle">{t('landing.cta.subtitle')}</p>
            </div>
            <div className="landing-cta__actions">
              <Link to="/login" className="btn btn--primary btn--lg" style={{ textDecoration: 'none' }}>
                {t('landing.cta.primary')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer id="contacto" className="landing-footer">
        <div className="landing-footer__inner">
          <div>
            <div className="landing-footer__brand">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-primary)] text-white">
                <span className="font-mono text-xs font-semibold">ICM</span>
              </div>
              <p className="text-sm font-semibold text-[color:var(--color-primary-dark)]">
                {t('auth.brand.name')}
              </p>
            </div>
            <p className="landing-footer__desc">{t('landing.footer.description')}</p>
          </div>

          <div>
            <p className="landing-footer__heading">{t('landing.footer.companyHeading')}</p>
            <ul className="landing-footer__links">
              <li><a href="#categorias">{t('landing.nav.categories')}</a></li>
              <li><a href="#beneficios">{t('landing.nav.benefits')}</a></li>
              <li><a href="#calidad">{t('landing.nav.quality')}</a></li>
            </ul>
          </div>

          <div>
            <p className="landing-footer__heading">{t('landing.footer.contactHeading')}</p>
            {/* TODO: reemplazar con los datos reales de la empresa una vez se definan canales públicos de contacto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="landing-footer__contact">
                <Phone size={14} />
                {t('landing.footer.contactPhone')}
              </span>
              <span className="landing-footer__contact">
                <Mail size={14} />
                {t('landing.footer.contactEmail')}
              </span>
              <span className="landing-footer__contact">
                <MapPin size={14} />
                {t('landing.footer.contactAddress')}
              </span>
            </div>
          </div>
        </div>
        <div className="landing-footer__bottom">
          {t('auth.brand.name')} © {new Date().getFullYear()}. {t('landing.footer.rights')}
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

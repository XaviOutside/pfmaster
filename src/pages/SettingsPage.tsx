import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/components/atoms/Input';
import Select, { type SelectOption } from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import { getSettings, updateSettings, uploadLogo, HttpError } from '@/services/settings';
import type { CompanySettings, Lang } from '@/types/settings';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Day numbers 1–7 mapped to locale key suffixes. */
const DAYS: { value: number; key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' }[] = [
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
  { value: 7, key: 'sun' },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { t } = useTranslation('settings');

  /* ---- form state ---- */
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [workdays, setWorkdays] = useState<number[]>([]);
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [defaultLang, setDefaultLang] = useState<Lang>(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ---- UI state ---- */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /* ---- load on mount ---- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data: CompanySettings = await getSettings();
        if (cancelled) return;
        setCompanyName(data.companyName);
        setTagline(data.tagline ?? '');
        setWorkdays(data.workdays);
        setWorkStartTime(data.workStartTime);
        setWorkEndTime(data.workEndTime);
        setDefaultLang(data.defaultLang);
        setLogoUrl(data.logoUrl);
      } catch {
        if (cancelled) return;
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- toggle workday chip ---- */
  function toggleDay(day: number) {
    setWorkdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
    // Clear workday validation error on change
    if (validationErrors.workdays) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.workdays;
        return next;
      });
    }
  }

  /* ---- client-side validation ---- */
  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) {
      errors.companyName = t('companyNameRequired');
    }

    if (workdays.length === 0) {
      errors.workdays = t('workdaysRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ---- submit ---- */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!validate()) return;

    setSaving(true);
    try {
      await updateSettings({
        companyName: companyName.trim(),
        tagline: tagline.trim() || null,
        workdays,
        workStartTime,
        workEndTime,
        defaultLang,
      });

      // Upload logo if a new file was selected
      if (logoFile) {
        const updated = await uploadLogo(logoFile);
        setLogoUrl(updated.logoUrl);
        setLogoFile(null);
      }
      setFeedback({ type: 'success', message: t('saveSuccess') });
    } catch (err) {
      if (err instanceof HttpError && err.fieldErrors) {
        setValidationErrors(err.fieldErrors);
      }
      setFeedback({ type: 'error', message: t('saveError') });
    } finally {
      setSaving(false);
    }
  }

  /* ---- lang select options ---- */
  const langOptions: SelectOption[] = [
    { value: '0', label: t('languageEnglish') },
    { value: '1', label: t('languageSpanish') },
  ];

  /* ---- render: loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="settings-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  /* ---- render: load error ---- */
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16" data-testid="settings-error">
        <p className="text-body-lg text-error">{t('loadError')}</p>
      </div>
    );
  }

  /* ---- render: form ---- */
  const renderLogoPreview = () => {
    if (logoFile) {
      return (
        <img
          src={URL.createObjectURL(logoFile)}
          alt="Logo preview"
          className="h-full w-full object-contain"
        />
      );
    }
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt="Company logo"
          className="h-full w-full object-contain"
        />
      );
    }
    return (
      <span className="text-on-surface-variant/40 material-symbols-outlined text-2xl">
        image
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-2xl" data-testid="settings-page">
      <h1 className="mb-8 font-headline text-headline-lg text-on-surface">{t('title')}</h1>

      {/* Feedback banner */}
      {feedback && (
        <div
          role="alert"
          data-testid="settings-feedback"
          className={`mb-6 rounded-lg px-4 py-3 font-label text-label-md ${
            feedback.type === 'success'
              ? 'bg-status-success/10 text-status-success'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Section 1 — Company branding */}
        <section className="space-y-4">
          <Input
            label={t('companyName')}
            placeholder={t('companyNamePlaceholder')}
            maxLength={200}
            required
            value={companyName}
            error={validationErrors.companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (validationErrors.companyName) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.companyName;
                  return next;
                });
              }
            }}
            data-testid="settings-company-name"
          />

          <Input
            label={t('tagline')}
            placeholder={t('taglinePlaceholder')}
            maxLength={100}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            data-testid="settings-tagline"
          />

          {/* Logo upload */}
          <div>
            <p className="mb-2 font-label text-label-md text-on-surface-variant">{t('logo')}</p>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
                {renderLogoPreview()}
              </div>
              <div className="flex flex-col gap-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoFile(file);
                  }}
                  data-testid="settings-logo-input"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoFile || logoUrl ? t('changeLogo') : t('uploadLogo')}
                </Button>
                {(logoFile || logoUrl) && (
                  <button
                    type="button"
                    className="text-label-sm text-on-surface-variant hover:text-error"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoUrl(null);
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                  >
                    {t('removeLogo')}
                  </button>
                )}
                <p className="text-label-xs text-on-surface-variant/60">{t('logoHint')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Workdays toggle chips */}
        <section>
          <fieldset>
            <legend className="mb-2 font-label text-label-md text-on-surface-variant">
              {t('workdays')}
              <span className="ml-1 text-error" aria-hidden="true">*</span>
            </legend>
            <div className="flex flex-wrap gap-2" data-testid="settings-workdays">
              {DAYS.map((day) => {
                const selected = workdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleDay(day.value)}
                    data-testid={`settings-workday-${day.key}`}
                    className={`rounded-full px-4 py-1.5 font-label text-label-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      selected
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'border border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {t(`days.${day.key}`)}
                  </button>
                );
              })}
            </div>
            {validationErrors.workdays && (
              <p className="mt-1 text-label-sm text-error" role="alert">
                {validationErrors.workdays}
              </p>
            )}
          </fieldset>
        </section>

        {/* Section 3 — Timetable */}
        <section>
          <h2 className="mb-3 font-label text-label-md text-on-surface-variant">
            {t('timetable')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label={t('startTime')}
              value={workStartTime}
              onChange={(e) => setWorkStartTime(e.target.value)}
              data-testid="settings-start-time"
            />
            <Input
              type="time"
              label={t('endTime')}
              value={workEndTime}
              onChange={(e) => setWorkEndTime(e.target.value)}
              data-testid="settings-end-time"
            />
          </div>
        </section>

        {/* Section 4 — Default language */}
        <section>
          <Select
            label={t('defaultLanguage')}
            options={langOptions}
            value={String(defaultLang)}
            onChange={(e) => setDefaultLang(Number(e.target.value) as Lang)}
            data-testid="settings-default-lang"
          />
        </section>

        {/* Save button */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            data-testid="settings-save"
          >
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

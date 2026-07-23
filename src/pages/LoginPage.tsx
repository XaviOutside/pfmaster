import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { http, HttpError } from '@/services/http';
import { validateRequired, validateEmail, validateLength, type FieldErrors } from '@/utils/validation';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

interface LoginFormData {
  email: string;
  password: string;
}

function validateLoginForm(data: LoginFormData): FieldErrors {
  const errors: FieldErrors = {};

  const emailErr = validateRequired(data.email, 'Email');
  if (emailErr) {
    errors.email = emailErr;
  } else {
    const formatErr = validateEmail(data.email);
    if (formatErr) errors.email = formatErr;
  }

  const pwErr = validateRequired(data.password, 'Password');
  if (pwErr) {
    errors.password = pwErr;
  } else {
    const lengthErr = validateLength(data.password, 'Password', MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH);
    if (lengthErr) errors.password = lengthErr;
  }

  return errors;
}

export default function LoginPage() {
  const { t } = useTranslation('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function clearErrors() {
    setServerError('');
    setFieldErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearErrors();

    const errors = validateLoginForm({ email, password });
    if (Object.values(errors).some((msg) => msg !== '')) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const data = await http<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Force API mode — ensures data goes through the backend even if the user
      // previously clicked "Try Demo" which set pf_demo:mode to 'demo'.
      localStorage.setItem('pf_demo:mode', 'api');

      // Redirect to clients page
      window.location.href = '/clients';
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 401) {
        setServerError(t('error.invalidCredentials'));
      } else {
        setServerError(t('error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-variant bg-surface-bright p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-headline-lg text-on-surface">
            {t('title')}
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-error bg-error-container/20 px-4 py-3 text-label-md text-on-error-container"
            >
              {serverError}
            </div>
          )}

          <Input
            label={t('email.label')}
            id="login-email"
            type="email"
            placeholder={t('email.placeholder')}
            value={email}
            error={fieldErrors.email ?? undefined}
            required
            autoComplete="email"
            onChange={(e) => {
              setEmail(e.target.value);
              if (serverError) setServerError('');
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
          />

          <Input
            label={t('password.label')}
            id="login-password"
            type="password"
            placeholder={t('password.placeholder')}
            value={password}
            error={fieldErrors.password ?? undefined}
            required
            autoComplete="current-password"
            onChange={(e) => {
              setPassword(e.target.value);
              if (serverError) setServerError('');
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

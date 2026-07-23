import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

// i18n mock is already set up globally in test-setup.ts — returns key as value

const originalLocation = window.location;

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock window.location.href
    let hrefValue = '';
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        get href() {
          return hrefValue;
        },
        set href(v: string) {
          hrefValue = v;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
  }

  it('renders login form with email and password fields', () => {
    renderPage();

    expect(screen.getByPlaceholderText('email.placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('password.placeholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument();
  });

  it('uses type="password" on the password field', () => {
    renderPage();

    const passwordInput = screen.getByPlaceholderText('password.placeholder');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'submit' }));

    // At least one validation.required error appears (email and password)
    await waitFor(() => {
      const errors = screen.getAllByText(/validation\.required/);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'not-an-email');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText('validation.email')).toBeInTheDocument();
    });
  });

  it('shows validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'short');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText(/validation\.length/)).toBeInTheDocument();
    });
  });

  it('submits form and stores token + redirects on success', async () => {
    const user = userEvent.setup();

    const mockFetch = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'test-jwt-token-abc123',
        user: { id: 1, email: 'admin@test.com', role: 'admin' },
      }),
    } as Response);

    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('/api/v1/auth/login');

    const fetchOptions = fetchCall[1] as RequestInit;
    expect(fetchOptions.method).toBe('POST');

    const body = JSON.parse(fetchOptions.body as string);
    expect(body.email).toBe('admin@test.com');
    expect(body.password).toBe('password123');

    // Verify token and user stored in localStorage (real, not spied)
    expect(localStorage.getItem('token')).toBe('test-jwt-token-abc123');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual({
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
    });
    expect(window.location.href).toBe('/clients');
    // Login must force API mode — even if user previously chose demo
    expect(localStorage.getItem('pf_demo:mode')).toBe('api');
  });

  it('shows inline error on 401 response', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Invalid email or password',
        statusCode: 401,
      }),
    } as Response);

    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'wrongpass123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText('error.invalidCredentials')).toBeInTheDocument();
    });
  });

  it('disables button and shows loading state while submitting', async () => {
    const user = userEvent.setup();

    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(window, 'fetch').mockReturnValue(fetchPromise);

    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    // While loading, button shows "submitting" and is disabled
    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'submitting' });
      expect(button).toBeDisabled();
    });

    // Resolve the fetch
    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'token',
        user: { id: 1, email: 'admin@test.com', role: 'admin' },
      }),
    } as Response);
  });

  it('shows generic error on non-401 server error', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Internal server error',
        statusCode: 500,
      }),
    } as Response);

    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'password123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText('error.generic')).toBeInTheDocument();
    });
  });

  it('clears error when user starts typing again', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Invalid credentials',
        statusCode: 401,
      }),
    } as Response);

    renderPage();

    await user.type(screen.getByPlaceholderText('email.placeholder'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('password.placeholder'), 'wrongpass123');
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText('error.invalidCredentials')).toBeInTheDocument();
    });

    // User starts typing — error should clear
    await user.clear(screen.getByPlaceholderText('email.placeholder'));
    await user.type(screen.getByPlaceholderText('email.placeholder'), 'a');

    await waitFor(() => {
      expect(screen.queryByText('error.invalidCredentials')).not.toBeInTheDocument();
    });
  });
});

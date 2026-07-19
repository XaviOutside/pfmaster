import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '@/pages/SettingsPage';
import * as settingsService from '@/services/settings';
import { HttpError } from '@/services/http';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock('@/services/settings', async () => {
  const actual = await vi.importActual<typeof import('@/services/settings')>('@/services/settings');
  return {
    ...actual,
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  };
});

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const mockSettings = {
  id: 1,
  companyName: 'Bark & Bubbles',
  tagline: null as string | null,
  logoUrl: null as string | null,
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '17:00',
  defaultLang: 0 as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsService.getSettings).mockResolvedValue(mockSettings);
  });

  /* ---- Load on mount ---- */

  it('shows loading spinner while fetching settings', () => {
    // Don't resolve the promise yet — keep it pending
    vi.mocked(settingsService.getSettings).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
  });

  it('displays form pre-populated with API data after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
  });

  it('shows error state when settings fetch fails', async () => {
    vi.mocked(settingsService.getSettings).mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('settings-error')).toBeInTheDocument();
    });
  });

  /* ---- Client-side validation ---- */

  it('shows validation error and blocks API call when company name is empty', async () => {
    vi.mocked(settingsService.updateSettings).mockResolvedValue(mockSettings);
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    // Clear the company name
    const input = screen.getByDisplayValue('Bark & Bubbles');
    fireEvent.change(input, { target: { value: '' } });

    // Submit
    fireEvent.click(screen.getByTestId('settings-save'));

    await waitFor(() => {
      expect(screen.getByText('companyNameRequired')).toBeInTheDocument();
    });

    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('shows validation error when no workdays are selected', async () => {
    vi.mocked(settingsService.getSettings).mockResolvedValue({
      ...mockSettings,
      workdays: [],
    });
    vi.mocked(settingsService.updateSettings).mockResolvedValue(mockSettings);
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('settings-save'));

    await waitFor(() => {
      expect(screen.getByText('workdaysRequired')).toBeInTheDocument();
    });

    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  /* ---- Successful submit ---- */

  it('submits valid form and shows success message', async () => {
    const updated = { ...mockSettings, companyName: 'Paws Palace' };
    vi.mocked(settingsService.updateSettings).mockResolvedValue(updated);
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    // Change name
    const input = screen.getByDisplayValue('Bark & Bubbles');
    fireEvent.change(input, { target: { value: 'Paws Palace' } });

    fireEvent.click(screen.getByTestId('settings-save'));

    await waitFor(() => {
      expect(screen.getByText('saveSuccess')).toBeInTheDocument();
    });

    expect(settingsService.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Paws Palace' }),
    );
  });

  /* ---- Error handling ---- */

  it('shows error message when update API returns 422', async () => {
    vi.mocked(settingsService.updateSettings).mockRejectedValue(
      new HttpError(422, 'Validation failed', {
        workStartTime: 'workStartTime must be in HH:MM format',
      }),
    );
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('settings-save'));

    await waitFor(() => {
      expect(screen.getByText('saveError')).toBeInTheDocument();
    });
  });

  /* ---- Workday toggles ---- */

  it('toggles workday chip on click', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bark & Bubbles')).toBeInTheDocument();
    });

    // Mon should be checked (day 1 is in mock)
    const monChip = screen.getByTestId('settings-workday-mon');
    expect(monChip).toHaveAttribute('aria-checked', 'true');

    // Click to deselect
    fireEvent.click(monChip);
    expect(monChip).toHaveAttribute('aria-checked', 'false');

    // Click to re-select
    fireEvent.click(monChip);
    expect(monChip).toHaveAttribute('aria-checked', 'true');
  });
});

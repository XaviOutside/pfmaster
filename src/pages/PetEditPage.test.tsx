import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PetEditPage from './PetEditPage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const existingPet = {
  id: 1, clientId: 10, name: 'Max', species: 'Dog', breed: 'Golden Retriever',
  sex: 'male' as const, dateOfBirth: '2020-03-15T00:00:00.000Z', weightKg: 32.5,
  notes: 'Friendly', status: 'active' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockClients = [
  { id: 10, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 (555) 111-1111', phone2: null, address: null, status: 'active' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 20, name: 'Bob Smith', email: 'bob@example.com', phone: '+1 (555) 222-2222', phone2: null, address: null, status: 'active' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

const { mockGetPet, mockListClients, mockUpdatePet } = vi.hoisted(() => ({
  mockGetPet: vi.fn(),
  mockListClients: vi.fn(),
  mockUpdatePet: vi.fn(),
}));

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => ({
    getPet: mockGetPet,
    listClients: mockListClients,
    updatePet: mockUpdatePet,
  }),
}));

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/pets/${id}/edit`]}>
      <Routes>
        <Route path="/pets/:id/edit" element={<PetEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  // Persistent mocks for all tests
  mockGetPet.mockResolvedValue(existingPet);
  mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });
});

describe('PetEditPage', () => {
  it('shows loading state while fetching data', () => {
    mockGetPet.mockReset();
    mockGetPet.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders form with pre-filled pet data and client options', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Max')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Dog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Golden Retriever')).toBeInTheDocument();
    // Client select shows selected owner name (options load asynchronously)
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('submits updated form and navigates to pet detail', async () => {
    const user = userEvent.setup();
    mockUpdatePet.mockResolvedValue({ ...existingPet, name: 'Maximus' });

    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Max')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Max');
    await user.clear(nameInput);
    await user.type(nameInput, 'Maximus');

    await user.click(screen.getByRole('button', { name: /form.submit.update/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets/1');
    });
  });

  it('shows field-level validation errors on error', async () => {
    const user = userEvent.setup();
    const err = new Error('Validation failed');
    (err as any).fieldErrors = { name: 'Name is required' };
    (err as any).statusCode = 422;
    mockUpdatePet.mockRejectedValue(err);

    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Max')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Max');
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed');

    await user.click(screen.getByRole('button', { name: /form.submit.update/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('has a Back button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Max')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /common:actions.backToList/i })).toBeInTheDocument();
  });

  it('shows generic error on server failure', async () => {
    const user = userEvent.setup();
    mockUpdatePet.mockRejectedValue(new Error('Internal server error'));

    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Max')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Max');
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed');

    await user.click(screen.getByRole('button', { name: /form.submit.update/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });
});

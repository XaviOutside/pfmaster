import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PetDetailPage from './PetDetailPage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const activePet = {
  id: 1, clientId: 10, name: 'Max', species: 'Dog', breed: 'Golden Retriever',
  sex: 'male' as const, dateOfBirth: '2020-03-15T00:00:00.000Z', weightKg: 32.5,
  notes: 'Friendly', status: 'active' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

const { mockGetPet, mockListServices } = vi.hoisted(() => ({
  mockGetPet: vi.fn(),
  mockListServices: vi.fn(),
}));

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => ({
    getPet: mockGetPet,
    listServices: mockListServices,
  }),
}));

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/pets/${id}`]}>
      <Routes>
        <Route path="/pets/:id" element={<PetDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mockListServices.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
});

describe('PetDetailPage', () => {
  it('shows loading spinner initially', () => {
    mockGetPet.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders pet detail after loading', async () => {
    mockGetPet.mockResolvedValue(activePet);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByText('Dog — Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('pets.sex.male')).toBeInTheDocument();
    expect(screen.getByText('pets.detail.weightUnit')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockGetPet.mockRejectedValue(new Error('Pet not found'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('detail.notFound')).toBeInTheDocument();
    });
  });

  it('has edit and deactivate buttons', async () => {
    mockGetPet.mockResolvedValue(activePet);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'actions.edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate|delete/i })).toBeInTheDocument();
  });

  it('has a Back button', async () => {
    mockGetPet.mockResolvedValue(activePet);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    // Success-path back button is rendered by PetDetailCard (common namespace key)
    expect(screen.getByRole('button', { name: 'actions.backToList' })).toBeInTheDocument();
  });
});

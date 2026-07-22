import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PetCreatePage from './PetCreatePage';

afterEach(cleanup);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClients = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 (555) 111-1111', phone2: null, address: null, status: 'active' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '+1 (555) 222-2222', phone2: null, address: null, status: 'active' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: 'Inactive Owner', email: 'inactive@example.com', phone: '+1 (555) 333-3333', phone2: null, address: null, status: 'inactive' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

const createdPet = {
  id: 42, clientId: 1, name: 'Max', species: 'Dog', breed: 'Golden Retriever',
  sex: 'male' as const, dateOfBirth: '2020-03-15T00:00:00.000Z', weightKg: 32.5,
  notes: 'Friendly', status: 'active' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

const { mockListClients, mockCreatePet } = vi.hoisted(() => ({
  mockListClients: vi.fn(),
  mockCreatePet: vi.fn(),
}));

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => ({
    listClients: mockListClients,
    createPet: mockCreatePet,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <PetCreatePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
});

describe('PetCreatePage', () => {
  it('shows loading state while fetching clients', () => {
    mockListClients.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders form with client options after loading', async () => {
    mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('form.placeholder.species')).toBeInTheDocument();
    expect(screen.getByLabelText('form.label.client')).toBeInTheDocument();

    const clientSelect = screen.getByLabelText('form.label.client') as HTMLSelectElement;
    expect(clientSelect.options).toHaveLength(2);
    expect(clientSelect.options[0].textContent).toBe('Alice Johnson');
    expect(clientSelect.options[1].textContent).toBe('Bob Smith');
  });

  it('submits form successfully and navigates to pet detail', async () => {
    const user = userEvent.setup();
    mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });
    mockCreatePet.mockResolvedValue(createdPet);

    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument(); });

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Max');
    await user.type(screen.getByPlaceholderText('form.placeholder.species'), 'Dog');
    await user.type(screen.getByPlaceholderText('form.placeholder.breed'), 'Golden Retriever');
    await user.selectOptions(screen.getByLabelText('form.label.client'), '1');

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pets/42');
    });
  });

  it('shows field-level validation errors on error', async () => {
    const user = userEvent.setup();
    mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });
    const err = new Error('Validation failed');
    (err as any).fieldErrors = { name: 'A pet with this name already exists' };
    (err as any).statusCode = 422;
    mockCreatePet.mockRejectedValue(err);

    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument(); });

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Max');
    await user.type(screen.getByPlaceholderText('form.placeholder.species'), 'Dog');
    await user.type(screen.getByPlaceholderText('form.placeholder.breed'), 'Golden Retriever');
    await user.selectOptions(screen.getByLabelText('form.label.client'), '1');

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

    await waitFor(() => {
      expect(screen.getByText('A pet with this name already exists')).toBeInTheDocument();
    });
  });

  it('shows general error on server failure', async () => {
    const user = userEvent.setup();
    mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });
    mockCreatePet.mockRejectedValue(new Error('Internal server error'));

    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument(); });

    await user.type(screen.getByPlaceholderText('form.placeholder.name'), 'Max');
    await user.type(screen.getByPlaceholderText('form.placeholder.species'), 'Dog');
    await user.type(screen.getByPlaceholderText('form.placeholder.breed'), 'Golden Retriever');
    await user.selectOptions(screen.getByLabelText('form.label.client'), '1');

    await user.click(screen.getByRole('button', { name: /form.submit.create/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('has a Back button that navigates to /pets', async () => {
    mockListClients.mockResolvedValue({ data: mockClients, meta: { total: 2, page: 1, limit: 200, totalPages: 1 } });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => { expect(screen.getByPlaceholderText('form.placeholder.name')).toBeInTheDocument(); });
    await user.click(screen.getByRole('button', { name: /common:actions.backToList/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/pets');
  });
});

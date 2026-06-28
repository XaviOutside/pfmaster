import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PetForm from './PetForm';
import type { SelectOption } from '@/components/atoms/Select';

afterEach(cleanup);

const mockClientOptions: SelectOption[] = [
  { value: '10', label: 'Alice Johnson' },
  { value: '20', label: 'Bob Smith' },
];

describe('PetForm', () => {
  it('renders all fields', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    expect(screen.getByPlaceholderText('Pet name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Dog, Cat, Bird')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Golden Retriever, Siamese')).toBeInTheDocument();
    expect(screen.getByLabelText('Sex')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 12.5')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Medical notes, allergies, etc.')).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
  });

  it('renders sex options including Unknown', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const sexSelect = screen.getByLabelText('Sex') as HTMLSelectElement;
    const options = Array.from(sexSelect.options).map((o) => o.textContent);
    expect(options).toContain('Unknown');
    expect(options).toContain('Male');
    expect(options).toContain('Female');
  });

  it('renders client options from clientOptions prop', () => {
    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const clientSelect = screen.getByLabelText('Client') as HTMLSelectElement;
    const options = Array.from(clientSelect.options).map((o) => o.textContent);
    expect(options).toContain('Alice Johnson');
    expect(options).toContain('Bob Smith');
  });

  it('shows validation errors on submit with empty data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PetForm onSubmit={onSubmit} clientOptions={mockClientOptions} />,
    );

    const submitBtn = screen.getByRole('button', { name: /create pet/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Species is required')).toBeInTheDocument();
      expect(screen.getByText('Breed is required')).toBeInTheDocument();
      expect(screen.getByText('Client is required')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <PetForm onSubmit={onSubmit} clientOptions={mockClientOptions} />,
    );

    await user.type(screen.getByPlaceholderText('Pet name'), 'Buddy');
    await user.type(screen.getByPlaceholderText('e.g. Dog, Cat, Bird'), 'Dog');
    await user.type(screen.getByPlaceholderText('e.g. Golden Retriever, Siamese'), 'Labrador');
    await user.selectOptions(screen.getByLabelText('Sex'), 'male');
    await user.type(screen.getByPlaceholderText('e.g. 12.5'), '25.0');
    await user.type(screen.getByPlaceholderText('Medical notes, allergies, etc.'), 'Very friendly');
    await user.selectOptions(screen.getByLabelText('Client'), '10');

    const submitBtn = screen.getByRole('button', { name: /create pet/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Buddy',
        species: 'Dog',
        breed: 'Labrador',
        sex: 'male',
        dateOfBirth: '',
        weightKg: '25',
        notes: 'Very friendly',
        clientId: '10',
      });
    });
  });

  it('displays server errors', () => {
    const serverErrors = { name: 'Name already taken' };

    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        serverErrors={serverErrors}
      />,
    );

    expect(screen.getByText('Name already taken')).toBeInTheDocument();
  });

  it('pre-populates fields with initialData', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        initialData={{
          name: 'Luna',
          species: 'Cat',
          breed: 'Siamese',
          sex: 'female',
          weightKg: '4.5',
          clientId: '20',
        }}
      />,
    );

    expect(screen.getByPlaceholderText('Pet name')).toHaveValue('Luna');
    expect(screen.getByPlaceholderText('e.g. Dog, Cat, Bird')).toHaveValue('Cat');
    expect(screen.getByPlaceholderText('e.g. Golden Retriever, Siamese')).toHaveValue('Siamese');
    expect(screen.getByPlaceholderText('e.g. 12.5')).toHaveValue(4.5);
    expect(screen.getByLabelText('Client')).toHaveValue('20');
    expect(screen.getByLabelText('Sex')).toHaveValue('female');
  });

  it('shows loading state on submit button', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        isLoading={true}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /create pet/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows Update Pet button when initialData is provided', () => {
    render(
      <PetForm
        onSubmit={vi.fn()}
        clientOptions={mockClientOptions}
        initialData={{ name: 'Buddy' }}
      />,
    );

    expect(screen.getByRole('button', { name: /update pet/i })).toBeInTheDocument();
  });

  it('validates field on blur after being touched', async () => {
    const user = userEvent.setup();

    render(
      <PetForm onSubmit={vi.fn()} clientOptions={mockClientOptions} />,
    );

    const nameInput = screen.getByPlaceholderText('Pet name');
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });
});

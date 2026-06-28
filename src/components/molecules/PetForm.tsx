import { useState, type FormEvent } from 'react';
import Input from '@/components/atoms/Input';
import Select, { type SelectOption } from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import { validatePetForm, isValid } from '@/utils/validation';
import type { FieldErrors, PetFormData } from '@/utils/validation';

export type { PetFormData } from '@/utils/validation';

export interface PetFormProps {
  initialData?: Partial<PetFormData>;
  onSubmit: (data: PetFormData) => Promise<void>;
  isLoading?: boolean;
  serverErrors?: FieldErrors | null;
  clientOptions: SelectOption[];
}

const emptyForm: PetFormData = {
  name: '',
  species: '',
  breed: '',
  sex: 'unknown',
  dateOfBirth: '',
  weightKg: '',
  notes: '',
  clientId: '',
};

const sexOptions: SelectOption[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function PetForm({
  initialData,
  onSubmit,
  isLoading = false,
  serverErrors = null,
  clientOptions,
}: PetFormProps) {
  const [formData, setFormData] = useState<PetFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  function handleChange(field: keyof PetFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched.has(field)) {
      const errors = validatePetForm({ ...formData, [field]: value });
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errors[field] ?? '',
      }));
    }
  }

  function handleBlur(field: keyof PetFormData) {
    setTouched((prev) => new Set(prev).add(field));
    const errors = validatePetForm(formData);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: errors[field] ?? '',
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validatePetForm(formData);
    setFieldErrors(errors);
    setTouched(
      new Set([
        'name',
        'species',
        'breed',
        'sex',
        'dateOfBirth',
        'weightKg',
        'notes',
        'clientId',
      ]),
    );

    if (!isValid(errors)) return;

    await onSubmit(formData);
  }

  function getFieldError(field: string): string | undefined {
    if (serverErrors?.[field]) return serverErrors[field];
    if (fieldErrors[field]) return fieldErrors[field];
    return undefined;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={getFieldError('name')}
        required
        placeholder="Pet name"
      />

      <Input
        label="Species"
        value={formData.species}
        onChange={(e) => handleChange('species', e.target.value)}
        onBlur={() => handleBlur('species')}
        error={getFieldError('species')}
        required
        placeholder="e.g. Dog, Cat, Bird"
      />

      <Input
        label="Breed"
        value={formData.breed}
        onChange={(e) => handleChange('breed', e.target.value)}
        onBlur={() => handleBlur('breed')}
        error={getFieldError('breed')}
        required
        placeholder="e.g. Golden Retriever, Siamese"
      />

      <Select
        label="Sex"
        options={sexOptions}
        value={formData.sex}
        onChange={(e) => handleChange('sex', e.target.value)}
        onBlur={() => handleBlur('sex')}
        error={getFieldError('sex')}
      />

      <Input
        label="Date of Birth"
        type="date"
        value={formData.dateOfBirth}
        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
        onBlur={() => handleBlur('dateOfBirth')}
        error={getFieldError('dateOfBirth')}
      />

      <Input
        label="Weight (kg)"
        type="number"
        value={formData.weightKg}
        onChange={(e) => handleChange('weightKg', e.target.value)}
        onBlur={() => handleBlur('weightKg')}
        error={getFieldError('weightKg')}
        placeholder="e.g. 12.5"
        step="0.1"
        min="0"
      />

      <Input
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        onBlur={() => handleBlur('notes')}
        error={getFieldError('notes')}
        placeholder="Medical notes, allergies, etc."
      />

      <Select
        label="Client"
        options={clientOptions}
        value={formData.clientId}
        onChange={(e) => handleChange('clientId', e.target.value)}
        onBlur={() => handleBlur('clientId')}
        error={getFieldError('clientId')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Update Pet' : 'Create Pet'}
        </Button>
      </div>
    </form>
  );
}

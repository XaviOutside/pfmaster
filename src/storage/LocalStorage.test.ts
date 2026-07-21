import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { LocalStorage } from '@/storage/LocalStorage';
import type { Client, CreateClientDto } from '@/types/client';
import type { Pet, CreatePetInput } from '@/types/pet';
import type { Service, CreateServiceInput } from '@/types/service';
import type { Appointment, CreateAppointmentDto, AppointmentStatus } from '@/types/appointment';
import type { CompanySettings, Lang } from '@/types/settings';

/* --------------------------------------------------------------------------
 * In-memory localStorage — same pattern as useStorageMode.test.ts
 * Node.js 23+ shadows jsdom's window.localStorage with an undefined global,
 * so we create our own and stub it globally.
 * -------------------------------------------------------------------------- */

function createMemoryStorage(): Storage {
  let store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store = new Map(); },
    get length() { return store.size; },
    key: (index: number) => {
      const keys = [...store.keys()];
      return keys[index] ?? null;
    },
  };
}

/* --------------------------------------------------------------------------
 * Helpers to seed localStorage directly (bypass the class for test setup)
 * -------------------------------------------------------------------------- */

function setRaw(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRaw<T>(key: string): T {
  return JSON.parse(localStorage.getItem(key) ?? 'null');
}

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    phone: '555-0100',
    phone2: null,
    address: null,
    status: 'active',
    lastServiceDate: null,
    notes: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 1,
    clientId: 1,
    name: 'Max',
    species: 'Dog',
    breed: 'Labrador',
    sex: 'male',
    dateOfBirth: null,
    weightKg: null,
    notes: null,
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 1,
    name: 'Haircut',
    description: 'Full body haircut',
    durationMinutes: 30,
    price: 50,
    petId: null,
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    petId: 1,
    petName: 'Max',
    clientId: 1,
    clientName: 'Alice',
    scheduledAt: '2025-06-15T10:00:00.000Z',
    status: 0 as AppointmentStatus,
    notes: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSettings(overrides: Partial<CompanySettings> = {}): CompanySettings {
  return {
    id: 1,
    companyName: 'Happy Paws',
    tagline: null,
    workdays: [1, 2, 3, 4, 5],
    workStartTime: '09:00',
    workEndTime: '17:00',
    defaultLang: 0 as Lang,
    logoUrl: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/* ==========================================================================
 * TESTS
 * ========================================================================== */

describe('LocalStorage', () => {
  let memStorage: Storage;
  let storage: LocalStorage;

  beforeAll(() => {
    memStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memStorage);
  });

  beforeEach(() => {
    memStorage.clear();
    // Seed nextIds to zero so IDs start at 1
    setRaw('pf_demo:nextIds', { clients: 0, pets: 0, services: 0, appointments: 0 });
    storage = new LocalStorage();
  });

  /* ========================================================================
   * CLIENTS — 8 methods
   * ======================================================================== */

  describe('clients — createClient', () => {
    it('persists a client to localStorage with auto-increment ID', async () => {
      const dto: CreateClientDto = { name: 'Alice', email: 'a@b.com', phone: '123' };
      const client = await storage.createClient(dto);

      expect(client.id).toBe(1);
      expect(client.name).toBe('Alice');

      // Verify persistence
      const raw = getRaw<Client[]>('pf_demo:clients');
      expect(raw).toHaveLength(1);
      expect(raw[0].id).toBe(1);
    });

    it('increments nextIds after each create', async () => {
      await storage.createClient({ name: 'A', email: 'a@a.com', phone: '1' });
      await storage.createClient({ name: 'B', email: 'b@b.com', phone: '2' });

      const raw = getRaw<Client[]>('pf_demo:clients');
      expect(raw).toHaveLength(2);
      expect(raw[0].id).toBe(1);
      expect(raw[1].id).toBe(2);

      const ids = getRaw<{ clients: number }>('pf_demo:nextIds');
      expect(ids.clients).toBe(2);
    });

    it('populates createdAt and updatedAt timestamps', async () => {
      const before = new Date().toISOString();
      const client = await storage.createClient({ name: 'A', email: 'a@a.com', phone: '1' });

      expect(client.createdAt).toBeTruthy();
      expect(client.updatedAt).toBeTruthy();
      // Timestamps should be after the 'before' check
      expect(client.createdAt >= before).toBe(true);
    });

    it('assigns status=active and defaults null fields', async () => {
      const client = await storage.createClient({ name: 'A', email: 'a@a.com', phone: '1' });

      expect(client.status).toBe('active');
      expect(client.lastServiceDate).toBeNull();
      expect(client.notes).toBeNull();
    });
  });

  describe('clients — listClients', () => {
    it('returns empty paginated response when no clients exist', async () => {
      const result = await storage.listClients();

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
    });

    it('returns all active clients sorted by id', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'First', email: 'f@test.com' }),
        makeClient({ id: 2, name: 'Second', email: 's@test.com' }),
      ]);

      const result = await storage.listClients();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('First');
      expect(result.data[1].name).toBe('Second');
      expect(result.meta.total).toBe(2);
    });

    it('excludes soft-deleted clients from list', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Active', email: 'a@test.com' }),
        makeClient({ id: 2, name: 'Deleted', email: 'd@test.com', deletedAt: '2025-06-01T00:00:00.000Z' } as Client),
      ]);

      const result = await storage.listClients();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Active');
      expect(result.meta.total).toBe(1);
    });

    it('paginates correctly — first page', async () => {
      const clients = Array.from({ length: 25 }, (_, i) =>
        makeClient({ id: i + 1, name: `Client${i + 1}`, email: `c${i + 1}@test.com` }),
      );
      setRaw('pf_demo:clients', clients);

      const result = await storage.listClients(1, 10);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(1);
      expect(result.data[9].id).toBe(10);
      expect(result.meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 });
    });

    it('paginates correctly — middle page', async () => {
      const clients = Array.from({ length: 25 }, (_, i) =>
        makeClient({ id: i + 1, name: `Client${i + 1}`, email: `c${i + 1}@test.com` }),
      );
      setRaw('pf_demo:clients', clients);

      const result = await storage.listClients(2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(11);
      expect(result.data[9].id).toBe(20);
      expect(result.meta.page).toBe(2);
    });

    it('paginates correctly — last partial page', async () => {
      const clients = Array.from({ length: 25 }, (_, i) =>
        makeClient({ id: i + 1, name: `Client${i + 1}`, email: `c${i + 1}@test.com` }),
      );
      setRaw('pf_demo:clients', clients);

      const result = await storage.listClients(3, 10);

      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe(21);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('clients — getClient', () => {
    it('returns the client by id', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@b.com' })]);

      const client = await storage.getClient(1);

      expect(client).not.toBeNull();
      expect(client.name).toBe('Alice');
    });

    it('rejects when client not found', async () => {
      setRaw('pf_demo:clients', []);

      await expect(storage.getClient(999)).rejects.toThrow('Client with id 999 not found');
    });

    it('rejects when client is soft-deleted', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Deleted', email: 'd@b.com', deletedAt: '2025-06-01T00:00:00.000Z' } as Client),
      ]);

      await expect(storage.getClient(1)).rejects.toThrow('Client with id 1 not found');
    });
  });

  describe('clients — updateClient', () => {
    it('merges partial updates into the existing client', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@b.com' })]);

      const updated = await storage.updateClient(1, { name: 'Alicia', phone: '999' });

      expect(updated.name).toBe('Alicia');
      expect(updated.phone).toBe('999');
      // Unchanged fields preserved
      expect(updated.email).toBe('a@b.com');
      expect(updated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z'); // timestamp refreshed
    });

    it('rejects when target client not found', async () => {
      setRaw('pf_demo:clients', []);
      await expect(storage.updateClient(999, { name: 'No' })).rejects.toThrow('Client with id 999 not found');
    });
  });

  describe('clients — deleteClient', () => {
    it('soft-deletes by setting deletedAt', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@b.com' })]);

      await storage.deleteClient(1);

      const raw = getRaw<Client[]>('pf_demo:clients');
      expect(raw[0].deletedAt).toBeTruthy();
      // Ensures it's an ISO timestamp
      expect(new Date(raw[0].deletedAt!).getTime()).toBeGreaterThan(0);
    });

    it('does not affect other clients', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Alice', email: 'a@b.com' }),
        makeClient({ id: 2, name: 'Bob', email: 'b@b.com' }),
      ]);

      await storage.deleteClient(1);

      const raw = getRaw<Client[]>('pf_demo:clients');
      expect(raw[0].deletedAt).toBeTruthy();
      expect(raw[1].deletedAt).toBeUndefined();
    });
  });

  describe('clients — reactivateClient', () => {
    it('sets status to active', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@b.com', status: 'inactive' })]);

      const result = await storage.reactivateClient(1);

      expect(result.status).toBe('active');
    });

    it('rejects when client not found', async () => {
      setRaw('pf_demo:clients', []);
      await expect(storage.reactivateClient(999)).rejects.toThrow('Client with id 999 not found');
    });
  });

  describe('clients — deactivateClient', () => {
    it('sets status to inactive', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@b.com', status: 'active' })]);

      const result = await storage.deactivateClient(1);

      expect(result.status).toBe('inactive');
    });

    it('rejects when client not found', async () => {
      setRaw('pf_demo:clients', []);
      await expect(storage.deactivateClient(999)).rejects.toThrow('Client with id 999 not found');
    });
  });

  describe('clients — searchClients', () => {
    it('matches case-insensitively on name', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Alice Brown', email: 'a@test.com' }),
        makeClient({ id: 2, name: 'Bob White', email: 'b@test.com' }),
      ]);

      const results = await storage.searchClients('brown');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Brown');
    });

    it('matches on email', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Alice', email: 'alice@vet.com' }),
        makeClient({ id: 2, name: 'Bob', email: 'bob@groom.com' }),
      ]);

      const results = await storage.searchClients('vet');

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('alice@vet.com');
    });

    it('excludes soft-deleted clients from search', async () => {
      setRaw('pf_demo:clients', [
        makeClient({ id: 1, name: 'Active Alice', email: 'a@test.com' }),
        makeClient({ id: 2, name: 'Deleted Alice', email: 'd@test.com', deletedAt: '2025-06-01T00:00:00.000Z' } as Client),
      ]);

      const results = await storage.searchClients('Alice');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Active Alice');
    });

    it('returns empty array when no match', async () => {
      setRaw('pf_demo:clients', [makeClient({ id: 1, name: 'Alice', email: 'a@test.com' })]);

      const results = await storage.searchClients('zzzznotfound');

      expect(results).toEqual([]);
    });
  });

  describe('clients — JSON corruption recovery', () => {
    it('returns empty array when pf_demo:clients contains unparseable JSON', async () => {
      localStorage.setItem('pf_demo:clients', '{{{broken');

      const result = await storage.listClients();

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('returns empty paginated response for corrupted storage on list', async () => {
      localStorage.setItem('pf_demo:clients', 'not-json');

      const result = await storage.listClients();

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('search returns empty array on corrupted storage', async () => {
      localStorage.setItem('pf_demo:clients', '{{{corrupt}}}');

      const results = await storage.searchClients('anything');

      expect(results).toEqual([]);
    });
  });

  /* ========================================================================
   * PETS — 7 methods (Task 3.3)
   * ======================================================================== */

  describe('pets — createPet', () => {
    it('persists a pet with auto-increment ID', async () => {
      const dto: CreatePetInput = { clientId: 1, name: 'Max', species: 'Dog', breed: 'Labrador' };
      const pet = await storage.createPet(dto);

      expect(pet.id).toBe(1);
      expect(pet.name).toBe('Max');
      expect(pet.clientId).toBe(1);

      const raw = getRaw<Pet[]>('pf_demo:pets');
      expect(raw).toHaveLength(1);
      expect(raw[0].id).toBe(1);
    });

    it('assigns default status=active', async () => {
      const pet = await storage.createPet({ clientId: 1, name: 'Max', species: 'Dog', breed: 'Lab' });

      expect(pet.status).toBe('active');
    });

    it('defaults sex to unknown when not provided', async () => {
      const pet = await storage.createPet({ clientId: 1, name: 'Max', species: 'Dog', breed: 'Lab' });

      expect(pet.sex).toBe('unknown');
    });
  });

  describe('pets — listPets', () => {
    it('returns all active pets when no filter', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Bella', clientId: 2 }),
      ]);

      const result = await storage.listPets();

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('filters by clientId when provided', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Bella', clientId: 2 }),
        makePet({ id: 3, name: 'Charlie', clientId: 1 }),
      ]);

      const result = await storage.listPets(1, 20, 1);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => p.clientId === 1)).toBe(true);
      expect(result.meta.total).toBe(2);
    });

    it('excludes soft-deleted pets', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Deleted', clientId: 1, deletedAt: '2025-06-01T00:00:00.000Z' } as Pet),
      ]);

      const result = await storage.listPets();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Max');
    });

    it('paginates correctly', async () => {
      const pets = Array.from({ length: 15 }, (_, i) =>
        makePet({ id: i + 1, name: `Pet${i + 1}` }),
      );
      setRaw('pf_demo:pets', pets);

      const result = await storage.listPets(2, 5);

      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe(6);
      expect(result.meta).toEqual({ total: 15, page: 2, limit: 5, totalPages: 3 });
    });

    it('returns empty paginated response for no pets', async () => {
      const result = await storage.listPets();

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
    });
  });

  describe('pets — getPet', () => {
    it('returns pet by id', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 1 })]);

      const pet = await storage.getPet(1);

      expect(pet.name).toBe('Max');
    });

    it('rejects when pet not found', async () => {
      setRaw('pf_demo:pets', []);
      await expect(storage.getPet(999)).rejects.toThrow('Pet with id 999 not found');
    });

    it('rejects when pet is soft-deleted', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Deleted', clientId: 1, deletedAt: '2025-06-01T00:00:00.000Z' } as Pet),
      ]);

      await expect(storage.getPet(1)).rejects.toThrow('Pet with id 1 not found');
    });
  });

  describe('pets — updatePet', () => {
    it('merges partial updates', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', species: 'Dog', breed: 'Labrador' })]);

      const updated = await storage.updatePet(1, { name: 'Maximus', breed: 'Golden' });

      expect(updated.name).toBe('Maximus');
      expect(updated.breed).toBe('Golden');
      expect(updated.species).toBe('Dog'); // unchanged
    });

    it('rejects when pet not found', async () => {
      setRaw('pf_demo:pets', []);
      await expect(storage.updatePet(999, { name: 'Ghost' })).rejects.toThrow('Pet with id 999 not found');
    });
  });

  describe('pets — deletePet', () => {
    it('soft-deletes by setting deletedAt', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 1 })]);

      await storage.deletePet(1);

      const raw = getRaw<Pet[]>('pf_demo:pets');
      expect(raw[0].deletedAt).toBeTruthy();
      expect(new Date(raw[0].deletedAt!).getTime()).toBeGreaterThan(0);
    });

    it('does not affect other pets', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Bella', clientId: 2 }),
      ]);

      await storage.deletePet(1);

      const raw = getRaw<Pet[]>('pf_demo:pets');
      expect(raw[0].deletedAt).toBeTruthy();
      expect(raw[1].deletedAt).toBeUndefined();
    });
  });

  describe('pets — deactivatePet', () => {
    it('sets status to inactive', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 1, status: 'active' })]);

      const result = await storage.deactivatePet(1);

      expect(result.status).toBe('inactive');
    });

    it('rejects when pet not found', async () => {
      setRaw('pf_demo:pets', []);
      await expect(storage.deactivatePet(999)).rejects.toThrow('Pet with id 999 not found');
    });
  });

  describe('pets — searchPets', () => {
    it('matches case-insensitively on name', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Bella', clientId: 2 }),
      ]);

      const results = await storage.searchPets('max');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Max');
    });

    it('matches on breed', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Rex', breed: 'German Shepherd', clientId: 1 }),
        makePet({ id: 2, name: 'Luna', breed: 'Poodle', clientId: 2 }),
      ]);

      const results = await storage.searchPets('poodle');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Luna');
    });

    it('matches on notes', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Rex', breed: 'Dog', notes: 'Allergic to peanuts', clientId: 1 }),
        makePet({ id: 2, name: 'Luna', breed: 'Cat', notes: null, clientId: 1 }),
      ]);

      const results = await storage.searchPets('peanuts');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Rex');
    });

    it('excludes soft-deleted pets', async () => {
      setRaw('pf_demo:pets', [
        makePet({ id: 1, name: 'Max', clientId: 1 }),
        makePet({ id: 2, name: 'Maximus', clientId: 1, deletedAt: '2025-06-01T00:00:00.000Z' } as Pet),
      ]);

      const results = await storage.searchPets('max');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    it('returns empty array on no match', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 1 })]);

      const results = await storage.searchPets('unicorn');

      expect(results).toEqual([]);
    });
  });

  describe('pets — JSON corruption recovery', () => {
    it('listPets returns empty on corrupted data', async () => {
      localStorage.setItem('pf_demo:pets', '{broken');

      const result = await storage.listPets();

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('searchPets returns empty on corrupted data', async () => {
      localStorage.setItem('pf_demo:pets', '{{{corrupt}}}');

      const results = await storage.searchPets('anything');

      expect(results).toEqual([]);
    });
  });

  /* ========================================================================
   * SERVICES — 7 methods (Task 4.1)
   * ======================================================================== */

  describe('services — createService', () => {
    it('persists a service with auto-increment ID', async () => {
      const dto: CreateServiceInput = { name: 'Haircut', price: 50 };
      const service = await storage.createService(dto);

      expect(service.id).toBe(1);
      expect(service.name).toBe('Haircut');
      expect(service.price).toBe(50);

      const raw = getRaw<Service[]>('pf_demo:services');
      expect(raw).toHaveLength(1);
      expect(raw[0].id).toBe(1);
    });

    it('increments nextIds after each create', async () => {
      await storage.createService({ name: 'A', price: 10 });
      await storage.createService({ name: 'B', price: 20 });

      const raw = getRaw<Service[]>('pf_demo:services');
      expect(raw).toHaveLength(2);
      expect(raw[0].id).toBe(1);
      expect(raw[1].id).toBe(2);

      const ids = getRaw<{ services: number }>('pf_demo:nextIds');
      expect(ids.services).toBe(2);
    });

    it('populates createdAt and updatedAt timestamps', async () => {
      const before = new Date().toISOString();
      const service = await storage.createService({ name: 'Haircut', price: 50 });

      expect(service.createdAt).toBeTruthy();
      expect(service.updatedAt).toBeTruthy();
      expect(service.createdAt >= before).toBe(true);
    });

    it('assigns status=active and defaults null fields', async () => {
      const service = await storage.createService({ name: 'Haircut', price: 50 });

      expect(service.status).toBe('active');
      expect(service.description).toBeNull();
      expect(service.durationMinutes).toBeNull();
      expect(service.petId).toBeNull();
    });

    it('accepts optional fields in DTO', async () => {
      const service = await storage.createService({
        name: 'Bath',
        price: 30,
        description: 'Full bath',
        durationMinutes: 20,
        petId: 5,
      });

      expect(service.description).toBe('Full bath');
      expect(service.durationMinutes).toBe(20);
      expect(service.petId).toBe(5);
    });
  });

  describe('services — listServices', () => {
    it('returns empty paginated response when no services exist', async () => {
      const result = await storage.listServices();

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
    });

    it('returns all active services', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Haircut' }),
        makeService({ id: 2, name: 'Bath' }),
      ]);

      const result = await storage.listServices();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Haircut');
      expect(result.data[1].name).toBe('Bath');
      expect(result.meta.total).toBe(2);
    });

    it('excludes soft-deleted services from list', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Active' }),
        makeService({ id: 2, name: 'Deleted', deletedAt: '2025-06-01T00:00:00.000Z' } as Service),
      ]);

      const result = await storage.listServices();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Active');
      expect(result.meta.total).toBe(1);
    });

    it('filters by petId when provided', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Haircut', petId: 1 }),
        makeService({ id: 2, name: 'Bath', petId: 2 }),
        makeService({ id: 3, name: 'Nails', petId: 1 }),
      ]);

      const result = await storage.listServices(1, 20, 1);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(s => s.petId === 1)).toBe(true);
      expect(result.meta.total).toBe(2);
    });

    it('paginates correctly — first page', async () => {
      const services = Array.from({ length: 25 }, (_, i) =>
        makeService({ id: i + 1, name: `Service${i + 1}` }),
      );
      setRaw('pf_demo:services', services);

      const result = await storage.listServices(1, 10);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(1);
      expect(result.data[9].id).toBe(10);
      expect(result.meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 });
    });

    it('paginates correctly — middle page', async () => {
      const services = Array.from({ length: 25 }, (_, i) =>
        makeService({ id: i + 1, name: `Service${i + 1}` }),
      );
      setRaw('pf_demo:services', services);

      const result = await storage.listServices(2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(11);
      expect(result.data[9].id).toBe(20);
      expect(result.meta.page).toBe(2);
    });

    it('paginates correctly — last partial page', async () => {
      const services = Array.from({ length: 25 }, (_, i) =>
        makeService({ id: i + 1, name: `Service${i + 1}` }),
      );
      setRaw('pf_demo:services', services);

      const result = await storage.listServices(3, 10);

      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe(21);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('services — getService', () => {
    it('returns the service by id', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, name: 'Haircut' })]);

      const service = await storage.getService(1);

      expect(service).not.toBeNull();
      expect(service.name).toBe('Haircut');
    });

    it('rejects when service not found', async () => {
      setRaw('pf_demo:services', []);

      await expect(storage.getService(999)).rejects.toThrow('Service with id 999 not found');
    });

    it('rejects when service is soft-deleted', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Deleted', deletedAt: '2025-06-01T00:00:00.000Z' } as Service),
      ]);

      await expect(storage.getService(1)).rejects.toThrow('Service with id 1 not found');
    });
  });

  describe('services — updateService', () => {
    it('merges partial updates into the existing service', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, name: 'Haircut', price: 50 })]);

      const updated = await storage.updateService(1, { name: 'Deluxe Cut', price: 75 });

      expect(updated.name).toBe('Deluxe Cut');
      expect(updated.price).toBe(75);
      expect(updated.status).toBe('active'); // unchanged
      expect(updated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z'); // timestamp refreshed
    });

    it('allows setting description to null', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, description: 'Old desc' })]);

      const updated = await storage.updateService(1, { description: null });

      expect(updated.description).toBeNull();
    });

    it('rejects when target service not found', async () => {
      setRaw('pf_demo:services', []);

      await expect(storage.updateService(999, { name: 'No' })).rejects.toThrow('Service with id 999 not found');
    });
  });

  describe('services — deleteService', () => {
    it('soft-deletes by setting deletedAt', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, name: 'Haircut' })]);

      await storage.deleteService(1);

      const raw = getRaw<Service[]>('pf_demo:services');
      expect(raw[0].deletedAt).toBeTruthy();
      expect(new Date(raw[0].deletedAt!).getTime()).toBeGreaterThan(0);
    });

    it('does not affect other services', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Haircut' }),
        makeService({ id: 2, name: 'Bath' }),
      ]);

      await storage.deleteService(1);

      const raw = getRaw<Service[]>('pf_demo:services');
      expect(raw[0].deletedAt).toBeTruthy();
      expect(raw[1].deletedAt).toBeUndefined();
    });
  });

  describe('services — deactivateService', () => {
    it('sets status to inactive', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, name: 'Haircut', status: 'active' })]);

      const result = await storage.deactivateService(1);

      expect(result.status).toBe('inactive');
    });

    it('rejects when service not found', async () => {
      setRaw('pf_demo:services', []);

      await expect(storage.deactivateService(999)).rejects.toThrow('Service with id 999 not found');
    });
  });

  describe('services — searchServices', () => {
    it('matches case-insensitively on name', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Haircut', description: 'Full cut' }),
        makeService({ id: 2, name: 'Bath', description: null }),
      ]);

      const results = await storage.searchServices('hair');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Haircut');
    });

    it('matches on description', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Haircut', description: 'Full body haircut' }),
        makeService({ id: 2, name: 'Bath', description: 'Gentle wash' }),
      ]);

      const results = await storage.searchServices('gentle');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bath');
    });

    it('excludes soft-deleted services from search', async () => {
      setRaw('pf_demo:services', [
        makeService({ id: 1, name: 'Active Cut' }),
        makeService({ id: 2, name: 'Deleted Cut', deletedAt: '2025-06-01T00:00:00.000Z' } as Service),
      ]);

      const results = await storage.searchServices('cut');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Active Cut');
    });

    it('returns empty array when no match', async () => {
      setRaw('pf_demo:services', [makeService({ id: 1, name: 'Haircut' })]);

      const results = await storage.searchServices('zzzznotfound');

      expect(results).toEqual([]);
    });
  });

  describe('services — JSON corruption recovery', () => {
    it('listServices returns empty on corrupted data', async () => {
      localStorage.setItem('pf_demo:services', '{broken');

      const result = await storage.listServices();

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('searchServices returns empty on corrupted data', async () => {
      localStorage.setItem('pf_demo:services', '{{{corrupt}}}');

      const results = await storage.searchServices('anything');

      expect(results).toEqual([]);
    });
  });

  /* ========================================================================
   * APPOINTMENTS — 5 methods (Task 4.3)
   * ======================================================================== */

  describe('appointments — createAppointment', () => {
    it('persists an appointment with auto-increment ID', async () => {
      const dto: CreateAppointmentDto = { petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' };
      const appointment = await storage.createAppointment(dto);

      expect(appointment.id).toBe(1);
      expect(appointment.petId).toBe(1);
      expect(appointment.scheduledAt).toBe('2025-06-15T10:00:00.000Z');

      const raw = getRaw<Appointment[]>('pf_demo:appointments');
      expect(raw).toHaveLength(1);
      expect(raw[0].id).toBe(1);
    });

    it('increments nextIds after each create', async () => {
      await storage.createAppointment({ petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' });
      await storage.createAppointment({ petId: 2, scheduledAt: '2025-06-16T10:00:00.000Z' });

      const raw = getRaw<Appointment[]>('pf_demo:appointments');
      expect(raw).toHaveLength(2);
      expect(raw[0].id).toBe(1);
      expect(raw[1].id).toBe(2);

      const ids = getRaw<{ appointments: number }>('pf_demo:nextIds');
      expect(ids.appointments).toBe(2);
    });

    it('populates createdAt and updatedAt timestamps', async () => {
      const before = new Date().toISOString();
      const appointment = await storage.createAppointment({ petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' });

      expect(appointment.createdAt).toBeTruthy();
      expect(appointment.updatedAt).toBeTruthy();
      expect(appointment.createdAt >= before).toBe(true);
    });

    it('assigns status=0 (pending) by default', async () => {
      const appointment = await storage.createAppointment({ petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' });

      expect(appointment.status).toBe(0);
    });

    it('resolves petName from pets collection', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 1 })]);

      const appointment = await storage.createAppointment({ petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' });

      expect(appointment.petName).toBe('Max');
    });

    it('resolves clientId and clientName from pet owner', async () => {
      setRaw('pf_demo:pets', [makePet({ id: 1, name: 'Max', clientId: 5 })]);
      setRaw('pf_demo:clients', [makeClient({ id: 5, name: 'Bob', email: 'bob@test.com' })]);

      const appointment = await storage.createAppointment({ petId: 1, scheduledAt: '2025-06-15T10:00:00.000Z' });

      expect(appointment.clientId).toBe(5);
      expect(appointment.clientName).toBe('Bob');
    });

    it('stores optional notes', async () => {
      const appointment = await storage.createAppointment({
        petId: 1,
        scheduledAt: '2025-06-15T10:00:00.000Z',
        notes: 'Please use hypoallergenic shampoo',
      });

      expect(appointment.notes).toBe('Please use hypoallergenic shampoo');
    });
  });

  describe('appointments — listAppointments', () => {
    it('returns empty array when no appointments exist', async () => {
      const result = await storage.listAppointments('2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.999Z');

      expect(result).toEqual([]);
    });

    it('returns appointments within the date range', async () => {
      setRaw('pf_demo:appointments', [
        makeAppointment({ id: 1, scheduledAt: '2025-06-15T10:00:00.000Z' }),
        makeAppointment({ id: 2, scheduledAt: '2025-06-16T14:00:00.000Z' }),
        makeAppointment({ id: 3, scheduledAt: '2025-06-20T09:00:00.000Z' }),
      ]);

      const result = await storage.listAppointments('2025-06-15T00:00:00.000Z', '2025-06-16T23:59:59.999Z');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('includes appointments exactly at range boundaries', async () => {
      setRaw('pf_demo:appointments', [
        makeAppointment({ id: 1, scheduledAt: '2025-06-15T00:00:00.000Z' }),
      ]);

      const result = await storage.listAppointments('2025-06-15T00:00:00.000Z', '2025-06-15T00:00:00.000Z');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns empty when no appointments in range', async () => {
      setRaw('pf_demo:appointments', [
        makeAppointment({ id: 1, scheduledAt: '2025-06-15T10:00:00.000Z' }),
      ]);

      const result = await storage.listAppointments('2025-07-01T00:00:00.000Z', '2025-07-31T23:59:59.999Z');

      expect(result).toEqual([]);
    });

    it('returns all active appointments in wide range', async () => {
      setRaw('pf_demo:appointments', [
        makeAppointment({ id: 1, scheduledAt: '2025-01-01T00:00:00.000Z' }),
        makeAppointment({ id: 2, scheduledAt: '2025-12-31T23:59:59.999Z' }),
      ]);

      const result = await storage.listAppointments('2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.999Z');

      expect(result).toHaveLength(2);
    });
  });

  describe('appointments — getAppointment', () => {
    it('returns the appointment by id', async () => {
      setRaw('pf_demo:appointments', [makeAppointment({ id: 1 })]);

      const appointment = await storage.getAppointment(1);

      expect(appointment).not.toBeNull();
      expect(appointment.id).toBe(1);
    });

    it('rejects when appointment not found', async () => {
      setRaw('pf_demo:appointments', []);

      await expect(storage.getAppointment(999)).rejects.toThrow('Appointment with id 999 not found');
    });
  });

  describe('appointments — updateAppointment', () => {
    it('merges partial updates', async () => {
      setRaw('pf_demo:appointments', [makeAppointment({ id: 1, scheduledAt: '2025-06-15T10:00:00.000Z' })]);

      const updated = await storage.updateAppointment(1, {
        scheduledAt: '2025-07-01T14:00:00.000Z',
        notes: 'Updated notes',
      });

      expect(updated.scheduledAt).toBe('2025-07-01T14:00:00.000Z');
      expect(updated.notes).toBe('Updated notes');
      expect(updated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z'); // timestamp refreshed
    });

    it('allows setting notes to null', async () => {
      setRaw('pf_demo:appointments', [makeAppointment({ id: 1, notes: 'Old notes' })]);

      const updated = await storage.updateAppointment(1, { notes: null });

      expect(updated.notes).toBeNull();
    });

    it('rejects when appointment not found', async () => {
      setRaw('pf_demo:appointments', []);

      await expect(storage.updateAppointment(999, { notes: 'No' })).rejects.toThrow('Appointment with id 999 not found');
    });
  });

  describe('appointments — cancelAppointment', () => {
    it('sets status to 3 (cancelled)', async () => {
      setRaw('pf_demo:appointments', [makeAppointment({ id: 1, status: 0 as AppointmentStatus })]);

      const result = await storage.cancelAppointment(1);

      expect(result.status).toBe(3);
    });

    it('updates the updatedAt timestamp', async () => {
      setRaw('pf_demo:appointments', [makeAppointment({ id: 1 })]);

      const result = await storage.cancelAppointment(1);

      expect(result.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });

    it('rejects when appointment not found', async () => {
      setRaw('pf_demo:appointments', []);

      await expect(storage.cancelAppointment(999)).rejects.toThrow('Appointment with id 999 not found');
    });
  });

  describe('appointments — JSON corruption recovery', () => {
    it('listAppointments returns empty on corrupted data', async () => {
      localStorage.setItem('pf_demo:appointments', '{broken');

      const result = await storage.listAppointments('2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.999Z');

      expect(result).toEqual([]);
    });
  });

  /* ========================================================================
   * SETTINGS — 3 methods (Task 4.5)
   * ======================================================================== */

  describe('settings — getSettings', () => {
    it('returns the stored settings singleton', async () => {
      const settings = makeSettings({ companyName: 'My Grooming' });
      setRaw('pf_demo:settings', settings);

      const result = await storage.getSettings();

      expect(result.companyName).toBe('My Grooming');
      expect(result.id).toBe(1);
    });

    it('returns default settings when nothing stored', async () => {
      const result = await storage.getSettings();

      expect(result).toBeDefined();
      expect(result.companyName).toBeTruthy();
      expect(result.workdays).toBeInstanceOf(Array);
    });

    it('returns default settings on corrupted JSON', async () => {
      localStorage.setItem('pf_demo:settings', '{broken');

      const result = await storage.getSettings();

      expect(result).toBeDefined();
      expect(result.companyName).toBeTruthy();
    });
  });

  describe('settings — updateSettings', () => {
    it('updates and persists all settings fields', async () => {
      setRaw('pf_demo:settings', makeSettings({ companyName: 'Old Name' }));

      const updated = await storage.updateSettings({
        companyName: 'New Name',
        workdays: [1, 2, 3],
        workStartTime: '08:00',
        workEndTime: '18:00',
        defaultLang: 1 as Lang,
        tagline: 'Best grooming',
      });

      expect(updated.companyName).toBe('New Name');
      expect(updated.workdays).toEqual([1, 2, 3]);
      expect(updated.workStartTime).toBe('08:00');
      expect(updated.workEndTime).toBe('18:00');
      expect(updated.defaultLang).toBe(1);
      expect(updated.tagline).toBe('Best grooming');

      // Verify persistence
      const raw = getRaw<CompanySettings>('pf_demo:settings');
      expect(raw.companyName).toBe('New Name');
    });

    it('updates updatedAt timestamp', async () => {
      setRaw('pf_demo:settings', makeSettings());

      const updated = await storage.updateSettings({
        companyName: 'Updated',
        workdays: [1],
        workStartTime: '09:00',
        workEndTime: '17:00',
        defaultLang: 0 as Lang,
      });

      expect(updated.updatedAt).not.toBe('2025-01-01T00:00:00.000Z');
    });

    it('works when no previous settings exist', async () => {
      const updated = await storage.updateSettings({
        companyName: 'Fresh Start',
        workdays: [1, 2, 3, 4, 5],
        workStartTime: '09:00',
        workEndTime: '17:00',
        defaultLang: 0 as Lang,
      });

      expect(updated.companyName).toBe('Fresh Start');
    });
  });

  describe('settings — uploadLogo', () => {
    it('updates logoUrl in settings', async () => {
      setRaw('pf_demo:settings', makeSettings({ logoUrl: null }));

      const mockFile = new File([], 'logo.png', { type: 'image/png' });
      const result = await storage.uploadLogo(mockFile);

      expect(result.logoUrl).toBe('logo.png');
    });

    it('preserves other settings fields', async () => {
      setRaw('pf_demo:settings', makeSettings({ companyName: 'My Shop', workdays: [1, 2] }));

      const mockFile = new File([], 'new-logo.png', { type: 'image/png' });
      const result = await storage.uploadLogo(mockFile);

      expect(result.companyName).toBe('My Shop');
      expect(result.workdays).toEqual([1, 2]);
      expect(result.logoUrl).toBe('new-logo.png');
    });

    it('works when no previous settings exist', async () => {
      const mockFile = new File([], 'first-logo.png', { type: 'image/png' });
      const result = await storage.uploadLogo(mockFile);

      expect(result.logoUrl).toBe('first-logo.png');
      expect(result.companyName).toBeTruthy();
    });
  });
});

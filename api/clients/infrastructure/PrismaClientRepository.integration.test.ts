/**
 * Integration tests for PrismaClientRepository.search() with ngram NATURAL LANGUAGE MODE FTS.
 * @integration — requires Docker MySQL running (npm run test:integration)
 *
 * These tests verify:
 * - Ngram substring search across 6 client cols + 3 pet cols
 * - Cross-entity merge with deduplication
 * - Accent folding via utf8mb4_0900_ai_ci
 * - Soft-delete exclusion
 * - Empty results for non-matching queries
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@api/shared/infrastructure/prisma';
import { PrismaClientRepository } from './PrismaClientRepository';
import { Client } from '../domain/Client';

const repo = new PrismaClientRepository();

/**
 * Helper: seed a client via Prisma, returning a domain Client.
 */
async function seedClient(overrides: Partial<{
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: number;
  notes: string | null;
  lastServiceDate: Date | null;
  deletedAt: Date | null;
}> = {}): Promise<{ id: number; name: string }> {
  const row = await prisma.client.create({
    data: {
      name: overrides.name ?? 'Test Client',
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      phone: overrides.phone ?? '555-1234',
      phone2: overrides.phone2 ?? null,
      address: overrides.address ?? null,
      status: overrides.status ?? 1,
      deletedAt: overrides.deletedAt ?? null,
    },
    select: { id: true, name: true },
  });

  return row;
}

/**
 * Helper: seed a pet linked to a client.
 */
async function seedPet(clientId: number, overrides: Partial<{
  name: string;
  breed: string;
  notes: string | null;
  status: number;
  deletedAt: Date | null;
}> = {}): Promise<number> {
  const row = await prisma.pet.create({
    data: {
      client_id: clientId,
      name: overrides.name ?? 'Test Pet',
      species: 'Perro',
      breed: overrides.breed ?? 'Mestizo',
      notes: overrides.notes ?? null,
      sex: 0,
      status: overrides.status ?? 1,
      deletedAt: overrides.deletedAt ?? null,
    },
    select: { id: true },
  });

  return row.id;
}

// Track created IDs per test for cleanup
let createdClientIds: number[] = [];
let createdPetIds: number[] = [];

beforeEach(() => {
  createdClientIds = [];
  createdPetIds = [];
});

afterEach(async () => {
  if (createdPetIds.length > 0) {
    await prisma.pet.deleteMany({ where: { id: { in: createdPetIds } } });
  }
  if (createdClientIds.length > 0) {
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
  }
});

describe('PrismaClientRepository — search (ngram FTS)', () => {
  describe('ngram substring search', () => {
    it('finds client by substring of pet breed (e.g. "bra" → Labrador)', async () => {
      const client = await seedClient({ name: 'PetOwner Bravo' });
      createdClientIds.push(client.id);
      const petId = await seedPet(client.id, { breed: 'Labrador' });
      createdPetIds.push(petId);

      const results = await repo.search('bra');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });

    it('finds client by partial phone match (e.g. "555")', async () => {
      const client = await seedClient({
        name: 'Phone Tester',
        phone: '+34 600 555 789',
      });
      createdClientIds.push(client.id);

      const results = await repo.search('555');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });

    it('finds client by substring of client notes (e.g. "labrador" → Labrador in notes)', async () => {
      // Use existing seed data: pet breeds are indexed via the pets table,
      // and the cross-entity merge finds the client through the pet.
      // Test the clients table directly: search for "especiales" from seed notes.
      // María García (id=16) has "cuidados" in her Max pet notes, but her own
      // notes "Clienta habitual" contains "habitual".
      const results = await repo.search('habitual');

      const ids = results.map((c: Client) => c.id);
      // María García has "habitual" in her own notes field
      expect(ids).toContain(16);
    });

    it('finds client by substring of client address', async () => {
      const client = await seedClient({
        name: 'Address Client',
        address: 'Calle Falsa 123, Springfield',
      });
      createdClientIds.push(client.id);

      const results = await repo.search('Falsa');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });

    it('finds client by pet name substring', async () => {
      const client = await seedClient({ name: 'Pet Parent' });
      createdClientIds.push(client.id);
      const petId = await seedPet(client.id, { name: 'Firulais' });
      createdPetIds.push(petId);

      const results = await repo.search('rula');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });
  });

  describe('accent folding', () => {
    it('finds "Ñandú" when searching "ñan" (utf8mb4_0900_ai_ci accent folding)', async () => {
      const client = await seedClient({ name: 'Ñandú' });
      createdClientIds.push(client.id);

      const results = await repo.search('ñan');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });

    it('finds "Peña" when searching "pena" (accent folding)', async () => {
      const client = await seedClient({ name: 'Peña S.A.' });
      createdClientIds.push(client.id);

      const results = await repo.search('pena');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });
  });

  describe('cross-entity merge and dedup', () => {
    it('deduplicates when client matches via both own fields and pet fields', async () => {
      // Client name contains "Zeta" AND pet name is "Zeta" — both should match
      const client = await seedClient({ name: 'Zeta Power' });
      createdClientIds.push(client.id);
      const petId = await seedPet(client.id, { name: 'Zeta' });
      createdPetIds.push(petId);

      const results = await repo.search('zeta');

      // Client should appear exactly once, not twice
      const matchCount = results.filter((c: Client) => c.id === client.id).length;
      expect(matchCount).toBe(1);
    });

    it('finds client only via pet match when client own fields do not match', async () => {
      const client = await seedClient({ name: 'Unrelated Name' });
      createdClientIds.push(client.id);
      const petId = await seedPet(client.id, { name: 'UniquePetX', breed: 'Xoloitzcuintle' });
      createdPetIds.push(petId);

      const results = await repo.search('xolo');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });

    it('finds client only via own fields when no matching pet exists', async () => {
      const client = await seedClient({ name: 'UniqueClientName' });
      createdClientIds.push(client.id);

      const results = await repo.search('UniqueClient');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(client.id);
    });
  });

  describe('soft-delete exclusion', () => {
    it('excludes soft-deleted clients from search results', async () => {
      // Laura López (id=19) has "especiales" in notes from seed data
      const lauraId = 19;
      // Soft-delete a duplicate copy to test exclusion
      const deletedClient = await seedClient({
        name: 'Laura Copy',
        notes: 'requiere cuidados especiales — dupe for FTS test',
        deletedAt: new Date(),
      });
      createdClientIds.push(deletedClient.id);

      const results = await repo.search('especiales');

      const ids = results.map((c: Client) => c.id);
      expect(ids).toContain(lauraId);
      expect(ids).not.toContain(deletedClient.id);
    });

    it('excludes clients whose only matching pet is soft-deleted', async () => {
      const client = await seedClient({ name: 'Petless Owner' });
      createdClientIds.push(client.id);
      const deletedPetId = await seedPet(client.id, {
        name: 'Ghost',
        breed: 'Phantom',
        deletedAt: new Date(),
      });
      createdPetIds.push(deletedPetId);

      const results = await repo.search('phantom');

      const ids = results.map((c: Client) => c.id);
      expect(ids).not.toContain(client.id);
    });
  });

  describe('no results', () => {
    it('returns empty array when no match exists', async () => {
      const results = await repo.search('zzz_no_match_xyz_9999');
      expect(results).toEqual([]);
    });
  });
});

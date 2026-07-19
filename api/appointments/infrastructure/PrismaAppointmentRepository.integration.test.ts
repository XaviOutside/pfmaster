/**
 * Integration tests for PrismaAppointmentRepository.
 *
 * Runs against Docker MySQL. Requires: docker compose up -d db
 * Uses vitest.integration.config.ts (pool: forks, singleFork, 30s timeout)
 *
 * Run: npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaAppointmentRepository } from './PrismaAppointmentRepository';
import { APPOINTMENT_STATUS } from '../domain/Appointment';
import { prisma } from '@api/shared/infrastructure/prisma';

const repo = new PrismaAppointmentRepository();

// Unique pet/client IDs per test run to avoid collisions
const TEST_PET_ID = 99990;
const TEST_CLIENT_ID = 99991;

beforeAll(async () => {
  // Ensure test pet and client exist (minimal rows for FK-free integrity)
  await prisma.client.upsert({
    where: { id: TEST_CLIENT_ID },
    create: {
      id: TEST_CLIENT_ID,
      name: 'Integration Test Client',
      email: 'test@integration.test',
      phone: '555-0000',
    },
    update: {},
  });

  await prisma.pet.upsert({
    where: { id: TEST_PET_ID },
    create: {
      id: TEST_PET_ID,
      client_id: TEST_CLIENT_ID,
      name: 'Integration Test Pet',
      species: 'Dog',
      breed: 'Test',
    },
    update: {},
  });
});

afterAll(async () => {
  // Clean up test appointments
  await prisma.appointment.deleteMany({
    where: { pet_id: TEST_PET_ID },
  });
});

beforeEach(async () => {
  // Clean up appointments before each test for isolation
  await prisma.appointment.deleteMany({
    where: { pet_id: TEST_PET_ID },
  });
});

describe('PrismaAppointmentRepository (integration)', () => {
  // ── create ─────────────────────────────────────────────────────────────────

  it('creates an appointment and returns the entity with generated id', async () => {
    const scheduledAt = new Date('2026-07-20T10:00:00Z');

    const result = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt,
      notes: 'Integration test',
    });

    expect(result.id).toBeGreaterThan(0);
    expect(result.petId).toBe(TEST_PET_ID);
    expect(result.clientId).toBe(TEST_CLIENT_ID);
    expect(result.scheduledAt).toEqual(scheduledAt);
    expect(result.status).toBe(APPOINTMENT_STATUS.PENDING); // schema default
    expect(result.notes).toBe('Integration test');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('defaults notes to null when not provided', async () => {
    const result = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T11:00:00Z'),
    });

    expect(result.notes).toBeNull();
  });

  // ── findById ───────────────────────────────────────────────────────────────

  it('finds an appointment by id', async () => {
    const created = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T12:00:00Z'),
    });

    const found = await repo.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.petId).toBe(TEST_PET_ID);
  });

  it('returns null when appointment not found', async () => {
    const result = await repo.findById(99999);
    expect(result).toBeNull();
  });

  // ── findByDateRange ────────────────────────────────────────────────────────

  it('returns appointments within the date range, ordered by scheduledAt', async () => {
    // Create 3 appointments at different times
    const a1 = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T14:00:00Z'),
    });
    const a2 = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T10:00:00Z'),
    });
    const a3 = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-21T09:00:00Z'),
    });

    // Range: Jul 20 only
    const results = await repo.findByDateRange(
      new Date('2026-07-20T00:00:00Z'),
      new Date('2026-07-20T23:59:59Z'),
    );

    expect(results).toHaveLength(2);
    // Ordered ascending by scheduledAt
    expect(results[0].scheduledAt.getTime()).toBeLessThan(
      results[1].scheduledAt.getTime(),
    );
    const ids = results.map((r) => r.id);
    expect(ids).toContain(a1.id);
    expect(ids).toContain(a2.id);
    expect(ids).not.toContain(a3.id); // Jul 21 excluded
  });

  it('returns empty array when no appointments in range', async () => {
    const results = await repo.findByDateRange(
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-01T23:59:59Z'),
    );

    expect(results).toEqual([]);
  });

  it('includes boundary appointments (gte and lte)', async () => {
    const exactStart = new Date('2026-07-22T08:00:00Z');
    const exactEnd = new Date('2026-07-22T16:00:00Z');

    const startAppt = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: exactStart,
    });
    const endAppt = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: exactEnd,
    });

    const results = await repo.findByDateRange(exactStart, exactEnd);

    const ids = results.map((r) => r.id);
    expect(ids).toContain(startAppt.id);
    expect(ids).toContain(endAppt.id);
  });

  // ── existsByPetAndTime ────────────────────────────────────────────────────

  it('returns true when pet has appointment at exact time', async () => {
    const scheduledAt = new Date('2026-07-20T15:00:00Z');
    await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt,
    });

    const exists = await repo.existsByPetAndTime(TEST_PET_ID, scheduledAt);
    expect(exists).toBe(true);
  });

  it('returns false when pet has no appointment at that time', async () => {
    const exists = await repo.existsByPetAndTime(
      TEST_PET_ID,
      new Date('2026-07-20T16:00:00Z'),
    );
    expect(exists).toBe(false);
  });

  it('returns false for different pet at same time', async () => {
    const scheduledAt = new Date('2026-07-20T17:00:00Z');
    await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt,
    });

    const exists = await repo.existsByPetAndTime(TEST_PET_ID + 1, scheduledAt);
    expect(exists).toBe(false);
  });

  // ── update ─────────────────────────────────────────────────────────────────

  it('updates appointment status', async () => {
    const created = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T18:00:00Z'),
    });

    const updated = await repo.update(created.id, {
      status: APPOINTMENT_STATUS.CONFIRMED,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.status).toBe(APPOINTMENT_STATUS.CONFIRMED);
    expect(updated.petId).toBe(TEST_PET_ID); // unchanged fields preserved
  });

  it('updates notes', async () => {
    const created = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-20T19:00:00Z'),
    });

    const updated = await repo.update(created.id, {
      notes: 'Updated notes via integration test',
    });

    expect(updated.notes).toBe('Updated notes via integration test');
  });

  it('updates scheduled_at', async () => {
    const created = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-23T10:00:00Z'),
    });

    const newTime = new Date('2026-07-23T14:00:00Z');
    const updated = await repo.update(created.id, { scheduledAt: newTime });

    expect(updated.scheduledAt).toEqual(newTime);
  });

  it('updates multiple fields at once', async () => {
    const created = await repo.create({
      petId: TEST_PET_ID,
      clientId: TEST_CLIENT_ID,
      scheduledAt: new Date('2026-07-23T11:00:00Z'),
    });

    const newTime = new Date('2026-07-23T15:00:00Z');
    const updated = await repo.update(created.id, {
      status: APPOINTMENT_STATUS.CANCELLED,
      notes: 'Cancelled',
      scheduledAt: newTime,
    });

    expect(updated.status).toBe(APPOINTMENT_STATUS.CANCELLED);
    expect(updated.notes).toBe('Cancelled');
    expect(updated.scheduledAt).toEqual(newTime);
  });
});

import { prisma } from '@api/shared/infrastructure/prisma';
import { Appointment, CreateAppointmentInput } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';

/**
 * Prisma implementation of IAppointmentRepository.
 *
 * Rules enforced here:
 * - create defaults status to 0 (PENDING) via schema default
 * - findByDateRange uses gte/lte on scheduledAt
 * - existsByPetAndTime checks exact pet + scheduledAt match
 * - update only modifies status, notes, and scheduledAt
 * - Maps Prisma snake_case column names to domain camelCase fields
 */
export class PrismaAppointmentRepository implements IAppointmentRepository {
  async create(data: CreateAppointmentInput): Promise<Appointment> {
    const row = await prisma.appointment.create({
      data: {
        pet_id: data.petId,
        client_id: data.clientId,
        scheduledAt: data.scheduledAt,
        notes: data.notes ?? null,
        // status defaults to 0 (PENDING) via schema @default(0)
      },
    });

    return this.mapToAppointment(row);
  }

  async findById(id: number): Promise<Appointment | null> {
    const row = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!row) return null;

    return this.mapToAppointment(row);
  }

  async findByDateRange(start: Date, end: Date): Promise<Appointment[]> {
    const rows = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return rows.map((row) => this.mapToAppointment(row));
  }

  async existsByPetAndTime(
    petId: number,
    scheduledAt: Date,
  ): Promise<boolean> {
    const row = await prisma.appointment.findFirst({
      where: {
        pet_id: petId,
        scheduledAt,
      },
      select: { id: true },
    });

    return row !== null;
  }

  async update(
    id: number,
    data: Partial<Pick<Appointment, 'status' | 'notes' | 'scheduledAt'>>,
  ): Promise<Appointment> {
    const updatePayload: Record<string, unknown> = {};

    if (data.status !== undefined) updatePayload['status'] = data.status;
    if (data.notes !== undefined) updatePayload['notes'] = data.notes;
    if (data.scheduledAt !== undefined) updatePayload['scheduledAt'] = data.scheduledAt;

    const row = await prisma.appointment.update({
      where: { id },
      data: updatePayload,
    });

    return this.mapToAppointment(row);
  }

  // ── Private mapper ─────────────────────────────────────────────────────────

  private mapToAppointment(row: {
    id: number;
    pet_id: number;
    client_id: number;
    scheduledAt: Date;
    status: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Appointment {
    return {
      id: row.id,
      petId: row.pet_id,
      clientId: row.client_id,
      scheduledAt: row.scheduledAt,
      status: row.status as Appointment['status'],
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

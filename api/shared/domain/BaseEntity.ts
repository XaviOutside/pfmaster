/**
 * Base interface for all domain entities.
 * Every entity has a numeric surrogate key and audit timestamps.
 */
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company domain entity — zero framework or DB imports.
 * Status values are stored as TINYINT in MySQL: 0 = inactive, 1 = active.
 */
export type CompanyStatus = 0 | 1;

export const COMPANY_STATUS = {
  INACTIVE: 0 as CompanyStatus,
  ACTIVE: 1 as CompanyStatus,
} as const;

export interface Company {
  id: number;
  name: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

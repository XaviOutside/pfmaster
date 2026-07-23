import type { SessionWithUser } from '../../domain/Session';

/**
 * Response DTO for a successful login.
 * - role is a human-readable string ('admin' | 'employee'), not the raw TINYINT.
 * - token is the session UUID v4.
 */
export interface LoginResponseDto {
  token: string;
  user: {
    id: number;
    email: string;
    role: 'admin' | 'employee';
    companyId: number;
    companyName: string;
  };
}

/**
 * Maps a SessionWithUser (from repository JOIN) to a LoginResponseDto.
 * Converts TINYINT role to human-readable string.
 */
export function toLoginResponseDto(
  session: SessionWithUser,
  email: string,
): LoginResponseDto {
  return {
    token: session.token,
    user: {
      id: session.userId,
      email,
      role: session.role === 0 ? 'admin' : 'employee',
      companyId: session.companyId,
      companyName: session.companyName,
    },
  };
}

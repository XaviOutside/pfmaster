import { IAuthRepository } from '../domain/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly repository: IAuthRepository) {}

  async execute(token: string): Promise<void> {
    await this.repository.invalidateSession(token);
  }
}

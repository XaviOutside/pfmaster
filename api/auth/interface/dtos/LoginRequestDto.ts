/**
 * Request DTO for the login endpoint.
 * Both fields are required — validation happens in the controller and use case.
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

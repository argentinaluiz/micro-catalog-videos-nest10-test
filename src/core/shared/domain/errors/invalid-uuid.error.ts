export class InvalidUuidError extends Error {
  constructor(id: string) {
    super(`ID ${id} must be a valid UUID`);
    this.name = 'InvalidUuidError';
  }
}

import { ValueObject } from '../value-object';
import crypto from 'crypto';
export class Uuid extends ValueObject {
  readonly id: string;
  constructor(id?: string) {
    super();
    this.id = id || crypto.randomUUID();
  }

  toString() {
    return this.id;
  }
}

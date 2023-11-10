import { ValueObject } from '../value-object';

export abstract class ImageMedia extends ValueObject {
  readonly name: string;
  readonly location: string;

  constructor({ name, location }: { name: string; location: string }) {
    super();
    this.name = name;
    this.location = location;
  }

  destination() {
    return `${this.location}/${this.name}`;
  }

  toJSON() {
    return {
      name: this.name,
      location: this.location,
    };
  }
}

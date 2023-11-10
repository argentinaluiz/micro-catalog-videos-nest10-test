import isEqual from 'lodash/isEqual';

export abstract class ValueObject {
  public equals(obj: this): boolean {
    if (obj === null || obj === undefined) {
      return false;
    }

    if (obj.constructor.name !== this.constructor.name) {
      return false;
    }

    return isEqual(this, obj);
  }
}

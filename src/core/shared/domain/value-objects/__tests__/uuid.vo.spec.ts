import { validate as uuidValidate } from 'uuid';
import { Uuid } from '../uuid.vo';

describe('Uuid Unit Tests', () => {
  test('should accept a uuid passed in constructor', () => {
    const uuid = '9366b7dc-2d71-4799-b91c-c64adb205104';
    const vo = new Uuid(uuid);
    expect(vo.id).toBe(uuid);
  });

  test('should accept a uuid passed in constructor', () => {
    const vo = new Uuid();
    expect(uuidValidate(vo.id)).toBe(true);
  });
});

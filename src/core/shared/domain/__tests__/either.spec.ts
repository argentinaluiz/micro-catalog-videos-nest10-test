import { Either } from '../either';

describe('Either Unit Tests', () => {
  test('test ok', () => {
    const either = Either.ok<number>(1);
    expect(either.isOk()).toBeTruthy();
    expect(either.isFail()).toBeFalsy();
    expect(either.ok).toBe(1);
    expect(either.error).toBeNull();

    const [ok, error] = either;
    expect(ok).toBe(1);
    expect(error).toBeNull();
  });

  test('test fail', () => {
    const either = Either.fail(1);
    expect(either.isOk()).toBeFalsy();
    expect(either.isFail()).toBeTruthy();
    expect(either.ok).toBeNull();
    expect(either.error).toBe(1);

    const [ok, error] = either;
    expect(ok).toBeNull();
    expect(error).toBe(1);
  });

  test('test map method', () => {
    const either = Either.ok(1);
    const newEither = either
      .map((value) => value + 1)
      .map((value) => value + 1);
    expect(newEither.isOk()).toBeTruthy();
    expect(newEither.isFail()).toBeFalsy();
    expect(newEither.ok).toBe(3);
    expect(newEither.error).toBeNull();

    const either2 = Either.fail(1);
    //@ts-expect-error - this is a test
    const newEither2 = either2.map((value) => value + 1);
    expect(newEither2.isOk()).toBeFalsy();
    expect(newEither2.isFail()).toBeTruthy();
    expect(newEither2.ok).toBeNull();
    expect(newEither2.error).toBe(1);
  });

  test('chain method', () => {
    const either = Either.ok(1);
    const newEither = either
      .chain((value) => Either.ok(value + 1))
      .chain((value) => Either.ok(value + 1));
    expect(newEither.isOk()).toBeTruthy();
    expect(newEither.isFail()).toBeFalsy();
    expect(newEither.ok).toBe(3);
    expect(newEither.error).toBeNull();

    const either2 = Either.fail(1);
    //@ts-expect-error - this is a test
    const newEither2 = either2.chain((value) => Either.ok(value + 1));
    expect(newEither2.isOk()).toBeFalsy();
    expect(newEither2.isFail()).toBeTruthy();
    expect(newEither2.ok).toBeNull();
    expect(newEither2.error).toBe(1);
  });

  test('chainEach method', () => {
    const either1 = Either.ok(1);
    //@ts-expect-error - this is a test
    expect(() => either1.chainEach((value) => value)).toThrowError(
      'Method chainEach only works with arrays',
    );

    const either2 = Either.ok([1, 2, 3]);
    const newEither1 = either2
      .chainEach((value) => Either.ok(value + 1))
      .chainEach((value) => Either.ok(value + 1));
    expect(newEither1.isOk()).toBeTruthy();
    expect(newEither1.isFail()).toBeFalsy();
    expect(newEither1.ok).toEqual([3, 4, 5]);
    expect(newEither1.error).toBeNull();

    const either3 = Either.fail(1);
    //@ts-expect-error - this is a test
    const newEither2 = either3.chainEach((value) => Either.ok(value + 1));
    expect(newEither2.isOk()).toBeFalsy();
    expect(newEither2.isFail()).toBeTruthy();
    expect(newEither2.ok).toBeNull();
    expect(newEither2.error).toBe(1);
  });
});

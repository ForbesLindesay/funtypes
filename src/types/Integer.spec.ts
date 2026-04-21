import { readFileSync } from 'fs';
import * as ft from '..';

export const myInteger = ft.Integer();
export const myIntegerInRange = ft.Integer({ min: 1, max: 42 });
test('Integer', () => {
  expect(ft.showType(myInteger)).toEqual('Integer');

  // Not a number
  expect(() => myInteger.parse('42')).toThrowErrorMatchingInlineSnapshot(
    `"Expected number, but was "42" (i.e. a string literal)"`,
  );

  // Not an integer
  expect(() => myInteger.parse(3.14)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer between -9007199254740991 and 9007199254740991, but was 3.14"`,
  );

  // Infinity
  expect(() => myInteger.parse(1 / 0)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer between -9007199254740991 and 9007199254740991, but was Infinity"`,
  );
  // @ts-expect-error
  expect(() => myInteger.parse('hello' / 2)).toThrowErrorMatchingInlineSnapshot(
    `"NaN is not a valid number"`,
  );

  // Valid Integer
  expect(myInteger.parse(512)).toEqual(512);
  expect(myIntegerInRange.parse(1)).toEqual(1);
  expect(myIntegerInRange.parse(42)).toEqual(42);

  // Out of range
  expect(() => myIntegerInRange.parse(0)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer between 1 and 42, but was 0"`,
  );
  expect(() => myIntegerInRange.parse(43)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer between 1 and 42, but was 43"`,
  );

  expect(() => ft.Integer({ min: 3.14 })).toThrowErrorMatchingInlineSnapshot(
    `"Expected min (3.14) to be an integer"`,
  );
  expect(() => ft.Integer({ max: 3.14 })).toThrowErrorMatchingInlineSnapshot(
    `"Expected max (3.14) to be an integer"`,
  );
  expect(() => ft.Integer({ min: 5, max: 1 })).toThrowErrorMatchingInlineSnapshot(
    `"Expected min (5) to be less than max (1)"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Integer.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myInteger: ft.Codec<number>;
    export declare const myIntegerInRange: ft.Codec<number>;
    "
  `);
});

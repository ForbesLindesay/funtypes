import { readFileSync } from 'fs';
import * as ft from '..';

export const myInteger = ft.IntegerString();
export const myIntegerWithMin = ft.IntegerString({ min: `-2` });
export const myIntegerWithMax = ft.IntegerString({ max: `0` });
export const myIntegerInRange = ft.IntegerString({ min: `1`, max: `42` });

test('IntegerString', () => {
  expect(ft.showType(myInteger)).toEqual('IntegerString');

  // Not a string
  expect(() => myInteger.parse(42)).toThrowErrorMatchingInlineSnapshot(
    `"Expected string, but was 42"`,
  );

  // Not an integer
  expect(() => myInteger.parse(`3.14`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string, but was "3.14""`,
  );

  // Not a number string
  expect(() => myInteger.parse(`Hello World`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string, but was "Hello World""`,
  );

  // Valid Integer
  expect(myInteger.parse(`512`)).toEqual(`512`);
  expect(myInteger.parse(Number.MAX_SAFE_INTEGER.toString(10).repeat(2))).toEqual(
    Number.MAX_SAFE_INTEGER.toString(10).repeat(2),
  );
  expect(myIntegerInRange.parse(`1`)).toEqual(`1`);
  expect(myIntegerInRange.parse(`42`)).toEqual(`42`);

  // Out of range
  expect(() => myIntegerWithMin.parse(`-3`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string greater than or equal to "-2", but was "-3""`,
  );
  expect(myIntegerWithMin.parse(`-1`)).toEqual(`-1`);
  expect(() => myIntegerWithMax.parse(`1`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string less than or equal to "0", but was "1""`,
  );
  expect(myIntegerWithMax.parse(`0`)).toEqual(`0`);
  expect(() => myIntegerInRange.parse(`0`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string between "1" and "42", but was "0""`,
  );
  expect(() => myIntegerInRange.parse(`43`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string between "1" and "42", but was "43""`,
  );
  expect(() => myIntegerWithMin.parse(`-3`)).toThrowErrorMatchingInlineSnapshot(
    `"Expected an integer string greater than or equal to "-2", but was "-3""`,
  );

  // expect(() => ft.Integer({ min: 3.14 })).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected min (3.14) to be an integer"`,
  // );
  // expect(() => ft.Integer({ max: 3.14 })).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected max (3.14) to be an integer"`,
  // );
  // expect(() => ft.Integer({ min: 5, max: 1 })).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected min (5) to be less than max (1)"`,
  // );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/IntegerString.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myInteger: ft.Codec<\`\${number}\`>;
    export declare const myIntegerWithMin: ft.Codec<\`\${number}\`>;
    export declare const myIntegerWithMax: ft.Codec<\`\${number}\`>;
    export declare const myIntegerInRange: ft.Codec<\`\${number}\`>;
    "
  `);
});

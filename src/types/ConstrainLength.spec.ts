import { readFileSync } from 'fs';
import * as ft from '..';

export const myString = ft.ConstrainLength(ft.String, { min: 1 });
export const myArray = ft.ConstrainLength(ft.Array(ft.Number), { max: 3 });
test('ConstrainLength', () => {
  expect(ft.showType(myString)).toEqual('ConstrainLength<string, 1-9007199254740991>');
  expect(ft.showType(myArray)).toEqual('ConstrainLength<number[], 0-3>');

  expect(() => myString.parse('')).toThrowErrorMatchingInlineSnapshot(
    `"Expected length to be between 1 and 9007199254740991, but was 0"`,
  );
  expect(myString.parse('hello')).toBe('hello');

  expect(() => myArray.parse([1, 2, 3, 4, 5])).toThrowErrorMatchingInlineSnapshot(
    `"Expected length to be between 0 and 3, but was 5"`,
  );
  expect(myArray.parse([])).toEqual([]);
  expect(myArray.parse([1, 2, 3])).toEqual([1, 2, 3]);

  expect(() => ft.ConstrainLength(ft.String, { min: -1 })).toThrowErrorMatchingInlineSnapshot(
    `"Expected min (-1) to be greater than or equal to 0"`,
  );
  expect(() =>
    ft.ConstrainLength(ft.String, { min: 5, max: 3 }),
  ).toThrowErrorMatchingInlineSnapshot(`"Expected min (5) to be less than max (3)"`);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/ConstrainLength.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myString: ft.Codec<string>;
    export declare const myArray: ft.Codec<number[]>;
    "
  `);
});

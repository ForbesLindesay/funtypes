import { readFileSync } from 'fs';
import * as ft from '..';

const recordType = ft.Object({ value: ft.Literal(42) });
const record = { value: 42 };

export const array = ft.Array(recordType);
test('Array', () => {
  expect(ft.showType(array)).toEqual('{ value: 42 }[]');
  expect(array.safeParse([record, record, record])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        {
          "value": 42,
        },
        {
          "value": 42,
        },
        {
          "value": 42,
        },
      ],
    }
  `);
  expect(array.safeParse([record, 10, record])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{value: 42}, 10, {value: 42}] to { value: 42 }[]",
        [
          "The types of [1] are not compatible",
          [
            "Expected { value: 42 }, but was 10",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected { value: 42 }, but was 10",
      "success": false,
    }
  `);
});

export const readonlyArray = ft.ReadonlyArray(recordType);
test('ReadonlyArray', () => {
  expect(ft.showType(readonlyArray)).toEqual('readonly { value: 42 }[]');
  expect(readonlyArray.safeParse([record, record, record])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        {
          "value": 42,
        },
        {
          "value": 42,
        },
        {
          "value": 42,
        },
      ],
    }
  `);
  expect(readonlyArray.safeParse([record, 10, record])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{value: 42}, 10, {value: 42}] to readonly { value: 42 }[]",
        [
          "The types of [1] are not compatible",
          [
            "Expected { value: 42 }, but was 10",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected { value: 42 }, but was 10",
      "success": false,
    }
  `);
});

export const arrayOfUnions = ft.Array(ft.Union(ft.Literal(1), ft.Literal(2)));
test('Array(Union)', () => {
  expect(ft.showType(arrayOfUnions)).toEqual('(1 | 2)[]');
  expect(arrayOfUnions.safeParse([1, 2, 1, 2])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        1,
        2,
        1,
        2,
      ],
    }
  `);
  expect(arrayOfUnions.safeParse([1, 10, 2])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [1, 10, 2] to (1 | 2)[]",
        [
          "The types of [1] are not compatible",
          [
            "Expected 1 | 2, but was 10",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected 1 | 2, but was 10",
      "success": false,
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/array.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const array: ft.Codec<{
        value: 42;
    }[]>;
    export declare const readonlyArray: ft.Codec<readonly {
        value: 42;
    }[]>;
    export declare const arrayOfUnions: ft.Codec<(1 | 2)[]>;
    "
  `);
});

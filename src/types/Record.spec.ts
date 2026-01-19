import { readFileSync } from 'fs';
import * as ft from '..';

const recordType = ft.Object({ value: ft.Literal(42) });
const record = { value: 42 };

export const StringRecord = ft.Record(ft.String, recordType);
test('StringRecord', () => {
  expect(ft.showType(StringRecord)).toMatchInlineSnapshot(`"Record<string, { value: 42 }>"`);
  expect(StringRecord.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
  expect(StringRecord.safeParse({ foo: record, bar: { value: 24 } })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "The types of bar are not compatible",
        [
          "Unable to assign {value: 24} to { value: 42 }",
          [
            "The types of "value" are not compatible",
            [
              "Expected literal 42, but was 24",
            ],
          ],
        ],
      ],
      "key": "bar.value",
      "message": "Expected literal 42, but was 24",
      "success": false,
    }
  `);
});

const NumberRecord = ft.Record(ft.Number, recordType);
test('NumberRecord', () => {
  expect(ft.showType(NumberRecord)).toMatchInlineSnapshot(`"Record<number, { value: 42 }>"`);
  expect(NumberRecord.safeParse({ 4: record, 3.14: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "3.14": {
          "value": 42,
        },
        "4": {
          "value": 42,
        },
      },
    }
  `);
  expect(NumberRecord.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    {
      "message": "Expected record key to be a number, but was "foo"",
      "success": false,
    }
  `);
});

test('Using Object.create', () => {
  const record = Object.create(null);
  record.value = 42;
  const outer = Object.create(null);
  outer.foo = record;
  outer.bar = record;
  expect(StringRecord.safeParse(outer)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
  const outer2 = Object.create(null);
  outer2.foo = record;
  outer2.bar = { value: 24 };
  expect(StringRecord.safeParse(outer2)).toMatchInlineSnapshot(`
    {
      "fullError": [
        "The types of bar are not compatible",
        [
          "Unable to assign {value: 24} to { value: 42 }",
          [
            "The types of "value" are not compatible",
            [
              "Expected literal 42, but was 24",
            ],
          ],
        ],
      ],
      "key": "bar.value",
      "message": "Expected literal 42, but was 24",
      "success": false,
    }
  `);
});

export const IntegerRecord = ft.Record(
  ft.Constraint(ft.Number, v => v === Math.floor(v), { name: 'Integer' }),
  recordType,
);
test('IntegerRecord', () => {
  expect(ft.showType(IntegerRecord)).toMatchInlineSnapshot(`"Record<Integer, { value: 42 }>"`);
  expect(IntegerRecord.safeParse({ 4: record, 2: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "2": {
          "value": 42,
        },
        "4": {
          "value": 42,
        },
      },
    }
  `);
  expect(IntegerRecord.safeParse({ 4: record, 3.14: record })).toMatchInlineSnapshot(`
    {
      "message": "Expected record key to be Integer, but was "3.14"",
      "success": false,
    }
  `);
});

export const UnionRecord = ft.Record(ft.Union(ft.Literal('foo'), ft.Literal('bar')), recordType);
test('UnionRecord - strings', () => {
  expect(ft.showType(UnionRecord)).toMatchInlineSnapshot(`"Record<"foo" | "bar", { value: 42 }>"`);
  expect(UnionRecord.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
  expect(UnionRecord.safeParse({ 10: record })).toMatchInlineSnapshot(`
    {
      "message": "Expected record key to be "foo" | "bar", but was "10"",
      "success": false,
    }
  `);
});

export const UnionNumbersRecord = ft.Record(ft.Union(ft.Literal(24), ft.Literal(42)), recordType);
test('UnionRecord - numbers', () => {
  expect(ft.showType(UnionNumbersRecord)).toMatchInlineSnapshot(`"Record<24 | 42, { value: 42 }>"`);
  expect(UnionNumbersRecord.safeParse({ 24: record, 42: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "24": {
          "value": 42,
        },
        "42": {
          "value": 42,
        },
      },
    }
  `);
  expect(UnionNumbersRecord.safeParse({ 10: record })).toMatchInlineSnapshot(`
    {
      "message": "Expected record key to be 24 | 42, but was "10"",
      "success": false,
    }
  `);
});

export const UnionMixedRecord = ft.Record(ft.Union(ft.Literal('foo'), ft.Literal(42)), recordType);
test('UnionRecord - mixed', () => {
  expect(ft.showType(UnionMixedRecord)).toMatchInlineSnapshot(
    `"Record<"foo" | 42, { value: 42 }>"`,
  );
  expect(UnionMixedRecord.safeParse({ foo: record, 42: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "42": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
  expect(UnionMixedRecord.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    {
      "message": "Expected record key to be "foo" | 42, but was "bar"",
      "success": false,
    }
  `);
});

export const ParsedStringsRecord = ft.Record(
  ft.String.withParser({
    parse: x => {
      return { success: true, value: x.toLowerCase() };
    },
  }),
  recordType,
);
test('Parsed Strings Record', () => {
  expect(ft.showType(ParsedStringsRecord)).toMatchInlineSnapshot(
    `"Record<ParsedValue<string>, { value: 42 }>"`,
  );
  expect(ParsedStringsRecord.safeParse({ FOO: record, Bar: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
});

export const BrandedStringsRecord = ft.Record(ft.Brand('MyBrand', ft.String), recordType);
test('Branded Strings Record - strings', () => {
  expect(BrandedStringsRecord.safeParse({ foo: record, bar: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": {
          "value": 42,
        },
        "foo": {
          "value": 42,
        },
      },
    }
  `);
  expect(BrandedStringsRecord.safeParse({ 10: record })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "10": {
          "value": 42,
        },
      },
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Record.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const StringRecord: ft.Codec<{
        [x: string]: {
            value: 42;
        } | undefined;
    }>;
    export declare const IntegerRecord: ft.Codec<{
        [x: number]: {
            value: 42;
        } | undefined;
    }>;
    export declare const UnionRecord: ft.Codec<{
        foo?: {
            value: 42;
        } | undefined;
        bar?: {
            value: 42;
        } | undefined;
    }>;
    export declare const UnionNumbersRecord: ft.Codec<{
        42?: {
            value: 42;
        } | undefined;
        24?: {
            value: 42;
        } | undefined;
    }>;
    export declare const UnionMixedRecord: ft.Codec<{
        42?: {
            value: 42;
        } | undefined;
        foo?: {
            value: 42;
        } | undefined;
    }>;
    export declare const ParsedStringsRecord: ft.Codec<{
        [x: string]: {
            value: 42;
        } | undefined;
    }>;
    export declare const BrandedStringsRecord: ft.Codec<{
        [x: string & {
                readonly __type__: "MyBrand";
            }]: {
            value: 42;
        } | undefined;
    }>;
    "
  `);
});

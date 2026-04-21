import { readFileSync } from 'fs';
import * as ft from '..';

export const myDateTimeString = ft.DateTimeString();
export const myLaxDateTimeString = ft.DateTimeString({ strict: false });
export const myDateInRange = ft.DateTimeString({
  min: new Date('2020-01-01'),
  max: new Date('2022-12-31'),
});
test('DateTime', () => {
  expect(ft.showType(myDateTimeString)).toEqual('DateTimeString');

  // Not really a string
  expect(() => myDateTimeString.parse(42)).toThrowErrorMatchingInlineSnapshot(
    `"Expected string, but was 42"`,
  );

  // Not a valid strict DateTimeString
  expect(() => myDateTimeString.parse('2025-01-01')).toThrowErrorMatchingInlineSnapshot(
    `""2025-01-01" is not a valid date in the full ISO8601 format."`,
  );
  expect(myLaxDateTimeString.parse('2025-01-01')).toEqual(`2025-01-01`);
  expect(() => myDateTimeString.parse('2025-02-30T00:00:00Z')).toThrowErrorMatchingInlineSnapshot(
    `""2025-02-30T00:00:00Z" is not a valid date in the full ISO8601 format."`,
  );

  // Not a valid lax DateTimeString
  expect(() => myLaxDateTimeString.parse('whatever')).toThrowErrorMatchingInlineSnapshot(
    `""whatever" is not a valid date"`,
  );

  // Valid strict

  expect(myDateTimeString.parse('2025-02-28T00:00:00Z')).toEqual(`2025-02-28T00:00:00Z`);

  // Out of range
  expect(() => myDateInRange.parse('2000-02-28T00:00:00Z')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date on or after 2020-01-01T00:00:00.000Z, but was "2000-02-28T00:00:00Z""`,
  );
  expect(() => myDateInRange.parse('2030-02-28T00:00:00Z')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date on or before 2022-12-31T00:00:00.000Z, but was "2030-02-28T00:00:00Z""`,
  );

  expect(() => ft.DateTimeString({ min: new Date(1 / 0) })).toThrowErrorMatchingInlineSnapshot(
    `"min is not a valid date."`,
  );
  expect(() => ft.DateTimeString({ max: new Date(1 / 0) })).toThrowErrorMatchingInlineSnapshot(
    `"max is not a valid date."`,
  );
  expect(() =>
    ft.DateTimeString({ min: new Date('2025-01-01'), max: new Date('2024-01-01') }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Expected min (2025-01-01T00:00:00.000Z) to be less than max (2024-01-01T00:00:00.000Z)"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/DateTimeString.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myDateTimeString: ft.Codec<\`\${number}-\${number}-\${number}T\${number}:\${number}:\${number}Z\`>;
    export declare const myLaxDateTimeString: ft.Codec<string>;
    export declare const myDateInRange: ft.Codec<\`\${number}-\${number}-\${number}T\${number}:\${number}:\${number}Z\`>;
    "
  `);
});

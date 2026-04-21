import { readFileSync } from 'fs';
import * as ft from '..';

export const myDate = ft.ParsedDateString();
export const myDateInRange = ft.ParsedDateString({ min: '2020-01-01', max: '2022-12-31' });
test('ParsedDateString', () => {
  expect(ft.showType(myDate)).toEqual('Date');

  // Not the right string format
  expect(() => myDate.parse('')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "0000-01-01" and "9999-12-30", but was """`,
  );

  // Not a real date (i.e. 30th Feb)
  expect(() => myDate.parse('2025-02-30')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "0000-01-01" and "9999-12-30", but was "2025-02-30""`,
  );

  // Valid Date
  expect(myDate.parse('2025-02-28').toISOString()).toEqual(`2025-02-28T00:00:00.000Z`);
  expect(myDate.parse('2025-06-01').toISOString()).toEqual(`2025-06-01T00:00:00.000Z`);
  expect(myDateInRange.parse('2020-01-01').toISOString()).toEqual(`2020-01-01T00:00:00.000Z`);
  expect(myDateInRange.parse('2022-12-31').toISOString()).toEqual(`2022-12-31T00:00:00.000Z`);
  expect(myDate.serialize(new Date(`2025-06-01T00:00:00.000Z`))).toEqual('2025-06-01');

  // Serialize with time part
  expect(() =>
    myDate.serialize(new Date(`2025-06-01T01:00:00.000Z`)),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Expected a Date with no time portion but got 2025-06-01T01:00:00.000Z"`,
  );

  // Out of range
  expect(() => myDateInRange.parse('2023-01-01')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "2020-01-01" and "2022-12-31", but was "2023-01-01""`,
  );

  expect(() => ft.ParsedDateString({ min: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
    `"Expected min ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  );
  expect(() => ft.ParsedDateString({ max: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
    `"Expected max ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  );
  expect(() =>
    ft.ParsedDateString({ min: '2025-01-01', max: '2024-01-01' }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Expected min ("2025-01-01") to be less than max ("2024-01-01")"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/ParsedDateString.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myDate: ft.Codec<Date>;
    export declare const myDateInRange: ft.Codec<Date>;
    "
  `);
});

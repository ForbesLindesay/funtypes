import { readFileSync } from 'fs';
import * as ft from '..';

export const myDateTime = ft.DateTime();
export const myDateInRange = ft.DateTime({
  min: new Date('2020-01-01'),
  max: new Date('2022-12-31'),
});
test('DateTime', () => {
  expect(ft.showType(myDateTime)).toEqual('Date');

  // Not really a Date
  expect(() => myDateTime.parse('2022-12-31')).toThrowErrorMatchingInlineSnapshot(
    `"Expected Date, but was "2022-12-31""`,
  );

  // Not a valid Date
  expect(() => myDateTime.parse(new Date(1 / 0))).toThrowErrorMatchingInlineSnapshot(
    `"[INVALID DATE] is not a valid date"`,
  );

  // Valid Date
  expect(myDateTime.parse(new Date('2025-02-28T00:00:00.000Z')).toISOString()).toEqual(
    `2025-02-28T00:00:00.000Z`,
  );
  expect(myDateInRange.parse(new Date('2020-01-01T00:00:00.000Z')).toISOString()).toEqual(
    `2020-01-01T00:00:00.000Z`,
  );
  expect(myDateInRange.parse(new Date('2022-12-31T00:00:00.000Z')).toISOString()).toEqual(
    `2022-12-31T00:00:00.000Z`,
  );

  // Out of range
  expect(() => myDateInRange.parse(new Date('2023-01-01'))).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date on or before 2022-12-31T00:00:00.000Z, but was 2023-01-01T00:00:00.000Z"`,
  );

  // expect(() => ft.DateString({ min: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected min ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  // );
  // expect(() => ft.DateString({ max: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected max ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  // );
  // expect(() =>
  //   ft.DateString({ min: '2025-01-01', max: '2024-01-01' }),
  // ).toThrowErrorMatchingInlineSnapshot(
  //   `"Expected min ("2025-01-01") to be less than max ("2024-01-01")"`,
  // );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/DateTime.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myDateTime: ft.Codec<Date>;
    export declare const myDateInRange: ft.Codec<Date>;
    "
  `);
});

import { readFileSync } from 'fs';
import * as ft from '..';

export const myDate = ft.DateString();
export const myDateInRange = ft.DateString({ min: '2020-01-01', max: '2022-12-31' });
test('DateString', () => {
  expect(ft.showType(myDate)).toEqual('DateString');

  // Not the right string format
  expect(() => myDate.parse('')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "0000-01-01" and "9999-12-30", but was """`,
  );

  // Not a real date (i.e. 30th Feb)
  expect(() => myDate.parse('2025-02-30')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "0000-01-01" and "9999-12-30", but was "2025-02-30""`,
  );

  // Valid Date
  expect(myDate.parse('2025-02-28')).toEqual(`2025-02-28`);
  expect(myDateInRange.parse('2020-01-01')).toEqual(`2020-01-01`);
  expect(myDateInRange.parse('2022-12-31')).toEqual(`2022-12-31`);

  // Out of range
  expect(() => myDateInRange.parse('2023-01-01')).toThrowErrorMatchingInlineSnapshot(
    `"Expected a date in form "yyyy-mm-dd" between "2020-01-01" and "2022-12-31", but was "2023-01-01""`,
  );

  expect(() => ft.DateString({ min: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
    `"Expected min ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  );
  expect(() => ft.DateString({ max: '2025-02-30' })).toThrowErrorMatchingInlineSnapshot(
    `"Expected max ("2025-02-30") to be a valid date string in the form "yyyy-mm-dd""`,
  );
  expect(() =>
    ft.DateString({ min: '2025-01-01', max: '2024-01-01' }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Expected min ("2025-01-01") to be less than max ("2024-01-01")"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/DateString.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myDate: ft.Codec<\`\${number}-\${number}-\${number}\`>;
    export declare const myDateInRange: ft.Codec<\`\${number}-\${number}-\${number}\`>;
    "
  `);
});

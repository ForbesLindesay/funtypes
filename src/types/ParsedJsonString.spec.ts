import { readFileSync } from 'fs';
import * as ft from '..';

export const myUnknownJsonString = ft.ParsedJsonString();
export const myJsonObject = ft.ParsedJsonString(
  ft.Object({
    date: ft.ParsedDateString(),
  }),
);

test('ParsedJsonString', () => {
  expect(ft.showType(myUnknownJsonString)).toEqual('ParsedJsonString<unknown>');
  expect(ft.showType(myJsonObject)).toEqual('ParsedJsonString<{ date: Date }>');

  // Not valid JSON
  expect(() => myUnknownJsonString.parse('')).toThrowErrorMatchingInlineSnapshot(
    `"Invalid JSON: Unexpected end of JSON input"`,
  );

  // Valid JSON
  expect(myUnknownJsonString.parse('"Hello World"')).toEqual('Hello World');

  // Valid JSON but doesn't match the base codec
  expect(() => myJsonObject.parse('{}')).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {} to { date: Date }
      The types of "date" are not compatible
        Expected string, but was undefined"
  `);
  expect(() => myJsonObject.parse('{"date": "whatever"}')).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {date: "whatever"} to { date: Date }
      The types of "date" are not compatible
        Expected a date in form "yyyy-mm-dd" between "0000-01-01" and "9999-12-30", but was "whatever""
  `);

  // Valid JSON matching the base codec
  expect(myJsonObject.parse(`{"date": "2025-01-01"}`).date.toISOString()).toEqual(
    '2025-01-01T00:00:00.000Z',
  );
  expect(myJsonObject.serialize({ date: new Date('2025-01-01T00:00:00.000Z') })).toEqual(
    `{"date":"2025-01-01"}`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/ParsedJsonString.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myUnknownJsonString: ft.Codec<unknown>;
    export declare const myJsonObject: ft.Codec<{
        date: Date;
    }>;
    "
  `);
});

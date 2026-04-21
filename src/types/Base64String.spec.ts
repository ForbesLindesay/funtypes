import { readFileSync } from 'fs';
import * as ft from '..';

export const myString = ft.Base64String();
test('Base64String', () => {
  expect(ft.showType(myString)).toEqual('Base64String');
  expect(myString.parse(``)).toBe(``);
  expect(myString.parse(`U29tZSBCYXNlNjQgU3RyaW5nIQ==`)).toBe(`U29tZSBCYXNlNjQgU3RyaW5nIQ==`);
  expect(myString.safeParse(`=foo=`)).toEqual({
    message: `Expected a base64 encoded string, but was "=foo="`,
    success: false,
  });
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Base64String.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myString: ft.Codec<string>;
    "
  `);
});

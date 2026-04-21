import { readFileSync } from 'fs';
import * as ft from '..';

export const myEncodedObject = ft.ChainCodecs(
  ft.ParsedBase64String(),
  ft.ParsedJsonString(ft.Object({ value: ft.String })),
);
test('Base64String', () => {
  expect(ft.showType(myEncodedObject)).toEqual(
    'Chain<Base64EncodedString, ParsedJsonString<{ value: string }>>',
  );
  const encoded = Buffer.from(JSON.stringify({ value: 'Hello, World!' })).toString('base64');
  expect(myEncodedObject.parse(encoded)).toEqual({ value: 'Hello, World!' });
  expect(myEncodedObject.serialize({ value: 'Hello, World!' })).toBe(encoded);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/ChainCodecs.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const myEncodedObject: ft.Codec<{
        value: string;
    }>;
    "
  `);
});

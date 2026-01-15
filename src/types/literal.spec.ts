import { readFileSync } from 'fs';
import * as ft from '..';

export const N = ft.Null;
export const U = ft.Undefined;
export const Str = ft.Literal('42');
export const Num = ft.Literal(42);
export const Boo = ft.Literal(true);

function expectLiteral<T>(codec: ft.Codec<T>, value: T) {
  expect(codec.safeParse(value)).toEqual({ success: true, value });
}
test('Literal', () => {
  expect(ft.showType(N)).toBe('null');
  expect(ft.showType(U)).toBe('undefined');
  expect(ft.showType(Str)).toBe('"42"');
  expect(ft.showType(Num)).toBe('42');
  expect(ft.showType(Boo)).toBe('true');

  expectLiteral(N, null);
  expectLiteral(U, undefined);
  expectLiteral(Str, '42');
  expectLiteral(Num, 42);
  expectLiteral(Boo, true);

  expect(N.safeParse(undefined)).toMatchInlineSnapshot(`
    {
      "message": "Expected literal null, but was undefined",
      "success": false,
    }
  `);
  expect(N.safeParse('hello')).toMatchInlineSnapshot(`
    {
      "message": "Expected literal null, but was "hello" (i.e. a string)",
      "success": false,
    }
  `);
  expect(U.safeParse(null)).toMatchInlineSnapshot(`
    {
      "message": "Expected literal undefined, but was null",
      "success": false,
    }
  `);

  expect(Str.safeParse({ hello: '42' })).toMatchInlineSnapshot(`
    {
      "message": "Expected literal "42", but was {hello: "42"} (i.e. an object)",
      "success": false,
    }
  `);
  expect(Str.safeParse(['42'])).toMatchInlineSnapshot(`
    {
      "message": "Expected literal "42", but was ["42"] (i.e. an array)",
      "success": false,
    }
  `);
  expect(Str.safeParse(42)).toMatchInlineSnapshot(`
    {
      "message": "Expected literal "42", but was 42 (i.e. a number)",
      "success": false,
    }
  `);
  expect(Str.safeParse('hello world')).toMatchInlineSnapshot(`
    {
      "message": "Expected literal "42", but was "hello world"",
      "success": false,
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/literal.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const N: ft.Codec<null>;
    export declare const U: ft.Codec<undefined>;
    export declare const Str: ft.Codec<"42">;
    export declare const Num: ft.Codec<42>;
    export declare const Boo: ft.Codec<true>;
    "
  `);
});

import { readFileSync } from 'fs';

import * as ft from '..';

export const StringObjectKeys = ft.KeyOf({
  foo: 1,
  bar: 2,
});

export const NumericObjectKeys = ft.KeyOf({
  2: 1,
  4: '2',
});

export const MixedObjectKeys = ft.KeyOf({
  foo: 'bar',
  5: 1,
  '4': 3, // a known issue is that at runtime we'll allow the number 4 here, but there's no good way to tell TypeScript we won't only accept the string "4"
});

test('Numeric Object Keys', () => {
  expect(NumericObjectKeys.safeParse(2)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": 2,
    }
  `);
  expect(NumericObjectKeys.safeParse('2')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "2",
    }
  `);
  expect(NumericObjectKeys.safeParse('foobar')).toMatchInlineSnapshot(`
    {
      "message": "Expected "2" | "4", but was "foobar"",
      "success": false,
    }
  `);
  expect(NumericObjectKeys.safeParse('5')).toMatchInlineSnapshot(`
    {
      "message": "Expected "2" | "4", but was "5"",
      "success": false,
    }
  `);
  expect(NumericObjectKeys.parse(2)).toBe(2);

  expect(ft.showType(NumericObjectKeys)).toMatchInlineSnapshot(`""2" | "4""`);
});

test('String Object Keys', () => {
  expect(StringObjectKeys.safeParse('foo')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "foo",
    }
  `);
  expect(StringObjectKeys.safeParse(55)).toMatchInlineSnapshot(`
    {
      "message": "Expected "bar" | "foo", but was 55",
      "success": false,
    }
  `);
  expect(StringObjectKeys.parse('bar')).toBe('bar');

  expect(ft.showType(StringObjectKeys)).toMatchInlineSnapshot(`""bar" | "foo""`);
});

test('Mixed Object Keys', () => {
  expect(MixedObjectKeys.safeParse('foo')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "foo",
    }
  `);
  expect(MixedObjectKeys.safeParse(5)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": 5,
    }
  `);
  expect(MixedObjectKeys.safeParse('foobar')).toMatchInlineSnapshot(`
    {
      "message": "Expected "4" | "5" | "foo", but was "foobar"",
      "success": false,
    }
  `);
  expect(MixedObjectKeys.safeParse(4)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": 4,
    }
  `);
  expect(MixedObjectKeys.parse('4')).toBe('4');
  expect(MixedObjectKeys.parse(5)).toBe(5);

  expect(ft.showType(MixedObjectKeys)).toMatchInlineSnapshot(`""4" | "5" | "foo""`);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/KeyOf.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const StringObjectKeys: ft.Codec<"foo" | "bar">;
    export declare const NumericObjectKeys: ft.Codec<2 | "2" | 4 | "4">;
    export declare const MixedObjectKeys: ft.Codec<"foo" | "4" | "5" | 5>;
    "
  `);
});

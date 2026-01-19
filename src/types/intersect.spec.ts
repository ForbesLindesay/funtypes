import { readFileSync } from 'fs';

import * as ft from '..';
import { success } from '../result';

// This is a super odd/unhelpful type that just JSON.stringify's whatever you
// attempt to parse
const ConvertIntoJSON = ft.ParsedValue(ft.Unknown, {
  name: 'ConvertIntoJSON',
  parse(value) {
    return success(JSON.stringify(value));
  },
});

const URLString = ft.ParsedValue(ft.String, {
  name: 'URLString',
  parse(value) {
    try {
      return success(new URL(value));
    } catch (ex) {
      return { success: false, message: `Expected a valid URL but got '${value}'` };
    }
  },
});

const NameRecord = ft.Object({ name: ft.String });
const UrlRecord = ft.Object({ url: URLString });
export const NamedURL = ft.Intersect(NameRecord, UrlRecord);

test('Intersect can handle object keys being converted', () => {
  expect(NamedURL.safeParse({ name: 'example', url: 'http://example.com/foo/../' }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "name": "example",
        "url": "http://example.com/",
      },
    }
  `);

  expect(NamedURL.safeParse({ name: 'example', url: 'not a url' })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {name: "example", url: "not a url"} to { url: URLString }",
        [
          "The types of "url" are not compatible",
          [
            "Expected a valid URL but got 'not a url'",
          ],
        ],
      ],
      "key": "url",
      "message": "Expected a valid URL but got 'not a url'",
      "success": false,
    }
  `);

  expect(ft.showType(NamedURL)).toBe('{ name: string; url: URLString }');
});

test('Intersect does not allow the values themselves to be converted', () => {
  expect(
    ft.Intersect(NamedURL, ConvertIntoJSON).safeParse({
      name: 'example',
      url: 'http://example.com/foo/../',
    }),
  ).toMatchInlineSnapshot(`
    {
      "message": "The validator ConvertIntoJSON attempted to convert the type of this value from an object to something else. That conversion is not valid as the child of an intersect",
      "success": false,
    }
  `);
});

const nameTuplePart = ft.Tuple(ft.String, ft.Unknown);
const urlTuplePart = ft.Tuple(ft.Unknown, URLString);
export const intersectedTuple = ft.Intersect(nameTuplePart, urlTuplePart);
test('Intersect can handle tuple entries being converted', () => {
  expect(intersectedTuple.safeParse(['example', 'http://example.com/foo/../']))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        "example",
        "http://example.com/",
      ],
    }
  `);
  expect(intersectedTuple.safeParse(['example', 'not a url'])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign ["example", "not a url"] to [unknown, URLString]",
        [
          "The types of [1] are not compatible",
          [
            "Expected a valid URL but got 'not a url'",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected a valid URL but got 'not a url'",
      "success": false,
    }
  `);

  expect(
    ft
      .Intersect(intersectedTuple, ConvertIntoJSON)
      .safeParse(['example', 'http://example.com/foo/../']),
  ).toMatchInlineSnapshot(`
    {
      "message": "The validator ConvertIntoJSON attempted to convert the type of this value from an array to something else. That conversion is not valid as the child of an intersect",
      "success": false,
    }
  `);
});

export const IntersectStringAndBrand = ft.Intersect(ft.String, ft.Brand('my_brand', ft.Unknown));
test('Intersect can handle String + Brand', () => {
  expect(IntersectStringAndBrand.safeParse('hello world')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "hello world",
    }
  `);
  expect(IntersectStringAndBrand.safeParse(42)).toMatchInlineSnapshot(`
    {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
});

const objUnion = ft.Union(ft.Object({ a: ft.Number }), ft.Object({ b: ft.String }));
export const IntersectUnions = ft.Intersect(
  objUnion,
  ft.Object({ c: ft.Boolean }),
  ft.Object({ d: ft.Boolean }),
);
test('IntersectedUnions', () => {
  expect(ft.showType(IntersectUnions)).toMatchInlineSnapshot(
    `"({ a: number } | { b: string }) & { c: boolean } & { d: boolean }"`,
  );
});

test('Intersect validates its inputs', () => {
  expect(() => ft.Intersect([ft.String, ft.Unknown] as any)).toThrowErrorMatchingInlineSnapshot(
    `"Expected Runtype but got [Runtype<string>, Runtype<unknown>]"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/intersect.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const NamedURL: ft.ObjectCodec<{
        name: string;
        url: URL;
    }>;
    export declare const intersectedTuple: ft.Codec<[string, unknown] & [unknown, URL]>;
    export declare const IntersectStringAndBrand: ft.Codec<string & {
        readonly __type__: "my_brand";
    }>;
    export declare const IntersectUnions: ft.Codec<({
        a: number;
    } | {
        b: string;
    }) & {
        c: boolean;
    } & {
        d: boolean;
    }>;
    "
  `);
});

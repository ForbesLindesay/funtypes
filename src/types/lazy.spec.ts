import { readFileSync } from 'fs';
import * as ft from '..';

export type MyRecursiveType = { next: MyRecursiveType | null };
export const MyRecursiveSchema = ft.Lazy(
  (): ft.Codec<MyRecursiveType> => ft.Object({ next: ft.Union(ft.Null, MyRecursiveSchema) }),
);

test('Lazy', () => {
  expect(ft.showType(MyRecursiveSchema)).toMatchInlineSnapshot(
    `"{ next: null | (CIRCULAR object) }"`,
  );
  expect(MyRecursiveSchema.safeParse({ next: { next: { next: null } } })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "next": {
          "next": {
            "next": null,
          },
        },
      },
    }
  `);
  expect(MyRecursiveSchema.safeParse({ next: { next: { next: 42 } } })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {next: {next: {next: 42}}} to { next: null | (CIRCULAR object) }",
        [
          "The types of "next" are not compatible",
          [
            "Unable to assign {next: {next: 42}} to null | { next: CIRCULAR union }",
            [
              "Unable to assign {next: {next: 42}} to null",
              [
                "Expected literal null, but was {next: {next: 42}}",
              ],
            ],
            [
              "And unable to assign {next: {next: 42}} to { next: null | (CIRCULAR object) }",
              [
                "The types of "next" are not compatible",
                [
                  "Unable to assign {next: 42} to null | { next: CIRCULAR union }",
                  [
                    "Unable to assign {next: 42} to null",
                    [
                      "Expected literal null, but was {next: 42}",
                    ],
                  ],
                  [
                    "And unable to assign {next: 42} to { next: null | (CIRCULAR object) }",
                    [
                      "The types of "next" are not compatible",
                      [
                        "Unable to assign 42 to null | { next: CIRCULAR union }",
                        [
                          "Unable to assign 42 to null",
                          [
                            "Expected literal null, but was 42 (i.e. a number)",
                          ],
                        ],
                        [
                          "And unable to assign 42 to { next: null | (CIRCULAR object) }",
                          [
                            "Expected { next: null | (CIRCULAR object) }, but was 42",
                          ],
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
      "key": "next",
      "message": "Expected null | { next: CIRCULAR union }, but was {next: {next: 42}}",
      "success": false,
    }
  `);
  const circularObj: MyRecursiveType = { next: null };
  circularObj.next = circularObj;
  expect(MyRecursiveSchema.safeParse(circularObj)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "next": [Circular],
      },
    }
  `);
});

const UrlString = ft.ParsedValue(ft.String, {
  parse: x => {
    try {
      return { success: true, value: new URL(x) };
    } catch {
      return { success: false, message: `Invalid URL: ${x}` };
    }
  },
});
type MyRecursiveParsedType = {
  next: MyRecursiveParsedType | null;
  value: ft.Static<typeof UrlString>;
};
export const MyRecursiveParsedSchema = ft.Lazy(
  (): ft.Codec<MyRecursiveParsedType> =>
    ft.Object({
      next: ft.Union(ft.Null, MyRecursiveParsedSchema),
      value: UrlString,
    }),
);

test('Lazy with ParsedValue', () => {
  expect(ft.showType(MyRecursiveParsedSchema)).toMatchInlineSnapshot(
    `"{ next: null | (CIRCULAR object); value: ParsedValue<string> }"`,
  );
  const input: any = { next: null, value: 'https://example.com' };
  input.next = input;
  const output = MyRecursiveParsedSchema.parse(input);
  expect(output.next).toBe(output);
  expect(output.value.href).toEqual('https://example.com/');
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/lazy.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export type MyRecursiveType = {
        next: MyRecursiveType | null;
    };
    export declare const MyRecursiveSchema: ft.Codec<MyRecursiveType>;
    declare const UrlString: ft.Codec<URL>;
    type MyRecursiveParsedType = {
        next: MyRecursiveParsedType | null;
        value: ft.Static<typeof UrlString>;
    };
    export declare const MyRecursiveParsedSchema: ft.Codec<MyRecursiveParsedType>;
    export {};
    "
  `);
});

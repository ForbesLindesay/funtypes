import { readFileSync } from 'fs';
import * as ft from '..';

const ObjectType = ft.Object({
  a: ft.Number,
  b: ft.String,
  c: ft.Boolean,
});
export const MyOmitedType = ft.Omit(ObjectType, ['b']);

test('Omit(Object)', () => {
  expect(ft.showType(MyOmitedType)).toMatchInlineSnapshot(`"{ a: number; c: boolean }"`);
  expect(MyOmitedType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

export const MyNamedOmitedType = ft.Omit(ft.Named('MyName', ObjectType), ['b']);
test('Omit(Named(Object))', () => {
  expect(ft.showType(MyNamedOmitedType)).toMatchInlineSnapshot(`"Omit<MyName, "b">"`);
  expect(MyNamedOmitedType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

export const MyOmitedIntersectionType = ft.Omit(
  ft.Intersect(
    ft.Object({
      a: ft.Number,
      b: ft.String,
      c: ft.Boolean,
    }),
    ft.Partial({ z: ft.Number }),
  ),
  ['b'],
);
test('Omit(Intersect(Object, Partial))', () => {
  expect(ft.showType(MyNamedOmitedType)).toMatchInlineSnapshot(`"Omit<MyName, "b">"`);
  expect(MyNamedOmitedType.safeParse({ a: 42, c: true, z: 12 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

test('Omit<Intersect<NonObject>', () => {
  expect(() => {
    ft.Omit(
      // @ts-expect-error Union only allows ObjectCodec inputs
      ft.Intersect(ft.Object({ name: ft.String }), ft.Null),
      ['name', 'rank'],
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Omit: input runtype "literal" does not support the 'omit' operation"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Omit.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const MyOmitedType: ft.ObjectCodec<Omit<{
        a: number;
        b: string;
        c: boolean;
    }, "b">>;
    export declare const MyNamedOmitedType: ft.ObjectCodec<Omit<{
        a: number;
        b: string;
        c: boolean;
    }, "b">>;
    export declare const MyOmitedIntersectionType: ft.ObjectCodec<Omit<{
        a: number;
        b: string;
        c: boolean;
        z?: number | undefined;
    }, "b">>;
    "
  `);
});

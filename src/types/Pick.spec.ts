import { readFileSync } from 'fs';
import * as ft from '..';

const ObjectType = ft.Object({
  a: ft.Number,
  b: ft.String,
  c: ft.Boolean,
});
export const MyPickedType = ft.Pick(ObjectType, ['a', 'c', 'z']);

test('Pick(Object)', () => {
  expect(ft.showType(MyPickedType)).toMatchInlineSnapshot(`"{ a: number; c: boolean }"`);
  expect(MyPickedType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

export const MyNamedPickedType = ft.Pick(ft.Named('MyName', ObjectType), ['a', 'c', 'z']);
test('Pick(Named(Object))', () => {
  expect(ft.showType(MyNamedPickedType)).toMatchInlineSnapshot(`"Pick<MyName, "a" | "c" | "z">"`);
  expect(MyNamedPickedType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

export const MyBrandPickedType = ft.Pick(ft.Brand('MyName', ObjectType), ['a', 'c', 'z']);
test('Pick(Brand(Object))', () => {
  expect(ft.showType(MyBrandPickedType)).toMatchInlineSnapshot(`"{ a: number; c: boolean }"`);
  expect(MyBrandPickedType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
});

export const MyPickedIntersectionType = ft.Pick(
  ft.Intersect(
    ft.Object({
      a: ft.Number,
      b: ft.String,
      c: ft.Boolean,
    }),
    ft.Partial({ z: ft.Number }),
  ),
  ['a', 'c', 'z'],
);

test('Pick(Intersect(Object, Partial))', () => {
  expect(ft.showType(MyPickedIntersectionType)).toMatchInlineSnapshot(
    `"{ a: number; c: boolean; z?: number }"`,
  );
  expect(MyPickedIntersectionType.safeParse({ a: 42, c: true, z: 12 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
        "z": 12,
      },
    }
  `);
});

export const MyPickedUnionType = ft.Pick(
  ft.Union(
    ft.Object({
      a: ft.Number,
      b: ft.String,
      c: ft.Boolean,
    }),
    ft.Object({ z: ft.Number }),
  ),
  ['a', 'c', 'z'],
);

test('Pick(Union(Object, Partial))', () => {
  expect(ft.showType(MyPickedUnionType)).toMatchInlineSnapshot(
    `"{ a: number; c: boolean } | { z: number }"`,
  );
  const x: ft.Static<typeof MyPickedUnionType> = { a: 42, c: true };
  expect(x).toEqual({ a: 42, c: true });
  expect(MyPickedUnionType.safeParse({ a: 42, c: true })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "a": 42,
        "c": true,
      },
    }
  `);
  expect(MyPickedUnionType.safeParse({ z: 42 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "z": 42,
      },
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Pick.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const MyPickedType: ft.ObjectCodec<Pick<{
        a: number;
        b: string;
        c: boolean;
    }, "a" | "c" | "z">>;
    export declare const MyNamedPickedType: ft.ObjectCodec<Pick<{
        a: number;
        b: string;
        c: boolean;
    }, "a" | "c" | "z">>;
    export declare const MyPickedIntersectionType: ft.ObjectCodec<Pick<{
        a: number;
        b: string;
        c: boolean;
        z?: number | undefined;
    }, "a" | "c" | "z">>;
    "
  `);
});

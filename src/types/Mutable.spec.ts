import { readFileSync } from 'fs';
import * as ft from '..';

export const record = ft.ReadonlyRecord(ft.String, ft.Number);
export const mutableRecord = ft.Mutable(record);
test('Mutable(Record)', () => {
  expect(ft.showType(mutableRecord)).toMatchInlineSnapshot(`"Record<string, number>"`);
  expect(mutableRecord.safeParse({ foo: 1, bar: 2 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": 2,
        "foo": 1,
      },
    }
  `);
});

const fields = { whatever: ft.Number };
export const obj = ft.ReadonlyObject(fields);
export const mutableObject = ft.Mutable(obj);
test('Mutable(Object)', () => {
  expect(ft.showType(mutableObject)).toMatchInlineSnapshot(`"{ whatever: number }"`);
  expect(mutableObject.safeParse({ whatever: 2 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "whatever": 2,
      },
    }
  `);
  expect(obj.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: false,
    isReadonly: true,
  });
  expect(mutableObject.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: false,
    isReadonly: false,
  });
});

export const tuple = ft.ReadonlyTuple(ft.Number, ft.String);
export const mutableTuple = ft.Mutable(tuple);
test('Mutable(Tuple)', () => {
  expect(ft.showType(mutableTuple)).toMatchInlineSnapshot(`"[number, string]"`);
  expect(mutableTuple.safeParse([10, `world`])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        10,
        "world",
      ],
    }
  `);
});

export const array = ft.ReadonlyArray(ft.Number);
export const mutableArray = ft.Mutable(array);
test('Mutable(Array)', () => {
  expect(ft.showType(mutableArray)).toMatchInlineSnapshot(`"number[]"`);
  expect(mutableArray.safeParse([10, 3])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        10,
        3,
      ],
    }
  `);
});

export const intersectObjAndPartial = ft.Intersect(
  ft.ReadonlyObject({ whatever: ft.Number }),
  ft.ReadonlyPartial({ another: ft.String }),
);
export const mutableIntersectObjAndPartial = ft.Mutable(intersectObjAndPartial);

test('Mutable(Intersect(Object, Partial))', () => {
  expect(ft.showType(mutableIntersectObjAndPartial)).toMatchInlineSnapshot(
    `"{ whatever: number; another?: string }"`,
  );
});

export const unionObj = ft.Union(
  ft.ReadonlyObject({ whatever: ft.Number }),
  ft.ReadonlyObject({ another: ft.String }),
);
export const mutableUnionObj = ft.Mutable(unionObj);
test('Mutable(Union(Object, Object))', () => {
  expect(ft.showType(mutableUnionObj)).toMatchInlineSnapshot(
    `"{ whatever: number } | { another: string }"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Mutable.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const record: ft.Codec<{
        readonly [x: string]: number | undefined;
    }>;
    export declare const mutableRecord: ft.Codec<{
        [x: string]: number | undefined;
    }>;
    export declare const obj: ft.ObjectCodec<{
        readonly whatever: number;
    }>;
    export declare const mutableObject: ft.ObjectCodec<{
        whatever: number;
    }>;
    export declare const tuple: ft.Codec<readonly [number, string]>;
    export declare const mutableTuple: ft.Codec<[number, string]>;
    export declare const array: ft.Codec<readonly number[]>;
    export declare const mutableArray: ft.Codec<number[]>;
    export declare const intersectObjAndPartial: ft.ObjectCodec<{
        readonly whatever: number;
        readonly another?: string | undefined;
    }>;
    export declare const mutableIntersectObjAndPartial: ft.ObjectCodec<{
        whatever: number;
        another?: string | undefined;
    }>;
    export declare const unionObj: ft.ObjectCodec<{
        readonly whatever: number;
    } | {
        readonly another: string;
    }>;
    export declare const mutableUnionObj: ft.ObjectCodec<{
        whatever: number;
    } | {
        another: string;
    }>;
    "
  `);
});

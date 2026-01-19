import { readFileSync } from 'fs';

import * as ft from '..';

export const record = ft.Record(ft.String, ft.Number);
export const readonlyRecord = ft.Readonly(record);
test('Readonly(Record)', () => {
  expect(readonlyRecord.safeParse({ foo: 1, bar: 2 })).toEqual({
    success: true,
    value: {
      bar: 2,
      foo: 1,
    },
  });
  expect(record.introspection).toEqual({
    tag: 'record',
    key: ft.String,
    value: ft.Number,
    isReadonly: false,
  });
  expect(readonlyRecord.introspection).toEqual({
    tag: 'record',
    key: ft.String,
    value: ft.Number,
    isReadonly: true,
  });
  expect(ft.showType(readonlyRecord)).toEqual(`ReadonlyRecord<string, number>`);
});

const fields = { whatever: ft.Number };
export const obj = ft.Object(fields);
export const readonlyObject = ft.Readonly(obj);
export const partialObj = ft.Partial(obj);
export const readonlyPartialObj = ft.Partial(readonlyObject);
test('Readonly(Object)', () => {
  expect(readonlyObject.safeParse({ whatever: 2 })).toEqual({
    success: true,
    value: { whatever: 2 },
  });
  expect(obj.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: false,
    isReadonly: false,
  });
  expect(readonlyObject.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: false,
    isReadonly: true,
  });
  expect(partialObj.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: true,
    isReadonly: false,
  });
  expect(readonlyPartialObj.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: true,
    isReadonly: true,
  });
});

const tuple = ft.Tuple(ft.Number, ft.String);
const readonlyTuple = ft.Readonly(tuple);
test('Readonly(Tuple)', () => {
  expect(readonlyTuple.safeParse([10, `world`])).toEqual({
    success: true,
    value: [10, 'world'],
  });
  expect(ft.showType(readonlyTuple)).toEqual(`readonly [number, string]`);
});

export const array = ft.Array(ft.Number);
export const readonlyArray = ft.Readonly(array);
test('Readonly(Array)', () => {
  expect(readonlyArray.safeParse([10, 3])).toEqual({
    success: true,
    value: [10, 3],
  });
  expect(ft.showType(readonlyArray)).toEqual(`readonly number[]`);
});

export const intersectObjAndPartial = ft.Intersect(
  ft.Object({ whatever: ft.Number }),
  ft.Partial({ another: ft.String }),
);
export const readonlyIntersectObjAndPartial = ft.Readonly(intersectObjAndPartial);
test('Readonly(Intersect(Object, Partial))', () => {
  expect(ft.showType(readonlyIntersectObjAndPartial)).toMatchInlineSnapshot(
    `"{ readonly whatever: number; readonly another?: string }"`,
  );
});

export const unionObj = ft.Union(
  ft.Object({ whatever: ft.Number }),
  ft.Object({ another: ft.String }),
);
export const readonlyUnionObj = ft.Readonly(unionObj);
test('Readonly(Union(Object, Object))', () => {
  expect(ft.showType(readonlyUnionObj)).toMatchInlineSnapshot(
    `"{ readonly whatever: number } | { readonly another: string }"`,
  );
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Readonly.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const record: ft.Codec<{
        [x: string]: number | undefined;
    }>;
    export declare const readonlyRecord: ft.Codec<{
        readonly [x: string]: number | undefined;
    }>;
    export declare const obj: ft.ObjectCodec<{
        whatever: number;
    }>;
    export declare const readonlyObject: ft.ObjectCodec<{
        readonly whatever: number;
    }>;
    export declare const partialObj: ft.ObjectCodec<{
        whatever?: number | undefined;
    }>;
    export declare const readonlyPartialObj: ft.ObjectCodec<{
        readonly whatever?: number | undefined;
    }>;
    export declare const array: ft.Codec<number[]>;
    export declare const readonlyArray: ft.Codec<readonly number[]>;
    export declare const intersectObjAndPartial: ft.ObjectCodec<{
        whatever: number;
        another?: string | undefined;
    }>;
    export declare const readonlyIntersectObjAndPartial: ft.ObjectCodec<{
        readonly whatever: number;
        readonly another?: string | undefined;
    }>;
    export declare const unionObj: ft.ObjectCodec<{
        whatever: number;
    } | {
        another: string;
    }>;
    export declare const readonlyUnionObj: ft.ObjectCodec<{
        readonly whatever: number;
    } | {
        readonly another: string;
    }>;
    "
  `);
});

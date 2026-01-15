import * as ta from 'type-assertions';
import * as ft from '..';

test('Mutable(Record)', () => {
  const dictionary = ft.ReadonlyRecord(ft.String, ft.Number);
  ta.assert<
    ta.Equal<ReturnType<(typeof dictionary)['parse']>, { readonly [key in string]?: number }>
  >();
  const rDictionary = ft.Mutable(dictionary);
  ta.assert<ta.Equal<ReturnType<(typeof rDictionary)['parse']>, { [key in string]?: number }>>();
  expect(rDictionary.safeParse({ foo: 1, bar: 2 })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "bar": 2,
        "foo": 1,
      },
    }
  `);
});

test('Mutable(Object)', () => {
  const fields = { whatever: ft.Number };
  const obj = ft.ReadonlyObject(fields);
  ta.assert<ta.Equal<ReturnType<(typeof obj)['parse']>, { readonly whatever: number }>>();
  const rObj = ft.Mutable(obj);
  ta.assert<ta.Equal<ReturnType<(typeof rObj)['parse']>, { whatever: number }>>();
  expect(rObj.safeParse({ whatever: 2 })).toMatchInlineSnapshot(`
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
  expect(rObj.introspection).toEqual({
    tag: 'object',
    fields,
    isPartial: false,
    isReadonly: false,
  });
});

test('Mutable(Tuple)', () => {
  const tuple = ft.ReadonlyTuple(ft.Number, ft.String);
  ta.assert<ta.Equal<ReturnType<(typeof tuple)['parse']>, readonly [number, string]>>();
  const rTuple = ft.Mutable(tuple);
  ta.assert<ta.Equal<ReturnType<(typeof rTuple)['parse']>, [number, string]>>();
  expect(rTuple.safeParse([10, `world`])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        10,
        "world",
      ],
    }
  `);
});

test('Mutable(Array)', () => {
  const array = ft.ReadonlyArray(ft.Number);
  ta.assert<ta.Equal<ReturnType<(typeof array)['parse']>, readonly number[]>>();
  const rArray = ft.Mutable(array);
  ta.assert<ta.Equal<ReturnType<(typeof rArray)['parse']>, number[]>>();
  expect(rArray.safeParse([10, 3])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        10,
        3,
      ],
    }
  `);
});

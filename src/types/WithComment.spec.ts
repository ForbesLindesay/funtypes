import * as ft from '..';
import { unwrapRuntype } from '../runtype';

test('parse/test/serialize delegate to the underlying type, unaffected by the docs', () => {
  const T = ft.WithComment({ title: 'Name', description: 'A person name' }, ft.String);
  expect(T.safeParse('bob')).toEqual({ success: true, value: 'bob' });
  expect(T.safeParse(42).success).toBe(false);
  expect(T.test('bob')).toBe(true);
  expect(T.safeSerialize('bob')).toEqual({ success: true, value: 'bob' });
});

test('introspection exposes the tag, title, description and underlying runtype', () => {
  const T = ft.WithComment({ title: 'Name', description: 'A person name' }, ft.String);
  expect(T.introspection).toEqual({
    tag: 'comment',
    underlying: ft.String,
    title: 'Name',
    description: 'A person name',
  });
});

test('introspection.description is undefined when no description is given', () => {
  const T = ft.WithComment({ title: 'Name' }, ft.String);
  expect(T.introspection).toEqual({
    tag: 'comment',
    underlying: ft.String,
    title: 'Name',
    description: undefined,
  });
});

test('showType shows the underlying type, not the title', () => {
  expect(ft.showType(ft.WithComment({ title: 'Name' }, ft.String))).toBe('string');
});

test('_underlyingType exposes the wrapped runtype', () => {
  const underlying = ft.String;
  const T = ft.WithComment({ title: 'Name' }, underlying);
  expect(unwrapRuntype(T, 'p')).toBe(underlying);
});

test('description is optional', () => {
  const T = ft.WithComment({ title: 'Name' }, ft.String);
  expect(T.safeParse('bob')).toEqual({ success: true, value: 'bob' });
});

test('wrapping an Optional field preserves its optionality within an object', () => {
  const T = ft.Object({ name: ft.WithComment({ title: 'Name' }, ft.Optional(ft.String)) });
  expect(T.safeParse({})).toEqual({ success: true, value: {} });
  expect(T.safeParse({ name: 'bob' })).toEqual({ success: true, value: { name: 'bob' } });
});

test('_asMutable/_asReadonly/_partial/_pick/_omit re-wrap the transformed underlying type in Documented, and this is reflected in the introspection', () => {
  const opts = { title: 'Person' };
  const fields = { name: ft.String, age: ft.Number };
  const T = ft.WithComment(opts, ft.Object(fields));

  const picked = ft.Pick(T, ['name']);
  expect(ft.showType(picked)).toBe('{ name: string }');
  expect(picked.safeParse({ name: 'bob' })).toEqual({ success: true, value: { name: 'bob' } });
  expect(picked.introspection).toEqual({
    tag: 'comment',
    title: 'Person',
    description: undefined,
    underlying: expect.objectContaining({
      introspection: {
        tag: 'object',
        fields: { name: ft.String },
        isPartial: false,
        isReadonly: false,
      },
    }),
  });

  const omitted = ft.Omit(T, ['age']);
  expect(ft.showType(omitted)).toBe('{ name: string }');
  expect(omitted.safeParse({ name: 'bob' })).toEqual({ success: true, value: { name: 'bob' } });
  expect(omitted.introspection).toEqual({
    tag: 'comment',
    title: 'Person',
    description: undefined,
    underlying: expect.objectContaining({
      introspection: {
        tag: 'object',
        fields: { name: ft.String },
        isPartial: false,
        isReadonly: false,
      },
    }),
  });

  const partial = ft.Partial(T);
  expect(partial.safeParse({})).toEqual({ success: true, value: {} });
  expect(partial.introspection).toEqual({
    tag: 'comment',
    title: 'Person',
    description: undefined,
    underlying: expect.objectContaining({
      introspection: { tag: 'object', fields, isPartial: true, isReadonly: false },
    }),
  });

  const mutable = ft.Mutable(T);
  expect(mutable.safeParse({ name: 'bob', age: 42 })).toEqual({
    success: true,
    value: { name: 'bob', age: 42 },
  });
  expect(mutable.introspection).toEqual({
    tag: 'comment',
    title: 'Person',
    description: undefined,
    underlying: expect.objectContaining({
      introspection: { tag: 'object', fields, isPartial: false, isReadonly: false },
    }),
  });

  const readonly = ft.Readonly(mutable);
  expect(readonly.safeParse({ name: 'bob', age: 42 })).toEqual({
    success: true,
    value: { name: 'bob', age: 42 },
  });
  expect(readonly.introspection).toEqual({
    tag: 'comment',
    title: 'Person',
    description: undefined,
    underlying: expect.objectContaining({
      introspection: { tag: 'object', fields, isPartial: false, isReadonly: true },
    }),
  });
});

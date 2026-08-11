import * as ft from '..';
import { unwrapRuntype } from '../runtype';

test('parse: undefined/null are replaced by the default value', () => {
  const T = ft.WithDefault(ft.String, 'fallback');
  expect(T.safeParse(undefined)).toEqual({ success: true, value: 'fallback' });
  expect(T.safeParse(null)).toEqual({ success: true, value: 'fallback' });
});

test('parse: any other value is validated against the underlying type', () => {
  const T = ft.WithDefault(ft.String, 'fallback');
  expect(T.safeParse('hello')).toEqual({ success: true, value: 'hello' });
  expect(T.safeParse(42).success).toBe(false);
});

test('test: does not apply the default, and checks the underlying type directly', () => {
  const T = ft.WithDefault(ft.String, 'fallback');
  expect(T.test('hello')).toBe(true);
  expect(T.test(undefined)).toBe(false);
  expect(T.test(null)).toBe(false);
});

test('assert: undefined/null pass because parse fills in the default', () => {
  const T = ft.WithDefault(ft.String, 'fallback');
  expect(() => T.assert('hello')).not.toThrow();
});

test('serialize: does not accept null/undefined, only the underlying type', () => {
  const T = ft.WithDefault(ft.String, 'fallback');
  expect(T.safeSerialize('hello')).toEqual({ success: true, value: 'hello' });
  expect(T.safeSerialize(undefined as any).success).toBe(false);
  expect(T.safeSerialize(null as any).success).toBe(false);
});

test('within an object, a missing/null/undefined field is defaulted on parse', () => {
  const T = ft.Object({ a: ft.WithDefault(ft.Number, 42) });
  expect(T.safeParse({})).toEqual({ success: true, value: { a: 42 } });
  expect(T.safeParse({ a: null })).toEqual({ success: true, value: { a: 42 } });
  expect(T.safeParse({ a: undefined })).toEqual({ success: true, value: { a: 42 } });
  expect(T.safeParse({ a: 10 })).toEqual({ success: true, value: { a: 10 } });
});

test('showType shows the underlying type, not the default value', () => {
  expect(ft.showType(ft.WithDefault(ft.String, 'fallback'))).toBe('string');
  expect(ft.showType(ft.WithDefault(ft.Number, 0))).toBe('number');
});

test('the underlying type used for parsing accepts null/undefined in addition to the base type', () => {
  const underlying = ft.String;
  const T = ft.WithDefault(underlying, 'fallback');
  const parseUnderlying = unwrapRuntype(T, 'p');
  expect(parseUnderlying.test('hello')).toBe(true);
  expect(parseUnderlying.test(null)).toBe(true);
  expect(parseUnderlying.test(undefined)).toBe(true);
  expect(parseUnderlying.test(42)).toBe(false);
});

test('the underlying type used for test/serialize is exactly the wrapped type', () => {
  const underlying = ft.String;
  const T = ft.WithDefault(underlying, 'fallback');
  expect(unwrapRuntype(T, 't')).toBe(underlying);
  expect(unwrapRuntype(T, 's')).toBe(underlying);
});

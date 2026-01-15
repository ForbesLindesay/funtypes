import { readFileSync } from 'fs';
import * as ft from '..';

test('Regression https://github.com/ForbesLindesay/funtypes/issues/62', () => {
  const DateSchema = ft.ParsedValue(ft.String, {
    test: ft.InstanceOf(Date),
    parse: value => {
      return { success: true, value: new Date(value) };
    },
    serialize: value => {
      return { success: true, value: value.toISOString() };
    },
  });
  let value: unknown;
  const ConstrainedDate = ft.Constraint(DateSchema, v => {
    value = v;
    return true;
  });

  value = undefined;
  expect(ConstrainedDate.test(new Date(0))).toEqual(true);
  expect(value).toEqual(new Date(0));

  value = undefined;
  expect(ConstrainedDate.safeParse(new Date(0).toISOString())).toEqual({
    success: true,
    value: new Date(0),
  });
  expect(value).toEqual(new Date(0));

  value = undefined;
  expect(ConstrainedDate.safeSerialize(new Date(0))).toEqual({
    success: true,
    value: new Date(0).toISOString(),
  });
  expect(value).toEqual(new Date(0));
});

function minLength<T extends { readonly length: number }>(base: ft.Codec<T>, min: number) {
  return ft.Constraint(base, value => value.length >= min, {
    name: `MinLength<${ft.showType(base)}, ${min}>`,
  });
}
export const NonEmptyString = minLength(ft.String, 1);
test('Constraint', () => {
  expect(NonEmptyString.safeParse('hello')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "hello",
    }
  `);
  expect(NonEmptyString.safeParse('')).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign "" to MinLength<string, 1>",
        [
          """ failed MinLength<string, 1> check",
        ],
      ],
      "message": """ failed MinLength<string, 1> check",
      "success": false,
    }
  `);
  expect(NonEmptyString.safeParse(42)).toMatchInlineSnapshot(`
    {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
  expect(ft.showType(NonEmptyString)).toMatchInlineSnapshot(`"MinLength<string, 1>"`);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/constraint.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const NonEmptyString: ft.Codec<string>;
    "
  `);
});

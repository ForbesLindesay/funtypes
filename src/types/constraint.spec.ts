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

export const NonEmptyStringV2 = ft.String.withConstraint(v => v.length >= 1, {
  name: `NonEmptyString`,
});
test('withConstraint', () => {
  expect(NonEmptyStringV2.safeParse('hello')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "hello",
    }
  `);
  expect(NonEmptyStringV2.safeParse('')).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign "" to NonEmptyString",
        [
          """ failed NonEmptyString check",
        ],
      ],
      "message": """ failed NonEmptyString check",
      "success": false,
    }
  `);
  expect(NonEmptyStringV2.safeParse(42)).toMatchInlineSnapshot(`
    {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
  expect(ft.showType(NonEmptyStringV2)).toMatchInlineSnapshot(`"NonEmptyString"`);
});

export const GuardedString = ft.Guard(x => typeof x === 'string');
test('Guard', () => {
  expect(GuardedString.safeParse('hello')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "hello",
    }
  `);
  expect(GuardedString.safeParse(42)).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign 42 to WithConstraint<unknown>",
        [
          "42 failed constraint check",
        ],
      ],
      "message": "42 failed constraint check",
      "success": false,
    }
  `);
  expect(ft.showType(GuardedString)).toMatchInlineSnapshot(`"WithConstraint<unknown>"`);
});

export const GuardedStringV2 = ft.Union(ft.String, ft.Number).withGuard(x => typeof x === 'string');
test('withGuard', () => {
  expect(GuardedStringV2.safeParse('hello')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "hello",
    }
  `);
  expect(GuardedStringV2.safeParse(true)).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign true to string | number",
        [
          "Unable to assign true to string",
          [
            "Expected string, but was true",
          ],
        ],
        [
          "And unable to assign true to number",
          [
            "Expected number, but was true",
          ],
        ],
      ],
      "message": "Expected string | number, but was true",
      "success": false,
    }
  `);
  expect(GuardedStringV2.safeParse(42)).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign 42 to WithConstraint<string | number>",
        [
          "42 failed constraint check",
        ],
      ],
      "message": "42 failed constraint check",
      "success": false,
    }
  `);
  expect(ft.showType(GuardedStringV2)).toMatchInlineSnapshot(`"WithConstraint<string | number>"`);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/constraint.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const NonEmptyString: ft.Codec<string>;
    export declare const NonEmptyStringV2: ft.Codec<string>;
    export declare const GuardedString: ft.Codec<string>;
    export declare const GuardedStringV2: ft.Codec<string>;
    "
  `);
});

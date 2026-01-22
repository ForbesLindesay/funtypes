---
title: Constraint & Guard
nextjs:
  metadata:
    title: Constraint & Guard
    description: Add extra constraints to Funtypes Codecs
---

Funtypes allows you to add additional arbitrary custom constraints/guards on top of the built in type validation.

There are 4 methods for doing this in Funtypes:

- `ft.Constraint` / `Codec.withConstraint` allow you to provide a custom error message, and provide a new static type, but TypeScript won't check that your function tests the type properly.
- `ft.Guard` / `Codec.withGuard` does not allow a custom error message, but TypeScript will infer the type from the function.

In all these examples, I've chosen to pass a `name` to these constraint/guard calls. The `name` is entirely optional, but it does make error messages a lot easier to read.

## Non Empty Array

Here's an example using `.withConstraint` to define a custom `NonEmptyArray` codec:

```ts
import * as ft from "funtypes";

function NonEmptyArray<T>(element: ft.Codec<T>) {
  return ft
    .Array(element)
    .withConstraint(
      (value) =>
        value.length
          ? true
          : "Array must contain at least one element",
      {
        name: `NonEmptyArray<${ft.showType(element)}>`,
      },
    );
}

export const NonEmptyNumbersArrayCodec =
  NonEmptyArray(ft.Number);
// => ft.Codec<number[]>
export type NonEmptyNumbersArray = ft.Static<
  typeof NonEmptyNumbersArrayCodec
>;
// => number[]

// ✅ Valid array of numbers
assert.deepEqual(
  MyArraySchema.parse([1, 2, 3]),
  [1, 2, 3],
);

// 🚨 Array is empty, failing our constraint
assert.throws(() => MyArraySchema.parse([]));

// 🚨 Array contains something other than numbers
assert.throws(() =>
  MyArraySchema.parse([1, "2", 3]),
);
```

You could equivalently write the `NonEmptyArray` function as:

```ts
function NonEmptyArray<T>(element: ft.Codec<T>) {
  return ft.Constraint(
    ft.Array(element),
    (value) =>
      value.length
        ? true
        : "Array must contain at least one element",
    {
      name: `NonEmptyArray<${ft.showType(element)}>`,
    },
  );
}
```

The `withConstraint` method is there as a shorthand primarily because it tends to make type inference simpler.

## Email

Here we'll use `.withGuard` to define an `EmailCodec`, making use of an existing `isEmail` function:

```ts
import * as ft from "funtypes";

type EmailString = `${string}@${string}`;
export function isEmail(
  email: string,
): email is EmailString {
  return email.includes("@");
}

const EmailCodec = ft.String.withGuard(isEmail, {
  name: "EmailString",
});
// => Codec<EmailString>

// ✅ Valid email
assert.deepEqual(
  EmailCodec.parse("forbes@example.com"),
  "forbes@example.com",
);

// 🚨 Wrong type
assert.throws(() => EmailCodec.parse(42));

// 🚨 Invalid email
assert.throws(() => EmailCodec.parse("forbes"));
```

The `ft.Guard` utility is slightly different in that it assumes a base type of `ft.Unknown`. If our `isEmail` function already handled `unknown`, we could use it like this:

```ts
import * as ft from "funtypes";

type EmailString = `${string}@${string}`;
export function isEmail(
  email: unknown,
): email is EmailString {
  return (
    typeof email === "string" &&
    email.includes("@")
  );
}

const EmailCodec = ft.Guard(isEmail, {
  name: "EmailString",
});
// => Codec<EmailString>

// ✅ Valid email
assert.deepEqual(
  EmailCodec.parse("forbes@example.com"),
  "forbes@example.com",
);

// 🚨 Wrong type
assert.throws(() => EmailCodec.parse(42));

// 🚨 Invalid email
assert.throws(() => EmailCodec.parse("forbes"));
```

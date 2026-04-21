---
title: KeyOf
nextjs:
  metadata:
    title: KeyOf
    description: Runtime validation of TypeScript keyof object
---

Use `ft.KeyOf` to validate an unknown value is a key of a given object.

## String Keys

```ts
import * as ft from "funtypes";

export const UserKeyCodec = ft.KeyOf({
  id: {},
  name: {},
});
// => ft.Codec<"id" | "name">

export type UserKey = ft.Static<
  typeof UserKeyCodec
>;
// => "id" | "name"

// ✅ Valid key
assert.deepEqual(
  UserKeyCodec.parse("name"),
  "name",
);

// 🚨 Invalid key
assert.throws(() =>
  UserKeyCodec.parse("other_string"),
);

// 🚨 Totally different type
assert.throws(() => UserKeyCodec.parse([42]));
```

## Numeric Keys

If the type has numeric keys, we allow both the number and the string as valid values.

```ts
import * as ft from "funtypes";

export const MyKeyCodec = ft.KeyOf({
  42: {},
  five: {},
});
// => ft.Codec<42 | "42" | "five">

export type MyKey = ft.Static<typeof MyKeyCodec>;
// => 42 | "42" | "five"

// ✅ Valid number key
assert.deepEqual(UserKeyCodec.parse(42), 42);

// ✅ Valid number key represented as a string
assert.deepEqual(UserKeyCodec.parse("42"), "42");

// ✅ Valid string key
assert.deepEqual(
  UserKeyCodec.parse("five"),
  "five",
);

// 🚨 Invalid number key
assert.throws(() => UserKeyCodec.parse(1));

// 🚨 Invalid string key
assert.throws(() =>
  UserKeyCodec.parse("other_string"),
);

// 🚨 Totally different type
assert.throws(() => UserKeyCodec.parse([42]));
```

{% callout type="warning" title="TypeScript is weird about numeric keys sometimes" %}
TypeScript gives a different type to `{ "42": {} }` vs. `{ 42: {} }` but they have the same type at runtime, so we can't tell them apart. Because of this, we'll allow both the numeric representation and the string representation at runtime, but if you use `{ "42": {} }`, the static types will incorrectly only include the string representation.

```ts
import * as ft from "funtypes";

// --header end--

export const MyKeyCodec = ft.KeyOf({
  "42": {},
});
// => ft.Codec<"42">

// The types would suggest that this should
// throw, but it does not.
assert.deepEqual(MyKeyCodec.parse(42), 42);
```

{% /callout %}

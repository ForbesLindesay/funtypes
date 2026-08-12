---
title: Union
nextjs:
  metadata:
    title: Union
    description: Validate TypeScript unions using Funtypes
---

Unions allow you to validate an object that should match one of a list of possible codecs. Although there are various optimizations, you can think of it as trying each codec in sequence until it finds a match. If no match is found, it will generate an error that details why the value doesn't match any of the codecs in the union. For common structures such as tagged unions, Funtypes has special logic to keep error messages more concise without missing out on relevant detail.

## Unions of types

Union can be used when you want to allow multiple possible types for a value:

```ts
import * as ft from "funtypes";

const StringOrNumberCodec = ft.Union(
  ft.String,
  ft.Number,
);
// => Codec<string | number>

type StringOrNumber = ft.Static<
  typeof StringOrNumberCodec
>;
// => string | number

// ✅ Valid value
assert.deepEqual(
  StringOrNumber.parse("hello world"),
  "hello world",
);

// ✅ Valid value
assert.deepEqual(StringOrNumber.parse(42), 42);

// 🚨 Wrong type
assert.throws(() => StringOrNumber.parse(true));
```

{% callout title="ft.Nullable" %}
You can use `ft.Nullable(SomeCodec)` as a shorthand for `ft.Union(SomeCodec, ft.Null)`
{% /callout %}

## ft.Optional

`ft.Optional(SomeCodec)` is a shorthand for `ft.Union(SomeCodec, ft.Undefined)`, but when used directly as a property of [`ft.Object`](/docs/types-object#optional-properties) or `ft.ReadonlyObject`, it also:

- makes the property optional in the static TypeScript type (`nickname?: string`), rather than a required property whose value happens to allow `undefined` (`nickname: string | undefined`), and
- makes Funtypes omit the property entirely, both when parsing and serializing, if it's missing or `undefined` - the same way [`ft.Partial`](/docs/types-partial) does.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  nickname: ft.Optional(ft.String),
});
// => ft.Codec<{ id: number; nickname?: string }>

type User = ft.Static<typeof UserCodec>;
// => { id: number; nickname?: string }

// ✅ The property can be omitted entirely
assert.deepEqual(UserCodec.parse({ id: 1 }), {
  id: 1,
});

// ✅ Or it can have a value
assert.deepEqual(
  UserCodec.parse({ id: 1, nickname: "Bob" }),
  { id: 1, nickname: "Bob" },
);
```

{% callout title="ft.Optional outside of ft.Object" %}
`ft.Optional` only changes anything when it's used directly as a field of [`ft.Object`](/docs/types-object) or [`ft.ReadonlyObject`](/docs/types-object#readonly-objects). Used anywhere else (as an array element, a tuple component, nested inside another union, etc.), it behaves exactly like `ft.Union(SomeCodec, ft.Undefined)`.
{% /callout %}

## Tagged Object Unions

A common pattern in TypeScript is to represent different possible states or object types as a union of objects, each with a property that identifies which type of object it is. For example, we could have a state machine like:

```ts
import * as ft from "funtypes";

const RequestStateCodec = ft.Union(
  ft.Object({
    status: ft.Literal("LOADING"),
  }),
  ft.Object({
    status: ft.Literal("LOADED"),
    value: ft.String,
  }),
  ft.Object({
    status: ft.Literal("FAILED"),
    error: ft.String,
  }),
);
// => Codec<{ status: "LOADING" } | { status: "LOADED"; value: string } | { status: "FAILED"; error: string }>

type RequestState = ft.Static<
  typeof RequestStateCodec
>;
// => { status: "LOADING" } | { status: "LOADED"; value: string } | { status: "FAILED"; error: string }

// ✅ Valid LOADING state
assert.deepEqual(
  RequestStateCodec.parse({ status: "LOADING" }),
  { status: "LOADING" },
);

// ✅ Valid LOADED state
assert.deepEqual(
  RequestStateCodec.parse({
    status: "LOADED",
    value: "Hello World",
  }),
  { status: "LOADED", value: "Hello World" },
);

// 🚨 Invalid LOADED state - value is not a string
assert.throws(() =>
  RequestStateCodec.parse({
    status: "LOADED",
    value: 42,
  }),
);
```

{% callout title="ft.Named" %}
It can be a good idea to wrap each object in the union in `ft.Named` as this dramatically improves error messages, which can otherwise be a bit verbose.
{% /callout %}

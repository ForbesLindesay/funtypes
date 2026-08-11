---
title: Object
nextjs:
  metadata:
    title: Object
    description: Validate objects in TypeScript using Funtypes
---

The most frequently used Funtype is probably Object. You use object any time you want to validate an object with specific properties.

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.Union(ft.String, ft.Undefined),
});
// => ft.Codec<{ id: number; name: string | undefined }>

export type User = ft.Static<typeof UserCodec>;
// => { id: number; name: string | undefined }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ id: number; name: string | undefined }",
);

// ✅ Valid object with correct keys
assert.deepEqual(
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
  },
);

// ✅ Extra keys are ignored when parsing
//    (use `Sealed` to prevent this)
assert.deepEqual(
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    someUnexpectedKey: "any value",
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
  },
);

// ✅ No runtime distinction is made between
//    missing properties and `undefined`, but
//    Funtypes populates the missing key unless
//    you use `ft.Partial`.
assert.deepEqual(
  UserCodec.parse({
    id: 1,
  }),
  {
    id: 1,
    name: undefined,
  },
);

// 🚨 Invalid: id should be a number, but here
//    we've passed a string instead.
assert.throws(() => {
  UserCodec.parse({
    id: "42",
    name: "Forbes Lindesay",
  });
});

// 🚨 Invalid: Missing required property, "id"
assert.throws(() => {
  UserCodec.parse({
    name: "Forbes Lindesay",
  });
});
```

## Readonly Objects

You can use `ft.ReadonlyObject` in place of `ft.Object` if you want the properties to be treated as `readonly` by TypeScript. The runtime behaviour is not changed by making the object read only.

```ts
import * as ft from "funtypes";

export const UserCodec = ft.ReadonlyObject({
  id: ft.Number,
  name: ft.Union(ft.String, ft.Undefined),
});
// => ft.Codec<{ readonly id: number; readonly name: string | undefined }>

export type User = ft.Static<typeof UserCodec>;
// => { readonly id: number; readonly name: string | undefined }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ readonly id: number; readonly name: string | undefined }",
);
```

If you need to make some properties readonly but others mutable, you can use `ft.Intersect`:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Intersect(
  ft.ReadonlyObject({
    id: ft.Number,
  }),
  ft.Object({
    name: ft.Union(ft.String, ft.Undefined),
  }),
);
// => ft.Codec<{ readonly id: number; name: string | undefined }>

export type User = ft.Static<typeof UserCodec>;
// => { readonly id: number; name: string | undefined }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ readonly id: number; name: string | undefined }",
);
```

## Optional Properties

If you need some properties to be treated as optional in the TypeScript types, wrap them in [`ft.Optional`](/docs/types-union#ft-optional):

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.Optional(ft.String),
});
// => ft.Codec<{ id: number; name?: string }>

export type User = ft.Static<typeof UserCodec>;
// => { id: number; name?: string }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ id: number; name?: string }",
);

// ✅ Valid object with correct keys
assert.deepEqual(
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
  },
);

// ✅ The property can be left out, and is
//    omitted from the parsed value entirely
assert.deepEqual(
  UserCodec.parse({
    id: 1,
  }),
  {
    id: 1,
  },
);
```

`ft.Optional(SomeCodec)` is shorthand for `ft.Union(SomeCodec, ft.Undefined)`, but it also tells `ft.Object` to treat the property as optional: it's typed as `name?: string` rather than as a required property that happens to allow `undefined` (`name: string | undefined`), and Funtypes omits it from the parsed/serialized value entirely when it's missing or `undefined`, the same way [`ft.Partial`](/docs/types-partial) does.

{% callout title="Merging separately defined required and optional properties" %}
If you already have two separate object codecs, e.g. one describing required fields and one describing optional fields, you can still combine them with `ft.Intersect` and `ft.Partial`:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Intersect(
  ft.Object({ id: ft.Number }),
  ft.Partial({ name: ft.String }),
);
// => ft.Codec<{ id: number; name?: string }>
```

This is most useful when the required and optional parts are already defined elsewhere and you want to compose them, rather than when you're just declaring a couple of optional fields on a new object, where `ft.Optional` is simpler.
{% /callout %}

{% callout title="Readonly Optional Properties" %}
You can combine readonly and partial in one by using `ft.ReadonlyPartial` to create an object with properties that are both optional and readonly.

You can also make an object's properties readonly or partial after the fact, by passing the object codec to the [`ft.Readonly`](/docs/types-readonly) or [`ft.Partial`](/docs/types-partial) utilities.
{% /callout %}

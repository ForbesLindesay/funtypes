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
  "{ id: number; name: string | undefined }"
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

// ✅ Extra keys are ignored when parsing (use `Sealed` to prevent this)
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

// ✅ No runtime distinction is made between missing
//    properties and `undefined`, but Funtypes populates
//    the missing key unless you use `ft.Partial`.
assert.deepEqual(
  UserCodec.parse({
    id: 1,
  }),
  {
    id: 1,
    name: undefined,
  },
);

// 🚨 Invalid: id should be a number, but here we've
//    passed a string instead.
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
  "{ readonly id: number; readonly name: string | undefined }"
);
```

If you need to make some properties readonly but others mutable, you can use `ft.Intersect`:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Intersect(
  ft.ReadonlyObject({ id: ft.Number }),
  ft.Object({ name: ft.Union(ft.String, ft.Undefined) }),
});
// => ft.Codec<{ readonly id: number; name: string | undefined }>

export type User = ft.Static<typeof UserCodec>;
// => { readonly id: number; name: string | undefined }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ readonly id: number; name: string | undefined }"
);
```

## Optional Properties

If you need some properties to be treated as optional in the TypeScript types, you can use `ft.Partial`. To make some properties optional and others required, you can use `ft.Intersect` to merge the required props and the optional props:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Intersect(
  ft.Object({
    id: ft.Number,
  }),
  ft.Partial({
    name: ft.Union(ft.String, ft.Undefined),
  })
);
// => ft.Codec<{ id: number; name?: string }>

export type User = ft.Static<typeof UserCodec>;
// => { id: number; name?: string }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ id: number; name?: string }"
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

// ✅ Missing properties that were "Partial" are ignored.
assert.deepEqual(
  UserCodec.parse({
    id: 1,
  }),
  {
    id: 1,
  },
);
```

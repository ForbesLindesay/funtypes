---
title: Omit
nextjs:
  metadata:
    title: Omit
    description: Omit utility from Funtypes
---

Use `ft.Omit` to exclude certain properties from an object's Codec.

You might also make use of the closely related utilities:

- [`ft.Partial`](/docs/types-partial)
- [`ft.Pick`](/docs/types-pick)

These utilities can be applied to any object codec, including one constructed by intersecting together several other object codecs.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => Codec<{ id: number; name: string }>

const NamedCodec = ft.Omit(UserCodec, ["id"]);
// => Codec<{ name: string }>

type Named = ft.Static<typeof NamedCodec>;
// => { name: string }

assert.deepEqual(
  ft.showType(NamedCodec),
  "{ name: string }",
);

// ✅ Valid object with correct keys
assert.deepEqual(
  NamedCodec.parse({
    name: "Forbes Lindesay",
  }),
  {
    name: "Forbes Lindesay",
  },
);

// ✅ Extra keys are ignored when parsing
//    (use `Sealed` to prevent this)
assert.deepEqual(
  NamedCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
  }),
  {
    name: "Forbes Lindesay",
  },
);
```

It also works on objects that were wrapped in `ft.Named`, and will preserve the name given to the type:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Named(
  "User",
  ft.Object({
    id: ft.Number,
    name: ft.String,
  }),
);
// => Codec<{ id: number; name: string }>

const NamedCodec = ft.Omit(UserCodec, ["id"]);
// => Codec<{ name: string }>

assert.deepEqual(
  ft.showType(NamedCodec),
  `Omit<User, "id">`,
);
```

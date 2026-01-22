---
title: Partial
nextjs:
  metadata:
    title: Partial
    description: Partial utility from Funtypes
---

Use `ft.Partial` to make properties of an object optional.

You might also make use of the closely related utilities:

- [`ft.Omit`](/docs/types-omit)
- [`ft.Pick`](/docs/types-pick)

These utilities can be applied to any object codec, including one constructed by intersecting together several other object codecs.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => Codec<{ id: number; name: string }>

const PartialUserCodec = ft.Partial(UserCodec);
// => Codec<{ id?: number; name?: string }>

type PartialUser = ft.Static<
  typeof PartialUserCodec
>;
// => { id?: number; name?: string }

assert.deepEqual(
  ft.showType(PartialUserCodec),
  "{ id?: number; name?: string }",
);

// ✅ Valid object with some keys
assert.deepEqual(
  PartialUserCodec.parse({
    name: "Forbes Lindesay",
  }),
  {
    name: "Forbes Lindesay",
  },
);

// ✅ Valid object with all the keys
assert.deepEqual(
  PartialUserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
  },
);

// ✅ Valid object with no keys
assert.deepEqual(PartialUserCodec.parse({}), {});

// 🚨 Invalid: id should be a number or undefined
assert.throws(() => {
  PartialUserCodec.parse({
    id: "42",
    name: "Forbes Lindesay",
  });
});
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

const PartialUserCodec = ft.Partial(UserCodec);
// => Codec<{ id?: number; name?: string }>

type PartialUser = ft.Static<
  typeof PartialUserCodec
>;
// => { id?: number; name?: string }

assert.deepEqual(
  ft.showType(PartialUserCodec),
  "Partial<User>",
);
```

{% callout title="Creating new Partial objects" %}
If you know you always want the fields of a Codec to be optional, You can just directly use `ft.Partial({...fields})` instead of doing it as `ft.Partial(ft.Object({...fields}))`. The only reason we also support passing an object codec to `ft.Partial` is so you can take an existing Object Codec and make a partial version of it.
{% /callout %}

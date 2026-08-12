---
title: WithDefault
nextjs:
  metadata:
    title: WithDefault
    description: Fall back to a default value when parsing null/undefined with Funtypes
---

Use `ft.WithDefault` to substitute a default value in place of `null` or `undefined` when parsing. Unlike [`ft.Optional`](/docs/types-union#ft-optional), the property is **not** treated as optional in the static TypeScript type or when serializing - by the time you have a parsed value, the default will already have been applied, so the field is always present.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  role: ft.WithDefault(ft.String, "member"),
});
// => ft.Codec<{ id: number; role: string }>

type User = ft.Static<typeof UserCodec>;
// => { id: number; role: string }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ id: number; role: string }",
);

// ✅ Missing property falls back to the default
assert.deepEqual(UserCodec.parse({ id: 1 }), {
  id: 1,
  role: "member",
});

// ✅ `null` also falls back to the default
assert.deepEqual(
  UserCodec.parse({ id: 1, role: null }),
  { id: 1, role: "member" },
);

// ✅ Any other value is validated normally
assert.deepEqual(
  UserCodec.parse({ id: 1, role: "admin" }),
  { id: 1, role: "admin" },
);

// 🚨 Invalid: `role` doesn't match the
//    underlying type
assert.throws(() => {
  UserCodec.parse({ id: 1, role: 42 });
});
```

## Optional vs. Default

`ft.Optional` and `ft.WithDefault` solve related but different problems:

- `ft.Optional(ft.String)` means the property may be entirely absent, and if it's absent it's simply left out of the parsed value - the static type has an actual `?: string`.
- `ft.WithDefault(ft.String, "member")` means the property may be absent (or `null`) on the way in, but it's always present and always a `string` once parsed.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  nickname: ft.Optional(ft.String),
  role: ft.WithDefault(ft.String, "member"),
});
// => ft.Codec<{ nickname?: string; role: string }>

assert.deepEqual(UserCodec.parse({}), {
  role: "member",
});
```

{% callout title="Codec.test and Codec.serialize don't apply the default" %}
`Codec.test` and `Codec.serialize` only ever see already-parsed values, so `ft.WithDefault` doesn't accept `null`/`undefined` there - it behaves exactly like the underlying Codec. If you want `role` to always be present when you call `.test(...)` or `.serialize(...)`, make sure you've already called `.parse(...)` (or provide the value yourself) first.

```ts
import * as ft from "funtypes";

const RoleCodec = ft.WithDefault(
  ft.String,
  "member",
);

assert.deepEqual(RoleCodec.test(undefined), false);
assert.throws(() => RoleCodec.serialize(undefined as any));
```

{% /callout %}

## Introspection

You can inspect the default value and underlying Codec via [`Codec.introspection`](/docs/funtypes-api-introspection):

```ts
import * as ft from "funtypes";

const RoleCodec = ft.WithDefault(
  ft.String,
  "member",
);

assert.deepEqual(RoleCodec.introspection, {
  tag: "default",
  underlying: ft.String,
  defaultValue: "member",
});
```

{% callout title="Representing WithDefault as JSON Schema" %}
When you convert a Codec to JSON Schema with [`ft.toJsonSchema`](/docs/standard-schema), a `ft.WithDefault` field is represented differently depending on whether you ask for the "parsed" (default) or "serialized" shape:

- In the **parsed** shape, the property is `required`, and has a `default` annotation.
- In the **serialized** shape, the property is optional and `nullable`, since the raw input may omit it (or send `null`) and still be valid.

See [Standard Schema & JSON Schema](/docs/standard-schema) for more details.
{% /callout %}

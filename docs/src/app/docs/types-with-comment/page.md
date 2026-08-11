---
title: WithComment
nextjs:
  metadata:
    title: WithComment
    description: Attach a title and description to a Funtypes Codec
---

Use `ft.WithComment` to attach a `title` and an optional `description` to a Codec. These don't affect parsing, serializing or the static TypeScript type at all - they're purely metadata, picked up when you convert a Codec to a JSON Schema with [`ft.toJsonSchema`](/docs/standard-schema) or [`ft.toStandardJsonSchema`](/docs/standard-schema).

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.WithComment(
    {
      title: "Full name",
      description: "The user's full, legal name",
    },
    ft.String,
  ),
});
// => ft.Codec<{ id: number; name: string }>

// Parsing/serializing behave exactly as if
// WithComment wasn't there at all.
assert.deepEqual(
  UserCodec.parse({ id: 1, name: "Forbes Lindesay" }),
  { id: 1, name: "Forbes Lindesay" },
);

assert.deepEqual(
  ft.toJsonSchema(UserCodec),
  {
    type: "object",
    properties: {
      id: { type: "number" },
      name: {
        type: "string",
        title: "Full name",
        description: "The user's full, legal name",
      },
    },
    required: ["id", "name"],
  },
);
```

`description` is optional, if you only need a `title`:

```ts
import * as ft from "funtypes";

const ScoreCodec = ft.WithComment(
  { title: "Score" },
  ft.Number,
);

assert.deepEqual(ft.toJsonSchema(ScoreCodec), {
  type: "number",
  title: "Score",
});
```

## Introspection

`WithComment` doesn't change `ft.showType`, but it is visible via [`Codec.introspection`](/docs/funtypes-api-introspection):

```ts
import * as ft from "funtypes";

const ScoreCodec = ft.WithComment(
  { title: "Score" },
  ft.Number,
);

assert.deepEqual(ft.showType(ScoreCodec), "number");

assert.deepEqual(ScoreCodec.introspection, {
  tag: "comment",
  title: "Score",
  description: undefined,
  underlying: ft.Number,
});
```

## Commenting Optional Properties

`ft.WithComment` preserves optionality, so you can wrap a property created with [`ft.Optional`](/docs/types-union#ft-optional) without losing the `?` in the static type:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  nickname: ft.WithComment(
    { title: "Nickname" },
    ft.Optional(ft.String),
  ),
});
// => ft.Codec<{ nickname?: string }>

assert.deepEqual(
  ft.toJsonSchema(UserCodec),
  {
    type: "object",
    properties: {
      nickname: { type: "string", title: "Nickname" },
    },
  },
);
```

## Commenting Objects

You can also comment a whole object, and still use [`ft.Pick`](/docs/types-pick), [`ft.Omit`](/docs/types-omit), [`ft.Partial`](/docs/types-partial), [`ft.Mutable`](/docs/types-mutable) or [`ft.Readonly`](/docs/types-readonly) on it afterwards - the comment carries over to the result:

```ts
import * as ft from "funtypes";

const UserCodec = ft.WithComment(
  { title: "User" },
  ft.Object({ id: ft.Number, name: ft.String }),
);

const PartialUserCodec = ft.Partial(UserCodec);
// => ft.Codec<{ id?: number; name?: string }>

const { introspection } = PartialUserCodec;
if (introspection.tag === "comment") {
  assert.deepEqual(introspection.title, "User");
}
```

{% callout title="Comments on named/branded/constrained types" %}
If the underlying Codec is wrapped in [`ft.Named`](/docs/types-named), [`ft.Constraint`](/docs/types-constraint) with a `name`, or is a `Brand`, `ft.toJsonSchema` will already give it its own named entry in `$defs`. Wrapping that in `ft.WithComment` adds the `title`/`description` alongside the `$ref` that points at it, rather than inside the shared `$defs` entry, so different usages of the same named type can have different comments.
{% /callout %}

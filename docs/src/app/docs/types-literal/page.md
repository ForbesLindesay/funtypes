---
title: Literal
nextjs:
  metadata:
    title: Literal
    description: Runtime validation of literals in TypeScript
---

Use `ft.Literal` to validate an unknown value is exactly equal to a specific value. This is most useful in unions.

## Union of literals

```ts
import * as ft from "funtypes";

export const ObjectKindSchema = ft.Union(
  ft.Literal("USER"),
  ft.Literal("POST"),
);
// => ft.Codec<"USER" | "POST">

export type ObjectKind = ft.Static<
  typeof ObjectKindSchema
>;
// => "USER" | "POST"

// ✅ Valid value
assert.deepEqual(
  ObjectKindSchema.parse("USER"),
  "USER",
);
assert.deepEqual(
  ObjectKindSchema.parse("POST"),
  "POST",
);

// 🚨 Invalid value
assert.throws(() => ObjectKindSchema.parse(42));

// 🚨 Invalid value
assert.throws(() =>
  ObjectKindSchema.parse("SOME_OTHER_STRING"),
);
```

{% callout title="Funtypes provides ft.Null and ft.Undefined" %}
Although you could write `ft.Literal(null)` and `ft.Literal(undefined)`, these two types are so common that Funtypes provides a shorthand of simply `ft.Null` and `ft.Undefined`. There's also a handy `ft.Nullable(T)` utility for creating a union of `null | SomeType`.
{% /callout %}

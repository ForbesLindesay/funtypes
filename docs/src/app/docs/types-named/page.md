---
title: Named
nextjs:
  metadata:
    title: Named
    description: Named utility to improve error messages in Funtypes
---

Use `ft.Named` to add names to types for use in error messages. This is especially useful for large unions that can otherwise have very long error messages.

```ts
import * as ft from "funtypes";

const UserSchema = ft.Named(
  "User",
  ft.Object({
    type: ft.Literal("USER"),
    id: ft.Number,
    name: ft.String,
  }),
);

const PostSchema = ft.Named(
  "Post",
  ft.Object({
    type: ft.Literal("POST"),
    id: ft.Number,
    title: ft.String,
  }),
);

export const DbObjectSchema = ft.Union(
  UserSchema,
  PostSchema,
);
// => ft.Codec<{ type: "USER"; id: number; name: string } | { type: "POST"; id: number; title: string }>

export type DbObjectType = ft.Static<
  typeof DbObjectSchema
>;
// => { type: "USER"; id: number; name: string } | { type: "POST"; id: number; title: string }

// ✅ Instead of printing out the full type, it
//    just refers to sub-types by name
assert.deepEqual(
  ft.showType(DbObjectSchema),
  "User | Post",
);
```

Other than improving error messages, `ft.Named` should never make any difference to the behaviour of your funtypes.

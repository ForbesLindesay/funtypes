---
title: showType
nextjs:
  metadata:
    title: showType
    description: API reference for showType
---

The `showType` utility can be used to display a human readable string representation of a funtypes Codec. It matches the TypeScript type syntax as much as possible.

For example:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => ft.Codec<{ id: number; name: string }>

assert.deepEqual(
  ft.showType(UserCodec)
  "{ id: number; name: string }",
);
```

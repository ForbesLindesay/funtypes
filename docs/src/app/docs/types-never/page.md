---
title: Never
nextjs:
  metadata:
    title: Never
    description: Funtypes "never" type
---

If you need a codec that is never valid, you can use `ft.Never`. You might use this as the type for an API endpoint that's not yet implemented and so you don't want it to ever be called.

```ts
import * as ft from "funtypes";

const MyCodec = ft.Never;
// => ft.Codec<never>
type MyType = ft.Static<typeof MyCodec>;
// => never

// 🚨 Never will always throw when you try to
//    parse something
assert.throws(() => MyCodec.parse({}));
```

If you use `ft.Never` inside a `Union`, it's effectively removed from the list of possibilities.

```ts
import * as ft from "funtypes";

const MyUnion = ft.Union(ft.String, ft.Never);
// => ft.Codec<string>

type MyType = ft.Static<typeof MyCodec>;
// => string

// ✅ Can parse the other types in the union
assert.deepEqual(
  MyCodec.parse("Hello World"),
  "Hello World",
);
```

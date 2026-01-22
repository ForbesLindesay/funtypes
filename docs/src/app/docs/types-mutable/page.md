---
title: Mutable
nextjs:
  metadata:
    title: Mutable
    description: Mutable utility from Funtypes
---

Use `ft.Mutable` to change an array or object Codec from `readonly` to mutable. It will not have any effect on the actual behaviour of the Codec, other than the results of `ft.showType` and the inferred TypeScript type.

The inverse is also available as [`ft.Readonly`](/docs/types-readonly)

## Mutable Array

```ts
import * as ft from "funtypes";

const ReadonlyArrayCodec = ft.ReadonlyArray(
  ft.Number,
);
// => Codec<readonly number[]>

const ArrayCodec = ft.Mutable(
  ReadonlyArrayCodec,
);
// => Codec<number[]>

type Array = ft.Static<typeof ArrayCodec>;
// => number[]

assert.deepEqual(
  ft.showType(ArrayCodec),
  "number[]",
);
```

## Mutable Object

```ts
import * as ft from "funtypes";

const ReadonlyUserCodec = ft.ReadonlyObject({
  id: ft.Number,
  name: ft.String,
});
// => Codec<{ readonly id: number; readonly name: string }>

const UserCodec = ft.Mutable(ReadonlyUserCodec);
// => Codec<{ id: number; name: string }>

type User = ft.Static<typeof UserCodec>;
// => { id: number; name: string }

assert.deepEqual(
  ft.showType(UserCodec),
  "{ id: number; name: string }",
);
```

## Mutable Tuple

```ts
import * as ft from "funtypes";

const ReadonlyTupleCodec = ft.ReadonlyTuple(
  ft.Number,
  ft.String,
);
// => Codec<readonly [ number, string ]>

const TupleCodec = ft.Mutable(
  ReadonlyTupleCodec,
);
// => Codec<[ number, string ]>

type Tuple = ft.Static<typeof TupleCodec>;
// => [ number, string ]

assert.deepEqual(
  ft.showType(TupleCodec),
  "[ number, string ]",
);
```

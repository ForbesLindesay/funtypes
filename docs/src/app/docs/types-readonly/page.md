---
title: Readonly
nextjs:
  metadata:
    title: Readonly
    description: Readonly utility from Funtypes
---

Use `ft.Readable` to change an array or object Codec from mutable to `readonly`. It will not have any effect on the actual behaviour of the Codec, other than the results of `ft.showType` and the inferred TypeScript type.

The inverse is also available as [`ft.Mutable`](/docs/types-mutable)

## Readonly Array

```ts
import * as ft from "funtypes";

const ArrayCodec = ft.Array(ft.Number);
// => Codec<number[]>

const ReadonlyArrayCodec =
  ft.Readonly(ArrayCodec);
// => Codec<readonly number[]>

type ReadonlyArray = ft.Static<
  typeof ReadonlyArrayCodec
>;
// => readonly number[]

assert.deepEqual(
  ft.showType(ReadonlyArrayCodec),
  "readonly number[]",
);
```

## Readonly Object

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => Codec<{ id: number; name: string }>

const ReadonlyUserCodec = ft.Readonly(
  ReadonlyUserCodec,
);
// => Codec<{ readonly id: number; readonly name: string }>

type ReadonlyUser = ft.Static<
  typeof ReadonlyUserCodec
>;
// => { readonly id: number; readonly name: string }

assert.deepEqual(
  ft.showType(ReadonlyUserCodec),
  "{ readonly id: number; readonly name: string }",
);
```

## Readonly Tuple

```ts
import * as ft from "funtypes";

const TupleCodec = ft.Tuple(
  ft.Number,
  ft.String,
);
// => Codec<[ number, string ]>

const ReadonlyTupleCodec =
  ft.Readonly(TupleCodec);
// => Codec<readonly [ number, string ]>

type ReadonlyTuple = ft.Static<
  typeof ReadonlyTupleCodec
>;
// => readonly [ number, string ]

assert.deepEqual(
  ft.showType(ReadonlyTupleCodec),
  "readonly [ number, string ]",
);
```

## Make everything readonly

If you prefer to use `Readonly` for most things, you can import from `"funtypes/readonly"` instead of `"funtypes"` and it will swap the default so that `ft.Array`, `ft.Object`, `ft.Record` and `ft.Tuple` would be `readonly` and you'd need to do `ft.MutableArray`, `ft.MutableObject`, `ft.MutableRecord` and `ft.MutableTuple` for the mutable versions.

```ts
import * as ft from "funtypes/readonly";

export const MyArrayCodec = ft.Array(
  ft.Number,
);
// => ft.Codec<readonly number[]>

export const MyMutableArrayCodec = ft.MutableArray(
  ft.Number,
);
// => ft.Codec<number[]>
```

---
title: Tuple
nextjs:
  metadata:
    title: Tuple
    description: Runtime validation of a TypeScript Tuples
---

Use `ft.Tuple` to validate an unknown value is a tuple, i.e. an array of a specific length with specific types for each value in the array.

## Simple Tuple

```ts
import * as ft from "funtypes";

export const MyTupleSchema = ft.Tuple(
  ft.Number,
  ft.String,
);
// => ft.Codec<[number, string]>
export type MyTuple = ft.Static<
  typeof MyTupleSchema
>;
// => [number, string]

// ✅ Valid tuple
assert.deepEqual(
  MyTupleSchema.parse([42, "42"]),
  [42, "42"],
);

// 🚨 Tuple is too short
assert.throws(() => MyTupleSchema.parse([42]));

// 🚨 Tuple is too long
assert.throws(() =>
  MyTupleSchema.parse([42, "42", "Forty Two"]),
);

// 🚨 Tuple has the wrong types
assert.throws(() =>
  MyTupleSchema.parse(["42", 42]),
);

// 🚨 Not an array
assert.throws(() =>
  MyTupleSchema.parse({ 0: 42, 1: "42" }),
);
```

## ReadonlyTuple

The `ft.ReadonlyTuple` type has the same runtime behaviour as `ft.Tuple`, but the type is a readonly array, rather than a mutable array.

```ts
import * as ft from "funtypes";

export const MyTupleSchema = ft.ReadonlyTuple(
  ft.Number,
  ft.String,
);
// => ft.Codec<readonly [number, string]>
export type MyTuple = ft.Static<
  typeof MyTupleSchema
>;
// => readonly [number, string]

// ✅ Valid tuple
assert.deepEqual(
  MyTupleSchema.parse([42, "42"]),
  [42, "42"],
);

// 🚨 Tuple is too short
assert.throws(() => MyTupleSchema.parse([42]));

// 🚨 Tuple is too long
assert.throws(() =>
  MyTupleSchema.parse([42, "42", "Forty Two"]),
);

// 🚨 Tuple has the wrong types
assert.throws(() =>
  MyTupleSchema.parse(["42", 42]),
);

// 🚨 Not an array
assert.throws(() =>
  MyTupleSchema.parse({ 0: 42, 1: "42" }),
);
```

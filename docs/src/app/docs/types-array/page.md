---
title: Array
nextjs:
  metadata:
    title: Array
    description: Runtime validation of a TypeScript Arrays
---

Use `ft.Array` to validate an unknown value is equal to an array of values matching some sub-codec.

## Array of numbers

```ts
import * as ft from "funtypes";

export const MyArraySchema = ft.Array(ft.Number);
// => ft.Codec<number[]>
export type MyArray = ft.Static<
  typeof MyArraySchema
>;
// => number[]

// ✅ Valid array of numbers
assert.deepEqual(
  MyArraySchema.parse([1, 2, 3]),
  [1, 2, 3],
);

// 🚨 Array contains something other than numbers
assert.throws(() =>
  MyArraySchema.parse([1, "2", 3]),
);

// 🚨 Not an array
assert.throws(() =>
  MyArraySchema.parse({ 0: 1, 1: 2, 2: 3 }),
);
```

## Array of parsed values

```ts
import * as ft from "funtypes";

const ParsedIntegerString = ft.String.withParser({
  parse(value) {
    if (!/^\d+$/.test(value)) {
      return {
        success: false,
        message: `Expected an integer string but got ${JSON.stringify(value)}`,
      };
    }
    return {
      success: true,
      value: parseInt(value, 10),
    };
  },
  serialize(value) {
    if (value !== (value | 0)) {
      return {
        success: false,
        message: `Expected an integer but got ${JSON.stringify(value)}`,
      };
    }
    return {
      success: true,
      value: value.toString(),
    };
  },
});

export const MyArraySchema = ft.Array(
  ParsedIntegerString,
);
// => ft.Codec<number[]>
export type MyArray = ft.Static<
  typeof MyArraySchema
>;
// => number[]

// ✅ Valid array of integer strings
assert.deepEqual(
  MyArraySchema.parse(["1", "2", "3"]),
  [1, 2, 3],
);

// ✅ Valid array of integers to serialize
assert.deepEqual(
  MyArraySchema.serialize([1, 2, 3]),
  ["1", "2", "3"],
);

// 🚨 Array contains something other than integer
//    strings
assert.throws(() =>
  MyArraySchema.parse(["1", "2", "3.14"]),
);

// 🚨 Array to serialize contains something other
//    than integers
assert.throws(() =>
  MyArraySchema.serialize([1, 2, 3.14]),
);

// 🚨 Not an array
assert.throws(() =>
  MyArraySchema.parse({ 0: "1", 1: "2", 2: "3" }),
);
```

## ReadonlyArray

The `ft.ReadonlyArray` type has the same runtime behaviour as `ft.Array`, but the type is a readonly array, rather than a mutable array.

```ts
import * as ft from "funtypes";

export const MyArraySchema = ft.ReadonlyArray(
  ft.Number,
);
// => ft.Codec<readonly number[]>
export type MyArray = ft.Static<
  typeof MyArraySchema
>;
// => readonly number[]

// ✅ Valid array of numbers
assert.deepEqual(
  MyArraySchema.parse([1, 2, 3]),
  [1, 2, 3],
);

// 🚨 Array contains something other than numbers
assert.throws(() =>
  MyArraySchema.parse([1, "2", 3]),
);

// 🚨 Not an array
assert.throws(() =>
  MyArraySchema.parse({ 0: 1, 1: 2, 2: 3 }),
);
```

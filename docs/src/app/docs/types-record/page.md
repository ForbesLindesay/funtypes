---
title: Record
nextjs:
  metadata:
    title: Record
    description: Runtime validation of a TypeScript Records
---

Use `ft.Record` to validate an unknown value is a "Record object", i.e. an object where the keys match some expected pattern, and the values are of some known type.

## Simple Record

```ts
import * as ft from "funtypes";

export const MyRecordCodec = ft.Record(
  ft.String,
  ft.Number,
);
// => ft.Codec<{ [key in string]?: number }>
export type MyRecord = ft.Static<
  typeof MyRecordCodec
>;
// => { [key in string]?: number }

// ✅ Valid Record
assert.deepEqual(
  MyRecordCodec.parse({ "Forty Two": 42 }),
  { "Forty Two": 42 },
);

// ✅ Valid Empty Record
assert.deepEqual(MyRecordCodec.parse({}), {});

// 🚨 Value doesn't match `ft.Number` codec
assert.throws(() =>
  MyRecordCodec.parse({ "42": "Forty Two" }),
);

// 🚨 Array rather than object
assert.throws(() => MyRecordCodec.parse([]));
```

## Complex Keys

Record keys can be any Codec type with an underlying type of `string` or `number`. Values can be any Codec type.

```ts
import * as ft from "funtypes";

type Email = `${string}@${string}`;
const EmailCodec =
  ft.String.withConstraint<Email>(
    (value) =>
      value.includes("@") ||
      "Expected a valid email",
    { name: "Email" },
  );
const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});

export const UsersByEmailCodec = ft.Record(
  EmailCodec,
  UserCodec,
);
// => ft.Codec<{ [key in Email]?: { id: number; name: string } }>

export type UsersByEmail = ft.Static<
  typeof UsersByEmailCodec
>;
// => { [key in Email]?: { id: number; name: string } }

// ✅ Valid Record
assert.deepEqual(
  MyRecordCodec.parse({
    "forbes@example.com": {
      id: 42,
      name: "Forbes Lindesay",
    },
  }),
  {
    "forbes@example.com": {
      id: 42,
      name: "Forbes Lindesay",
    },
  },
);

// ✅ Valid Empty Record
assert.deepEqual(MyRecordCodec.parse({}), {});

// 🚨 Invalid Key
assert.throws(() =>
  MyRecordCodec.parse({
    forbes: {
      id: 42,
      name: "Forbes Lindesay",
    },
  }),
);
```

## Numbers as Keys

```ts
import * as ft from "funtypes";

export const MyRecordCodec = ft.Record(
  ft.Number,
  ft.String,
);
// => ft.Codec<{ [key in number]?: string }>
export type MyRecord = ft.Static<
  typeof MyRecordCodec
>;
// => { [key in number]?: string }

// ✅ Valid Record
assert.deepEqual(
  MyRecordCodec.parse({ 42: "Forty Two" }),
  { 42: "Forty Two" },
);

// ✅ Valid Record (runtime value is the same)
assert.deepEqual(
  MyRecordCodec.parse({ "42": "Forty Two" }),
  { "42": "Forty Two" },
);

// ✅ Valid Empty Record
assert.deepEqual(MyRecordCodec.parse({}), {});

// 🚨 Key doesn't match `ft.Number` codec
assert.throws(() =>
  MyRecordCodec.parse({
    "Forty Two": "Forty Two",
  }),
);
```

## ReadonlyRecord

The `ft.ReadonlyRecord` type has the same runtime behaviour as `ft.Record`, but the type is a readonly object, rather than a mutable object.

```ts
import * as ft from "funtypes";

export const MyRecordCodec = ft.ReadonlyRecord(
  ft.String,
  ft.Number,
);
// => ft.Codec<{ readonly [key in string]?: number }>
export type MyRecord = ft.Static<
  typeof MyRecordCodec
>;
// => { readonly [key in string]?: number }
```

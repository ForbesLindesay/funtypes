---
title: Codec.serialize
nextjs:
  metadata:
    title: Codec.serialize
    description: API reference for Codec.serialize
---

Serializes a known type using a Funtypes Codec.

For example:

```ts
import * as ft from "funtypes";
import * as s from 'funtypes-schemas';

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: s.ParsedDateTimeString(),
});
// => ft.Codec<{ id: number; name: string; dateOfBirth: Date }>

// ✅ Serializes the date object to a string
assert.deepEqual(
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date("1970-01-01T00:00:00.000Z"),
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z",
  },
);

// 🚨 Invalid: id should be a number, but here we've
//    passed a string instead.
assert.throws(() => {
  UserCodec.serialize({
    // @ts-expect-error - TypeScript will expect the object passed to `serialize` to be valid
    id: "42",
    name: "Forbes Lindesay",
    dateOfBirth: new Date("1970-01-01T00:00:00.000Z")
  });
});

// 🚨 Invalid: dateOfBirth is already a string, but the
//    parsed value should have been a Date.
assert.throws(() => {
  UserCodec.serialize({
    id: 1,
    name: "Forbes Lindesay",
    // @ts-expect-error - TypeScript will expect the object passed to `serialize` to be valid
    dateOfBirth: "1970-01-01T00:00:00.000Z"
  })
});
```

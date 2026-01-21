---
title: Codec.parse
nextjs:
  metadata:
    title: Codec.parse
    description: API reference for Codec.parse
---

Parses an unknown value using a funtypes Codec.

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

// ✅ Validates and parses the Date
assert.deepEqual(
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z",
  }),
  {
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date("1970-01-01T00:00:00.000Z"),
  },
);

// 🚨 Invalid: id should be a number, but here we've
//    passed a string instead.
assert.throws(() => {
  UserCodec.parse({
    id: "42",
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z"
  });
});

// 🚨 Invalid: dateOfBirth is already a Date, but the
//    serialized value should have been as string.
assert.throws(() => {
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date("1970-01-01T00:00:00.000Z")
  })
});
```

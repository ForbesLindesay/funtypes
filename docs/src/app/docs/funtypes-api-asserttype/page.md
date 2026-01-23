---
title: assertType
nextjs:
  metadata:
    title: assertType
    description: API reference for assertType
---

The `assertType` utility throws an error if a given value doesn't match a given type.

For example:

```ts
import * as ft from "funtypes";
import * as s from "funtypes-schemas";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: s.ParsedDateTimeString(),
});
// => ft.Codec<{ id: number; name: string; dateOfBirth: Date }>

// ✅ Valid so no error is thrown
ft.assertType(UserCodec, {
  id: 1,
  name: "Forbes Lindesay",
  dateOfBirth: new Date(
    "1970-01-01T00:00:00.000Z",
  ),
});

// 🚨 Invalid: id should be a number, but here we
//    passed a string instead.
assert.throws(() => {
  ft.assertType(UserCodec, {
    id: "42",
    name: "Forbes Lindesay",
    dateOfBirth: new Date(
      "1970-01-01T00:00:00.000Z",
    ),
  });
});

// 🚨 Invalid: dateOfBirth is a string, which
//    would be ok if the value was serialized, but
//    the Codec.assert function tests if the value
//    matches the **parsed** Codec
assert.throws(() => {
  ft.assertType(UserCodec, {
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z",
  });
});
```

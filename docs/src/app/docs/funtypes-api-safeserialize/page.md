---
title: Codec.safeSerialize
nextjs:
  metadata:
    title: Codec.safeSerialize
    description: API reference for Codec.safeSerialize
---

Serializes a known type using a Funtypes Codec without throwing an error.

For example:

```ts
import * as ft from "funtypes";
import * as s from "funtypes-Codecs";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: s.ParsedDateTimeString(),
});
// => ft.Codec<{ id: number; name: string; dateOfBirth: Date }>

// ✅ Serializes the date object to a string
assert.deepEqual(
  UserCodec.safeSerialize({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date(
      "1970-01-01T00:00:00.000Z",
    ),
  }),
  {
    success: true,
    value: {
      id: 1,
      name: "Forbes Lindesay",
      dateOfBirth: "1970-01-01T00:00:00.000Z",
    },
  },
);

// 🚨 Invalid: id should be a number, but here
//    we've passed a string instead.
const failedResult = UserCodec.safeSerialize({
  // TypeScript will expect the object passed
  // to `safeSerialize` to be valid.
  // @ts-expect-error
  id: "42",
  name: "Forbes Lindesay",
  dateOfBirth: new Date(
    "1970-01-01T00:00:00.000Z",
  ),
});
assert.deepEqual(failedResult.success, false);
console.log(ft.showError(failedResult));
// => prints human readable error message
```

See [the `Result` type](/docs/funtypes-api-result) for more information on how you can handle the unsuccessful return values from `safeSerialize`.

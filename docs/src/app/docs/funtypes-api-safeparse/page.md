---
title: Codec.safeParse
nextjs:
  metadata:
    title: Codec.safeParse
    description: API reference for Codec.safeParse
---

Parses an unknown value using a funtypes Codec without throwing an error.

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

// ✅ Validates and parses the Date
assert.deepEqual(
  UserCodec.safeParse({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z",
  }),
  {
    success: true,
    value: {
      id: 1,
      name: "Forbes Lindesay",
      dateOfBirth: new Date(
        "1970-01-01T00:00:00.000Z",
      ),
    },
  },
);

// 🚨 Invalid: id should be a number, but here
//    we've passed a string instead.
const failedResult = UserCodec.safeParse({
  id: "42",
  name: "Forbes Lindesay",
  dateOfBirth: "1970-01-01T00:00:00.000Z",
});
assert.deepEqual(failedResult.success, false);
console.log(ft.showError(failedResult));
// => prints human readable error message
```

See [the `Result` type](/docs/funtypes-api-result) for more information on how you can handle the unsuccessful return values from `safeParse`.

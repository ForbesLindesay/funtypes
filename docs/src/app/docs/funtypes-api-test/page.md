---
title: Codec.test
nextjs:
  metadata:
    title: Codec.test
    description: API reference for Codec.test
---

Tests if a given runtime value matches the codec's static type. That is, if it's a value that would be valid to return from the `Codec.parse` method.

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
assert.deepEqual(
  UserCodec.test({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date(
      "1970-01-01T00:00:00.000Z",
    ),
  }),
  true,
);

// 🚨 Invalid: id should be a
//   number, but here we've
//    passed a string instead.
assert.deepEqual(
  UserCodec.test({
    id: "42",
    name: "Forbes Lindesay",
    dateOfBirth: new Date(
      "1970-01-01T00:00:00.000Z",
    ),
  }),
  false,
);

// 🚨 Invalid: dateOfBirth is a
//   string, which would
//    be ok if the value was serialized, but the
//    Codec.assert function tests if the value
//    matches the **parsed** Codec
assert.deepEqual(
  UserCodec.test({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: "1970-01-01T00:00:00.000Z",
  }),
  false,
);
```

Note that TypeScript can tell that the type is constrained by the `Codec.test` call:

```ts
/**
 * TypeScript can infer that this function returns
 * a value of type `string`.
 */
function safelyGetUserName(user: unknown) {
  if (UserCodec.test(user)) {
    return user.name;
  } else {
    return "Unknown user";
  }
}

// ✅ Valid so no error is thrown and the name
//    is returned
assert.deepEqual(
  safelyGetUserName({
    id: 1,
    name: "Forbes Lindesay",
    dateOfBirth: new Date(
      "1970-01-01T00:00:00.000Z",
    ),
  }),
  "Forbes Lindesay",
);

// 🚨 Invalid: even though this object has a
//    "name" prop, It is not a valid User object,
//    so UserCodec.test will return false.
assert.deepEqual(
  safelyGetUserName({
    name: "Forbes Lindesay",
  }),
  "Unknown user",
);
```

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

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: ft.ParsedDateTimeString(),
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

Note that TypeScript can tell that the type is constrained by the `Codec.assert` call:

```ts
import * as ft from "funtypes";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: ft.ParsedDateTimeString(),
});

// --header end--

/**
 * TypeScript can infer that this function returns
 * a value of type `string`. The function will
 * throw an error if you give it anything other than
 * a valid User object.
 */
function dangerouslyGetUserName(user: unknown) {
  ft.assertType(UserCodec, user);
  return user.name;
}

// ✅ Valid so no error is thrown and the name is
//    returned
assert.deepEqual(
  dangerouslyGetUserName({
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
//    so UserCodec.assert will throw an error.
assert.throws(() => {
  dangerouslyGetUserName({
    name: "Forbes Lindesay",
  });
});
```

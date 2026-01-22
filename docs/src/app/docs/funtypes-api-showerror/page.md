---
title: showError
nextjs:
  metadata:
    title: showError
    description: API reference for showError
---

The `showError` utility creates a detailed, readable error message for a `Failure` (see [`Result`](/docs/funtypes-api-result)).

For example:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Named(
  "User",
  ft.Object({
    type: ft.Literal("USER"),
    id: ft.Number,
    name: ft.String,
  }),
);
const PostCodec = ft.Named(
  "Post",
  ft.Object({
    type: ft.Literal("POST"),
    id: ft.Number,
    title: ft.String,
  }),
);
const ObjectCodec = ft.Union(
  UserCodec,
  PostCodec,
);

const failure = ObjectCodec.safeParse({
  type: "USER",
  id: 42,
  title: "Forbes Lindesay",
});
if (failure.success) {
  throw new Error(
    "This can't happen because the value is not valid",
  );
}

// failure.message has a very short description
// of why the value is not valid
console.log("Short Message: " + failure.message);

// ft.showError constructs a detailed message
// showing the reasoning process for why the
// value is not valid.
console.log(
  "Full Error: " + ft.showError(failure),
);
```

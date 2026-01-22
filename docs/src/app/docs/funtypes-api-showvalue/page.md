---
title: showValue
nextjs:
  metadata:
    title: showValue
    description: API reference for showValue
---

The `showValue` utility can be used to display a human readable string representation of a JavaScript value. This is useful when constructing custom errors in [`.withConstraint`](/docs/types-constraint) and [`.withParser`](/docs/types-parsed-value)

It aims to produce more readable output than `JSON.stringify` and handles cutting off the string before it gets too long, and deals with cycles, all while only being a tiny function to avoid adding too much to the bundle size.

For example:

```ts
import * as ft from "funtypes";

assert.deepEqual(
  ft.showValue({
    id: 42,
    name: "Forbes Lindesay",
  }),
  `{ id: 42, name: "Forbes Lindesay" }`,
);
```

---
title: Sealed
nextjs:
  metadata:
    title: Sealed
    description: Sealed utility from Funtypes
---

Use `ft.Sealed` if you want to error when encountering any unexpected additional properties. By default, `ft.Sealed` is shallow, only applying to the immediate Object it contains. You can pass `{ deep: true }` to apply `Sealed` to all objects under the current point:

## Shallow Sealed

```ts
import * as ft from "funtypes";

const UserCodec = ft.Sealed(
  ft.Object({
    id: ft.Number,
    name: ft.String,
    address: ft.Object({
      street: ft.String,
      town: ft.String,
    }),
  }),
);

type User = ft.Static<typeof UserCodec>;
// => {
//      id: number;
//      name: string;
//      address: { street: string; town: string }
//    }

// ✅ Valid object with correct keys
assert.deepEqual(
  UserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
  },
);

// ✅ Extra properties in nested objects are
//    ignored
assert.deepEqual(
  UserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
      someUnexpectedExtraProp: true,
    },
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
  },
);

// 🚨 Extra keys cause an error due to Sealed
assert.throws(() =>
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
    someUnexpectedExtraProp: true,
  }),
);
```

## Deep Sealed

```ts
import * as ft from "funtypes";

const UserCodec = ft.Sealed(
  ft.Object({
    id: ft.Number,
    name: ft.String,
    address: ft.Object({
      street: ft.String,
      town: ft.String,
    }),
  }),
  { deep: true },
);

type User = ft.Static<typeof UserCodec>;
// => {
//      id: number;
//      name: string;
//      address: { street: string; town: string }
//    }

// ✅ Valid object with correct keys
assert.deepEqual(
  UserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
  },
);

// 🚨 Extra keys in nested objects cause an error
//    due to Sealed with { deep: true }
assert.throws(() =>
  UserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
      someUnexpectedExtraProp: true,
    },
  }),
);

// 🚨 Extra keys cause an error due to Sealed
assert.throws(() =>
  UserCodec.parse({
    id: 1,
    name: "Forbes Lindesay",
    address: {
      street: "Awesome Street",
      town: "Awesome Town",
    },
    someUnexpectedExtraProp: true,
  }),
);
```

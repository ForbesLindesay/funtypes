---
title: Enum
nextjs:
  metadata:
    title: Enum
    description: Runtime validation of TypeScript Enums
---

Use `ft.Enum` to validate an unknown value is equal to one of the values in an enum.

The first parameter is the name of the enum, for use in error messages. The second parameter is the enum itself.

## Numeric Enum

```ts
import * as ft from "funtypes";

export enum MyEnum {
  A = 1,
  B = 2,
}
export const MyEnumSchema = ft.Enum(
  "MyEnum",
  MyEnum,
);
// => ft.Codec<MyEnum>

// ✅ Valid reference to enum value
assert.deepEqual(
  MyEnumSchema.parse(MyEnum.A),
  MyEnum.A,
);

// ✅ Valid raw value
//    (equivalent at runtime)
assert.deepEqual(MyEnumSchema.parse(1), MyEnum.A);

// 🚨 Invalid value:
assert.throws(() => MyEnumSchema.parse(3));

// 🚨 Invalid value:
assert.throws(() => MyEnumSchema.parse("A"));
```

## String Enum

```ts
import * as ft from "funtypes";

export enum MyEnum {
  A = "letter_a",
  B = "letter_b",
}
export const MyEnumSchema = ft.Enum(
  "MyEnum",
  MyEnum,
);
// ft.Codec<MyEnum>

// ✅ Valid reference to enum value
assert.deepEqual(
  MyEnumSchema.parse(MyEnum.A),
  MyEnum.A,
);

// ✅ Valid raw value
//    (equivalent at runtime)
assert.deepEqual(
  MyEnumSchema.parse("letter_a"),
  MyEnum.A,
);

// 🚨 Invalid value:
assert.throws(() => MyEnumSchema.parse(1));

// 🚨 Invalid value:
assert.throws(() => MyEnumSchema.parse("A"));
```

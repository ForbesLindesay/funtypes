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
export const MyEnumCodec = ft.Enum(
  "MyEnum",
  MyEnum,
);
// => ft.Codec<MyEnum>

// ✅ Valid reference to enum value
assert.deepEqual(
  MyEnumCodec.parse(MyEnum.A),
  MyEnum.A,
);

// ✅ Valid raw value
//    (equivalent at runtime)
assert.deepEqual(MyEnumCodec.parse(1), MyEnum.A);

// 🚨 Invalid value:
assert.throws(() => MyEnumCodec.parse(3));

// 🚨 Invalid value:
assert.throws(() => MyEnumCodec.parse("A"));
```

## String Enum

```ts
import * as ft from "funtypes";

export enum MyEnum {
  A = "letter_a",
  B = "letter_b",
}
export const MyEnumCodec = ft.Enum(
  "MyEnum",
  MyEnum,
);
// ft.Codec<MyEnum>

// ✅ Valid reference to enum value
assert.deepEqual(
  MyEnumCodec.parse(MyEnum.A),
  MyEnum.A,
);

// ✅ Valid raw value
//    (equivalent at runtime)
assert.deepEqual(
  MyEnumCodec.parse("letter_a"),
  MyEnum.A,
);

// 🚨 Invalid value:
assert.throws(() => MyEnumCodec.parse(1));

// 🚨 Invalid value:
assert.throws(() => MyEnumCodec.parse("A"));
```

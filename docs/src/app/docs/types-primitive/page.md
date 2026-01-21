---
title: Primitive
nextjs:
  metadata:
    title: Primitive
    description: Runtime validation of primitive types in TypeScript
---

## BigInt

```ts
import * as ft from "funtypes";

export const MyBigInt = ft.BigInt;
// => ft.Codec<bigint>

// ✅ Valid value
assert.deepEqual(ft.BigInt.parse(42n), 42n);

// 🚨 Wrong type
assert.deepEqual(
  ft.BigInt.safeParse("true"),
  {
    success: false,
    message: `Expected bigint, but was "true" (i.e. a string literal)`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.BigInt.safeParse(42),
  {
    success: false,
    message: `Expected bigint, but was 42`
  }
)
```

## Boolean

```ts
import * as ft from "funtypes";

export const MyBool = ft.Boolean;
// => ft.Codec<boolean>

// ✅ Valid value
assert.deepEqual(ft.Boolean.parse(true), true);
assert.deepEqual(ft.Boolean.parse(false), false);

// 🚨 Wrong type
assert.deepEqual(
  ft.Boolean.safeParse("true"),
  {
    success: false,
    message: `Expected boolean, but was "true" (i.e. a string literal)`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.Boolean.safeParse(42),
  {
    success: false,
    message: `Expected boolean, but was 42`
  }
)
```

## Number

```ts
import * as ft from "funtypes";

export const MyNumber = ft.Number;
// => ft.Codec<number>

// ✅ Valid value
assert.deepEqual(ft.Number.parse(42), 42);
assert.deepEqual(ft.Number.parse(3.14), 3.14);

// 🚨 Wrong type
assert.deepEqual(
  ft.Number.safeParse("42"),
  {
    success: false,
    message: `Expected number, but was "42" (i.e. a string literal)`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.Number.safeParse(true),
  {
    success: false,
    message: `Expected number, but was true`
  }
)
```

## Function

```ts
import * as ft from "funtypes";

export const MyFunction = ft.Function;
// => ft.Codec<(...args: any[]) => any>

// ✅ Valid value
const myFun = () => 42;
assert.deepEqual(ft.Function.parse(myFun), myFun);

// 🚨 Wrong type
assert.deepEqual(
  ft.Function.safeParse("42"),
  {
    success: false,
    message: `Expected function, but was "42" (i.e. a string literal)`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.Function.safeParse(true),
  {
    success: false,
    message: `Expected function, but was true`
  }
)
```

{% callout type="warning" title="Functions accept and return any" %}
There's unfortunately no way for us to verify what parameters a function accepts or what it returns, so `ft.Function` just checks it is some kind of function, not anything more specific.
{% /callout %}

## String

```ts
import * as ft from "funtypes";

export const MyString = ft.String;
// => ft.Codec<string>

// ✅ Valid value
assert.deepEqual(ft.String.parse("hello world"), "hello world");

// 🚨 Wrong type
assert.deepEqual(
  ft.String.safeParse(42),
  {
    success: false,
    message: `Expected string, but was 42`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.String.safeParse(true),
  {
    success: false,
    message: `Expected string, but was true`
  }
)
```

## Symbol

```ts
import * as ft from "funtypes";

export const MySymbol = ft.Symbol;
// => ft.Codec<symbol>

// ✅ Valid value
const mySym = Symbol("My Symbol");
assert.deepEqual(ft.Symbol.parse(mySym), mySym);

// 🚨 Wrong type
assert.deepEqual(
  ft.Symbol.safeParse("true"),
  {
    success: false,
    message: `Expected symbol, but was "true" (i.e. a string literal)`
  }
)

// 🚨 Wrong type
assert.deepEqual(
  ft.Symbol.safeParse(42),
  {
    success: false,
    message: `Expected symbol, but was 42`
  }
)
```

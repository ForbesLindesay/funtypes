---
title: Unknown
nextjs:
  metadata:
    title: Unknown
    description: Funtypes "unknown" type
---

If you need a codec that is always valid, you can use `ft.Unknown`. This can allow you to validate outer parts of some schema, while still having some inner value that is Funtypes just passes through without changing it or validating it.

```ts
import * as ft from "funtypes";

const MySchema = ft.Unknown;
// => ft.Codec<unknown>
type MyType = ft.Static<typeof MySchema>;
// => unknown

// ✅ Accepts any value
assert.deepEqual(
  MySchema.parse({ hello: "world" }),
  { hello: "worldxxx" },
);

// ✅ Accepts any value
assert.deepEqual(MySchema.parse(42), 42);
```

## Unknown with Intersection

If you use `ft.Unknown` inside an intersection, it's effectively ignored by TypeScript, but it will ensure any extra properties are preserved.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => ft.Codec<{ id: number; name: string }>
const OpenUserCodec = ft.Intersect(
  UserCodec,
  ft.Unknown,
);
// => ft.Codec<{ id: number; name: string }>

type OpenUser = ft.Static<typeof OpenUserCodec>;
// => { id: number; name: string }

// ✅ Can parse the object while preserving extra
//    properties
assert.deepEqual(
  OpenUserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
    someOtherUnexpectedProperty: true,
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
    someOtherUnexpectedProperty: true,
  },
);

// 🚨 Still fails if other parts of the
//    intersection fail
assert.throws(() => OpenUserCodec.parse({}));
```

## Unknown with constraint

You can use `ft.Unknown` as a base type for parsed types or constraint types. For example, here's a type for a node.js Buffer object:

```ts
const BufferCodec =
  ft.Unknown.withConstraint<Buffer>(
    (value) =>
      Buffer.isBuffer(value) ||
      "Expected a node.js Buffer",
    { name: "Buffer" },
  );
// => ft.Codec<Buffer>

assert.deepEqual(
  BufferCodec.parse(Buffer.from("Hello World")),
  Buffer.from("Hello World"),
);
assert.deepEqual(
  BufferCodec.safeParse("Hello World"),
  {
    success: false,
    message: "Expected a node.js Buffer",
  },
);
```

## Unknown with parser

You can also use it as a base for parsed types. For example, here we have a type that serializes to a node.js Buffer but parses to the UTF8 string contained in the Buffer.

```ts
const Utf8BufferCodec = ft.Unknown.withParser({
  name: "Utf8Buffer",
  test: ft.String,
  parse(value) {
    if (!Buffer.isBuffer(value)) {
      return {
        success: false,
        message: "Expected a node.js Buffer",
      };
    }
    return {
      success: true,
      value: value.toString("utf8"),
    };
  },
  serialize(value) {
    return {
      success: true,
      value: Buffer.from(value, "utf8"),
    };
  },
});
// => ft.Codec<string>

assert.deepEqual(
  Utf8BufferCodec.parse(
    Buffer.from("Hello World"),
  ),
  "Hello World",
);
assert.deepEqual(
  Utf8BufferCodec.safeParse("Hello World"),
  {
    success: false,
    message: "Expected a node.js Buffer",
  },
);
```

We could (of course) use the `BufferCodec` we created in "Unknown with constraint" to simplify our `Utf8BufferCodec` type a little though:

```ts
const BufferCodec =
  ft.Unknown.withConstraint<Buffer>(
    (value) =>
      Buffer.isBuffer(value) ||
      "Expected a node.js Buffer",
    { name: "Buffer" },
  );
const Utf8BufferCodec = BufferCodec.withParser({
  name: "Utf8Buffer",
  test: ft.String,
  parse(value) {
    return {
      success: true,
      value: value.toString("utf8"),
    };
  },
  serialize(value) {
    return {
      success: true,
      value: Buffer.from(value, "utf8"),
    };
  },
});
// => ft.Codec<string>

assert.deepEqual(
  Utf8BufferCodec.parse(
    Buffer.from("Hello World"),
  ),
  "Hello World",
);
assert.deepEqual(
  Utf8BufferCodec.safeParse("Hello World"),
  {
    success: false,
    message: "Expected a node.js Buffer",
  },
);
```

This composition approach is generally easier to reason about and more flexible, so it's normally a better choice than using `ft.Unknown` as a base type for `.withParser`.

## Unknown with union

If you use `ft.Unknown` inside a `Union`, it's effectively makes the entire union `unknown`. Funtypes will still try each validator in order though.

```ts
import * as ft from "funtypes";

const UpperString = ft.String.withParser({
  test: ft.String.withConstraint(
    (v) =>
      v === v.toUpperCase() ||
      "Expected string to be upper case",
  ),
  parse(value) {
    return {
      success: true,
      value: value.toUpperCase(),
    };
  },
  serialize(value) {
    return {
      success: true,
      value,
    };
  },
});
// => ft.Codec<string>

const NegativeNumber = ft.Number.withParser({
  test: ft.Number.withConstraint(
    (v) =>
      v <= 0 || "Expected number to be negative",
  ),
  parse(value) {
    return {
      success: true,
      value: Math.abs(value) * -1,
    };
  },
  serialize(value) {
    return {
      success: true,
      value,
    };
  },
});
// => ft.Codec<number>

// Unknown will replace all the other types in the union
// as far as TypeScript is concerned
const OpenCodec = ft.Union(
  UpperString,
  ft.Unknown,
  NegativeNumber,
);
// => ft.Codec<unknown>

type Open = ft.Static<typeof OpenCodec>;
// => unknown

// ✅ When parsing string, it'll use that
//    first codec
assert.deepEqual(
  OpenCodec.parse("forbes lindesay"),
  "FORBES LINDESAY",
);

// ✅ When parsing number, it'll use unknown as
//    that's before the number codec in the Union
assert.deepEqual(OpenCodec.parse(42), 42);

// ✅ When parsing anything else, it uses unknown
assert.deepEqual(
  OpenCodec.parse({
    hello: "world",
  }),
  {
    hello: "world",
  },
);
```

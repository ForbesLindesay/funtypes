---
title: Intersect
nextjs:
  metadata:
    title: Intersect
    description: Runtime validation of TypeScript intersections of types
---

Use `ft.Intersect` to validate an unknown value matches multiple codecs at the same time. This is equivalent to TypeScript's `&` operator for combining types, it combines types using "and". You can pass as many arguments as you like to `ft.Intersect` in one go to combine lots of different codecs.

## Intersecting Objects

```ts
import * as ft from "funtypes";

const VersionedObjectSchema = ft.Object({
  version: ft.Number,
});

export const UserSchema = ft.Intersect(
  VersionedObjectSchema,
  ft.Object({
    id: ft.Number,
    name: ft.String,
  })
);
// => ft.Codec<{ version: number; id: number; name: string }>

export type User = ft.Static<typeof UserSchema>;
// => { version: number; id: number; name: string }


// ✅ Valid instance of User:
assert.deepEqual(
  UserSchema.parse({
    version: 1,
    id: 42,
    name: "Forbes Lindesay",
  }),
  {
    version: 1,
    id: 42,
    name: "Forbes Lindesay",
  }
);

// 🚨 Missing `version` part of the intersection
assert.throws(() => {
  UserSchema.parse({
    id: 42,
    name: "Forbes Lindesay",
  });
});

// 🚨 Musing user parts of the intersection
assert.throws(() => {
  UserSchema.parse({
    version: 1,
  });
});
```

## Intersecting Constraints

You can also intersect "constraints" along with the underlying types.

```ts
import * as ft from "funtypes";

const MinimumValue = (min: number) => ft.Number.withConstraint(
  value => value >= min || `Expected number to be at least ${min}`,
  { name: `Minimum<${min}>` }
);
const MaximumValue = (max: number) => ft.Number.withConstraint(
  value => value <= max || `Expected number to be at most ${max}`,
  { name: `Maximum<${max}>` }
);

const MyRangeCodec = ft.Intersect(MinimumValue(1), MaximumValue(4));

// ✅ Valid for both constraints
assert.deepEqual(MyRangeCodec.parse(3), 3);

// 🚨 Value less than the minimum
assert.throws(() => MyRangeCodec.parse(0));

// 🚨 Value more than the maximum
assert.throws(() => MyRangeCodec.parse(5));
```

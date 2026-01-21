---
title: InstanceOf
nextjs:
  metadata:
    title: InstanceOf
    description: Runtime validation of TypeScript instances of classes
---

Use `ft.InstanceOf` to validate an unknown value is an instance of a class.

## Simple Class

```ts
import * as ft from "funtypes";

export class User {
  public readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
}
export const UserSchema = ft.InstanceOf(User);
// => ft.Codec<User>


// ✅ Valid instance of User:
assert.deepEqual(
  UserSchema.parse(new User("Forbes Lindesay")),
  new User("Forbes Lindesay"),
);

// 🚨 Correct shape, but not an instance of the class:
assert.throws(() => UserSchema.parse({ name: "Forbes Lindesay" }));

// 🚨 Invalid value:
assert.throws(() => UserSchema.parse("A"));
```

{% callout type="warning" title="InstanceOf can behave strangely if intersected with Object codecs" %}
When parsing using the `ft.Object` codec, properties are copied from the input object to a fresh object for the result. This enables codecs that change the value when parsing or serializing, but it's not compatible with the `InstanceOf` check, as that needs to keep the value un-changed. To avoid issues, don't pass `ft.InstanceOf` to `ft.Intersect`.
{% /callout %}

---
title: Lazy
nextjs:
  metadata:
    title: Lazy
    description: Runtime validation of recursive structures in TypeScript
---

Use `ft.Lazy` to validate an unknown value matches a recursive data structure.

## LinkedList

```ts
import * as ft from "funtypes";

interface LinkedList<T> {
  value: T;
  next: LinkedList<T> | null;
}
const LinkedListCodec = <T,>(
  value: ft.Codec<T>,
) => {
  const ListNode = ft.Lazy(
    (): ft.Codec<LinkedList<T>> =>
      ft.Object({
        value,
        next: ft.Union(ft.Null, ListNode),
      }),
  );
  return ListNode;
};
const NumberLinkedListCodec = LinkedListCodec(
  ft.Number,
);

// ✅ Valid nested structure
assert.deepEqual(
  NumberLinkedListCodec.parse({
    value: 1,
    next: { value: 2, next: null },
  }),
  {
    value: 1,
    next: { value: 2, next: null },
  },
);

// ✅ Cycles in these recursive structures are ok
const NumberLoop = {
  value: 1,
  next: { value: 2, next: null },
};
NumberLoop.next.next = NumberLoop;
assert.deepEqual(
  NumberLinkedListCodec.parse(NumberLoop),
  NumberLoop,
);

// 🚨 Nested value is invalid because v.next.next
//    is `false`
assert.throws(() => {
  NumberLinkedListCodec.parse({
    value: 1,
    next: { value: 2, next: false },
  });
});
```

{% callout title="TypeScript can't infer recursive types" %}
TypeScript will check our working, but it can't do inference when the code is recursive like this, so we have to manually specify the return type on the function we pass in to `ft.Lazy`.
{% /callout %}

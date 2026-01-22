---
title: ValidationError
nextjs:
  metadata:
    title: ValidationError
    description: API reference for the ValidationError type in Funtypes
---

Calling `Codec.assert`, `Codec.parse` or `Codec.serialize` can throw a `ValidationError` if the operation fails. It has the following structure, in addition to the message:

```ts
class ValidationError extends Error {
  public readonly name: 'ValidationError';
  public readonly key: string | undefined;
  public readonly shortMessage: string;
  public readonly fullError: FullError | undefined;
}
```

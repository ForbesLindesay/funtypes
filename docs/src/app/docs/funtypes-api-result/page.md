---
title: Result
nextjs:
  metadata:
    title: Result
    description: API reference for the Result type in Funtypes
---

Calling `Codec.safeParse` or `Codec.safeSerialize` returns a `Result<T>` to indicate the outcome of the operation:

```ts
/**
 * The result of a type validation.
 */
export type Result<T> = Success<T> | Failure;

/**
 * A successful validation result.
 */
export type Success<T> = {
  success: true;
  value: T;
};

/**
 * A failed validation result.
 */
export type Failure = {
  success: false;

  /**
   * A short message indicating the
   * reason validation failed.
   */
  message: string;

  /**
   * A key indicating the location at
   * which validation failed.
   */
  key?: string;

  /**
   * A nested structure containing
   * detail on the reason for the
   * error.
   */
  fullError?: FullError;
};

export type FullError = [string, ...FullError[]];
```

You can call `ft.showError(result)` to get the full, detailed error as a string. This is very helpful when trying to work out why an object can't be assigned to some large, complex union type.

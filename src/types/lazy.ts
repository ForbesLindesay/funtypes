import { create, Codec, showType } from '../runtype';

export function lazyValue<T>(fn: () => T) {
  let value: T;
  return () => {
    return value || (value = fn());
  };
}

/**
 * Construct a possibly-recursive Runtype.
 */
export function Lazy<TUnderlying>(delayed: () => Codec<TUnderlying>): Codec<TUnderlying> {
  const underlying = lazyValue(delayed);

  return create<TUnderlying>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) =>
        innerValidateToPlaceholder(underlying(), value) as any,
      _underlyingType: underlying,
      _showType(needsParens) {
        return showType(underlying(), needsParens);
      },
    },
    {
      tag: 'lazy',
      underlying,
    },
  );
}

import { Runtype, showType, create, Codec, assertRuntype } from '../runtype';

export function Sealed<T>(
  underlying: Runtype<T>,
  { deep = false }: { readonly deep?: boolean } = {},
): Codec<T> {
  assertRuntype(underlying);

  return create<T>(
    {
      _parse: (value, _innerValidate, innerParseToPlaceholder) => {
        return innerParseToPlaceholder<T>(underlying, value, {
          deep,
        });
      },
      _underlyingType: () => underlying,
      _showType: () => `Sealed<${showType(underlying, false)}>`,
    },
    {
      tag: 'sealed',
      underlying,
      deep,
    },
  );
}

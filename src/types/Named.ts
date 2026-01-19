import { create, Codec, assertRuntype, showValue, ObjectCodec } from '../runtype';

export function Named<TUnderlying>(
  name: string,
  underlying: ObjectCodec<TUnderlying>,
): ObjectCodec<TUnderlying>;
export function Named<TUnderlying>(
  name: string,
  underlying: Codec<TUnderlying>,
): Codec<TUnderlying>;
export function Named<TUnderlying>(
  name: string,
  underlying: Codec<TUnderlying>,
): Codec<TUnderlying> {
  assertRuntype(underlying);
  return create<TUnderlying>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) =>
        innerValidateToPlaceholder(underlying, value),
      _underlyingType: () => underlying,
      _showType: () => name,
      _asMutable: asMutable => Named(name, asMutable(underlying)),
      _asReadonly: asReadonly => Named(name, asReadonly(underlying)),
      _pick: (keys, pick) =>
        Named(`Pick<${name}, ${keys.map(v => showValue(v)).join(' | ')}>`, pick(underlying, keys)),
      _omit: (keys, omit) =>
        Named(`Omit<${name}, ${keys.map(v => showValue(v)).join(' | ')}>`, omit(underlying, keys)),
    },
    {
      tag: 'named',
      underlying,
      name,
    },
  );
}

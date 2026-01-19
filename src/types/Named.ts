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
      _mapInternal: mapper => Named(name, mapper(underlying)),
      _partial: asPartial => Named(`Partial<${name}>`, asPartial(underlying)),
      _pick: (pick, keys) =>
        Named(`Pick<${name}, ${keys.map(v => showValue(v)).join(' | ')}>`, pick(underlying)),
      _omit: (omit, keys) =>
        Named(`Omit<${name}, ${keys.map(v => showValue(v)).join(' | ')}>`, omit(underlying)),
    },
    {
      tag: 'named',
      underlying,
      name,
    },
  );
}

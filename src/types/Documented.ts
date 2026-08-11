import { create, Codec, assertRuntype, showType, getInternal, OptionalCodec } from '../runtype';

export interface DocumentedOptions {
  title: string;
  description?: string;
}
export function Documented<TUnderlying>(
  options: DocumentedOptions,
  underlying: OptionalCodec<TUnderlying>,
): OptionalCodec<TUnderlying>;
export function Documented<TUnderlying>(
  options: DocumentedOptions,
  underlying: Codec<TUnderlying>,
): Codec<TUnderlying>;
export function Documented<TUnderlying>(
  options: DocumentedOptions,
  underlying: Codec<TUnderlying>,
): Codec<TUnderlying> {
  assertRuntype(underlying);
  return create<TUnderlying>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) =>
        innerValidateToPlaceholder(underlying, value),
      _underlyingType: () => underlying,
      _showType: needsParens => showType(underlying, needsParens),
      _isOptional: getInternal(underlying)._isOptional,
      _asMutable: mapper => Documented(options, mapper(underlying)),
      _asReadonly: mapper => Documented(options, mapper(underlying)),
      _partial: mapper => Documented(options, mapper(underlying)),
      _pick: mapper => Documented(options, mapper(underlying)),
      _omit: mapper => Documented(options, mapper(underlying)),
    },
    {
      tag: 'documented',
      underlying,
      title: options.title,
      description: options.description,
    },
  );
}

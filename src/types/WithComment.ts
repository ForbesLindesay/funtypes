import {
  create,
  Codec,
  assertRuntype,
  showType,
  getInternal,
  OptionalCodec,
  ObjectCodec,
} from '../runtype';

export interface WithCommentOptions {
  title?: string;
  description?: string;
}
export function WithComment<TUnderlying>(
  options: WithCommentOptions,
  underlying: ObjectCodec<TUnderlying>,
): ObjectCodec<TUnderlying>;
export function WithComment<TUnderlying>(
  options: WithCommentOptions,
  underlying: OptionalCodec<TUnderlying>,
): OptionalCodec<TUnderlying>;
export function WithComment<TUnderlying>(
  options: WithCommentOptions,
  underlying: Codec<TUnderlying>,
): Codec<TUnderlying>;
export function WithComment<TUnderlying>(
  options: WithCommentOptions,
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
      _asMutable: mapper => WithComment(options, mapper(underlying)),
      _asReadonly: mapper => WithComment(options, mapper(underlying)),
      _partial: mapper => WithComment(options, mapper(underlying)),
      _pick: mapper => WithComment(options, mapper(underlying)),
      _omit: mapper => WithComment(options, mapper(underlying)),
    },
    {
      tag: 'comment',
      underlying,
      title: options.title,
      description: options.description,
    },
  );
}

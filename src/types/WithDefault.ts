import { success } from '../result';
import { Runtype, create, Codec, assertRuntype, showType } from '../runtype';
import { Null, Undefined } from './literal';
import { Union } from './union';

/**
 * Add a default value to use in place of null and undefined when parsing.
 * The value will still not be considered optional by TypeScript or when
 * serializing, as by then the default value should have been applied.
 */
export function WithDefault<TParsed>(
  underlying: Runtype<TParsed>,
  defaultValue: TParsed,
): Codec<TParsed> {
  assertRuntype(underlying);
  const underlyingBeforeParse = Union(underlying, Null, Undefined);
  return create<TParsed>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder, _mode, sealed) =>
        value === undefined || value === null
          ? success(defaultValue)
          : innerValidateToPlaceholder(underlying, value, sealed),
      _test: (value, internalTest, sealed, _isOptionalTest) =>
        internalTest(underlying, value, sealed),
      _serialize: (value, _innerValidate, innerValidateToPlaceholder, _mode, sealed) =>
        innerValidateToPlaceholder(underlying, value, sealed),
      _underlyingType(mode) {
        switch (mode) {
          case 'p':
            return underlyingBeforeParse;
          case 't':
            return underlying;
          case 's':
            return underlying;
        }
      },
      _showType: needsParens => showType(underlying, needsParens),
    },
    { tag: 'default', underlying, defaultValue },
  );
}

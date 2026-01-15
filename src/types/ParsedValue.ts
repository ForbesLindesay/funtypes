import { failure, Result } from '../result';
import {
  Runtype,
  create,
  Codec,
  mapValidationPlaceholder,
  assertRuntype,
  innerGuard,
  createGuardVisitedState,
  showType,
} from '../runtype';
import { Never } from './never';

export interface ParsedValueConfig<TUnderlying, TParsed> {
  name?: string;
  parse: (value: TUnderlying) => Result<TParsed>;
  serialize?: (value: TParsed) => Result<TUnderlying>;
  test?: Runtype<TParsed>;
}
export function ParsedValue<TUnderlying, TParsed>(
  underlying: Runtype<TUnderlying>,
  config: ParsedValueConfig<TUnderlying, TParsed>,
): Codec<TParsed> {
  assertRuntype(underlying);
  return create<TParsed>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) => {
        return mapValidationPlaceholder<any, TParsed>(
          innerValidateToPlaceholder(underlying, value),
          source => config.parse(source),
          config.test,
        );
      },
      _test(value, internalTest, _sealed, isOptionalTest) {
        return config.test
          ? internalTest(config.test, value)
          : isOptionalTest
            ? undefined
            : failure(
                `${
                  config.name || `ParsedValue<${showType(underlying)}>`
                } does not support Runtype.test`,
              );
      },
      _serialize(value, _internalSerialize, internalSerializeToPlaceholder, _getFields, sealed) {
        if (!config.serialize) {
          return failure(
            `${
              config.name || `ParsedValue<${showType(underlying)}>`
            } does not support Runtype.serialize`,
          );
        }
        const testResult = config.test
          ? innerGuard(config.test, value, createGuardVisitedState(), sealed, true)
          : undefined;

        if (testResult) {
          return testResult;
        }

        const serialized = config.serialize(value);

        if (!serialized.success) {
          return serialized;
        }

        return internalSerializeToPlaceholder(underlying, serialized.value, false);
      },
      _underlyingType(mode) {
        switch (mode) {
          case 'p':
            return underlying;
          case 't':
            return config.test;
          case 's':
            return config.serialize ? config.test : Never;
        }
      },
      _showType: () => config.name || `ParsedValue<${showType(underlying, false)}>`,
    },
    {
      tag: 'parsed',
      underlying,
      name: config.name,
      test: config.test,
    },
  );
}

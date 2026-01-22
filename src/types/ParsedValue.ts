import { failure, Result, success } from '../result';
import {
  Runtype,
  create,
  Codec,
  assertRuntype,
  innerGuard,
  createGuardVisitedState,
  showType,
  Cycle,
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
        const innerResult = innerValidateToPlaceholder(underlying, value);
        if (!innerResult._cycle) {
          if (!innerResult.success) return innerResult;
          const result = config.parse(innerResult.value);
          return (
            (result.success &&
              config.test &&
              innerGuard(config.test, result.value, createGuardVisitedState(), false, true)) ||
            result
          );
        }

        const placeholder = (
          Array.isArray(innerResult._placeholder)
            ? [...innerResult._placeholder]
            : { ...innerResult._placeholder }
        ) as TParsed;

        let hasCycle = false;
        let cache: Result<TParsed> | undefined;
        const cycle: Cycle<TParsed> = {
          _cycle: true,
          _placeholder: placeholder,
          _unwrap: () => {
            if (cache) {
              hasCycle = true;
              return cache;
            }
            cache = success(placeholder);

            const sourceResult = innerResult._unwrap();

            cache = sourceResult.success ? config.parse(sourceResult.value) : sourceResult;
            if (!cache.success) return cache;

            if (hasCycle && placeholder !== cache.value)
              cache = attemptMixin(placeholder, cache.value);
            if (!cache.success) return cache;

            const guardFailure =
              config.test &&
              innerGuard(config.test, cache.value, createGuardVisitedState(), false, true);
            if (guardFailure) return (cache = guardFailure);

            cycle._placeholder = cache.value;

            return cache;
          },
        };
        return cycle;
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

function attemptMixin<T>(placeholder: T, value: T): Result<T> {
  if (Array.isArray(placeholder) && Array.isArray(value)) {
    placeholder.splice(0, placeholder.length, ...value);
    return success(placeholder);
  }
  if (
    placeholder &&
    typeof placeholder === 'object' &&
    !Array.isArray(placeholder) &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    Object.assign(placeholder, value);
    return success(placeholder);
  }
  return failure(
    `Cannot convert a value of type "${
      Array.isArray(placeholder) ? 'Array' : typeof placeholder
    }" into a value of type "${
      value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value
    }" when it contains cycles.`,
  );
}

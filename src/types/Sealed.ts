import { Failure, Result } from '../result';
import {
  RuntypeBase,
  Static,
  create,
  Codec,
  mapValidationPlaceholder,
  assertRuntype,
} from '../runtype';
import show from '../show';
import { isArrayRuntype } from './array';
import { isConstraintRuntype } from './constraint';
import { isIntersectRuntype } from './intersect';
import { isLazyRuntype } from './lazy';
import { isNamedRuntype } from './Named';
import { isObjectRuntype } from './Object';
import { isParsedValueRuntype } from './ParsedValue';
import { isTupleRuntype } from './tuple';
import { isUnionType } from './union';

export interface Sealed<TUnderlying extends RuntypeBase<unknown>>
  extends Codec<Static<TUnderlying>> {
  readonly tag: 'sealed';
  readonly underlying: TUnderlying;
  readonly deep: boolean;
}

export function isSealedRuntype(runtype: RuntypeBase): runtype is Sealed<RuntypeBase> {
  return 'tag' in runtype && (runtype as Sealed<RuntypeBase>).tag === 'sealed';
}

export interface SealedConfig {
  readonly deep?: boolean;
}
export function Sealed<TUnderlying extends RuntypeBase<unknown>>(
  underlying: TUnderlying,
  { deep = false }: SealedConfig = {},
): Sealed<TUnderlying> {
  assertRuntype(underlying);
  return create<Sealed<TUnderlying>>(
    'sealed',
    {
      p: (value, _innerValidate, innerParseToPlaceholder) => {
        return mapValidationPlaceholder<any, Static<TUnderlying>>(
          innerParseToPlaceholder(underlying, value),
          source => getResult(value, source, deep),
        );
      },
      t(value, internalTest) {
        const failure = internalTest(underlying, value);
        if (failure) return failure;

        return getFailure(getExtraPropertiesFromRuntype(value, underlying, ``, deep, internalTest));
      },
      s(value, _internalSerialize, internalSerializeToPlaceholder) {
        return mapValidationPlaceholder<unknown, unknown>(
          internalSerializeToPlaceholder(underlying, value),
          source => getResult(value, source, deep),
        );
      },
    },
    {
      underlying,
      deep,

      show() {
        return deep
          ? `DeepSealed<${show(underlying, false)}>`
          : `Sealed<${show(underlying, false)}>`;
      },
    },
  );
}

function getResult<T>(raw: unknown, parsed: T, deep: boolean): Result<T> {
  return (
    getFailure(getExtraPropertiesFromValues(raw, parsed, ``, deep)) ?? {
      success: true,
      value: parsed,
    }
  );
}

function getFailure(extraProperties: string[]): Failure | undefined {
  if (extraProperties.length === 1) {
    return {
      success: false,
      message: `Unexpected property on sealed object: ${extraProperties[0]}`,
    };
  }
  if (extraProperties.length) {
    return {
      success: false,
      message: `Unexpected properties on sealed object: ${extraProperties.join(`, `)}`,
      fullError: [
        `Unexpected properties on sealed object`,
        ...extraProperties.map((p): [string] => [`Unexpected property: ${p}`]),
      ],
    };
  }
  return undefined;
}

/**
 * Return an array of properties in `raw` that are not present in `parsed`
 */
function getExtraPropertiesFromValues(
  raw: unknown,
  parsed: unknown,
  path: string,
  deep: boolean,
): string[] {
  if (isPlainObject(raw) && isPlainObject(parsed)) {
    const afterKeys = new Set(Object.keys(parsed));
    if (deep) {
      return Object.keys(raw).flatMap(key =>
        afterKeys.has(key)
          ? getExtraPropertiesFromValues(raw[key], parsed[key], printKey(path, key), deep)
          : [printKey(path, key)],
      );
    } else {
      return Object.keys(raw)
        .filter(key => !afterKeys.has(key))
        .map(key => printKey(path, key));
    }
  }

  if (!deep) return [];

  if (Array.isArray(raw) && Array.isArray(parsed) && raw.length === parsed.length) {
    return raw.flatMap((value, i) =>
      getExtraPropertiesFromValues(value, parsed[i], `${path}[${i}]`, deep),
    );
  }

  return [];
}

type InternalTest = <T>(runtype: RuntypeBase<T>, value: unknown) => Failure | undefined;

/**
 * Return an array of properties in `raw` that are not expected in the runtype
 */
function getExtraPropertiesFromRuntype(
  raw: unknown,
  runtype: RuntypeBase,
  path: string,
  deep: boolean,
  test: InternalTest,
): string[] {
  if (isPlainObject(raw)) {
    const expectedProperties = getExpectedProperties(raw, runtype, test);
    if (!expectedProperties) return [];
    const expectedPropertiesMap = new Map(expectedProperties);

    if (deep) {
      return Object.keys(raw).flatMap(key => {
        const expected = expectedPropertiesMap.get(key);
        return expected
          ? getExtraPropertiesFromRuntype(raw[key], expected, printKey(path, key), deep, test)
          : [printKey(path, key)];
      });
    } else {
      return Object.keys(raw)
        .filter(key => !expectedPropertiesMap.has(key))
        .map(key => printKey(path, key));
    }
  }
  if (deep && Array.isArray(raw)) {
    if (isArrayRuntype(runtype)) {
      return raw.flatMap((v, i) =>
        getExtraPropertiesFromRuntype(v, runtype.element, `${path}[${i}]`, deep, test),
      );
    }
    if (isTupleRuntype(runtype) && raw.length === runtype.components.length) {
      return raw.flatMap((v, i) =>
        getExtraPropertiesFromRuntype(v, runtype.components[i], `${path}[${i}]`, deep, test),
      );
    }
  }
  return [];
}

function getExpectedProperties(
  raw: unknown,
  runtype: RuntypeBase,
  test: InternalTest,
): undefined | [string, RuntypeBase][] {
  if (isConstraintRuntype(runtype) || isNamedRuntype(runtype)) {
    return getExpectedProperties(raw, runtype.underlying, test);
  }
  if (isLazyRuntype(runtype)) {
    return getExpectedProperties(raw, runtype.underlying(), test);
  }
  if (isParsedValueRuntype(runtype)) {
    return runtype.config.test ? getExpectedProperties(raw, runtype.config.test, test) : undefined;
  }
  if (isIntersectRuntype(runtype)) {
    const results: [string, RuntypeBase][] = [];
    for (const t of runtype.intersectees) {
      const r = getExpectedProperties(raw, t, test);
      if (r === undefined) {
        return undefined;
      }
      results.push(...r);
    }
    return results;
  }
  if (isUnionType(runtype)) {
    const results: [string, RuntypeBase][] = [];
    for (const t of runtype.alternatives) {
      if (test(t, raw)) {
        const r = getExpectedProperties(raw, t, test);
        if (r === undefined) {
          return undefined;
        }
        results.push(...r);
      }
    }
    return results;
  }
  if (isObjectRuntype(runtype)) {
    return Object.entries(runtype.fields);
  }
  return undefined;
}

function isPlainObject(value: unknown): value is { [key: string]: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  );
}

function printKey(path: string, key: string) {
  if (/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(key)) {
    return path ? `${path}.${key}` : key;
  }
  if (/^[0-9]+$/.test(key)) {
    return `${path}[${key}]`;
  } else {
    return `${path}[${JSON.stringify(key)}]`;
  }
}

import {
  create,
  Runtype,
  Codec,
  createValidationPlaceholder,
  assertRuntype,
  showType,
} from '../runtype';
import { lazyValue } from './lazy';
import { expected, failure, Result, typesAreNotCompatible } from '../result';

function getExpectedBaseType(key: Runtype): 'string' | 'number' | 'mixed' {
  switch (key.introspection.tag) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'literal': {
      const valueType = typeof key.introspection.value as 'string' | 'number';
      return valueType === 'string' || valueType === 'number' ? valueType : 'mixed';
    }
    case 'union':
      const baseTypes = key.introspection.alternatives.map(getExpectedBaseType);
      return baseTypes.reduce((a, b) => (a === b ? a : 'mixed'), baseTypes[0]);
    case 'constraint':
      return getExpectedBaseType(key.introspection.underlying);
    case 'brand':
      return getExpectedBaseType(key.introspection.entity);
    default:
      return 'mixed';
  }
}

/**
 * Construct a runtype for arbitrary dictionaries.
 */
export function Record<K extends string | number, V>(
  key: Codec<K>,
  value: Codec<V>,
): Codec<{ [_ in K]?: V }> {
  return RecordCore(key, value, false);
}

export function ReadonlyRecord<K extends string | number, V>(
  key: Codec<K>,
  value: Codec<V>,
): Codec<{ readonly [_ in K]?: V }> {
  return RecordCore(key, value, true);
}

function RecordCore<K extends string | number, V>(
  key: Codec<K>,
  value: Codec<V>,
  isReadonly: boolean,
): Codec<{ [_ in K]?: V }> {
  assertRuntype(key, value);
  const expectedBaseType = lazyValue(() => getExpectedBaseType(key));
  const runtype: Codec<{ [_ in K]?: V }> = create<{ [_ in K]?: V }>(
    {
      _parse: (x, innerValidate, _innerValidateToPlaceholder, _getFields, sealed) => {
        if (x === null || x === undefined || typeof x !== 'object') {
          return expected(runtype, x);
        }

        if (Object.getPrototypeOf(x) !== Object.prototype && Object.getPrototypeOf(x) !== null) {
          if (!Array.isArray(x)) {
            return failure(`Expected ${showType(runtype)}, but was ${Object.getPrototypeOf(x)}`);
          }
          return failure('Expected Record, but was Array');
        }

        return createValidationPlaceholder<{ [_ in K]?: V }>(Object.create(null), placeholder => {
          for (const k in x) {
            let keyValidation: Result<string | number> | null = null;
            if (expectedBaseType() === 'number') {
              if (isNaN(+k)) return expected(`record key to be a number`, k);
              keyValidation = innerValidate(key, +k, false);
            } else if (expectedBaseType() === 'string') {
              keyValidation = innerValidate(key, k, false);
            } else {
              keyValidation = innerValidate(key, k, false);
              if (!keyValidation.success && !isNaN(+k)) {
                keyValidation = innerValidate(key, +k, false);
              }
            }
            if (!keyValidation.success) {
              return expected(`record key to be ${showType(key)}`, k);
            }

            const validated = innerValidate(
              value,
              (x as any)[k],
              sealed && sealed._deep ? { _deep: true } : false,
            );
            if (!validated.success) {
              return failure(validated.message, {
                key: validated.key ? `${k}.${validated.key}` : k,
                fullError: typesAreNotCompatible(k, validated.fullError ?? [validated.message]),
              });
            }
            (placeholder as any)[keyValidation.value] = validated.value;
          }
        });
      },
      _showType: () =>
        `${isReadonly ? `Readonly` : ``}Record<${showType(key, false)}, ${showType(value, false)}>`,
      _asMutable: () => RecordCore(key, value, false),
      _asReadonly: () => RecordCore(key, value, true),
    },
    {
      tag: 'record',
      key,
      value,
      isReadonly,
    },
  );
  return runtype;
}

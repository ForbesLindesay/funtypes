import {
  Codec,
  create,
  Runtype,
  InnerValidateHelper,
  assertRuntype,
  unwrapRuntype,
  getFields,
  showType,
  parenthesize,
  showValue,
} from '../runtype';
import { LiteralValue, Null } from './literal';
import { lazyValue } from './lazy';
import {
  andError,
  expected,
  failure,
  FullError,
  Result,
  success,
  typesAreNotCompatible,
  unableToAssign,
} from '../result';
import { LiteralIntrospection } from '../introspection';

function mapGet<TKey, TValue>(map: Map<TKey, TValue>) {
  return (key: TKey, fn: () => TValue) => {
    const existing = map.get(key);
    if (existing !== undefined) return existing;
    const fresh = fn();
    map.set(key, fresh);
    return fresh;
  };
}

function findFields<TResult>(
  alternative: Runtype<TResult>,
  mode: 'p' | 's' | 't',
): [string, Runtype][] {
  const underlying = unwrapRuntype(alternative, mode);
  const fields: [string, Runtype][] = [];
  const pushField = (fieldName: string, type: Runtype) => {
    const f = unwrapRuntype(type, mode);
    if (f.introspection.tag === 'union') {
      for (const type of f.introspection.alternatives) {
        pushField(fieldName, type);
      }
    } else {
      fields.push([fieldName, f]);
    }
  };
  if (underlying.introspection.tag === 'object' && !underlying.introspection.isPartial) {
    for (const [fieldName, fieldType] of Object.entries(underlying.introspection.fields)) {
      pushField(fieldName, fieldType);
    }
  } else if (underlying.introspection.tag === 'tuple') {
    underlying.introspection.components.forEach((type, i) => {
      pushField(`${i}`, type);
    });
  } else if (underlying.introspection.tag === 'intersect') {
    for (const type of underlying.introspection.intersectees) {
      fields.push(...findFields(type, mode));
    }
  } else if (underlying.introspection.tag === 'union') {
    const alternatives = underlying.introspection.alternatives.map(type => findFields(type, mode));
    const fieldNames = intersect(alternatives.map(v => new Set(v.map(([fieldName]) => fieldName))));
    for (const v of alternatives) {
      for (const [fieldName, type] of v) {
        if (fieldNames.has(fieldName)) {
          pushField(fieldName, type);
        }
      }
    }
  }
  return fields;
}

function intersect<T>(sets: Set<T>[]) {
  const result = new Set(sets[0]);
  for (const s of sets) {
    for (const v of result) {
      if (!s.has(v)) {
        result.delete(v);
      }
    }
  }
  return result;
}
interface Discriminant<TResult> {
  largestDiscriminant: number;
  fieldTypes: Map<LiteralValue, Set<Runtype<TResult>>>;
}
function createDiscriminant<TResult>(): Discriminant<TResult> {
  return { largestDiscriminant: 0, fieldTypes: new Map() };
}
function findDiscriminator<TResult>(
  recordAlternatives: readonly (readonly [Runtype<TResult>, [string, Runtype][]])[],
) {
  const commonFieldNames = intersect(
    recordAlternatives.map(([, fields]) => new Set(fields.map(([fieldName]) => fieldName))),
  );

  const commonLiteralFields = new Map<string, Discriminant<TResult>>(
    // we want to always check these props first, in case there are multiple possible keys
    // that can be used to discriminate
    ['type', 'kind', 'tag', 'version'].map(fieldName => [fieldName, createDiscriminant()]),
  );
  for (const [type, fields] of recordAlternatives) {
    for (const [fieldName, field] of fields) {
      if (commonFieldNames.has(fieldName)) {
        if (field.introspection.tag === 'literal') {
          const discriminant = mapGet(commonLiteralFields)(fieldName, createDiscriminant);
          const typesForThisDiscriminant = discriminant.fieldTypes.get(field.introspection.value);
          if (typesForThisDiscriminant) {
            typesForThisDiscriminant.add(type);
            discriminant.largestDiscriminant = Math.max(
              discriminant.largestDiscriminant,
              typesForThisDiscriminant.size,
            );
          } else {
            discriminant.largestDiscriminant = Math.max(discriminant.largestDiscriminant, 1);
            discriminant.fieldTypes.set(field.introspection.value, new Set([type]));
          }
        } else {
          commonFieldNames.delete(fieldName);
        }
      }
    }
  }
  let bestDiscriminatorSize = Infinity;
  for (const [fieldName, { largestDiscriminant }] of commonLiteralFields) {
    if (commonFieldNames.has(fieldName)) {
      bestDiscriminatorSize = Math.min(bestDiscriminatorSize, largestDiscriminant);
    }
  }
  if (bestDiscriminatorSize >= recordAlternatives.length) {
    return undefined;
  }
  for (const [fieldName, { fieldTypes, largestDiscriminant }] of commonLiteralFields) {
    if (largestDiscriminant === bestDiscriminatorSize && commonFieldNames.has(fieldName)) {
      return [
        fieldName,
        new Map(
          Array.from(fieldTypes).map(([fieldValue, types]) => [fieldValue, Array.from(types)]),
        ),
      ] as const;
    }
  }
}

/**
 * Construct a union runtype from runtypes for its alternatives.
 */
export function Union<const TAlternatives extends readonly Runtype<unknown>[]>(
  ...alternatives: TAlternatives
): Codec<
  {
    [key in keyof TAlternatives]: TAlternatives[key] extends Runtype<infer T> ? T : unknown;
  }[number]
> {
  type TResult = {
    [key in keyof TAlternatives]: TAlternatives[key] extends Runtype<infer T> ? T : unknown;
  }[number];
  assertRuntype(...alternatives);
  type InnerValidate = (x: any, innerValidate: InnerValidateHelper) => Result<TResult>;
  const flatAlternatives: Codec<TResult>[] = [];
  for (const a of alternatives) {
    if (a.introspection.tag === 'union') {
      flatAlternatives.push(...(a.introspection.alternatives as any));
    } else {
      flatAlternatives.push(a as any);
    }
  }
  function validateWithKey(
    tag: string,
    types: Map<LiteralValue, Runtype<TResult>[]>,
  ): InnerValidate {
    const typeStrings = new Set<string>();
    for (const t of types.values()) {
      for (const v of t) {
        typeStrings.add(showType(v, true));
      }
    }
    const typesString = Array.from(typeStrings).join(' | ');
    return (value, innerValidate) => {
      if (!value || typeof value !== 'object') {
        return expected(typesString, value);
      }
      const validator = types.get(value[tag]);
      if (validator) {
        if (validator.length === 1) {
          const result = innerValidate(validator[0], value);
          if (!result.success) {
            return failure(result.message, {
              key: `<${/^\d+$/.test(tag) ? `[${tag}]` : tag}: ${showValue(value[tag])}>${
                result.key ? `.${result.key}` : ``
              }`,
              fullError: unableToAssign(value, typesString, result),
            });
          }
          return result;
        }

        return validateWithoutKeyInner(validator, value, innerValidate);
      } else {
        const err = expected(
          Array.from(types.keys())
            .map(v => (typeof v === 'string' ? `'${v}'` : v))
            .join(' | '),
          value[tag],
          {
            key: /^\d+$/.test(tag) ? `[${tag}]` : tag,
          },
        );
        err.fullError = unableToAssign(
          value,
          typesString,
          typesAreNotCompatible(/^\d+$/.test(tag) ? `[${tag}]` : `"${tag}"`, err.message),
        );
        return err;
      }
    };
  }

  function validateWithoutKeyInner(
    alternatives: readonly Runtype<TResult>[],
    value: any,
    innerValidate: InnerValidateHelper,
  ): Result<TResult> {
    let fullError: FullError | undefined;
    for (const targetType of alternatives) {
      const result = innerValidate(targetType, value);
      if (result.success) {
        return result as Result<TResult>;
      }
      if (!fullError) {
        fullError = unableToAssign(
          value,
          runtype,
          result.fullError || unableToAssign(value, targetType, result),
        );
      } else {
        fullError.push(andError(result.fullError || unableToAssign(value, targetType, result)));
      }
    }

    return expected(runtype, value, {
      fullError,
    });
  }
  function validateWithoutKey(alternatives: readonly Runtype<TResult>[]): InnerValidate {
    return (value, innerValidate) => validateWithoutKeyInner(alternatives, value, innerValidate);
  }
  function validateOnlyOption(innerType: Runtype<TResult>): InnerValidate {
    return (value, innerValidate) => innerValidate(innerType, value);
  }
  function validateLiteral(alternatives: Runtype<TResult>[]): InnerValidate {
    const literalValues = new Set(
      alternatives.map(a => (a.introspection as LiteralIntrospection).value),
    );
    return value => {
      if (literalValues.has(value)) {
        return success(value);
      } else {
        return expected(runtype, value);
      }
    };
  }

  // This must be lazy to avoid eagerly evaluating any circular references
  const validatorOf = (mode: 'p' | 's' | 't'): InnerValidate => {
    const nonNeverAlternatives = flatAlternatives.filter(
      a => unwrapRuntype(a, mode).introspection.tag !== 'never',
    );
    if (nonNeverAlternatives.length === 1) {
      return validateOnlyOption(nonNeverAlternatives[0]);
    }
    if (flatAlternatives.every(a => a.introspection.tag === 'literal')) {
      return validateLiteral(flatAlternatives);
    }
    const withFields = nonNeverAlternatives.map(a => [a, findFields(a, mode)] as const);
    const withAtLeastOneField = withFields.filter(a => a[1].length !== 0);
    const withNoFields = withFields.filter(a => a[1].length === 0);
    const discriminant = findDiscriminator(withAtLeastOneField);

    if (discriminant && withNoFields.length) {
      const withKey = discriminant && validateWithKey(discriminant[0], discriminant[1]);
      const withoutKey = validateWithoutKey(withNoFields.map(v => v[0]));
      return (value, innerValidate) => {
        const resultWithKey = withKey(value, innerValidate);
        if (resultWithKey.success) {
          return resultWithKey;
        }
        const resultWithoutKey = withoutKey(value, innerValidate);
        if (!resultWithoutKey.success) {
          resultWithoutKey.fullError!.push(
            andError(resultWithKey.fullError ?? unableToAssign(value, `Object`)),
          );
        }
        return resultWithoutKey;
      };
    } else if (discriminant) {
      return validateWithKey(discriminant[0], discriminant[1]);
    } else {
      return validateWithoutKey(flatAlternatives);
    }
  };
  const innerValidator = lazyValue(() => ({
    p: validatorOf('p'),
    s: validatorOf('s'),
    t: validatorOf('t'),
  }));

  const getFieldsForMode = (mode: 'p' | 't' | 's') => {
    const fields = new Set<string>();
    for (const a of alternatives) {
      const aFields = getFields(a, mode);
      if (aFields === undefined) return undefined;
      for (const f of aFields) {
        fields.add(f);
      }
    }
    return fields;
  };
  const fields = {
    p: lazyValue(() => getFieldsForMode(`p`)),
    t: lazyValue(() => getFieldsForMode(`t`)),
    s: lazyValue(() => getFieldsForMode(`s`)),
  };

  const runtype: Codec<TResult> = create<TResult>(
    {
      _parse: (value, visited) => {
        return innerValidator().p(value, visited);
      },
      _serialize: (value, visited) => {
        return innerValidator().s(value, visited);
      },
      _test: (value, visited) => {
        const result = innerValidator().t(value, (t, v) => visited(t, v) || success(v as any));
        return result.success ? undefined : result;
      },
      _fields: mode => fields[mode](),
      _showType: needsParens =>
        parenthesize(`${flatAlternatives.map(v => showType(v, true)).join(' | ')}`, needsParens),
      _asMutable: mapper => Union(...flatAlternatives.map(mapper)),
      _asReadonly: mapper => Union(...flatAlternatives.map(mapper)),
    },
    {
      tag: 'union',
      alternatives: flatAlternatives,
    },
  );

  return runtype;
}

export function Nullable<T>(type: Codec<T>): Codec<T | null> {
  return Union(type, Null);
}

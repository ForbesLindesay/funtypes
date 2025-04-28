import {
  Codec,
  Static,
  create,
  RuntypeBase,
  InnerValidateHelper,
  innerValidate,
  createVisitedState,
  OpaqueVisitedState,
  assertRuntype,
  unwrapRuntype,
  getFields,
} from '../runtype';
import show, { parenthesize } from '../show';
import { LiteralValue, isLiteralRuntype } from './literal';
import { lazyValue } from './lazy';
import { isObjectRuntype } from './Object';
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
import { isTupleRuntype } from './tuple';
import showValue from '../showValue';
import { isIntersectRuntype } from './intersect';

export type StaticUnion<TAlternatives extends readonly RuntypeBase<unknown>[]> = {
  [key in keyof TAlternatives]: TAlternatives[key] extends RuntypeBase<unknown>
    ? Static<TAlternatives[key]>
    : unknown;
}[number];

export interface Union<TAlternatives extends readonly RuntypeBase<unknown>[]>
  extends Codec<StaticUnion<TAlternatives>> {
  readonly tag: 'union';
  readonly alternatives: TAlternatives;
  match: Match<TAlternatives>;
}

export function isUnionType(runtype: RuntypeBase): runtype is Union<RuntypeBase<unknown>[]> {
  return 'tag' in runtype && (runtype as Union<RuntypeBase<unknown>[]>).tag === 'union';
}

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
  alternative: RuntypeBase<TResult>,
  mode: 'p' | 's' | 't',
): [string, RuntypeBase][] {
  const underlying = unwrapRuntype(alternative, mode);
  const fields: [string, RuntypeBase][] = [];
  const pushField = (fieldName: string, type: RuntypeBase) => {
    const f = unwrapRuntype(type, mode);
    if (isUnionType(f)) {
      for (const type of f.alternatives) {
        pushField(fieldName, type);
      }
    } else {
      fields.push([fieldName, f]);
    }
  };
  if (isObjectRuntype(underlying) && !underlying.isPartial) {
    for (const fieldName of Object.keys(underlying.fields)) {
      pushField(fieldName, underlying.fields[fieldName]);
    }
  } else if (isTupleRuntype(underlying)) {
    underlying.components.forEach((type, i) => {
      pushField(`${i}`, type);
    });
  } else if (isIntersectRuntype(underlying)) {
    for (const type of underlying.intersectees) {
      fields.push(...findFields(type, mode));
    }
  } else if (isUnionType(underlying)) {
    const alternatives = underlying.alternatives.map(type => findFields(type, mode));
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
  fieldTypes: Map<LiteralValue, Set<RuntypeBase<TResult>>>;
}
function createDiscriminant<TResult>(): Discriminant<TResult> {
  return { largestDiscriminant: 0, fieldTypes: new Map() };
}
function findDiscriminator<TResult>(
  recordAlternatives: readonly (readonly [RuntypeBase<TResult>, [string, RuntypeBase][]])[],
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
        if (isLiteralRuntype(field)) {
          const discriminant = mapGet(commonLiteralFields)(fieldName, createDiscriminant);
          const typesForThisDiscriminant = discriminant.fieldTypes.get(field.value);
          if (typesForThisDiscriminant) {
            typesForThisDiscriminant.add(type);
            discriminant.largestDiscriminant = Math.max(
              discriminant.largestDiscriminant,
              typesForThisDiscriminant.size,
            );
          } else {
            discriminant.largestDiscriminant = Math.max(discriminant.largestDiscriminant, 1);
            discriminant.fieldTypes.set(field.value, new Set([type]));
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
export function Union<
  TAlternatives extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]],
>(...alternatives: TAlternatives): Union<TAlternatives> {
  assertRuntype(...alternatives);
  type TResult = StaticUnion<TAlternatives>;
  type InnerValidate = (x: any, innerValidate: InnerValidateHelper) => Result<TResult>;
  const flatAlternatives: RuntypeBase<TResult>[] = [];
  for (const a of alternatives) {
    if (isUnionType(a)) {
      flatAlternatives.push(...(a.alternatives as any));
    } else {
      flatAlternatives.push(a as any);
    }
  }
  function validateWithKey(
    tag: string,
    types: Map<LiteralValue, RuntypeBase<TResult>[]>,
  ): InnerValidate {
    const typeStrings = new Set<string>();
    for (const t of types.values()) {
      for (const v of t) {
        typeStrings.add(show(v, true));
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
    alternatives: readonly RuntypeBase<TResult>[],
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
  function validateWithoutKey(alternatives: readonly RuntypeBase<TResult>[]): InnerValidate {
    return (value, innerValidate) => validateWithoutKeyInner(alternatives, value, innerValidate);
  }
  function validateOnlyOption(innerType: RuntypeBase<TResult>): InnerValidate {
    return (value, innerValidate) => innerValidate(innerType, value);
  }

  // This must be lazy to avoid eagerly evaluating any circular references
  const validatorOf = (mode: 'p' | 's' | 't'): InnerValidate => {
    const nonNeverAlternatives = flatAlternatives.filter(
      a => unwrapRuntype(a, mode).tag !== 'never',
    );
    if (nonNeverAlternatives.length === 1) {
      return validateOnlyOption(nonNeverAlternatives[0]);
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

  const runtype: Union<TAlternatives> = create<Union<TAlternatives>>(
    'union',
    {
      p: (value, visited) => {
        return innerValidator().p(value, visited);
      },
      s: (value, visited) => {
        return innerValidator().s(value, visited);
      },
      t: (value, visited) => {
        const result = innerValidator().t(value, (t, v) => visited(t, v) || success(v as any));
        return result.success ? undefined : result;
      },
      f: mode => fields[mode](),
    },
    {
      alternatives: flatAlternatives as any,
      match: match as any,
      show(needsParens) {
        return parenthesize(`${flatAlternatives.map(v => show(v, true)).join(' | ')}`, needsParens);
      },
    },
  );

  return runtype;

  function match(...cases: any[]) {
    return (x: any) => {
      const visited: OpaqueVisitedState = createVisitedState();
      for (let i = 0; i < alternatives.length; i++) {
        const input = innerValidate(alternatives[i], x, visited, false);
        if (input.success) {
          return cases[i](input.value);
        }
      }
      // if none of the types matched, we should fail with an assertion error
      runtype.assert(x);
    };
  }
}

export interface Match<A extends readonly RuntypeBase<unknown>[]> {
  <Z>(
    ...a: { [key in keyof A]: A[key] extends RuntypeBase<unknown> ? Case<A[key], Z> : never }
  ): Matcher<A, Z>;
}

export type Case<T extends RuntypeBase<unknown>, Result> = (v: Static<T>) => Result;

export type Matcher<A extends readonly RuntypeBase<unknown>[], Z> = (
  x: {
    [key in keyof A]: A[key] extends RuntypeBase<infer Type> ? Type : unknown;
  }[number],
) => Z;

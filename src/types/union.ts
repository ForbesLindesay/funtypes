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
} from '../runtype';
import show from '../show';
import { LiteralValue, isLiteralRuntype } from './literal';
import { lazyValue, isLazyRuntype } from './lazy';
import { isObjectRuntype } from './Object';
import { expected, failure, FullError, Result, success } from '../result';
import { isTupleRuntype } from './tuple';
import { isBrandRuntype } from './brand';
import { isConstraintRuntype } from './constraint';
import { isParsedValueRuntype } from './ParsedValue';
import { Never } from '..';
import showValue from '../showValue';

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

function resolveUnderlyingType(runtype: RuntypeBase, mode: 'p' | 's' | 't'): RuntypeBase {
  if (isLazyRuntype(runtype)) return resolveUnderlyingType(runtype.underlying(), mode);
  if (isBrandRuntype(runtype)) return resolveUnderlyingType(runtype.entity, mode);
  if (isConstraintRuntype(runtype)) return resolveUnderlyingType(runtype.underlying, mode);
  if (mode === 'p' && isParsedValueRuntype(runtype))
    return resolveUnderlyingType(runtype.underlying, mode);
  if (mode === 't' && isParsedValueRuntype(runtype)) {
    return runtype.config.test ? resolveUnderlyingType(runtype.config.test, mode) : Never;
  }
  if (mode === 's' && isParsedValueRuntype(runtype)) {
    if (!runtype.config.serialize) {
      // this node can never match
      return Never;
    }
    return runtype.config.test ? resolveUnderlyingType(runtype.config.test, mode) : runtype;
  }

  return runtype;
}

/**
 * Construct a union runtype from runtypes for its alternatives.
 */
export function Union<
  TAlternatives extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]
>(...alternatives: TAlternatives): Union<TAlternatives> {
  alternatives.forEach(a => assertRuntype(a));
  type TResult = StaticUnion<TAlternatives>;
  type InnerValidate = (x: any, innerValidate: InnerValidateHelper) => Result<TResult>;
  function validateWithKey(
    tag: string | 0,
    types: Map<LiteralValue, RuntypeBase<TResult>>,
  ): InnerValidate {
    return (value, innerValidate) => {
      if (!value || typeof value !== 'object') {
        return expected(runtype, value);
      }
      const validator = types.get(value[tag]);
      if (validator) {
        const result = innerValidate(validator, value);
        if (!result.success) {
          return failure(result.message, {
            key: `<${tag === 0 ? `[0]` : tag}: ${showValue(value[tag])}>${
              result.key ? `.${result.key}` : ``
            }`,
            fullError: [
              `Unable to assign ${showValue(value)} to ${show(runtype)}:`,
              result.fullError || [result.message],
            ],
          });
        }
        return result;
      } else {
        const message = `Expected ${Array.from(types.keys())
          .map(v => (typeof v === 'string' ? `'${v}'` : v))
          .join(' | ')}, but was ${showValue(value[tag])}`;
        return failure(message, {
          key: tag === 0 ? `[0]` : tag,
          fullError: [
            `Unable to assign ${showValue(value)} to ${show(runtype)}:`,
            [`The types of [0] are not compatible:`, [message]],
          ],
        });
      }
    };
  }

  // This must be lazy to avoid eagerly evaluating any circular references
  const validatorOf = (mode: 'p' | 's' | 't'): InnerValidate => {
    const excludingNever = alternatives.filter(t => resolveUnderlyingType(t, mode).tag !== 'never');
    if (excludingNever.length) {
      const alts = excludingNever.map(t => resolveUnderlyingType(t, mode));
      const recordAlternatives = alts.filter(isObjectRuntype);
      if (recordAlternatives.length === excludingNever.length) {
        const commonLiteralFields: {
          [key: string]: Map<LiteralValue, RuntypeBase<TResult>>;
        } = {};
        for (let i = 0; i < excludingNever.length; i++) {
          for (const fieldName in recordAlternatives[i].fields) {
            const field = resolveUnderlyingType(recordAlternatives[i].fields[fieldName], mode);
            if (isLiteralRuntype(field)) {
              if (!commonLiteralFields[fieldName]) {
                commonLiteralFields[fieldName] = new Map();
              }
              if (!commonLiteralFields[fieldName].has(field.value)) {
                commonLiteralFields[fieldName].set(
                  field.value,
                  // @ts-expect-error
                  excludingNever[i],
                );
              }
            }
          }
        }
        for (const tag of ['type', 'kind', 'tag', ...Object.keys(commonLiteralFields)]) {
          if (
            tag in commonLiteralFields &&
            commonLiteralFields[tag].size === excludingNever.length
          ) {
            return validateWithKey(tag, commonLiteralFields[tag]);
          }
        }
      }
      const tupleAlternatives = alts.filter(isTupleRuntype);
      if (tupleAlternatives.length === excludingNever.length) {
        const commonLiteralFields = new Map<LiteralValue, RuntypeBase<TResult>>();
        for (let i = 0; i < excludingNever.length; i++) {
          const field = resolveUnderlyingType(tupleAlternatives[i].components[0], mode);
          if (isLiteralRuntype(field)) {
            if (!commonLiteralFields.has(field.value)) {
              commonLiteralFields.set(
                field.value,
                // @ts-expect-error
                excludingNever[i],
              );
            }
          }
        }
        if (commonLiteralFields.size === excludingNever.length) {
          return validateWithKey(0, commonLiteralFields);
        }
      }
    }
    return (value, innerValidate) => {
      let errorsWithKey = 0;
      let lastError;
      let lastErrorRuntype;
      let fullError: FullError | undefined;
      for (const targetType of alternatives) {
        const result = innerValidate(targetType, value);
        if (result.success) {
          return result as Result<TResult>;
        }
        if (!fullError) {
          fullError = [
            `Unable to assign ${showValue(value)} to ${show(runtype)}:`,
            result.fullError || [
              `Unable to assign ${showValue(value)} to ${show(targetType)}:`,
              [result.message],
            ],
          ];
        } else {
          fullError.push(
            result.fullError || [
              `And unable to assign ${showValue(value)} to ${show(targetType)}:`,
              [result.message],
            ],
          );
        }
        if (result.key) {
          errorsWithKey++;
          lastError = result;
          lastErrorRuntype = targetType;
        }
      }

      if (lastError && lastErrorRuntype && errorsWithKey === 1) {
        return failure(lastError.message, {
          key: `<${show(lastErrorRuntype)}>.${lastError.key}`,
          fullError,
        });
      }
      return expected(runtype, value, {
        fullError,
      });
    };
  };
  const innerValidator = lazyValue(() => ({
    p: validatorOf('p'),
    s: validatorOf('s'),
    t: validatorOf('t'),
  }));

  const runtype: Union<TAlternatives> = create<Union<TAlternatives>>(
    'union',
    {
      validate: (value, visited) => {
        return innerValidator().p(value, visited);
      },
      serialize: (value, visited) => {
        return innerValidator().s(value, visited);
      },
      test: (value, visited) => {
        const result = innerValidator().s(value, (t, v) => visited(t, v) || success(v as any));
        return result.success ? undefined : result;
      },
    },
    {
      alternatives,
      match: match as any,
      show({ parenthesize, showChild }) {
        return parenthesize(`${alternatives.map(v => showChild(v, true)).join(' | ')}`);
      },
    },
  );

  return runtype;

  function match(...cases: any[]) {
    return (x: any) => {
      const visited: OpaqueVisitedState = createVisitedState();
      for (let i = 0; i < alternatives.length; i++) {
        const input = innerValidate(alternatives[i], x, visited);
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

import { Failure } from '../result';
import {
  RuntypeBase,
  Static,
  create,
  Codec,
  mapValidationPlaceholder,
  assertRuntype,
} from '../runtype';
import show from '../show';
import showValue from '../showValue';
import { Array, isArrayRuntype, ReadonlyArray } from './array';
import { Brand, isBrandRuntype } from './brand';
import { Constraint, isConstraintRuntype } from './constraint';
import { Intersect, isIntersectRuntype } from './intersect';
import { isLazyRuntype, Lazy } from './lazy';
import { isNamedRuntype, Named } from './Named';
import { InternalObject, isObjectRuntype } from './Object';
import { isParsedValueRuntype, ParsedValue } from './ParsedValue';
import { isRecordRuntype, ReadonlyRecord, Record } from './Record';
import { isTupleRuntype, ReadonlyTuple, Tuple } from './tuple';
import { isUnionType, Union } from './union';
import showType from '../show';

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
): Codec<Static<TUnderlying>> {
  assertRuntype(underlying);
  return SealedWrapper<Static<TUnderlying>>(underlying as any, makeState(deep));
}
interface SealedInternalState {
  deep: boolean;
  addField(name: string): void;
  makeUnbounded(): void;
  isUnbounded(): boolean;
  getFields(): Set<string>;
  makeUnion(): () => SealedInternalState;
  addLazy<T>(fn: () => T): () => T;
  resolveLazy(): void;
}
function makeState(deep: boolean): SealedInternalState {
  interface SealedInternalStateChild {
    onParentField(name: string): void;
    onParentUnbounded(): void;
  }
  const lazyFunctions = new Set<() => unknown>();
  return makeStateInternal({
    fields: new Set(),
    isUnbounded: false,
    onField() {},
    onUnbounded() {},
  });
  function makeStateInternal(parent: {
    fields: ReadonlySet<string>;
    isUnbounded: boolean;
    onField(field: string): void;
    onUnbounded(): void;
  }): SealedInternalState & SealedInternalStateChild {
    const globalFields = new Set<string>(parent.fields);
    let isAlwaysUnbounded = parent.isUnbounded;
    const unions: SealedInternalStateChild[] = [];
    return {
      onParentField(name: string) {
        globalFields.add(name);
        for (const u of unions) {
          u.onParentField(name);
        }
      },
      onParentUnbounded() {
        isAlwaysUnbounded = true;
        for (const u of unions) {
          u.onParentUnbounded();
        }
      },
      deep,
      addField(name: string) {
        parent.onField(name);
        this.onParentField(name);
      },
      makeUnbounded() {
        parent.onUnbounded();
        this.onParentUnbounded();
      },
      makeUnion() {
        const fields = new Set(globalFields);
        let isUnbounded = isAlwaysUnbounded;

        const unionElements: SealedInternalStateChild[] = [];
        const currentUnion: SealedInternalStateChild = {
          onParentField(field) {
            fields.add(field);
            for (const e of unionElements) {
              e.onParentField(field);
            }
          },
          onParentUnbounded() {
            isUnbounded = true;
            for (const e of unionElements) {
              e.onParentUnbounded();
            }
          },
        };
        unions.push(currentUnion);
        return () => {
          const state = makeStateInternal({
            fields,
            isUnbounded,
            onField(name) {
              globalFields.add(name);
              parent.onField(name);
              for (const u of unions) {
                if (u !== currentUnion) {
                  u.onParentField(name);
                }
              }
            },
            onUnbounded() {
              isAlwaysUnbounded = true;
              parent.onUnbounded();
              for (const u of unions) {
                if (u !== currentUnion) {
                  u.onParentUnbounded();
                }
              }
            },
          });
          unionElements.push(state);
          return state;
        };
      },

      addLazy<T>(fn: () => T) {
        let result: { value: T } | undefined;
        const memo = () => {
          if (result) return result.value;
          result = { value: fn() };
          lazyFunctions.delete(memo);
          return result.value;
        };
        lazyFunctions.add(memo);
        return memo;
      },
      isUnbounded() {
        return isAlwaysUnbounded;
      },
      getFields() {
        return globalFields;
      },
      resolveLazy() {
        while (lazyFunctions.size) {
          for (const fn of lazyFunctions) {
            fn();
          }
        }
      },
    };
  }
}

function SealedWrapper<TUnderlying>(
  underlying: RuntypeBase<TUnderlying>,
  state: SealedInternalState,
): Codec<TUnderlying> {
  const base = SealedInternal(underlying, state);
  if (state.isUnbounded()) return base;

  return create<Sealed<RuntypeBase<TUnderlying>>>(
    'sealed',
    {
      p: (value, _innerValidate, innerParseToPlaceholder) => {
        state.resolveLazy();
        return mapValidationPlaceholder<any, TUnderlying>(
          innerParseToPlaceholder(base, value),
          source =>
            getFailure(getExtraProperties(value, state), value, underlying) ?? {
              success: true,
              value: source,
            },
        );
      },
      t(value, internalTest) {
        state.resolveLazy();
        const failure = internalTest(base, value);
        if (failure) return failure;

        return getFailure(getExtraProperties(value, state), value, underlying);
      },
      s(value, _internalSerialize, internalSerializeToPlaceholder) {
        state.resolveLazy();
        return mapValidationPlaceholder<unknown, unknown>(
          internalSerializeToPlaceholder(base, value),
          source =>
            getFailure(getExtraProperties(value, state), value, underlying) ?? {
              success: true,
              value: source,
            },
        );
      },
    },
    {
      underlying,
      deep: state.deep,

      show(needsParens) {
        return state.isUnbounded()
          ? show(underlying, needsParens)
          : `Sealed<${show(underlying, false)}>`;
      },
    },
  );
}

function SealedInternal<TUnderlying>(
  underlying: RuntypeBase<TUnderlying>,
  state: SealedInternalState,
): Codec<TUnderlying> {
  assertRuntype(underlying);
  if (isNamedRuntype(underlying)) {
    return Named(
      underlying.name,
      SealedInternal<TUnderlying>(underlying.underlying as RuntypeBase<TUnderlying>, state),
    );
  }
  if (isBrandRuntype(underlying)) {
    return Brand(
      underlying.brand,
      SealedInternal<TUnderlying>(underlying.entity as RuntypeBase<TUnderlying>, state),
    ) as any;
  }
  if (isConstraintRuntype(underlying)) {
    return Constraint(
      SealedInternal<TUnderlying>(underlying.underlying as RuntypeBase<TUnderlying>, state),
      underlying.constraint,
      {
        name: underlying.name,
        args: underlying.args,
      },
    );
  }
  if (isParsedValueRuntype(underlying)) {
    return ParsedValue(SealedInternal(underlying.underlying, state), {
      ...underlying.config,
      test: underlying.config.test ? SealedInternal(underlying.config.test, state) : undefined,
    }) as any;
  }

  if (isIntersectRuntype(underlying)) {
    return Intersect(
      ...(underlying.intersectees.map(inner => SealedInternal(inner, state)) as any),
    ) as any;
  }
  if (isUnionType(underlying)) {
    const unionState = state.makeUnion();
    return Union(
      ...(underlying.alternatives.map(inner => SealedWrapper(inner, unionState())) as any),
    ) as any;
  }

  if (isObjectRuntype(underlying)) {
    const fields = Object.entries(underlying.fields);
    for (const [name] of fields) {
      state.addField(name);
    }
    return state.deep
      ? (InternalObject(
          Object.fromEntries(
            fields.map(([name, codec]) => [name, SealedWrapper(codec, makeState(state.deep))]),
          ),
          underlying.isPartial,
          underlying.isReadonly,
        ) as any)
      : (underlying as any);
  }

  if (isLazyRuntype(underlying)) {
    return Lazy(state.addLazy(() => SealedInternal(underlying.underlying(), state))) as any;
  }

  state.makeUnbounded();

  if (!state.deep) {
    return underlying as any;
  }

  if (isArrayRuntype(underlying)) {
    return ((underlying.isReadonly ? ReadonlyArray : Array) as any)(
      SealedWrapper(underlying.element, makeState(true)),
    );
  }
  if (isTupleRuntype(underlying)) {
    return ((underlying.isReadonly ? ReadonlyTuple : Tuple) as any)(
      ...underlying.components.map(c => SealedWrapper(c, makeState(true))),
    );
  }
  if (isRecordRuntype(underlying)) {
    return ((underlying.isReadonly ? ReadonlyRecord : Record) as any)(
      underlying.key,
      SealedWrapper(underlying.value, makeState(true)),
    );
  }

  return underlying as any;
}

/**
 * Return an array of properties in `raw` that are not present in `parsed`
 */
function getExtraProperties(raw: unknown, state: SealedInternalState): string[] {
  if (state.isUnbounded()) return [];

  const expectedKeys = state.getFields();

  return Object.keys(raw as any)
    .filter(key => !expectedKeys.has(key))
    .map(key => JSON.stringify(key));
}

function getFailure(
  extraProperties: string[],
  value: unknown,
  type: RuntypeBase,
): Failure | undefined {
  if (extraProperties.length) {
    return {
      success: false,
      message: `Unexpected ${
        extraProperties.length > 1 ? `properties` : `property`
      } on sealed object: ${extraProperties.join(`, `)}`,
      fullError: [
        `Unable to assign ${showValue(value)} to Sealed<${showType(type)}>`,
        ...extraProperties.map((p): [string] => [`Unexpected property on sealed object: ${p}`]),
      ],
      key: extraProperties[0],
    };
  }
  return undefined;
}

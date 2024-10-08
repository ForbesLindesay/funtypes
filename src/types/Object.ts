import {
  Static,
  create,
  RuntypeBase,
  Codec,
  createValidationPlaceholder,
  assertRuntype,
} from '../runtype';
import { hasKey } from '../util';
import show from '../show';
import { Failure } from '..';
import { expected, failure, FullError, typesAreNotCompatible, unableToAssign } from '../result';

export type RecordFields = { readonly [_: string]: RuntypeBase<unknown> };
type MutableRecordStaticType<O extends RecordFields> = {
  -readonly [K in keyof O]: Static<O[K]>;
};
type ReadonlyRecordStaticType<O extends RecordFields> = {
  readonly [K in keyof O]: Static<O[K]>;
};
type PartialMutableRecordStaticType<O extends RecordFields> = {
  -readonly [K in keyof O]?: Static<O[K]>;
};
type PartialReadonlyRecordStaticType<O extends RecordFields> = {
  readonly [K in keyof O]?: Static<O[K]>;
};
type RecordStaticType<
  O extends RecordFields,
  IsPartial extends boolean,
  IsReadonly extends boolean,
> = IsPartial extends false
  ? IsReadonly extends false
    ? MutableRecordStaticType<O>
    : ReadonlyRecordStaticType<O>
  : IsReadonly extends false
  ? PartialMutableRecordStaticType<O>
  : PartialReadonlyRecordStaticType<O>;

export interface InternalRecord<
  O extends RecordFields,
  IsPartial extends boolean,
  IsReadonly extends boolean,
> extends Codec<RecordStaticType<O, IsPartial, IsReadonly>> {
  readonly tag: 'object';
  readonly fields: O;
  readonly isPartial: IsPartial;
  readonly isReadonly: IsReadonly;
  asPartial(): Partial<O, IsReadonly>;
  asReadonly(): IsPartial extends false ? Obj<O, true> : Partial<O, true>;
  pick<TKeys extends [keyof O, ...(keyof O)[]]>(
    ...keys: TKeys
  ): InternalRecord<Pick<O, TKeys[number]>, IsPartial, IsReadonly>;
  omit<TKeys extends [keyof O, ...(keyof O)[]]>(
    ...keys: TKeys
  ): InternalRecord<Omit<O, TKeys[number]>, IsPartial, IsReadonly>;
}

export { Obj as Object };
type Obj<O extends RecordFields, IsReadonly extends boolean> = InternalRecord<O, false, IsReadonly>;

export type Partial<O extends RecordFields, IsReadonly extends boolean> = InternalRecord<
  O,
  true,
  IsReadonly
>;

export function isObjectRuntype(
  runtype: RuntypeBase,
): runtype is InternalRecord<RecordFields, boolean, boolean> {
  return (
    'tag' in runtype && (runtype as InternalRecord<RecordFields, boolean, boolean>).tag === 'object'
  );
}

/**
 * Construct an object runtype from runtypes for its values.
 */
export function InternalObject<O extends RecordFields, Part extends boolean, RO extends boolean>(
  fields: O,
  isPartial: Part,
  isReadonly: RO,
): InternalRecord<O, Part, RO> {
  assertRuntype(...Object.values(fields));
  const fieldNames: ReadonlySet<string> = new Set(Object.keys(fields));
  const runtype: InternalRecord<O, Part, RO> = create<InternalRecord<O, Part, RO>>(
    'object',
    {
      p: (x, innerValidate, _innerValidateToPlaceholder, _getFields, sealed) => {
        if (x === null || x === undefined || typeof x !== 'object') {
          return expected(runtype, x);
        }
        if (Array.isArray(x)) {
          return failure(`Expected ${show(runtype)}, but was an Array`);
        }

        return createValidationPlaceholder(Object.create(null), (placeholder: any) => {
          let fullError: FullError | undefined = undefined;
          let firstError: Failure | undefined;
          for (const key in fields) {
            if (!isPartial || (hasKey(key, x) && x[key] !== undefined)) {
              const value = isPartial || hasKey(key, x) ? x[key] : undefined;
              let validated = innerValidate(
                fields[key],
                value,
                sealed && sealed.deep ? { deep: true } : false,
              );
              if (!validated.success) {
                if (!fullError) {
                  fullError = unableToAssign(x, runtype);
                }
                fullError.push(typesAreNotCompatible(`"${key}"`, validated));
                firstError =
                  firstError ||
                  failure(validated.message, {
                    key: validated.key ? `${key}.${validated.key}` : key,
                    fullError: fullError,
                  });
              } else {
                placeholder[key] = validated.value;
              }
            }
          }
          if (!firstError && sealed) {
            for (const key of Object.keys(x)) {
              if (!fieldNames.has(key) && !sealed.keysFromIntersect?.has(key)) {
                const message = `Unexpected property: ${key}`;
                if (!fullError) {
                  fullError = unableToAssign(x, runtype);
                }
                fullError.push([message]);
                firstError =
                  firstError ||
                  failure(message, {
                    key: key,
                    fullError: fullError,
                  });
              }
            }
          }
          return firstError;
        });
      },
      f: () => fieldNames,
    },
    {
      isPartial,
      isReadonly,
      fields,
      asPartial,
      asReadonly,
      pick,
      omit,
      show() {
        const keys = Object.keys(fields);
        return keys.length
          ? `{ ${keys
              .map(
                k =>
                  `${isReadonly ? 'readonly ' : ''}${k}${isPartial ? '?' : ''}: ${show(
                    fields[k],
                    false,
                  )};`,
              )
              .join(' ')} }`
          : '{}';
      },
    },
  );

  return runtype;

  function asPartial() {
    return InternalObject(runtype.fields, true, runtype.isReadonly);
  }

  function asReadonly(): any {
    return InternalObject(runtype.fields, runtype.isPartial, true);
  }

  function pick<TKeys extends [keyof O, ...(keyof O)[]]>(
    ...keys: TKeys
  ): InternalRecord<Pick<O, TKeys[number]>, Part, RO> {
    const newFields: Pick<O, TKeys[number]> = {} as any;
    for (const key of keys) {
      newFields[key] = fields[key];
    }
    return InternalObject(newFields, isPartial, isReadonly);
  }

  function omit<TKeys extends [keyof O, ...(keyof O)[]]>(
    ...keys: TKeys
  ): InternalRecord<Omit<O, TKeys[number]>, Part, RO> {
    const newFields: Omit<O, TKeys[number]> = { ...fields } as any;
    for (const key of keys) {
      if (key in newFields) delete (newFields as any)[key];
    }
    return InternalObject(newFields, isPartial, isReadonly);
  }
}

function Obj<O extends RecordFields>(fields: O): Obj<O, false> {
  return InternalObject(fields, false, false);
}
export function ReadonlyObject<O extends RecordFields>(fields: O): Obj<O, true> {
  return InternalObject(fields, false, true);
}

export function Partial<O extends RecordFields>(fields: O): Partial<O, false> {
  return InternalObject(fields, true, false);
}

export function ReadonlyPartial<O extends RecordFields>(fields: O): Partial<O, true> {
  return InternalObject(fields, true, true);
}

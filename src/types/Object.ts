import {
  Static,
  create,
  Runtype,
  Codec,
  createValidationPlaceholder,
  assertRuntype,
  showType,
  isRuntype,
  ObjectCodec,
  getInternal,
} from '../runtype';
import { hasKey } from '../util';
import { Failure } from '..';
import { expected, failure, FullError, typesAreNotCompatible, unableToAssign } from '../result';

export type RecordFields = { readonly [_: string]: Runtype };

/**
 * Construct an object runtype from runtypes for its values.
 */
function InternalObject<O extends RecordFields, Part extends boolean, RO extends boolean>(
  fields: O,
  isPartial: Part,
  isReadonly: RO,
): ObjectCodec<any> {
  assertRuntype(...Object.values(fields));
  const fieldNames: ReadonlySet<string> = new Set(Object.keys(fields));
  const runtype: Codec<any> = create<any>(
    {
      _parse: (x, innerValidate, _innerValidateToPlaceholder, _getFields, sealed) => {
        if (x === null || x === undefined || typeof x !== 'object') {
          return expected(runtype, x);
        }
        if (Array.isArray(x)) {
          return failure(`Expected ${showType(runtype)}, but was an Array`);
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
                sealed && sealed._deep ? { _deep: true } : false,
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
              if (!fieldNames.has(key) && !sealed._keysFromIntersect?.has(key)) {
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
      _fields: () => fieldNames,
      _showType() {
        const keys = Object.keys(fields);
        return keys.length
          ? `{ ${keys
              .map(
                k =>
                  `${isReadonly ? 'readonly ' : ''}${k}${isPartial ? '?' : ''}: ${showType(
                    fields[k],
                    false,
                  )}`,
              )
              .join('; ')} }`
          : '{}';
      },
      _asMutable: () => InternalObject(fields, isPartial, false),
      _asReadonly: () => InternalObject(fields, isPartial, true),
      _pick: (_, keys) =>
        InternalObject(
          Object.fromEntries(Object.entries(fields).filter(([k]) => keys.includes(k))),
          isPartial,
          isReadonly,
        ),
      _omit: (_, keys) =>
        InternalObject(
          Object.fromEntries(Object.entries(fields).filter(([k]) => !keys.includes(k))),
          isPartial,
          isReadonly,
        ),
      _partial: () => InternalObject(fields, true, isReadonly),
    },
    {
      tag: 'object',
      isPartial,
      isReadonly,
      fields,
    },
  );
  return runtype as ObjectCodec<any>;
}

function Obj<O extends RecordFields>(
  fields: O,
): ObjectCodec<{
  -readonly [K in keyof O]: Static<O[K]>;
}> {
  return InternalObject(fields, false, false);
}
export { Obj as Object };
export function ReadonlyObject<O extends RecordFields>(
  fields: O,
): ObjectCodec<{
  readonly [K in keyof O]: Static<O[K]>;
}> {
  return InternalObject(fields, false, true);
}

export function Partial<O extends { [_: string]: unknown }>(
  fields: ObjectCodec<O>,
): ObjectCodec<{
  [K in keyof O]?: O[K];
}>;
export function Partial<O extends RecordFields>(
  fields: O,
): ObjectCodec<{
  -readonly [K in keyof O]?: Static<O[K]>;
}>;
export function Partial(fields: any): ObjectCodec<any> {
  if (isRuntype(fields)) {
    const i = getInternal(fields);
    if (i._partial) {
      const result = i._partial(Partial);
      // @ts-expect-error Unsafe cast from Codec to ObjectCodec
      return result;
    }
    throw new Error(
      `Partial: input runtype "${fields.introspection.tag}" does not support 'partial' operation`,
    );
  } else {
    return InternalObject(fields, true, false);
  }
}

export function ReadonlyPartial<O extends RecordFields>(
  fields: O,
): ObjectCodec<{
  readonly [K in keyof O]?: Static<O[K]>;
}> {
  return InternalObject(fields, true, true);
}

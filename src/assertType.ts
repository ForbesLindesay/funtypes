import { Runtype } from './runtype';

export function assertType<T>(rt: Runtype<T>, v: unknown): asserts v is T {
  rt.assert(v);
}

import { expected, success } from '../result';
import { create, Codec } from '../runtype';

export function InstanceOf<T>(ctor: { new (...args: any[]): T }): Codec<T> {
  return create<T>(
    {
      _parse: value =>
        value instanceof ctor ? success(value) : expected(`${(ctor as any).name}`, value),

      _showType: () => `InstanceOf<${(ctor as any).name}>`,
    },
    {
      tag: 'instanceof',
      ctor: ctor,
    },
  );
}

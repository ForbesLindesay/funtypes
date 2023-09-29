import { Constraint, String, ParsedValue, InstanceOf } from '..';

test('Regression https://github.com/ForbesLindesay/funtypes/issues/62', () => {
  const DateSchema = ParsedValue(String, {
    test: InstanceOf(Date),
    parse: value => {
      return { success: true, value: new Date(value) };
    },
    serialize: value => {
      return { success: true, value: value.toISOString() };
    },
  });
  let value: unknown;
  const ConstrainedDate = Constraint(DateSchema, v => {
    value = v;
    return true;
  });

  value = undefined;
  expect(ConstrainedDate.test(new Date(0))).toEqual(true);
  expect(value).toEqual(new Date(0));

  value = undefined;
  expect(ConstrainedDate.safeParse(new Date(0).toISOString())).toEqual({
    success: true,
    value: new Date(0),
  });
  expect(value).toEqual(new Date(0));

  value = undefined;
  expect(ConstrainedDate.safeSerialize(new Date(0))).toEqual({
    success: true,
    value: new Date(0).toISOString(),
  });
  expect(value).toEqual(new Date(0));
});

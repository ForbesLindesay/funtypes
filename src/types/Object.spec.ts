import { readFileSync } from 'fs';
import * as ft from '..';

export const CrewMember = ft.Object({
  name: ft.String,
  rank: ft.String,
  home: ft.String,
});
test('Object', () => {
  expect(ft.showType(CrewMember)).toMatchInlineSnapshot(
    `"{ name: string; rank: string; home: string }"`,
  );
  expect(CrewMember.safeParse({ name: 'my name', rank: 'my rank', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
      rank: 'my rank',
    },
  });
});

export const ReadonlyPartialCrewMember = ft.ReadonlyPartial({
  name: ft.String,
  rank: ft.String,
  home: ft.String,
});
test('ReadonlyPartial', () => {
  expect(ft.showType(ReadonlyPartialCrewMember)).toMatchInlineSnapshot(
    `"{ readonly name?: string; readonly rank?: string; readonly home?: string }"`,
  );
  expect(ReadonlyPartialCrewMember.safeParse({ name: 'my name', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
    },
  });
});

export const CrewMemberFromIntersect = ft.Intersect(
  ft.Object({
    name: ft.String,
  }),
  ft.Object({
    rank: ft.String,
  }),
  ft.Object({
    home: ft.String,
  }),
);
export const PartialCrewMemberFromIntersect = ft.Partial(CrewMemberFromIntersect);
test('Partial<Intersect>', () => {
  expect(ft.showType(CrewMemberFromIntersect)).toMatchInlineSnapshot(
    `"{ name: string; rank: string; home: string }"`,
  );
  expect(ft.showType(PartialCrewMemberFromIntersect)).toMatchInlineSnapshot(
    `"{ name?: string; rank?: string; home?: string }"`,
  );
  expect(PartialCrewMemberFromIntersect.safeParse({ name: 'my name', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
    },
  });
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Object.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const CrewMember: ft.ObjectCodec<{
        name: string;
        rank: string;
        home: string;
    }>;
    export declare const ReadonlyPartialCrewMember: ft.ObjectCodec<{
        readonly name?: string | undefined;
        readonly rank?: string | undefined;
        readonly home?: string | undefined;
    }>;
    export declare const CrewMemberFromIntersect: ft.ObjectCodec<{
        name: string;
        rank: string;
        home: string;
    }>;
    export declare const PartialCrewMemberFromIntersect: ft.ObjectCodec<{
        name?: string | undefined;
        rank?: string | undefined;
        home?: string | undefined;
    }>;
    "
  `);
});

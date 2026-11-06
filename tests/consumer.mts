import { matchGlob, type GlobOptions } from '@lp-labs/glob-matcher';
const options: GlobOptions = { caseSensitive: false, maxWork: 100 };
const matches: boolean = matchGlob('src/**/*.ts', 'src/a.ts', options);
// @ts-expect-error work budgets must be numeric.
matchGlob('*', 'x', { maxWork: 'many' });
void matches;

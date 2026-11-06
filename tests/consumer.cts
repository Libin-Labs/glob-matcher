import { matchGlob, type GlobOptions } from '@lp-labs/glob-matcher';
const opts: GlobOptions = {};
const result: boolean = matchGlob('*.js', 'index.js', opts);
// @ts-expect-error unsupported option.
matchGlob('*', 'x', { nocase: true });
void result;

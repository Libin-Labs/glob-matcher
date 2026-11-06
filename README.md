# @lp-labs/glob-matcher

A deterministic, bounded glob matcher for application-level path strings. It uses dynamic
programming rather than building a regular expression, so ambiguous wildcard patterns cannot trigger
catastrophic backtracking. It never reads a filesystem or traverses directories.

## Install

```bash
npm install @lp-labs/glob-matcher
```

```js
import { matchGlob } from '@lp-labs/glob-matcher';

if (!matchGlob('src/**/*.ts', 'src/lib/parse.ts')) throw new Error('Glob did not match');
if (matchGlob('src/*.ts', 'src/lib/parse.ts')) throw new Error('Single star crossed a slash');
```

ESM and CommonJS entry points and declarations are supplied; runtime/peer dependency count is zero.

## API

`matchGlob(pattern: string, input: string, options?: GlobOptions): boolean` matches the entire input.
`GlobOptions` supports `caseSensitive` (default `true`), `maxPatternLength` (default 512 UTF-16
code units), `maxInputLength` (default 4096 code units), and `maxWork` (default one million DP
cells). Limits can be lowered for request-specific budgets.

Supported syntax:

- `*` matches zero or more non-`/` code points.
- `**` matches zero or more code points including `/`.
- `?` matches exactly one non-`/` code point.
- `[abc]`, `[a-z]`, `[!a-z]`, and `[^a-z]` define character sets/ranges.
- Backslash quotes the following pattern character; a trailing backslash is invalid.

Matching is case-sensitive unless explicitly disabled. Glob syntax is not shell syntax; braces,
extglob, leading-dot rules, and platform-specific escaping are not implemented.
The path separator recognized by wildcard tokens is `/`; normalize Windows paths before matching.

```js
import { matchGlob } from '@lp-labs/glob-matcher';

const options = { caseSensitive: false, maxWork: 100_000 };
if (!matchGlob('assets/**/[a-z]*.png', 'ASSETS/icons/logo.png', options)) {
  throw new Error('Expected case-insensitive path match');
}
```

## Errors and performance

Malformed classes, descending ranges, and trailing escapes throw `TypeError`. Inputs exceeding a
configured length or work budget throw `RangeError`. Work and memory are O(P × I), where P is the
token count and I the input code-point count. The product is checked before allocating DP rows.
Classes match a single code point; Unicode case folding uses JavaScript `toLowerCase`, not locale
collation or filesystem-specific matching.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.

export interface GlobOptions {
  readonly caseSensitive?: boolean;
  readonly maxPatternLength?: number;
  readonly maxInputLength?: number;
  readonly maxWork?: number;
}
type Token =
  | { kind: 'literal'; value: string }
  | { kind: 'one' }
  | { kind: 'star'; acrossSlash: boolean }
  | { kind: 'class'; negated: boolean; ranges: readonly (readonly [number, number])[] };

function tokenize(pattern: string): Token[] {
  const chars = Array.from(pattern);
  const tokens: Token[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    if (char === '\\') {
      if (++i >= chars.length) throw new TypeError('Trailing escape in glob');
      tokens.push({ kind: 'literal', value: chars[i]! });
    } else if (char === '?') tokens.push({ kind: 'one' });
    else if (char === '*') {
      if (chars[i + 1] === '*') {
        while (chars[i + 1] === '*') i++;
        tokens.push({ kind: 'star', acrossSlash: true });
      } else tokens.push({ kind: 'star', acrossSlash: false });
    } else if (char === '[') {
      let end = i + 1;
      while (end < chars.length && chars[end] !== ']') end++;
      if (end === chars.length) throw new TypeError('Unclosed character class');
      let start = i + 1;
      const negated = chars[start] === '!' || chars[start] === '^';
      if (negated) start++;
      const ranges: [number, number][] = [];
      for (let at = start; at < end; at++) {
        const first = chars[at]!.codePointAt(0)!;
        if (chars[at + 1] === '-' && at + 2 < end) {
          const last = chars[at + 2]!.codePointAt(0)!;
          if (last < first) throw new TypeError('Descending character-class range');
          ranges.push([first, last]);
          at += 2;
        } else ranges.push([first, first]);
      }
      if (ranges.length === 0) throw new TypeError('Empty character class');
      tokens.push({ kind: 'class', negated, ranges });
      i = end;
    } else tokens.push({ kind: 'literal', value: char });
  }
  return tokens;
}

export function matchGlob(pattern: string, input: string, options: GlobOptions = {}): boolean {
  const maxPattern = options.maxPatternLength ?? 512;
  const maxInput = options.maxInputLength ?? 4096;
  const maxWork = options.maxWork ?? 1_000_000;
  if (pattern.length > maxPattern || input.length > maxInput)
    throw new RangeError('Glob input exceeds limit');
  const tokens = tokenize(pattern);
  const chars = Array.from(input);
  if ((tokens.length + 1) * (chars.length + 1) > maxWork)
    throw new RangeError('Glob work limit exceeded');
  const fold = (value: string): string =>
    options.caseSensitive === false ? value.toLowerCase() : value;
  let previous = new Uint8Array(chars.length + 1);
  previous[0] = 1;
  for (const token of tokens) {
    const next = new Uint8Array(chars.length + 1);
    if (token.kind === 'star') {
      next[0] = previous[0]!;
      for (let j = 1; j <= chars.length; j++) {
        const canConsume = token.acrossSlash || chars[j - 1] !== '/';
        next[j] = previous[j]! || (canConsume && next[j - 1]!) ? 1 : 0;
      }
    } else {
      for (let j = 1; j <= chars.length; j++) {
        const char = chars[j - 1]!;
        let accepts = false;
        if (token.kind === 'one') accepts = char !== '/';
        else if (token.kind === 'literal') accepts = fold(char) === fold(token.value);
        else {
          const point = fold(char).codePointAt(0)!;
          const included = token.ranges.some(([from, to]) => {
            if (options.caseSensitive !== false) return point >= from && point <= to;
            const first = fold(String.fromCodePoint(from)).codePointAt(0)!;
            const last = fold(String.fromCodePoint(to)).codePointAt(0)!;
            return point >= Math.min(first, last) && point <= Math.max(first, last);
          });
          accepts = char !== '/' && (token.negated ? !included : included);
        }
        next[j] = accepts && previous[j - 1]! ? 1 : 0;
      }
    }
    previous = next;
  }
  return previous[chars.length] === 1;
}

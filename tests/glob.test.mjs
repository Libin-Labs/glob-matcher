import test from 'node:test';
import assert from 'node:assert/strict';
import { matchGlob } from '../dist/esm/index.js';
test('matches literals and rejects other input', () => {
  assert.equal(matchGlob('readme.md', 'readme.md'), true);
  assert.equal(matchGlob('readme.md', 'README.md'), false);
});
test('star matches within one path segment', () => {
  assert.equal(matchGlob('src/*.ts', 'src/main.ts'), true);
  assert.equal(matchGlob('src/*.ts', 'src/a/main.ts'), false);
});
test('double star crosses path segments', () => {
  assert.equal(matchGlob('src/**/*.ts', 'src/a/b/main.ts'), true);
});
test('question mark consumes one non-slash code point', () => {
  assert.equal(matchGlob('a?.txt', 'a😀.txt'), true);
  assert.equal(matchGlob('a?.txt', 'a/x.txt'), false);
});
test('classes support ranges and negation', () => {
  assert.equal(matchGlob('file[0-9].txt', 'file7.txt'), true);
  assert.equal(matchGlob('file[!0-5].txt', 'file8.txt'), true);
});
test('supports explicit escaping and case folding', () => {
  assert.equal(matchGlob(String.raw`a\*`, 'a*'), true);
  assert.equal(matchGlob('ABC', 'abc', { caseSensitive: false }), true);
});
test('rejects malformed patterns and enforces work budgets', () => {
  assert.throws(() => matchGlob('[abc', 'a'));
  assert.throws(() => matchGlob('abc', 'abc', { maxWork: 1 }), RangeError);
});

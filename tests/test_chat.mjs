import test from 'node:test';
import assert from 'node:assert/strict';
import {formatMessageTime} from '../web/chat.mjs';

test('fallback message times roll over the hour for a full thread', () => {
  for (const [index, expected] of [[0, '9:41 AM'], [9, '9:59 AM'], [10, '10:01 AM'], [19, '10:19 AM']]) {
    assert.equal(formatMessageTime({}, index), expected);
  }
});

test('explicit message times take precedence over the fallback sequence', () => {
  const time = new Date(2000, 0, 1, 11, 4).toISOString();
  assert.equal(formatMessageTime({time}, 19), '11:04 AM');
});

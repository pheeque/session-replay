import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PREFERENCES_KEY, readPreferences, savePreferences } from '../lib/preferences.js';

const memory = (initial = {}) => {
    const items = { ...initial };

    return { items, getItem: (key) => items[key] ?? null, setItem: (key, value) => (items[key] = value) };
};

test('a first replay opens at 1x, skipping inactivity, with vitals hidden', () => {
    assert.deepEqual(readPreferences(memory()), { speed: 1, skipInactive: true, hidden: ['vital'] });
    assert.deepEqual(readPreferences(null), { speed: 1, skipInactive: true, hidden: ['vital'] });
});

test('each choice is kept on its own, on top of the earlier ones', () => {
    const storage = memory();

    savePreferences(storage, { speed: 4 });
    savePreferences(storage, { skipInactive: false });
    savePreferences(storage, { hidden: ['console', 'request'] });

    assert.deepEqual(readPreferences(storage), { speed: 4, skipInactive: false, hidden: ['console', 'request'] });
    assert.deepEqual(JSON.parse(storage.items[PREFERENCES_KEY]), { speed: 4, skipInactive: false, hidden: ['console', 'request'] });
});

test('showing every kind is a choice too, not a return to the default', () => {
    const storage = memory();

    savePreferences(storage, { hidden: [] });

    assert.deepEqual(readPreferences(storage).hidden, []);
});

test('what the player cannot use is left out, and the rest kept', () => {
    const storage = memory({ [PREFERENCES_KEY]: JSON.stringify({ speed: 3, skipInactive: 'no', hidden: ['error', 7], volume: 1 }) });

    assert.deepEqual(readPreferences(storage), { speed: 1, skipInactive: true, hidden: ['error'] });

    savePreferences(storage, { speed: 8, volume: 2 });

    assert.deepEqual(JSON.parse(storage.items[PREFERENCES_KEY]), { speed: 8, skipInactive: true, hidden: ['error'] });
});

test('a broken or refusing storage keeps the defaults and never throws', () => {
    assert.deepEqual(readPreferences(memory({ [PREFERENCES_KEY]: '{not json' })).speed, 1);
    assert.deepEqual(readPreferences(memory({ [PREFERENCES_KEY]: 'null' })).speed, 1);

    const refusing = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } };

    assert.deepEqual(readPreferences(refusing), { speed: 1, skipInactive: true, hidden: ['vital'] });
    assert.deepEqual(savePreferences(refusing, { speed: 2 }), { speed: 2, skipInactive: true, hidden: ['vital'] });
});

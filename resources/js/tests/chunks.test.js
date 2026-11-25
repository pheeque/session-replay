import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inOrder, playable } from '../lib/chunks.js';

const later = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('chunks come out in recording order however they arrive, with no more than `ahead` requests at once', async () => {
    const items = [0, 1, 2, 3, 4, 5, 6];
    let running = 0;
    let most = 0;
    const started = [];

    const results = [];

    for await (const result of inOrder(items, 3, async (item) => {
        started.push(item);
        most = Math.max(most, ++running);
        // The first chunk is the slowest: the next ones are back before it.
        await later(item === 0 ? 30 : 5);
        running--;

        return `chunk ${item}`;
    })) {
        results.push(result);
    }

    assert.deepEqual(results, items.map((item) => `chunk ${item}`));
    assert.equal(most, 3);
    assert.deepEqual(started, items);
});

test('the requests ahead start before the first chunk is handed out', async () => {
    const started = [];
    const loader = inOrder([0, 1, 2, 3], 3, async (item) => {
        started.push(item);

        return item;
    });

    assert.deepEqual((await loader.next()).value, 0);
    assert.deepEqual(started.slice(0, 3), [0, 1, 2]);
});

test('the player is built once a full page snapshot and something after it are in', () => {
    assert.equal(playable([]), false);
    assert.equal(playable([{ type: 4 }, { type: 3 }]), false);
    assert.equal(playable([{ type: 2 }]), false);
    assert.equal(playable([{ type: 4 }, { type: 2 }]), true);
});

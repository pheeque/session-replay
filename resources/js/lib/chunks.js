/**
 * How the player loads a recording's chunks: several requests at once, handed
 * on in recording order, so playback can start on the first chunks while the
 * rest are still on their way. Pure, so it runs in Node for the tests.
 */

/** Requests in flight at once; HTTP/2 puts them on one connection. */
export const CHUNKS_AT_ONCE = 12;

/** Yields task(item) for each item in order, with up to `ahead` tasks running ahead of the one handed out. */
export async function* inOrder(items, ahead, task) {
    const running = [];
    let next = 0;

    const start = () => {
        if (next < items.length) running.push(task(items[next++]));
    };

    for (let slot = 0; slot < ahead; slot++) start();

    while (running.length) {
        const result = await running.shift();

        start();

        yield result;
    }
}

/** Enough to build the player on: a full page snapshot and something after it. */
export function playable(events) {
    return events.length >= 2 && events.some((event) => event.type === 2);
}

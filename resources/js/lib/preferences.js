/**
 * What the person watching last chose in the player (speed, skip inactivity, the marker kinds they hid),
 * kept in localStorage so the next replay opens the same way. Pure but for the storage it is given, tested
 * with node --test. A storage that throws (private mode, blocked cookies) or holds something else keeps the
 * defaults.
 */

export const PREFERENCES_KEY = 'sr:player';

export const SPEEDS = [1, 2, 4, 8];

const DEFAULTS = { speed: 1, skipInactive: true, hidden: ['vital'] };

export function readPreferences(storage) {
    let saved = {};

    try {
        saved = JSON.parse(storage?.getItem(PREFERENCES_KEY) ?? '{}') ?? {};
    } catch {
        saved = {};
    }

    return {
        speed: SPEEDS.includes(saved.speed) ? saved.speed : DEFAULTS.speed,
        skipInactive: typeof saved.skipInactive === 'boolean' ? saved.skipInactive : DEFAULTS.skipInactive,
        hidden: Array.isArray(saved.hidden) ? saved.hidden.filter((type) => typeof type === 'string') : DEFAULTS.hidden,
    };
}

/** Keeps the choices in change that are known, on top of what was saved; returns what is saved now. */
export function savePreferences(storage, change) {
    const known = Object.fromEntries(Object.entries(change).filter(([key]) => key in DEFAULTS));
    const next = { ...readPreferences(storage), ...known };
    const preferences = readPreferences({ getItem: () => JSON.stringify(next) });

    try {
        storage?.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
        // Not kept: the next replay opens with the defaults, nothing else changes.
    }

    return preferences;
}

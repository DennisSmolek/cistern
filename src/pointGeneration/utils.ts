import { Points, SinglePoint } from "./pointGeneration";




/*
 * Helper function factory that creates a last() function for getting the most recent point
 */
export function createPointTracker(pointsArray: Points) {
    return {
        last: () => pointsArray[pointsArray.length - 1],
        push: (point: SinglePoint) => pointsArray.push(point),
        pushArray: (x: number, y: number) => pointsArray.push([x, y]),
        pushWithId: (x: number, y: number, id: number) => pointsArray.push([x, y, id]),
    };
}

// Generic shallow merge helper that preserves type safety
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

export function deepMerge<T extends Record<string, unknown>>(obj1: Partial<T>, obj2: Partial<T>): T {
    const result: Record<string, unknown> = { ...(obj1 as Record<string, unknown>) };

    if (!obj2) return result as T;

    for (const key in obj2 as Record<string, unknown>) {
        const value2 = (obj2 as Record<string, unknown>)[key];
        if (value2 === undefined) continue; // do not overwrite with undefined

        const value1 = (obj1 as Record<string, unknown> | undefined)?.[key];

        // Arrays: prefer object2 (replace, not concatenate)
        if (Array.isArray(value2)) {
            result[key] = value2.slice();
            continue;
        }

        // Objects: recursively merge when both sides are plain objects
        if (isPlainObject(value2) && isPlainObject(value1)) {
            result[key] = deepMerge(value1 as Record<string, unknown>, value2 as Record<string, unknown>);
            continue;
        }

        // If value2 is object but value1 is not, clone value2 via recursive merge into empty
        if (isPlainObject(value2)) {
            result[key] = deepMerge({}, value2 as Record<string, unknown>);
            continue;
        }

        // Primitives: prefer object2
        result[key] = value2;
    }

    return result as T;
}



export function createPointTracker(pointsArray: Points) {
    return {
        last: () => pointsArray[pointsArray.length - 1],
        push: (point: SinglePoint) => pointsArray.push(point),
        pushArray: (x: number, y: number) => pointsArray.push([x, y]),
        pushWithId: (x: number, y: number, id: number) => pointsArray.push([x, y, id]),
    };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

export function deepMerge<T extends object>(obj1: Partial<T>, obj2: Partial<T>): T {
    const result: Record<string, unknown> = { ...(obj1 as Record<string, unknown>) };

    if (!obj2) return result as T;

    for (const key in obj2 as Record<string, unknown>) {
        const value2 = (obj2 as Record<string, unknown>)[key];
        if (value2 === undefined) continue;

        const value1 = (obj1 as Record<string, unknown> | undefined)?.[key];

        if (Array.isArray(value2)) {
            result[key] = value2.slice();
            continue;
        }

        if (isPlainObject(value2) && isPlainObject(value1)) {
            result[key] = deepMerge(value1 as Record<string, unknown>, value2 as Record<string, unknown>);
            continue;
        }

        if (isPlainObject(value2)) {
            result[key] = deepMerge({}, value2 as Record<string, unknown>);
            continue;
        }

        result[key] = value2;
    }

    return result as T;
}

type NotZeroInput = number | Array<unknown> | null | undefined;
export function notZero<T extends NotZeroInput>(inputItem?: T): T | undefined {
    //* Return the original value when it is considered "non-zero/non-empty"; otherwise undefined
    if (inputItem === undefined) return undefined;
    if (inputItem === null) return undefined;
    if (Array.isArray(inputItem)) return inputItem.length > 0 ? inputItem : undefined;
    if (typeof inputItem === "number") return inputItem !== 0 && !Number.isNaN(inputItem) ? inputItem : undefined;
    return undefined;
}

export { mat, withMat } from './threeUtils'
//* Types ==============================================
// Recursive type describing values that can be lerped deeply
// Use an interface for recursion to avoid TS2456 circular alias errors
interface LerpObject { [key: string]: number | number[] | LerpObject }
type Lerpable = number | number[] | LerpObject;

export function deepLerp<T extends Lerpable>(a: T, b: T, t: number): T {
    if (typeof a === "number" && typeof b === "number") {
        return (a + (b - a) * t) as T;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        const arrA = a as unknown as Lerpable[];
        const arrB = b as unknown as Lerpable[];
        return arrA.map((value: Lerpable, index: number) => deepLerp(value, arrB[index], t)) as T;
    }
    if (typeof a === "object" && a != null && typeof b === "object" && b != null) {
        // Narrow to object shapes for safe indexing
        const objA = a as LerpObject;
        const objB = b as LerpObject;
        const result: LerpObject = {};
        for (const key of Object.keys(objB)) {
            result[key] = key in objA ? deepLerp(objA[key], objB[key], t) : objB[key];
        }
        return result as T;
    }
    // fallback: just return b
    return b;
}

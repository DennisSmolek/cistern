import { Vector2, Vector3, Material } from "three/webgpu";

export function arrayToVecs(points: Points) {
    return points.map((point) => new Vector3(...point));
}


/**
     * Converts x, y coordinates and radius to UV coordinates on a circle
     * The circle is mapped to a square UV space where radius=1 creates a 2x2 square
     * @param x - X coordinate
     * @param y - Y coordinate  
     * @param radius - Radius of the circle
     * @returns Vector2 with UV coordinates (0-1 range)
     */
export function circleToUV(x: number, y: number, radius: number): Vector2 {
    // Normalize coordinates to the circle's radius
    const normalizedX = x / radius;
    const normalizedY = y / radius;

    // Convert from [-1, 1] range to [0, 1] UV range
    const u = (normalizedX + 1) * 0.5;
    const v = (normalizedY + 1) * 0.5;

    return new Vector2(u, v);
}


// Helper to get/check mats from a mesh because the damn array is annoying
//* Helper to get/check mats from a mesh because the damn array is annoying
// Smaller Section ---------------------------------
type UnknownRef<T> = { current?: T | null | undefined };
type MaybeRef<T> = T | UnknownRef<T> | null | undefined;
type HasMaterial = { material?: Material | Material[] | null | undefined };

function unwrapRef<T>(value: MaybeRef<T>): T | null | undefined {
    if (value && typeof value === "object" && "current" in (value as Record<string, unknown>))
        return (value as UnknownRef<T>).current;
    return value as T | null | undefined;
}

function isMaterial(value: unknown): value is Material {
    if (!value) return false;
    // Prefer duck-typing via built-in flags to avoid cross-realm instanceof pitfalls
    return (value as { isMaterial?: unknown }).isMaterial === true;
}

function isMaterialArray(value: unknown): value is Material[] {
    return Array.isArray(value) && value.length > 0 && value.every((v) => isMaterial(v));
}

// Minor Subdivision -- overloads for typed lookup
export function mat<T extends Material>(thing: MaybeRef<HasMaterial | T | T[]>, ctor: new (...args: unknown[]) => T): T | null;
export function mat(thing: MaybeRef<HasMaterial | Material | Material[]>): Material | null;
export function mat<T extends Material>(
    thing: MaybeRef<HasMaterial | T | T[] | Material | Material[]>,
    ctor?: new (...args: unknown[]) => T
): T | Material | null {
    const unwrapped = unwrapRef(thing);

    // Determine the material source: either the object itself is a material(s) or it has a .material
    let materialValue: Material | Material[] | null | undefined;
    if (isMaterial(unwrapped) || isMaterialArray(unwrapped)) materialValue = unwrapped as Material | Material[];
    else if (unwrapped && typeof unwrapped === "object" && "material" in (unwrapped as Record<string, unknown>))
        materialValue = (unwrapped as HasMaterial).material as Material | Material[] | null | undefined;
    else return null;

    if (!materialValue) return null;

    // If a constructor is provided, return the first material matching that type
    if (ctor) {
        const ctorName = ctor.name;
        const matches = (m: Material) => {
            const matObj = m as unknown as Record<string, unknown>;
            const hasTypeMatch = typeof matObj.type === "string" && (matObj.type as string) === ctorName;
            const hasFlagMatch = matObj["is" + ctorName] === true;
            return hasTypeMatch || hasFlagMatch;
        };
        if (Array.isArray(materialValue)) {
            const match = materialValue.find(matches);
            return (match as T | undefined) ?? null;
        }
        return matches(materialValue) ? (materialValue as T) : null;
    }

    // No type filter: collapse arrays to the first entry to avoid array handling at callsites
    return Array.isArray(materialValue) ? (materialValue[0] ?? null) : materialValue;
}

// Smaller Section ---------------------------------
// Execute a callback only when a material exists (and optionally matches a ctor)
export function withMat<T extends Material>(
    thing: MaybeRef<HasMaterial | T | T[] | Material | Material[]>,
    fn: (m: Material) => void
): void;
export function withMat<T extends Material>(
    thing: MaybeRef<HasMaterial | T | T[] | Material | Material[]>,
    ctor: new (...args: unknown[]) => T,
    fn: (m: T) => void
): void;
export function withMat<T extends Material>(
    thing: MaybeRef<HasMaterial | T | T[] | Material | Material[]>,
    ctorOrFn: ((m: Material) => void) | (new (...args: unknown[]) => T),
    maybeFn?: (m: T) => void
): void {
    const hasCtor = typeof ctorOrFn === "function" && (ctorOrFn as unknown as { prototype?: unknown }).prototype !== undefined && maybeFn !== undefined;
    const ctor = (hasCtor ? (ctorOrFn as new (...args: unknown[]) => T) : undefined) as (new (...args: unknown[]) => T) | undefined;
    const fn = (hasCtor ? maybeFn : (ctorOrFn as (m: Material) => void)) as (m: Material) => void;
    const m = mat(thing as never, ctor as never);
    if (m) fn(m as Material);
}

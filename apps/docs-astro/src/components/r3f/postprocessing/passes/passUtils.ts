
/**
 * Updates a property on a target object or a React ref to an object.
 * Accepts either a direct object or a React ref object as the first argument.
 *
 * @param targetOrRef - The object to update, or a React ref to the object.
 * @param key - The property key to update.
 * @param value - The value to assign.
 * @param setDirectly - Whether to set the value directly on the target object.
 */
export function updatePass<T extends object>(
    targetOrRef: T | React.RefObject<T | null | undefined>,
    key: PropertyKey,
    value: unknown,
    setDirectly?: boolean,
): void;
export function updatePass<T extends object>(
    targetOrRef: T | React.RefObject<T | null | undefined>,
    entries: Partial<Record<PropertyKey, unknown>>,
    setDirectly?: boolean,
): void;
export function updatePass<T extends object>(
    targetOrRef: T | React.RefObject<T | null | undefined>,
    keyOrEntries: PropertyKey | Partial<Record<PropertyKey, unknown>>,
    valueOrSetDirectly?: unknown,
    setDirectlyParam?: boolean,
): void {

    //* Get Target Object
    // Determine if the input is a ref (has a .current property)
    const isRef = typeof targetOrRef === 'object' && targetOrRef !== null && 'current' in targetOrRef;
    // Get the actual target object
    const target: T | null | undefined = isRef
        ? (targetOrRef as React.RefObject<T | null | undefined>).current
        : (targetOrRef as T);

    if (!target) {
        console.warn('%c[updatePass] Target object is not available.', 'color: orange');
        return;
    }

    //* Determine if object input or single key/value
    if (typeof keyOrEntries === 'object' && keyOrEntries !== null) {
        const entries = keyOrEntries as Partial<Record<PropertyKey, unknown>>;
        const direct = Boolean(valueOrSetDirectly);
        for (const [propKey, propValue] of Object.entries(entries))
            updatePass(target, propKey, propValue, direct);
        return;
    }

    const recordTarget: Record<PropertyKey, unknown> = target as unknown as Record<
        PropertyKey,
        unknown
    >;
    const propKey = keyOrEntries as PropertyKey;
    const direct = Boolean(setDirectlyParam);

    if (!(propKey in recordTarget)) {
        console.warn(`[updatePass] Key "${String(propKey)}" does not exist on target.`, target);
        return;
    }
    if (direct) {
        recordTarget[propKey] = valueOrSetDirectly;
        return;
    }
    const property = recordTarget[propKey];
    const isUniformLike = (v: unknown): v is { value: unknown } =>
        typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>);
    if (isUniformLike(property)) property.value = valueOrSetDirectly;
    else
        console.warn(
            `[updatePass] Property at key "${String(propKey)}" is not uniform-like (missing .value).`,
            property,
        );
}

import { describe, expect, it } from 'vitest';
import { defaultBaseConfig, getConfig, getConfigFromBase, mergeConfigs } from '../config';

describe('getConfig', () => {
    it('returns the default shape when called with no arguments', () => {
        // getConfig() with no args falls back to the module-local defaultBaseConfig
        // (radius: 20, height: 10, pedestalRadius: 5, pedestalHeight: 0.25, skylightRadius: 5).
        expect(getConfig()).toMatchSnapshot();
    });

    it('is stable/idempotent across repeated calls with the same input', () => {
        // Two independent calls should produce structurally identical (but not
        // referentially identical) configs - guards against accidental shared
        // mutable state (e.g. shared `points` array instances).
        const a = getConfig();
        const b = getConfig();
        expect(a).toEqual(b);
        expect(a.pedestal.points).not.toBe(b.pedestal.points);
    });

    it('falls back to radius/height when top/bottom variants are omitted', () => {
        const config = getConfig({ radius: 8, height: 4, pedestalRadius: 2, pedestalHeight: 0.5, skylightRadius: 1 });

        expect(config.root).toEqual({
            radius: 8,
            topRadius: 8,
            bottomRadius: 8,
            height: 4,
            topHeight: 4,
            bottomHeight: 0,
        });
    });

    it('prefers explicit top/bottom overrides over the radius/height fallback', () => {
        const config = getConfig({
            radius: 8,
            height: 4,
            topRadius: 12,
            bottomRadius: 3,
            topHeight: 9,
            bottomHeight: 1,
            pedestalRadius: 2,
            pedestalHeight: 0.5,
        });

        expect(config.root).toEqual({
            radius: 8,
            topRadius: 12,
            bottomRadius: 3,
            height: 4,
            topHeight: 9,
            bottomHeight: 1,
        });
    });

    it('QUIRK: does NOT backfill missing optional BaseConfig fields from defaultBaseConfig', () => {
        // getConfig only substitutes `defaultBaseConfig` when the ENTIRE inputBaseConfig
        // argument is falsy. It never merges an individual partial input against the
        // defaults field-by-field, so omitted optional fields (pedestalRadius,
        // pedestalHeight, skylightRadius, topHeight/bottomHeight/topRadius/bottomRadius)
        // simply propagate as `undefined` into the expanded config - even though a
        // "reasonable" implementation might fall back to defaultBaseConfig per-field.
        // This test intentionally pins that current (surprising) behavior.
        const config = getConfig({ radius: 10, height: 5 });

        expect(config.pedestal.height).toBeUndefined();
        expect(config.pedestal.outerHeight).toBeUndefined();
        expect(config.pedestal.radius).toBeUndefined();
        expect(config.skylight.radius).toBe(0);
        expect(config.skylight.topRadius).toBe(0);
        // root itself IS fully populated because radius/height were provided and the
        // top/bottom fields fall back onto the sibling radius/height inputs (not onto
        // defaultBaseConfig, which has no top/bottom fields anyway).
        expect(config.root).toEqual({
            radius: 10,
            topRadius: 10,
            bottomRadius: 10,
            height: 5,
            topHeight: 5,
            bottomHeight: 0,
        });
    });

    it('always returns fresh (non-shared) empty points arrays per section', () => {
        const config = getConfig();
        expect(config.pedestal.points).toEqual([]);
        expect(config.bottomCorner.points).toEqual([]);
        expect(config.topCorner.points).toEqual([]);
        expect(config.wall.points).toEqual([]);
        expect(config.soffit.points).toEqual([]);
        expect(config.skylight.points).toEqual([]);
    });

    it('shares the same defaultTrimConfig object reference across wall trims', () => {
        // wall.ceilingTrim / floorTrim / railTrim are all assigned the same imported
        // `defaultTrimConfig` object literal - not independent copies. Mutating one
        // would mutate all three. Pinning this so the (accidental?) sharing survives
        // the three.js bump untouched; a fix for this would need to be intentional.
        const config = getConfig();
        expect(config.wall.ceilingTrim).toBe(config.wall.floorTrim);
        expect(config.wall.floorTrim).toBe(config.wall.railTrim);
    });
});

describe('getConfigFromBase (deprecated)', () => {
    it('delegates to getConfig and produces an identical result', () => {
        expect(getConfigFromBase(defaultBaseConfig)).toEqual(getConfig(defaultBaseConfig));
    });

    it('with no meaningful input still resolves via getConfig defaulting behavior', () => {
        // getConfigFromBase has no default parameter of its own; passing undefined
        // relies on getConfig's own `inputBaseConfig || defaultBaseConfig` fallback.
        // @ts-expect-error - intentionally exercising the undefined-input path
        expect(getConfigFromBase(undefined)).toEqual(getConfig());
    });
});

describe('mergeConfigs', () => {
    it('deep-merges nested objects, preserving untouched sibling fields', () => {
        const base = getConfig();
        const merged = mergeConfigs(base, { pedestal: { height: 99 } });

        expect(merged.pedestal.height).toBe(99);
        // siblings from base survive the merge
        expect(merged.pedestal.radius).toBe(base.pedestal.radius);
        expect(merged.pedestal.outerHeight).toBe(base.pedestal.outerHeight);
        // untouched top-level sections are preserved too
        expect(merged.root).toEqual(base.root);
    });

    it('REPLACES arrays wholesale rather than concatenating/merging them', () => {
        const base = getConfig();
        const overridePoints: Points = [[1, 2, 3]];
        const merged = mergeConfigs(base, { pedestal: { points: overridePoints } });

        expect(merged.pedestal.points).toEqual([[1, 2, 3]]);
        // it's a copy, not the same array reference
        expect(merged.pedestal.points).not.toBe(overridePoints);
    });

    it('treats explicit undefined values in the second argument as "no override"', () => {
        const base = getConfig({ radius: 10, height: 5, pedestalRadius: 3, pedestalHeight: 1 });
        const merged = mergeConfigs(base, { pedestal: { radius: undefined } });

        // undefined in obj2 is skipped entirely, so base's value survives
        expect(merged.pedestal.radius).toBe(3);
    });

    it('is left-to-right: second argument wins on scalar conflicts', () => {
        const merged = mergeConfigs({ root: { radius: 1 } }, { root: { radius: 2 } });
        expect(merged.root?.radius).toBe(2);
    });
});

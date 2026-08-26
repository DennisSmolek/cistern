//* Load-time color system: one random hue per page load drives BOTH the UI
//* accent and the scene materials, so the shell and the demo read as one
//* monochrome composition (primary shades) with complementary accents.

function hslToHex(h: number, s: number, l: number): string {
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(255 * c)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export interface Palette {
    hue: number;
    /** UI accent (buttons, eyebrow, links) — same hue as the scene primary. */
    accent: string;
    accentHi: string;
    /** Scene primary: gallery walls. */
    primary: string;
    /** Lighter primary: pedestal-ish surfaces. */
    primarySoft: string;
    /** Near-black primary: canvas background. */
    primaryDark: string;
    /** Mid-dark primary: backdrop sweep. */
    backdrop: string;
    /** Complementary accents: the floating objects. */
    complement: string;
    complementSoft: string;
}

export function generatePalette(hue: number = Math.random() * 360): Palette {
    const h = ((hue % 360) + 360) % 360;
    const h2 = (h + 180) % 360;
    return {
        hue: h,
        accent: hslToHex(h, 70, 62),
        accentHi: hslToHex(h, 76, 74),
        primary: hslToHex(h, 28, 52),
        primarySoft: hslToHex(h, 20, 76),
        primaryDark: hslToHex(h, 30, 12),
        backdrop: hslToHex(h, 20, 30),
        complement: hslToHex(h2, 62, 60),
        complementSoft: hslToHex(h2, 38, 72),
    };
}

/** The palette for this page load. */
export const palette = generatePalette();

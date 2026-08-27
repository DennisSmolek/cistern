import { useEffect, useRef, useState } from 'react';
import { Leva } from 'leva';
import { useSnapshot } from 'valtio';
import { REVISION } from 'three/webgpu';
import Fiber from '../r3f/Fiber';
import { homeState } from './homeState';
import { palette } from './palette';
import { ExportPanel } from './ExportPanel';

import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './home.css';

const INSTALL_CMD = 'npm i @cistern/core three';
const GITHUB_URL = 'https://github.com/DennisSmolek/cistern';
const RELEASES_URL = `${GITHUB_URL}/releases`;
const DOCS_URL = '/guides/getting-started/';

interface HomeProps {
    /** \@cistern/core version, read at build time in the Astro frontmatter. */
    version: string;
}

export default function Home({ version }: HomeProps) {
    const { editMode } = useSnapshot(homeState);
    const [menuOpen, setMenuOpen] = useState(false);
    const [levaOpen, setLevaOpen] = useState(false);
    const panelOpen = editMode || levaOpen;
    const [copied, setCopied] = useState(false);
    // null until mounted — the shell renders over the flat canvas color either way.
    const [webgpu, setWebgpu] = useState<boolean | null>(null);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setWebgpu(typeof navigator !== 'undefined' && !!navigator.gpu);
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => (homeState.reducedMotion = mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    const copyInstall = () => {
        void navigator.clipboard.writeText(INSTALL_CMD);
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1400);
    };

    return (
        <div
            className={`home${editMode ? ' home--edit' : ''}`}
            style={
                {
                    // Load-time palette: UI accent + canvas ground align with the scene.
                    '--accent': palette.accent,
                    '--accent-hi': palette.accentHi,
                    '--bg-canvas': palette.primaryDark,
                } as React.CSSProperties
            }
        >
            <div className="home-canvas">{webgpu && <Fiber />}</div>
            <div className="home-scrim" />

            <header className="home-header">
                <a className="home-brand" href="/">
                    <span className="home-mark" aria-hidden="true" />
                    <span className="home-wordmark">
                        cistern<span>.studio</span>
                    </span>
                </a>
                <nav className="home-nav">
                    <a href={DOCS_URL}>Docs</a>
                    <a href={RELEASES_URL}>Changelog</a>
                    <a href={GITHUB_URL}>GitHub</a>
                    <span className="home-chip">
                        v{version}
                        <span>wip</span>
                    </span>
                </nav>
                <button
                    type="button"
                    className="home-burger"
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((o) => !o)}
                >
                    <i />
                    <i />
                </button>
            </header>
            {menuOpen && (
                <nav className="home-sheet">
                    <a href={DOCS_URL}>Docs</a>
                    <a href={RELEASES_URL}>Changelog</a>
                    <a href={GITHUB_URL}>GitHub</a>
                </nav>
            )}

            <section className="home-hero">
                <span className="home-eyebrow d-only">Three.js geometry · WebGPU / TSL</span>
                <span className="home-eyebrow m-only">Parametric round geometry</span>
                <h1 className="home-h1">
                    cistern<span>.studio</span>
                </h1>
                <div className="home-say">
                    <p className="home-lead d-only">
                        Type a radius, get architecture — pedestal, corners, soffit,
                        skylight, every section addressable, every UV where you left it.
                    </p>
                    <p className="home-lead m-only">
                        Type a radius, get architecture — every section addressable, every
                        UV where you left it.
                    </p>
                    <p className="home-note">Caution: Materials still WIP</p>
                </div>
                <div className="home-cta">
                    <div className="home-install">
                        <code>
                            <b>$</b>
                            {INSTALL_CMD}
                        </code>
                        <button type="button" className="home-copy" onClick={copyInstall}>
                            {copied ? 'COPIED' : 'COPY'}
                        </button>
                    </div>
                    <div className="home-buttons">
                        <button
                            type="button"
                            className="home-btn-primary"
                            onClick={() => (homeState.editMode = true)}
                        >
                            Edit live
                        </button>
                        <a className="home-btn-secondary" href={GITHUB_URL}>
                            GitHub <span className="arrow">↗</span>
                        </a>
                        <a className="home-btn-tertiary" href={DOCS_URL}>
                            Docs
                        </a>
                    </div>
                </div>
            </section>

            <footer className="home-footer">
                <span>
                    MIT · three r{REVISION}
                    <span className="d-only"> · SSGI → FSR3</span>
                </span>
                <span>
                    built by <a href="https://smolek.dev">Dennis Smolek</a>
                </span>
            </footer>

            <div className="home-leva">
                {!editMode && (
                    <button
                        type="button"
                        className="home-gear"
                        aria-label="Scene settings"
                        aria-expanded={panelOpen}
                        onClick={() => setLevaOpen((o) => !o)}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden="true"
                        >
                            <line x1="1" y1="5" x2="15" y2="5" />
                            <circle cx="6" cy="5" r="2.2" fill="var(--bg-page)" />
                            <line x1="1" y1="11" x2="15" y2="11" />
                            <circle cx="10" cy="11" r="2.2" fill="var(--bg-page)" />
                        </svg>
                    </button>
                )}
                {/* Export sits above Leva: an expanded panel is tall enough to
                    push anything below it off the bottom of the viewport. */}
                {editMode && <ExportPanel />}
                {/* Always mounted (an unmounted Leva re-mounts its own floating
                    default panel); the gear/edit mode toggles visibility. */}
                <div className="home-leva-scroll">
                    <Leva fill collapsed={false} hidden={!panelOpen} />
                </div>
            </div>
            {editMode && (
                <button
                    type="button"
                    className="home-exit"
                    onClick={() => (homeState.editMode = false)}
                >
                    ← Back
                </button>
            )}
        </div>
    );
}

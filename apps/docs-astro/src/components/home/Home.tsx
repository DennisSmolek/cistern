import { useEffect, useRef, useState } from 'react';
import { Leva } from 'leva';
import { useSnapshot } from 'valtio';
import { REVISION } from 'three/webgpu';
import Fiber from '../r3f/Fiber';
import { homeState } from './homeState';
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
        <div className={`home${editMode ? ' home--edit' : ''}`}>
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
                <span className="home-eyebrow d-only">Three.js geometry · mid-renovation</span>
                <span className="home-eyebrow m-only">Parametric round geometry</span>
                <h1 className="home-h1">
                    cistern<span>.studio</span>
                </h1>
                <p className="home-lead d-only">
                    Pass it a few params and it hands back a round geometry that already knows
                    about panel materials and where its UVs went. The renderer is a work in
                    progress. The geometry isn&rsquo;t.
                </p>
                <p className="home-lead m-only">
                    A few params in, a cylinder out — panel materials and sane UVs included.
                    Renderer still under scaffolding.
                </p>
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
                    built by <a href="https://smolek.dev">smolek.dev</a>
                </span>
            </footer>

            <div className="home-leva">
                <Leva key={editMode ? 'open' : 'closed'} fill collapsed={!editMode} />
                {editMode && <ExportPanel />}
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

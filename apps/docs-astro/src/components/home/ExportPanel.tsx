import { useState } from 'react';
import { Mesh, MeshStandardMaterial } from 'three/webgpu';
import { controlState } from '../r3f/control/controlState';
import { sceneRefs } from './homeState';

function download(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Edit-mode export: download what you built as a GLB or as code. */
export const ExportPanel = () => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportGLB = async () => {
        const mesh = sceneRefs.cistern;
        if (!mesh) {
            setError('Scene not ready yet');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
            // TSL node materials don't serialize to glTF — export the geometry
            // under a plain standard material.
            const exportMesh = new Mesh(mesh.geometry, new MeshStandardMaterial({ color: 0xd8d2c4 }));
            exportMesh.name = 'cistern';
            const exporter = new GLTFExporter();
            const result = (await exporter.parseAsync(exportMesh, { binary: true })) as ArrayBuffer;
            download('cistern.glb', new Blob([result], { type: 'model/gltf-binary' }));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    const exportCode = () => {
        const config = JSON.stringify(controlState.activeConfig, null, 4);
        const code =
            `import { CisternGeometry } from '@cistern/core';\n\n` +
            `// Exported from cistern.studio — the live config behind what you built.\n` +
            `export const config = ${config};\n\n` +
            `export const geometry = new CisternGeometry(config);\n`;
        download('cistern.ts', new Blob([code], { type: 'text/typescript' }));
    };

    return (
        <div className="home-export">
            <span className="home-export-label">Export</span>
            <div className="home-export-buttons">
                <button type="button" onClick={() => void exportGLB()} disabled={busy}>
                    {busy ? 'Exporting…' : 'GLB'}
                </button>
                <button type="button" onClick={exportCode}>Code</button>
            </div>
            {error && <span className="home-export-error">{error}</span>}
        </div>
    );
};

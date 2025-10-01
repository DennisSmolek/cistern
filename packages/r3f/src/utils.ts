import React from 'react';
/**
 * Loops over React children and returns the first child that is a material (by type or key), or null if none found.
 * This is useful for extracting a material passed as a child to a mesh-like component.
 * @param children - The children prop from a React component
 * @returns The first material React element, or null if not found
 */
export function findMaterialChild(children: React.ReactNode): React.ReactElement | null {
    // Helper to check if a React element is a material (by type or key)
    const isMaterialElement = (child: React.ReactNode): child is React.ReactElement => {
        if (!child || typeof child !== 'object' || !('type' in child)) return false;
        // Accept common material keys/types (cisternMaterial, meshStandardMaterial, etc)
        const type = (child as React.ReactElement).type;
        if (typeof type === 'string') {
            // Accept keys that end with 'Material' (e.g., 'meshStandardMaterial', 'cisternMaterial')
            return /Material$/i.test(type);
        }
        // If using a custom material component, you may want to check displayName or other props
        return false;
    };

    // React.Children.toArray flattens fragments and removes null/undefined
    const arr = React.Children.toArray(children);
    for (const child of arr) {
        if (isMaterialElement(child)) return child as React.ReactElement;
    }
    return null;
}



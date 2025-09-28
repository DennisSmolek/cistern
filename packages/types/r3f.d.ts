import '@react-three/fiber'

// Ambient augmentation for custom R3F elements
declare module '@react-three/fiber' {
    interface ThreeElements {
        // Map our custom material element created via extend({ ShadowNodeMaterial })
        // to MeshPhongMaterial props plus our custom 'blend' uniform.
        shadowNodeMaterial: ThreeElements['meshPhongMaterial'] & {
            blend?: number
        }
        meshStandardNodeMaterial: ThreeElements['meshStandardMaterial'] & {
            blend?: number
        }
    }
}


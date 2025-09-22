import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Cistern',
    description: 'Geometry toolkit for round galleries',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'API', link: '/api/' }
        ],
        sidebar: {
            '/api/': [
                {
                    text: 'API',
                    items: [
                        { text: 'Core', link: '/api/modules' }
                    ]
                }
            ]
        }
    }
})

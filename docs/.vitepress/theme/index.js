import DefaultTheme from 'vitepress/theme'

import './tailwind.postcss'
// Exercise the published stylesheet; the library build runs before docs.
// eslint-disable-next-line antfu/no-import-dist
import '../../../dist/vue-tailwind-datepicker.css'

export default { ...DefaultTheme }

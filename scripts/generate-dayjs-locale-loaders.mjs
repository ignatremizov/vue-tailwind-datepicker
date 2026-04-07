import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const repoRoot = path.resolve(scriptDir, '..')
const require = createRequire(import.meta.url)
const dayjsPackageJsonPath = require.resolve('dayjs/package.json')
const dayjsRootDir = path.dirname(dayjsPackageJsonPath)
const dayjsLocaleDir = path.join(dayjsRootDir, 'esm', 'locale')
const outputPath = path.join(repoRoot, 'src', 'generated', 'dayjs-locale-loaders.ts')

async function main() {
  const localeFiles = (await fs.readdir(dayjsLocaleDir))
    .filter(file => file.endsWith('.js'))
    .sort((left, right) => left.localeCompare(right))

  const entries = localeFiles.map((file) => {
    const localeCode = file.replace(/\.js$/, '')
    return `  '${localeCode}': () => import('dayjs/esm/locale/${file}').then(mod => mod.default),`
  })

  const fileContents = `export const dayjsLocaleLoaders = {
${entries.join('\n')}
} satisfies Record<string, () => Promise<unknown>>
`

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, fileContents)
  console.log(`Generated ${outputPath} with ${localeFiles.length} locale loaders.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

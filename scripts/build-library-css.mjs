import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, defineConfig } from 'vite'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const repoRoot = path.resolve(scriptDir, '..')
const distDir = path.join(repoRoot, 'dist')
const packageJsonPath = path.join(repoRoot, 'package.json')
const postcssConfigPath = path.join(repoRoot, 'postcss.config.cjs')
const publishedStylesheetExportPath = './style.css'
const styleBundleName = 'vtd-styles-bundle'

function toRollupOutputs(buildResult) {
  if (!buildResult)
    return []

  return Array.isArray(buildResult) ? buildResult : [buildResult]
}

async function resolvePublishedStylesheetName() {
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
  const stylesheetExportTarget = packageJson.exports?.[publishedStylesheetExportPath]

  if (typeof stylesheetExportTarget !== 'string')
    throw new Error(`Expected package.json exports["${publishedStylesheetExportPath}"] to be a string`)

  const relativeExportTarget = path.relative(distDir, path.resolve(repoRoot, stylesheetExportTarget))

  if (
    relativeExportTarget.startsWith('..')
    || path.isAbsolute(relativeExportTarget)
    || relativeExportTarget.length === 0
  ) {
    throw new Error(`Expected package.json exports["${publishedStylesheetExportPath}"] to resolve inside dist/, got: ${stylesheetExportTarget}`)
  }

  if (path.extname(relativeExportTarget) !== '.css')
    throw new Error(`Expected package.json exports["${publishedStylesheetExportPath}"] to point to a CSS asset, got: ${stylesheetExportTarget}`)

  return relativeExportTarget
}

async function main() {
  let emittedChunkFiles = []

  try {
    const publishedStylesheetName = await resolvePublishedStylesheetName()
    const buildResult = await build(defineConfig({
      configFile: false,
      css: {
        postcss: postcssConfigPath,
      },
      build: {
        outDir: distDir,
        emptyOutDir: false,
        copyPublicDir: false,
        cssCodeSplit: true,
        lib: {
          entry: path.join(repoRoot, 'src', 'style.css'),
          formats: ['es'],
          fileName: () => styleBundleName,
        },
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css')
              ? publishedStylesheetName
              : '[name]-[hash][extname]',
          },
        },
      },
    }))

    const cssAssetFiles = []

    emittedChunkFiles = toRollupOutputs(buildResult)
      .flatMap(output => 'output' in output ? output.output : [])
      .flatMap((entry) => {
        if (entry.type === 'asset' && entry.fileName.endsWith('.css')) {
          cssAssetFiles.push(entry.fileName)
          return []
        }

        return entry.type === 'chunk' ? [entry.fileName] : []
      })

    if (cssAssetFiles.length !== 1 || cssAssetFiles[0] !== publishedStylesheetName) {
      throw new Error(`Expected exactly one emitted stylesheet named ${publishedStylesheetName}, got: ${cssAssetFiles.join(', ') || '(none)'}`)
    }
  }
  finally {
    const filesToDelete = emittedChunkFiles.flatMap(file => [file, `${file}.map`])

    await Promise.all(filesToDelete.map(file => fs.rm(path.join(distDir, file), { force: true })))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

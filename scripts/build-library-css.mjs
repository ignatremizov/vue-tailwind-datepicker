import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'tinyglobby'
import { build, defineConfig } from 'vite'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const repoRoot = path.resolve(scriptDir, '..')
const distDir = path.join(repoRoot, 'dist')
const targetCssPath = path.join(distDir, 'vue-tailwind-datepicker.css')
const postcssConfigPath = path.join(repoRoot, 'postcss.config.cjs')

async function listCssFiles(dir) {
  return glob('**/*.css', {
    absolute: true,
    cwd: dir,
  })
}

async function main() {
  const tempCssBuildDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vue-tailwind-datepicker-css-build-'))

  try {
    const existingDistCssFiles = await listCssFiles(distDir)

    if (existingDistCssFiles.length > 1) {
      throw new Error(`Expected at most one CSS file from the library build, found: ${existingDistCssFiles.map(file => path.relative(repoRoot, file)).join(', ')}`)
    }

    await build(defineConfig({
      configFile: false,
      css: {
        postcss: postcssConfigPath,
      },
      build: {
        outDir: tempCssBuildDir,
        emptyOutDir: true,
        copyPublicDir: false,
        cssCodeSplit: true,
        rollupOptions: {
          input: {
            styles: path.join(repoRoot, 'src', 'style.css'),
          },
        },
      },
    }))

    const generatedCssFiles = await listCssFiles(tempCssBuildDir)

    if (generatedCssFiles.length !== 1) {
      throw new Error(`Expected one generated CSS file, found: ${generatedCssFiles.map(file => path.relative(repoRoot, file)).join(', ') || '(none)'}`)
    }

    const componentCssPath = existingDistCssFiles[0]
    const [componentCss, generatedCss] = await Promise.all([
      componentCssPath ? fs.readFile(componentCssPath, 'utf8') : Promise.resolve(''),
      fs.readFile(generatedCssFiles[0], 'utf8'),
    ])

    const combinedCss = componentCss ? `${generatedCss}\n${componentCss}` : generatedCss
    await fs.writeFile(targetCssPath, combinedCss)

    if (componentCssPath && componentCssPath !== targetCssPath)
      await fs.rm(componentCssPath, { force: true })
  }
  finally {
    await fs.rm(tempCssBuildDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

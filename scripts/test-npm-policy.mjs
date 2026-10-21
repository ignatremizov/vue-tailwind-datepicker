// Copyright © 2026 Zolvat Ltd
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const npmCli = path.join(projectRoot, 'node_modules/npm/bin/npm-cli.js')
const rootPackage = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const npmPackage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'node_modules/npm/package.json'), 'utf8'),
)
const environment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_config_')),
)
const unreviewedScriptError = /ESTRICTALLOWSCRIPTS/
const unknownConfigError = /unrecognized-policy-setting/
const unknownFlagError = /unrecognized-policy-flag/
const unreviewedRemoteError = /EALLOWREMOTE/

test('pinned npm enforces independent root and docs install policies', () => {
  assert.equal(`npm@${npmPackage.version}`, rootPackage.packageManager)
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'datepicker npm policy '))
  const userConfig = path.join(temporary, 'user.npmrc')
  const globalConfig = path.join(temporary, 'global.npmrc')

  function npm(args, cwd) {
    const result = spawnSync(process.execPath, [
      npmCli,
      ...args,
      '--offline',
      '--no-audit',
      '--no-fund',
      '--userconfig',
      userConfig,
      '--globalconfig',
      globalConfig,
    ], { cwd, env: environment, encoding: 'utf8', timeout: 15000 })
    assert.ifError(result.error)
    return result
  }

  try {
    fs.writeFileSync(userConfig, '')
    fs.writeFileSync(globalConfig, '')

    // A local tarball impersonating an approved registry name/version must not
    // inherit that registry package's script approval.
    const dependency = path.join(temporary, 'dependency')
    fs.mkdirSync(dependency)
    fs.writeFileSync(path.join(dependency, 'package.json'), JSON.stringify({
      name: 'esbuild',
      version: '0.28.2',
      scripts: { postinstall: 'node hook.cjs' },
    }))
    fs.writeFileSync(path.join(dependency, 'hook.cjs'), 'require("node:fs").writeFileSync("script-ran", "executed")\n')
    const packed = npm([
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      temporary,
    ], dependency)
    assert.equal(packed.status, 0, packed.stderr)
    assert.equal(JSON.parse(packed.stdout).esbuild.filename, 'esbuild-0.28.2.tgz')

    const remoteParent = path.join(temporary, 'remote-parent')
    fs.mkdirSync(remoteParent)
    fs.writeFileSync(path.join(remoteParent, 'package.json'), JSON.stringify({
      name: 'remote-parent',
      version: '1.0.0',
      dependencies: { 'remote-child': 'https://unreviewed.invalid/remote-child.tgz' },
    }))
    const parentPack = npm([
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      temporary,
    ], remoteParent)
    assert.equal(parentPack.status, 0, parentPack.stderr)

    for (const relativeRoot of ['', 'docs']) {
      const sourceRoot = path.join(projectRoot, relativeRoot)
      const project = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'))
      const lock = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package-lock.json'), 'utf8'))
      const policy = fs.readFileSync(path.join(sourceRoot, '.npmrc'), 'utf8')
      assert.equal(project.packageManager, rootPackage.packageManager)
      assert.deepEqual(project.allowScripts, {
        [`esbuild@${lock.packages['node_modules/esbuild'].version}`]: true,
        [`fsevents@${lock.packages['node_modules/fsevents'].version}`]: false,
        [`vue-demi@${lock.packages['node_modules/vue-demi'].version}`]: true,
      })

      function fixture(name, approval) {
        const directory = path.join(temporary, `${relativeRoot || 'root'}-${name}`)
        fs.mkdirSync(directory)
        const allowScripts = { ...project.allowScripts }
        if (typeof approval === 'boolean')
          allowScripts['file:../esbuild-0.28.2.tgz'] = approval
        fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
          name: `policy-${name}`,
          version: '1.0.0',
          allowScripts,
          dependencies: { esbuild: 'file:../esbuild-0.28.2.tgz' },
        }))
        fs.writeFileSync(path.join(directory, '.npmrc'), policy)
        return directory
      }

      function marker(directory) {
        return path.join(directory, 'node_modules/esbuild/script-ran')
      }

      const unreviewed = fixture('unreviewed')
      const blocked = npm(['install'], unreviewed)
      assert.notEqual(blocked.status, 0)
      assert.match(blocked.stderr, unreviewedScriptError)
      assert.equal(fs.existsSync(marker(unreviewed)), false)

      const approved = fixture('approved', true)
      const allowed = npm(['install'], approved)
      assert.equal(allowed.status, 0, allowed.stderr)
      assert.equal(fs.readFileSync(marker(approved), 'utf8'), 'executed')

      const denied = fixture('denied', false)
      const skipped = npm(['install'], denied)
      assert.equal(skipped.status, 0, skipped.stderr)
      assert.equal(fs.existsSync(marker(denied)), false)

      const unknown = fixture('unknown-config', false)
      fs.appendFileSync(path.join(unknown, '.npmrc'), 'unrecognized-policy-setting=true\n')
      const invalid = npm(['install'], unknown)
      assert.notEqual(invalid.status, 0)
      assert.match(invalid.stderr, unknownConfigError)
      assert.equal(fs.existsSync(marker(unknown)), false)

      const invalidFlag = npm(['install', '--unrecognized-policy-flag'], approved)
      assert.notEqual(invalidFlag.status, 0)
      assert.match(invalidFlag.stderr, unknownFlagError)

      const remote = fixture('transitive-remote', false)
      const remotePackage = JSON.parse(fs.readFileSync(path.join(remote, 'package.json'), 'utf8'))
      remotePackage.dependencies = { 'remote-parent': 'file:../remote-parent-1.0.0.tgz' }
      fs.writeFileSync(path.join(remote, 'package.json'), JSON.stringify(remotePackage))
      const rejectedRemote = npm(['install'], remote)
      assert.notEqual(rejectedRemote.status, 0)
      assert.match(rejectedRemote.stderr, unreviewedRemoteError)
    }

    const rootRemote = npm(['config', 'get', 'allow-remote'], projectRoot)
    assert.equal(rootRemote.status, 0, rootRemote.stderr)
    assert.equal(rootRemote.stdout.trim(), 'root')
    const docsRemote = npm(['--prefix', 'docs', 'config', 'get', 'allow-remote'], projectRoot)
    assert.equal(docsRemote.status, 0, docsRemote.stderr)
    assert.equal(docsRemote.stdout.trim(), 'none')
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
})

test('semantic-release prepares a version and tarball with pinned npm without publishing', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'datepicker npm release '))

  try {
    fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({
      name: 'npm-release-fixture',
      version: '1.0.0',
      files: ['entry.js'],
      scripts: { prepack: 'node prepack.cjs' },
    }))
    fs.writeFileSync(path.join(temporary, 'entry.js'), 'module.exports = "release fixture"\n')
    fs.writeFileSync(path.join(temporary, 'prepack.cjs'), 'require("node:fs").writeFileSync("prepack-ran", "executed")\n')
    fs.copyFileSync(path.join(projectRoot, '.npmrc'), path.join(temporary, '.npmrc'))
    const userConfig = path.join(temporary, 'auth.npmrc')
    const globalConfig = path.join(temporary, 'global.npmrc')
    fs.writeFileSync(userConfig, '')
    fs.writeFileSync(globalConfig, '')

    const { default: prepare } = await import(
      '../node_modules/@semantic-release/npm/lib/prepare.js',
    )
    await prepare(userConfig, { tarballDir: 'packed' }, {
      cwd: temporary,
      env: {
        ...environment,
        PATH: `${path.join(projectRoot, 'node_modules/.bin')}${path.delimiter}${environment.PATH}`,
        NPM_CONFIG_GLOBALCONFIG: globalConfig,
        NPM_CONFIG_OFFLINE: 'true',
      },
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      nextRelease: { version: '1.0.1' },
      logger: { log: () => undefined },
    })

    const prepared = JSON.parse(fs.readFileSync(path.join(temporary, 'package.json'), 'utf8'))
    assert.equal(prepared.version, '1.0.1')
    assert.equal(fs.readFileSync(path.join(temporary, 'prepack-ran'), 'utf8'), 'executed')
    assert.ok(fs.statSync(path.join(temporary, 'packed/npm-release-fixture-1.0.1.tgz')).size > 0)
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
})

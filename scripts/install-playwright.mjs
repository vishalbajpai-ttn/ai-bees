import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const playwrightCli = path.join(
  projectRoot,
  'node_modules',
  'playwright',
  'cli.js',
)

const result = spawnSync(
  process.execPath,
  [playwrightCli, 'install', ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: path.join(
        projectRoot,
        '.playwright-browsers',
      ),
    },
    stdio: 'inherit',
  },
)

if (result.error) throw result.error
process.exit(result.status ?? 1)

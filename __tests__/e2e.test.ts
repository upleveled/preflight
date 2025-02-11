import { readFile, writeFile } from 'node:fs/promises';
import { execa } from 'execa';
import pMap from 'p-map';
import { beforeAll, expect, test } from 'vitest';

const fixturesTempDir = '__tests__/fixtures/__temp';

beforeAll(
  async () => {
    // Pack and install Preflight globally
    const pnpmPackTarballPath = (await execa`pnpm pack`).stdout
      .split('\n')
      .find((line) => line.match(/^upleveled-preflight-.*\.tgz$/));

    if (!pnpmPackTarballPath) {
      throw new Error('Failed to find the tarball path in `pnpm pack` output');
    }

    // Workaround to globally set `pnpm.onlyBuiltDependencies` for `esbuild`
    // - https://github.com/pnpm/pnpm/issues/8891#issuecomment-2651840685
    const globalPnpmRoot = (await execa`pnpm root --global`).stdout;
    const globalPnpmPackageJsonPath = `${globalPnpmRoot.replace(/\/node_modules$/, '')}/package.json`;

    let globalPnpmPackageJson: {
      pnpm?: { onlyBuiltDependencies?: string[] };
    } = {};

    try {
      globalPnpmPackageJson = JSON.parse(
        await readFile(globalPnpmPackageJsonPath, 'utf8'),
      );
    } catch {
      // Swallow error if package.json doesn't exist
    }

    if (
      !globalPnpmPackageJson.pnpm?.onlyBuiltDependencies ||
      !globalPnpmPackageJson.pnpm.onlyBuiltDependencies.includes('esbuild')
    ) {
      console.log(
        `Updating pnpm global package.json at ${globalPnpmPackageJsonPath} to add 'esbuild' to pnpm.onlyBuiltDependencies...`,
      );
      globalPnpmPackageJson.pnpm = globalPnpmPackageJson.pnpm || {};
      globalPnpmPackageJson.pnpm.onlyBuiltDependencies =
        globalPnpmPackageJson.pnpm.onlyBuiltDependencies || [];
      globalPnpmPackageJson.pnpm.onlyBuiltDependencies.push('esbuild');
      await writeFile(
        globalPnpmPackageJsonPath,
        JSON.stringify(globalPnpmPackageJson, null, 2) + '\n',
      );
    }

    await execa`pnpm add --global ${process.cwd()}/${pnpmPackTarballPath}`;

    await pMap(
      [
        {
          repoPath: 'upleveled/preflight-test-project-react-passing',
          dirName: 'react-passing',
          async setup(this: { dirName: string }) {
            await execa({
              cwd: `${fixturesTempDir}/${this.dirName}`,
            })`pnpm install --frozen-lockfile`;
          },
        },
        {
          repoPath: 'upleveled/preflight-test-project-next-js-passing',
          dirName: 'next-js-passing',
          async setup(this: { dirName: string }) {
            await execa({
              cwd: `${fixturesTempDir}/${this.dirName}`,
            })`pnpm install --frozen-lockfile`;
            // Run project database migrations
            await execa({
              cwd: `${fixturesTempDir}/${this.dirName}`,
            })`pnpm migrate up`;
          },
        },
      ],
      async (testRepo) => {
        await execa`git clone --depth 1 --single-branch --branch=main https://github.com/${testRepo.repoPath}.git ${fixturesTempDir}/${testRepo.dirName} --config core.autocrlf=input`;
        return await testRepo.setup();
      },
      {
        // Run up to 4 concurrent test repo setups at a time
        concurrency: 4,
      },
    );
  },
  // 10 minute timeout for pnpm installation inside test repos
  600000,
);

function sortStdoutAndStripVersionNumber(stdout: string) {
  return stdout
    .replace(/(UpLeveled Preflight) v\d+\.\d+\.\d+(-\d+)?/, '$1')
    .split('\n')
    .sort((a: string, b: string) => {
      if (b.includes('UpLeveled Preflight')) return 1;
      return a < b ? -1 : 1;
    })
    .join('\n')
    .trim();
}

test('Passes in the react-passing test project', async () => {
  const { stdout, stderr } = await execa({
    cwd: `${fixturesTempDir}/react-passing`,
  })`preflight`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 30000);

test('Passes in the next-js-passing test project', async () => {
  const { stdout, stderr } = await execa({
    cwd: `${fixturesTempDir}/next-js-passing`,
  })`preflight`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 45000);

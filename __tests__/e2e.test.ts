import { execa as execaBind } from 'execa';
import pMap from 'p-map';
import { beforeAll, expect, test } from 'vitest';

const execa = execaBind({
  // Use Bash also on Windows, to avoid path issues
  shell: 'bash',
});

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

    await execa`pnpm add --global --allow-build=esbuild $(pwd)/${pnpmPackTarballPath}`;

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
}, 80000);

test('Passes in the next-js-passing test project', async () => {
  const { stdout, stderr } = await execa({
    cwd: `${fixturesTempDir}/next-js-passing`,
  })`preflight`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 90000);

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

    console.log(await execa({ shell: true })`echo $PATH`);
    console.log(await execa({ shell: 'bash' })`echo $PATH`);
    console.log(
      await execa`pnpm add --global --allow-build=esbuild ${process.cwd()}/${pnpmPackTarballPath}`,
    );
    console.log(
      (await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm`)
        .stdout,
    );
    // logging for
    // Error: Cannot find module 'C:\Program Files\Git\home\runner\.local\share\pnpm\global\5\.pnpm\node_modules\tsx\dist\cli.mjs'\r
    console.log(
      (await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm`)
        .stdout,
    );
    console.log(
      (
        await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm/global`
      ).stdout,
    );
    console.log(
      (
        await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm/global/5`
      ).stdout,
    );
    console.log(
      (
        await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm/global/5/.pnpm`
      ).stdout,
    );
    console.log(
      (
        await execa`ls /c/Program\ Files/Git/home/runner/.local/share/pnpm/global/5/.pnpm/node_modules`
      ).stdout,
    );
    console.log((await execa`preflight --version`).stdout);

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
}, 60000);

test('Passes in the next-js-passing test project', async () => {
  const { stdout, stderr } = await execa({
    cwd: `${fixturesTempDir}/next-js-passing`,
  })`preflight`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 90000);

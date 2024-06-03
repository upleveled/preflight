import { tmpdir } from 'node:os';
import { beforeAll, expect, test } from '@jest/globals';
import { execa } from 'execa';
import pMap from 'p-map';

const fixturesTempDir = process.env.GITHUB_ACTIONS
  ? // Switch to `tmpdir()` on GitHub Actions to avoid
    // ESLint crashing with Windows paths over the 260 character
    // MAX_PATH limit
    // https://github.com/upleveled/preflight/pull/469/#issuecomment-1812422819
    // https://github.com/eslint/eslint/issues/17763
    // https://github.com/nodejs/node/issues/50753
    tmpdir()
  : '__tests__/fixtures/__temp';

beforeAll(
  async () => {
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
        return testRepo.setup();
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
  })`${process.cwd()}/bin/preflight.js`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 30000);

test('Passes in the next-js-passing test project', async () => {
  const { stdout, stderr } = await execa({
    cwd: `${fixturesTempDir}/next-js-passing`,
  })`${process.cwd()}/bin/preflight.js`;

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 45000);

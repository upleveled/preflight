import { beforeAll, expect, test } from '@jest/globals';
import { execaCommand } from 'execa';
import pMap from 'p-map';

const fixturesTempDir = '__tests__/fixtures/__temp';

function cloneRepoToFixtures(repoPath: string, fixtureDirName: string) {
  return execaCommand(
    `git clone --depth 1 --single-branch --branch=main https://github.com/${repoPath}.git ${fixturesTempDir}/${fixtureDirName} --config core.autocrlf=input`,
  );
}

type Repo = {
  repoPath: string;
  dirName: string;
  installCommands?: string[];
};

const testRepos: Repo[] = [
  {
    repoPath: 'upleveled/preflight-test-project-react-passing',
    dirName: 'react-passing',
  },
  {
    repoPath: 'upleveled/preflight-test-project-next-js-passing',
    dirName: 'next-js-passing',
    installCommands:
      process.platform === 'win32'
        ? [
            // `pnpm remove` also installs if node_modules doesn't
            // exist (no need to run `pnpm install` as well)
            'pnpm remove @ts-safeql/eslint-plugin libpg-query',
            'git config user.email github-actions[bot]@users.noreply.github.com',
            'git config user.name github-actions[bot]',
            'git commit --all --message Remove\\ SafeSQL\\ for\\ Windows',
          ]
        : [
            'pnpm install --frozen-lockfile',
            // Run project database migrations
            'pnpm migrate up',
          ],
  },
];

beforeAll(
  async () => {
    await pMap(
      testRepos,
      ({ repoPath, dirName }) => cloneRepoToFixtures(repoPath, dirName),
      { concurrency: 4 },
    );

    await pMap(
      testRepos,
      async ({ dirName, installCommands }) => {
        if (!installCommands || installCommands.length < 1) {
          // Return array to keep return type uniform with
          // `return pMap()` below
          return [
            await execaCommand('pnpm install --frozen-lockfile', {
              cwd: `${fixturesTempDir}/${dirName}`,
            }),
          ];
        }

        return pMap(
          installCommands,
          (command) =>
            execaCommand(command, {
              cwd: `${fixturesTempDir}/${dirName}`,
            }),
          { concurrency: 1 },
        );
      },
      { concurrency: 1 },
    );
  },
  // 5 minute timeout for pnpm installation inside test repos
  300000,
);

test('Passes in the react-passing test project', async () => {
  const { stdout, stderr } = await execaCommand(
    `../../../../bin/preflight.js`,
    {
      cwd: `${fixturesTempDir}/react-passing`,
    },
  );

  const stdoutSortedWithoutVersionNumber = stdout
    .replace(/(UpLeveled Preflight) v\d+\.\d+\.\d+(-\d+)?/, '$1')
    .split('\n')
    .sort((a: string, b: string) => {
      if (b.includes('UpLeveled Preflight')) return 1;
      return a < b ? -1 : 1;
    })
    .join('\n')
    .trim();

  expect(stdoutSortedWithoutVersionNumber).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 30000);

test('Passes in the next-js-passing test project', async () => {
  const { stdout, stderr } = await execaCommand(
    `../../../../bin/preflight.js`,
    {
      cwd: `${fixturesTempDir}/next-js-passing`,
    },
  );

  const stdoutSortedWithoutVersionNumber = stdout
    .replace(/(UpLeveled Preflight) v\d+\.\d+\.\d+(-\d+)?/, '$1')
    .split('\n')
    .sort((a: string, b: string) => {
      if (b.includes('UpLeveled Preflight')) return 1;
      return a < b ? -1 : 1;
    })
    .join('\n')
    .trim();

  expect(stdoutSortedWithoutVersionNumber).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 45000);

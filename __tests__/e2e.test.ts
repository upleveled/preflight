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
  // {
  //   repoPath: 'upleveled/preflight-test-project-next-js-passing',
  //   dirName: 'next-js-passing',
  //   installCommands:
  //     // libpg-query is not yet supported on Windows
  //     // https://github.com/pganalyze/libpg_query/issues/44
  //     process.platform === 'win32'
  //       ? [
  //           // `pnpm remove` also installs if node_modules doesn't
  //           // exist (no need to run `pnpm install` as well)
  //           'pnpm remove @ts-safeql/eslint-plugin libpg-query',
  //           // Commit packages.json and pnpm-lock.yaml changes to
  //           // avoid failing "All changes committed to Git" check
  //           'git config user.email github-actions[bot]@users.noreply.github.com',
  //           'git config user.name github-actions[bot]',
  //           'git commit --all --message Remove\\ SafeSQL\\ for\\ Windows',
  //           // 'pnpm setup',
  //           // 'pnpm add --global ../../../preflight',
  //         ]
  //       : [
  //           'pnpm install --frozen-lockfile',
  //           // Run project database migrations
  //           'pnpm migrate up',
  //           // 'pnpm setup',
  //           // 'pnpm add --global ../../../preflight',
  //         ],
  // },
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
            await execaCommand('npm install', {
              cwd: `${fixturesTempDir}/${dirName}`,
            }),
          ];
        }

        return pMap(
          installCommands,
          (command) =>
            execaCommand(command, {
              cwd: `${fixturesTempDir}/${dirName}`,
              // env: {
              //   PNPM_HOME: '/usr/local/bin',
              //   SHELL: 'bash',
              // },
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
  if (process.platform === 'win32') {
    // const { stdout: stdout1 } = await execaCommand('dir', {
    //   cwd: `D:\\a\\preflight\\preflight\\__tests__\\fixtures\\__temp\\react-passing\\node_modules\\.pnpm\\eslint-config-upleveled@7.0.0_@babel+eslint-parser@7.23.3_@next+eslint-plugin-next@14.0.2_@ty_xvhbeu5qc6hlxssq5gmtnagbti\\node_modules\\eslint-plugin-jsx-expressions\\`,
    // });
    // console.log(stdout1);
    // const { stdout: stdout2 } = await execaCommand('dir', {
    //   cwd: `D:\\a\\preflight\\preflight\\__tests__\\fixtures\\__temp\\react-passing\\node_modules\\`,
    // });
    // console.log(stdout2);
    // const { stdout: stdout3 } = await execaCommand('type index.js', {
    //   cwd: `D:\\a\\preflight\\preflight\\__tests__\\fixtures\\__temp\\react-passing\\node_modules\\.pnpm\\eslint-config-upleveled@7.0.0_@babel+eslint-parser@7.23.3_@next+eslint-plugin-next@14.0.2_@ty_xvhbeu5qc6hlxssq5gmtnagbti\\node_modules\\eslint-config-upleveled\\`,
    // });
    // console.log(stdout3);
    // await execaCommand('pnpm install --shamefully-hoist', {
    //   cwd: `${fixturesTempDir}/react-passing`,
    // });
  }

  const { stdout, stderr } = await execaCommand(
    '../../../../bin/preflight.js',
    {
      cwd: `${fixturesTempDir}/react-passing`,
    },
  );

  expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
  expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
}, 70000);

// test('Passes in the next-js-passing test project', async () => {

//   const { stdout, stderr } = await execaCommand(
//     '../../../../bin/preflight.js',
//     {
//       cwd: `${fixturesTempDir}/next-js-passing`,
//     },
//   );

//   expect(sortStdoutAndStripVersionNumber(stdout)).toMatchSnapshot();
//   expect(stderr.replace(/^\(node:\d+\) /, '')).toMatchSnapshot();
// }, 45000);

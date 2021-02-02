import execa from 'execa';
import pMap from 'p-map';

const fixturesTempDir = '__tests__/fixtures/__temp';

async function cloneRepoToFixtures(repoPath: string, fixtureDirName: string) {
  return execa.command(
    `git clone --depth 1 --single-branch --branch=main https://github.com/${repoPath}.git ${fixturesTempDir}/${fixtureDirName}`,
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
    installCommands: [
      // Copy files from Git versions
      'cp package.json package.committed.json',
      'cp yarn.lock yarn.committed.lock',
      // To install the latest version of the ESLint config
      'yarn upgrade --latest @upleveled/eslint-config-upleveled',
      // Move back originals to avoid Git commit
      'rm package.json',
      'rm yarn.lock',
      'mv package.committed.json package.json',
      'mv yarn.committed.lock yarn.lock',
    ],
  },
];

beforeAll(
  async () => {
    await pMap(
      testRepos,
      async ({ repoPath, dirName }) => cloneRepoToFixtures(repoPath, dirName),
      { concurrency: 4 },
    );

    await pMap(
      testRepos,
      async ({ dirName, installCommands }) => {
        if (!installCommands) {
          return execa.command('yarn --frozen-lockfile', {
            cwd: `${fixturesTempDir}/${dirName}`,
          });
        }

        return await Promise.all(
          installCommands.map(command =>
            execa.command(command, {
              cwd: `${fixturesTempDir}/${dirName}`,
            }),
          ),
        );
      },
      { concurrency: 1 },
    );
  },
  // 2 minute timeout for yarn installation
  120000,
);

describe('Preflight', () => {
  it('passes in the react-passing test project', async () => {
    const { stdout, stderr } = await execa.command(
      `../../../../bin/preflight.js`,
      {
        cwd: `${fixturesTempDir}/react-passing`,
      },
    );

    const stdoutSortedWithoutVersionNumber = stdout
      .replace(/(UpLeveled Preflight) v\d+\.\d+\.\d+/, '$1')
      .split('\n')
      .sort((a: string, b: string) => {
        if (b.includes('UpLeveled Preflight')) return 1;
        return a < b ? -1 : 1;
      })
      .join('\n');

    expect(stdoutSortedWithoutVersionNumber).toMatchSnapshot();
    expect(stderr).toMatchSnapshot();
  }, 30000);
});

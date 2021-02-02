import { promises as fs } from 'fs';
import { Listr } from 'listr2';
import { createRequire } from 'module';
import { URL } from 'url';
import * as allChangesCommittedToGit from './checks/allChangesCommittedToGit';
import * as eslint from './checks/eslint';
import * as eslintConfigIsLatestVersion from './checks/eslintConfigIsLatestVersion';
import * as linkOnGithubAbout from './checks/linkOnGithubAbout';
import * as nodeModulesIgnoredFromGit from './checks/nodeModulesIgnoredFromGit';
import * as noDependenciesWithoutTypes from './checks/noDependencyProblems/noDependenciesWithoutTypes';
import * as noUnusedDependencies from './checks/noDependencyProblems/noUnusedDependencies';
import * as noExtraneousFilesCommittedToGit from './checks/noExtraneousFilesCommittedToGit';
import * as noSecretsCommittedToGit from './checks/noSecretsCommittedToGit';
import * as preflightIsLatestVersion from './checks/preflightIsLatestVersion';
import * as useSinglePackageManager from './checks/useSinglePackageManager';
import { CtxParam } from './types/CtxParam';
import { TaskParam } from './types/TaskParam';

const version = JSON.parse(
  await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8'),
).version;

const require = createRequire(process.cwd());
console.log('process.cwd', process.cwd());
const eslintConfigPackageJsonPath = require.resolve(
  '@upleveled/eslint-config-upleveled/package.json',
);
console.log('eslint package json path', eslintConfigPackageJsonPath);
process.exit(0);
console.log(`🚀 UpLeveled Preflight v${version}`);

const listrTasks = [
  // ======= Sync Tasks =======
  // Git
  allChangesCommittedToGit,
  nodeModulesIgnoredFromGit,
  noExtraneousFilesCommittedToGit,
  noSecretsCommittedToGit,

  // Package Managers
  useSinglePackageManager,

  // ======= Async Tasks =======
  // Dependencies
  {
    title: 'No dependency problems',
    task: (ctx: CtxParam, task: TaskParam): Listr =>
      task.newListr([
        {
          title: noUnusedDependencies.title,
          task: noUnusedDependencies.default,
        },
        {
          title: noDependenciesWithoutTypes.title,
          task: noDependenciesWithoutTypes.default,
        },
      ]),
  },

  // GitHub
  linkOnGithubAbout,

  // Linting
  eslint,

  // Version checks
  eslintConfigIsLatestVersion,
  preflightIsLatestVersion,
].map(module => {
  if ('task' in module) return module;
  return {
    title: module.title,
    task: module.default,
  };
});

await new Listr(listrTasks, {
  exitOnError: false,
  rendererOptions: {
    collapseErrors: false,
    removeEmptyLines: false,
    formatOutput: 'wrap',
  },
  concurrent: 5,
}).run();

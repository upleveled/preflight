import {
  Listr,
  ListrContext,
  ListrDefaultRenderer,
  ListrTask,
  ListrTaskWrapper,
} from 'listr2';
import * as allChangesCommittedToGit from './checks/allChangesCommittedToGit.js';
import * as eslint from './checks/eslint.js';
import * as eslintConfigIsValid from './checks/eslintConfigIsValid.js';
import * as linkOnGithubAbout from './checks/linkOnGithubAbout.js';
import * as nodeModulesIgnoredFromGit from './checks/nodeModulesIgnoredFromGit.js';
import * as noDependenciesWithoutTypes from './checks/noDependencyProblems/noDependenciesWithoutTypes.js';
import * as noUnusedAndMissingDependencies from './checks/noDependencyProblems/noUnusedDependencies.js';
import * as noExtraneousFilesCommittedToGit from './checks/noExtraneousFilesCommittedToGit.js';
import * as noSecretsCommittedToGit from './checks/noSecretsCommittedToGit.js';
import * as preflightIsLatestVersion from './checks/preflightIsLatestVersion.js';
import * as prettier from './checks/prettier.js';
import * as projectFolderNameMatchesCorrectFormat from './checks/projectFolderNameMatchesCorrectFormat.js';
import * as stylelint from './checks/stylelint.js';
import * as stylelintConfigIsValid from './checks/stylelintConfigIsValid.js';
import * as useSinglePackageManager from './checks/useSinglePackageManager.js';
import {
  preflightPackageJson,
  projectPackageJson,
} from './util/packageJson.js';

const projectDependencies = projectPackageJson.dependencies || {};

console.log(`🚀 UpLeveled Preflight v${preflightPackageJson.version}`);

const listrTasks: ListrTask[] = [
  // ======= Sync Tasks =======
  // Git
  allChangesCommittedToGit,
  nodeModulesIgnoredFromGit,
  noExtraneousFilesCommittedToGit,
  noSecretsCommittedToGit,

  // Package managers
  useSinglePackageManager,

  // Project setup
  projectFolderNameMatchesCorrectFormat,

  // ======= Async Tasks =======
  // Dependencies
  {
    title: 'No dependency problems',
    task: (
      ctx: ListrContext,
      task: ListrTaskWrapper<any, ListrDefaultRenderer, ListrDefaultRenderer>,
    ): Listr<any, any, any> =>
      task.newListr([
        {
          title: noUnusedAndMissingDependencies.title,
          task: noUnusedAndMissingDependencies.default,
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
  ...(!(
    '@upleveled/react-scripts' in projectDependencies ||
    'next' in projectDependencies
  )
    ? []
    : [stylelint]),
  prettier,

  // Version and configuration checks
  eslintConfigIsValid,
  ...(!(
    '@upleveled/react-scripts' in projectDependencies ||
    'next' in projectDependencies
  )
    ? []
    : [stylelintConfigIsValid]),
  preflightIsLatestVersion,
].map((module) => {
  if ('task' in module) return module;
  return {
    title: module.title,
    task: module.default,
  };
});

const tasks = new Listr(listrTasks, {
  exitOnError: false,
  collectErrors: 'minimal',
  rendererOptions: {
    collapseErrors: false,
    removeEmptyLines: false,
    formatOutput: 'wrap',
  },
  fallbackRenderer: 'verbose',
  concurrent: 5,
});

await tasks.run();

if (tasks.errors.length > 0) {
  process.exit(1);
}

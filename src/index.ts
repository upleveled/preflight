import {
  Listr,
  type ListrContext,
  type ListrDefaultRenderer,
  type ListrTask,
  ListrTaskWrapper,
} from 'listr2';
import * as allChangesCommittedToGit from './checks/allChangesCommittedToGit.ts';
import * as eslint from './checks/eslint.ts';
import * as eslintConfigIsValid from './checks/eslintConfigIsValid.ts';
import * as linkOnGithubAbout from './checks/linkOnGithubAbout.ts';
import * as nodeModulesIgnoredFromGit from './checks/nodeModulesIgnoredFromGit.ts';
import * as noDependenciesWithoutTypes from './checks/noDependencyProblems/noDependenciesWithoutTypes.ts';
import * as noUnusedAndMissingDependencies from './checks/noDependencyProblems/noUnusedDependencies.ts';
import * as noExtraneousFilesCommittedToGit from './checks/noExtraneousFilesCommittedToGit.ts';
import * as noSecretsCommittedToGit from './checks/noSecretsCommittedToGit.ts';
import * as preflightIsLatestVersion from './checks/preflightIsLatestVersion.ts';
import * as prettier from './checks/prettier.ts';
import * as projectFolderNameMatchesCorrectFormat from './checks/projectFolderNameMatchesCorrectFormat.ts';
import * as stylelint from './checks/stylelint.ts';
import * as stylelintConfigIsValid from './checks/stylelintConfigIsValid.ts';
import * as useSinglePackageManager from './checks/useSinglePackageManager.ts';
import {
  preflightPackageJson,
  projectPackageJson,
} from './util/packageJson.ts';

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

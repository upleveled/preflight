import { Listr, ListrContext } from 'listr2';
import eslintTask from './checks/eslintTask';
import noUnnecessaryFilesTask from './checks/noUnnecessaryFilesTask';

const taskList = [eslintTask, noUnnecessaryFilesTask];

await new Listr<ListrContext>(taskList, {
  exitOnError: false,
  rendererOptions: { collapseErrors: false },
  concurrent: 5,
}).run();

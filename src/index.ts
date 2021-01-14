import { Listr, ListrContext } from 'listr2';
import eslintTask from './checks/eslint';

const taskList = [eslintTask];

await new Listr<ListrContext>(taskList, {
  exitOnError: false,
  rendererOptions: { collapseErrors: false },
  concurrent: 5,
}).run();

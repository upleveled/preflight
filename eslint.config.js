import upleveled from 'eslint-config-upleveled';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  upleveled,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        project: './tsconfig.json',
      },
    },
  },
);

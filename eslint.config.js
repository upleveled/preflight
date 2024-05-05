import upleveled from 'eslint-config-upleveled';

upleveled[1].languageOptions.parserOptions = {
  EXPERIMENTAL_useProjectService: true,
};

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
const config = [...upleveled];

export default config;

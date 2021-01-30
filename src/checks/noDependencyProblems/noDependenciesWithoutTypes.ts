import cheerio from 'cheerio';
import { existsSync, promises as fs } from 'fs';
import { createRequire } from 'module';
import fetch from 'node-fetch';
import pReduce from 'p-reduce';

const require = createRequire(import.meta.url);

export const title = 'No dependencies without types';

// This is a naive check for matching @types/<pkg name> packages
// that the student hasn't yet installed. It is not intended to
// be an exhaustive check for any types for all packages.
//
// It attempts to address scenarios such as this with
// `styled-components`:
//
// https://learn.upleveled.io/courses/btcmp-l-webfs-gen-0/modules/122-cheatsheet-css-in-js/#eslint-errors-with-styled-components
export default async function noDependenciesWithoutTypes() {
  const { devDependencies, dependencies } = JSON.parse(
    await fs.readFile('package.json', 'utf-8'),
  );

  const dependenciesWithMissingTypes = await pReduce(
    Object.keys(dependencies),
    async (
      filteredDependencies: { [key: string]: string },
      dependency: string,
    ) => {
      // If a matching `@types/<package name>` has been already installed in devDependencies, bail out
      if (Object.keys(devDependencies).includes(`@types/${dependency}`)) {
        return filteredDependencies;
      }

      try {
        const packageJsonPath = require.resolve(`${dependency}/package.json`);

        const modulePackageJson = JSON.parse(
          await fs.readFile(packageJsonPath, 'utf-8'),
        );

        // If the keys "types" or "typings" are in the module's `package.json`, bail out
        if ('types' in modulePackageJson || 'typings' in modulePackageJson) {
          return filteredDependencies;
        }
      } catch (err) {}

      let indexDTsPath;

      try {
        indexDTsPath = require.resolve(`${dependency}/index.d.ts`);
      } catch (err) {}

      // If the index.d.ts file exists inside the module's directory, bail out
      if (indexDTsPath && (await existsSync(indexDTsPath))) {
        return filteredDependencies;
      }

      // TODO: Change this to use Algolia npm search index instead
      //
      // https://github.com/yarnpkg/berry/blob/master/packages/plugin-typescript/sources/typescriptUtils.ts#L8-L9
      //
      // index: npm-search
      // app id: OFCNCOG2CU
      // api key: ec73550aa8b2936dab436d4e02144784
      const html = await (
        await fetch(`https://www.npmjs.com/package/${dependency}`)
      ).text();

      const $ = cheerio.load(html);

      const definitelyTypedPreamble =
        'This package has TypeScript declarations provided by ';
      const definitelyTypedImage = $(
        `img[title^="${definitelyTypedPreamble}"]`,
      );

      if (definitelyTypedImage.length > 0) {
        const definitelyTypedPackageName = (definitelyTypedImage.attr(
          'title',
        ) as string).replace(definitelyTypedPreamble, '');
        filteredDependencies[dependency] = definitelyTypedPackageName;
      }

      return filteredDependencies;
    },
    {},
  );

  if (Object.keys(dependenciesWithMissingTypes).length > 0) {
    // TODO: Add proper error message here
    throw new Error(JSON.stringify(dependenciesWithMissingTypes, null, 2));
  }
}

import commandExample from '../../util/commandExample';
import { projectPackageJson } from '../../util/packageJson';

export const title = 'Next.js project has sharp installed';

export default function nextJsProjectHasSharpInstalled() {
  const dependenciesPackageNames = Object.keys(
    projectPackageJson.dependencies!,
  );
  if (
    dependenciesPackageNames.includes('next') &&
    !dependenciesPackageNames.includes('sharp')
  ) {
    throw new Error(
      `Next.js projects require the sharp package. Install it with:

        ${commandExample('yarn add sharp')}
      `,
    );
  }
}

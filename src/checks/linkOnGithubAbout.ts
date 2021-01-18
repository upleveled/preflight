import execa from 'execa';

// create task title

export const title = 'Github Repository contains link on About Section';

// create task
export default async function linkOnGithubAbout() {
  // get repo link with ´´´git remote get-url origin´´´  (check point)

  const { stdout: repoUrlStdout } = await execa.command(
    'git remote get-url origin',
  );

  console.log(repoUrlStdout);
  // fetch html from github url  (check point)
  // pass html trough the parser  (check point)
  // find the expected link if exist inside of the about page  (check point)
}

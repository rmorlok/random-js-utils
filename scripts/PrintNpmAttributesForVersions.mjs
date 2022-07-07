import { exec } from 'child_process';
import Table from 'easy-table';

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout? stdout : stderr);
    });
  });
}

const args = process.argv.slice(2);

if (args.length < 2 || args[0] === '--help') {
  console.log(`
Prints data that would normally be displayed using the "npm view" command as a table across all versions for the package.

Usage:  
yarn print-npm-attributes-for-versions <package-name> <attribute1> <attribute2> ...

Example:

yarn print-npm-attributes-for-versions eslint-plugin-unicorn engines.node peerDependencies.eslint
`);
  process.exit(1);
}

const [repoName, ...properties] = args;

const versions = JSON.parse(await execShellCommand(`npm view ${repoName} versions --json`));

console.log(`Loading data for ${versions.length} versions...`);

const data = await Promise.all(versions.map(async (v) => {
  const result = {version: v};
  for (const prop of properties) {
    result[prop] = (await execShellCommand(`npm view ${repoName}@${v} ${prop}`)).replace(/(\r\n|\n|\r)/gm, "");
  }

  return result;
}));

const t = new Table();

data.forEach((row) => {
  t.cell('Version', row.version);

  for (const prop of properties) {
    t.cell(prop, row[prop]);
  }

  t.newRow()
});

console.log(t.toString());

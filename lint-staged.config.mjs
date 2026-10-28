// Windows caps command lines at ~8k characters, so very large commits (like the initial import)
// lint the whole project instead of passing every staged path on the command line.
const MAX_LISTED_FILES = 40;

function quote(files) {
  return files.map((file) => `"${file}"`).join(' ');
}

function perFileOr(projectCommand, fileCommand) {
  return (files) =>
    files.length > MAX_LISTED_FILES ? projectCommand : `${fileCommand} ${quote(files)}`;
}

const config = {
  '*.{ts,tsx}': [
    perFileOr('eslint --fix .', 'eslint --fix'),
    perFileOr('prettier --write .', 'prettier --write'),
  ],
  '*.{json,md,css,mjs,cjs,js}': [perFileOr('prettier --write .', 'prettier --write')],
};

export default config;

const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const textFile = /\.(?:[cm]?[jt]sx?|json|css|scss|html|ya?ml|toml|md|sql|sh|py|txt|xml|svg)$/i;
const marker = /^(?:<{7}|>{7}|\|{7})(?: .*)?$|^={7}\s*$/m;

function checkFiles(files) {
  return files.filter(file => textFile.test(file) && marker.test(readFileSync(path.resolve(root, file), 'utf8')));
}

if (require.main === module) {
  const files = process.argv.length > 2 ? process.argv.slice(2)
    : execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const conflicts = checkFiles(files);
  if (conflicts.length) {
    console.error('Compilación detenida: quedan conflictos de merge en:\n' + conflicts.join('\n'));
    process.exitCode = 1;
  } else console.log('Verificación de merge: sin marcadores de conflicto.');
}

module.exports = { checkFiles };

const tsConfig = require('./tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Sovrascriviamo la baseUrl per puntare alla cartella compilata
// In tsconfig è "./src", ma in produzione i file sono in "./dist/src"
const baseUrl = path.join(__dirname, 'dist', 'src');

tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths
});
const tsConfig = require('./tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Override baseUrl to point to the compiled folder
// In tsconfig it's "./src", but in production files are in "./dist/src"
const baseUrl = path.join(__dirname, 'dist', 'src');

tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths
});
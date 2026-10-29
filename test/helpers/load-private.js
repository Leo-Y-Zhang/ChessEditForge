'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

// Inspect pure internal helpers without changing the production export surface.
module.exports = function loadPrivate(relative, name) {
  const filename = path.resolve(__dirname, '../..', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const sandbox = { module: { exports: {} }, require: createRequire(filename), Buffer, process };
  vm.runInNewContext(source + '\nmodule.exports = ' + name + ';', sandbox, { filename });
  return sandbox.module.exports;
};

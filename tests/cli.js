import test from 'blue-tape';
import shell from 'shelljs';

const before = test;
const after = test;
const TEMP_DIR = '.tmp/tests/cli';
const ORIGINAL_DIR = '../../../';
const FLINT_CLI_PATH = '../../../packages/cli/entry/flint'; // relative to TEMP_DIR

before('cli test setup', (assert) => {
  shell.mkdir('-p', TEMP_DIR);
  shell.cd(TEMP_DIR);
  assert.end();
});

test('Creates a new flint app', (assert) => {
  assert.equal(shell.exec(FLINT_CLI_PATH + ' new appname').code, 0);
  assert.ok(shell.test('-d', './appname'));
  assert.ok(shell.test('-f', './appname/main.js'));
  assert.ok(shell.test('-d', './appname/.flint'));
  assert.end();
});

after('cli test teardown', (assert) => {
  shell.cd(ORIGINAL_DIR);
  shell.rm('-rf', TEMP_DIR);
  assert.end();
});

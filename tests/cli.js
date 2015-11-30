import test from 'blue-tape'
import shell from 'shelljs'

const before = test
const after = test
const TEMP_DIR = '.tmp/tests/cli'
const ORIGINAL_DIR = '../../../'
const FLINT_CLI_PATH = '../../../packages/cli/entry/flint' // relative to TEMP_DIR

before('cli test setup', t => {
  shell.mkdir('-p', TEMP_DIR)
  shell.cd(TEMP_DIR)
  t.end()
})

test('Creates a new flint app', t => {
  t.equal(shell.exec(FLINT_CLI_PATH + ' new appname').code, 0)
  t.ok(shell.test('-d', './appname'))
  t.ok(shell.test('-f', './appname/main.js'))
  t.ok(shell.test('-d', './appname/.flint'))
  t.end()
})

after('cli test teardown', t => {
  shell.cd(ORIGINAL_DIR)
  shell.rm('-rf', TEMP_DIR)
  t.end()
})
import test from 'blue-tape'
import shell from 'shelljs'

const TEMP_DIR = '.tmp/tests/cli'
const ORIGINAL_DIR = '../../../'
const MOTION_CLI_PATH = '../../../packages/motion/cli/entry/motion' // relative to TEMP_DIR

let before = () => test('cli test setup', t => {
  shell.mkdir('-p', TEMP_DIR)
  shell.cd(TEMP_DIR)
  t.end()
})

let after = () => test('cli test teardown', t => {
  shell.cd(ORIGINAL_DIR)
  shell.rm('-rf', TEMP_DIR)
  t.end()
})

let run = (name, fn) => {
  before()
  test(name, fn)
  after()
}

run('Creates a new motion app', t => {
  t.equal(shell.exec(MOTION_CLI_PATH + ' new appname').code, 0)
  t.ok(shell.test('-d', './appname'))
  t.ok(shell.test('-f', './appname/main.js'))
  t.ok(shell.test('-f', './appname/.motion/index.html'))
  t.ok(shell.test('-f', './appname/.motion/package.json'))
  t.ok(shell.test('-d', './appname/.motion'))
  t.ok(shell.test('-d', './appname/static'))
  t.ok(shell.test('-f', './appname/static/main.css'))
  t.end()
})

run('Builds motion app', t => {
  t.equal(shell.exec(MOTION_CLI_PATH + ' new appname').code, 0)
  t.equal(shell.exec('cd ' + TEMP_DIR + '/appname').code, 0)
  t.equal(shell.exec(MOTION_CLI_PATH + ' build').code, 0)
  t.ok(shell.test('-d', './appname/.motion/.internal'))
  t.ok(shell.test('-f', './appname/.motion/.internal/state.json'))
  t.ok(shell.test('-d', './appname/.motion/.internal/out'))
  t.ok(shell.test('-f', './appname/.motion/.internal/out/main.js'))
  t.end()
})


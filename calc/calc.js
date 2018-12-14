import spawn from 'spawncommand'
import { resolve } from 'path'
import compiler from 'google-closure-compiler-java'

const LIB = resolve(require.resolve('google-closure-library'), '../../..')
const calcdeps  = resolve(LIB, 'bin/calcdeps.py')

;(async () => {
  const { promise } = spawn(calcdeps, [
    '-i', 'form/files/script.js',
    '-p', LIB, '-o', 'list',
  ])
  const { stdout, stderr, code } = await promise
  if (code) {
    throw new Error(stderr)
  }
  const files = stdout.split('\n').filter(a=>a)
  const args = [
    '-jar', compiler,
    '--js', 'form/files/upload.js',
    '--compilation_level', 'ADVANCED',
    '--externs', 'calc/externs.js',
    '--js_output_file', 'form/files/script-closure.js',
    '--create_source_map', '%outname%.map',
    '--source_map_include_content',
    ...files.reduce((a, f) => [...a, '--js', f], []),
  ]
  const { promise: promise2 } = spawn('java', args)
  const { stdout: o, stderr: e, code: c } = await promise2
  if (c) throw new Error(e)
  console.log(o)
})()
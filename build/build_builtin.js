const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const spawn = require('child_process').spawn

const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'lib')
const ascJar = path.join(rootDir, 'build/asc.jar')
const sourceDir = path.join(rootDir, 'src/native/')

exports.build = (rebuild = false, callback) => {
  ensureDir(outputDir)
  compileAbc(outputDir, 'builtin',
    ['builtin.as', 'Vector.as', 'DescribeType.as', 'JSON.as', 'Math.as', 'Error.as', 'Date.as', 'RegExp.as', 'IDataInput.as', 'IDataOutput.as', 'ByteArray.as', 'Proxy.as', 'XML.as', 'Dictionary.as', 'xml-document.as'],
    true, [], rebuild, callback
  )
}

function compileAbc (outputDir, libName, files, isBuiltin, configs, rebuild, callback) {
  let libPath = path.join(outputDir, libName + '.abc')
  let sourcesPath = path.resolve(sourceDir, libName)
  let hashesFilePath = path.join(outputDir, libName + '.hashes')

  let allFiles = scanForIncludes(sourcesPath, files)
  let newHashes = {}
  allFiles.forEach(function (file) {
    newHashes[file] = calcSha1(path.join(sourcesPath, file))
  })

  if (!rebuild && fs.existsSync(hashesFilePath)) {
    try {
      let hashes = JSON.parse(fs.readFileSync(hashesFilePath))
      let hashesMatch = Object.keys(hashes).concat(Object.keys(newHashes))
        .every(i => hashes[i] === newHashes[i])
      rebuild = !hashesMatch
    } catch (e) {
      rebuild = true
    }
  } else {
    rebuild = true
  }
  if (!rebuild) {
    callback(false)
    return
  }

  let args = ['-ea', '-DAS3', '-DAVMPLUS', '-classpath', ascJar, 'macromedia.asc.embedding.ScriptCompiler', '-builtin']
  if (!isBuiltin) {
    args.push(path.relative(sourcesPath, path.join(outputDir, 'builtin.abc')))
  }
  args.push('-out', path.relative(sourcesPath, libPath).replace(/\.abc$/, ''))
  args = args.concat(files, configs)

  let proc = spawn('java', args, { stdio: 'inherit', cwd: sourcesPath })
  proc.on('close', function (code) {
    if (code !== 0 || !fs.existsSync(libPath)) {
      console.log('Unable to build ' + libPath + '\nargs: ' + args.join(' '))
      process.exit(1)
    }
    fs.writeFileSync(hashesFilePath, JSON.stringify(newHashes, null, 2))
    callback(true)
  })
}

function scanForIncludes (basePath, files) {
  let queue = files.slice(0)
  let processed = {}
  let result = files.slice(0)
  queue.forEach(file => processed[file] = true)
  while (queue.length > 0) {
    let file = queue.shift()
    let content = fs.readFileSync(path.join(basePath, file)).toString()
    let re = /^\s*include\s+["']([^"']+)/gm
    let m
    while ((m = re.exec(content))) {
      let included = m[1]
      if (!processed[included]) {
        processed[included] = true
        result.push(included)
        queue.push(included)
      }
    }
  }
  return result
}

function calcSha1 (file) {
  var fileData = fs.readFileSync(file)
  return crypto.createHash('sha1').update(fileData).digest('hex')
}

function ensureDir (dir) {
  if (fs.existsSync(dir)) return
  let parts = dir.split(/[/\\]/g)
  let i = parts.length
  while (!fs.existsSync(parts.slice(0, i - 1).join('/'))) {
    i--
    if (i <= 0) throw new Error()
  }

  while (i <= parts.length) {
    fs.mkdirSync(parts.slice(0, i).join('/'))
    i++
  }
}

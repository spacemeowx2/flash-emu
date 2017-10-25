const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const spawn = require('child_process').spawn

const rootDir = path.resolve(__dirname, '..')
const ascjar = path.join(rootDir, 'build/asc.jar')
const build_dir = path.join(rootDir, 'build/compileabc')
const flash_dir = path.join(rootDir, 'src/native/flash')
const avm_dir = path.join(rootDir, 'src/native/avm2')
const pwd = path.join(rootDir, 'src/native')
const buildasc = path.join(rootDir, 'lib/builtin.abc')
const outputAbc = path.join(rootDir, 'lib/playerglobal.abc')
ensureDir(build_dir)

process.chdir(pwd)

exports.build = (rebuild = false, callback) => {
  let files = []
  let avmFiles = []
  walkFolder(flash_dir, files)
  walkFolder(avm_dir, avmFiles)
  files = files.concat(avmFiles)
  // console.log(files)
  files = resolveDeps(files)
  // console.log(files)
  runAsc(outputAbc, files, (code) => {
    callback()
  })
}

function package2filename (name) {
  return name.split('.').join(path.sep) + '.as'
}

function getDeps (origin, str) {
  let out = new Set()
  let imports = new Map()
  const fullName = (name) => {
    if (name.indexOf('.') === -1) {
      if (imports.has(name)) {
        return imports.get(name)
      } else {
        return origin.substr(0, origin.lastIndexOf('.') + 1) + name
      }
    } else {
      return name
    }
  }
  const importRE = /import\s+([a-zA-Z0-9\.]+)/g
  const extendRE = /class\s+([^\s]+?)\s+(extends\s+([^\s]+?)\s*)?(implements\s+(.+?)\s*)?\{/g
  let r
  while (r = importRE.exec(str)) {
    const qname = r[1]
    out.add(qname)
    const cls = qname.substr(qname.lastIndexOf('.') + 1)
    imports.set(cls, qname)
  }
  while (r = extendRE.exec(str)) {
    const extend = r[3] && fullName(r[3])
    const imps = r[5] ? r[5].split(',').map(s => s.split()).map(fullName) : []
    if (extend) {
      out.add(extend)
    }
    for (let imp of imps) {
      out.add(imp)
    }
  }
  // console.log('[+]', out)
  return Array.from(out.values())
}

function resolveDeps (names) {
  const moveToTop = (ary, val) => {
    let idx = ary.indexOf(val)
    if (idx === -1) {
      return false
    }
    let item = ary.splice(idx, 1)[0]
    ary.unshift(item)
    return true
  }
  const isInOut = (c) => {
    return out.includes(c) || ignore.includes(c)
  }
  names = names.slice(0)
  let out = []
  let ignore = []
  let cur
  let stack = []
  for (let name of names) {
    if (!isInOut(name)) {
      stack.push(name)
      while (cur = stack.pop()) {
        if (isInOut(cur)) {
          continue
        }
        const filename = package2filename(cur)
        try {
          const content = fs.readFileSync(filename).toString()
          const deps = getDeps(cur, content).filter(i => !isInOut(i))
          if (deps.length === 0) {
            out.push(cur)
          } else {
            for (let dep of deps) {
              if (!stack.includes(dep)) {
                stack.push(dep)
              }
            }
            stack.unshift(cur)
          }
        } catch (e) {
          console.error(`open ${filename} failed, ignore it`)
          ignore.push(cur)
        }
      }
    }
  }
  out = out.map(package2filename)
  return out
}

function walkFolder (dir, out) {
  let files = fs.readdirSync(dir)
  for (let file of files) {
    let filename = path.join(dir, file)
    let stat = fs.statSync(filename)
    if (stat.isFile() && path.extname(filename) === '.as') {
      let parsedPath = path.parse(filename)
      let name = path.join(parsedPath.dir, parsedPath.name)
      name = path.relative(pwd, name)
      name = name.split(path.sep).join('.')
      out.push(name)
    } else if (stat.isDirectory()) {
      walkFolder(filename, out)
    }
  }
}

let manifestPath = null
let files = []
let swfParams = null
let needsPlayerglobal = null
let outputPath = null
let debugInfo = false
let strict = true

function runAsc(outputPath, files, callback) {
  console.info('Building ' + outputPath + ' ...')
  const parsedPath = path.parse(outputPath)
  const outputDir = parsedPath.dir
  const outputName = parsedPath.name
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  let outputAs = path.join(outputDir, outputName + '.as')
  fs.writeFileSync(outputAs, '');

  var args = ['-jar', ascjar, '-AS3', '-md'];
  if (debugInfo) {
    args.push('-d');
  }
  if (strict) {
    args.push('-strict');
  }
  args.push('-import', buildasc);
  files.forEach(function (file) {
    args.push('-in', file);
  })
  args.push(outputAs);

  var proc = spawn('java', args, {stdio: 'inherit'} );
  proc.on('close', function (code) {
    if (!fs.existsSync(outputPath)) {
      code = -1;
    }

    callback(code, outputPath, 'java ' + args.join(' '));
  });
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

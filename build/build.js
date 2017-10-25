const buildBuiltin = require('./build_builtin').build
const buildPlayer = require('./build_player_global').build

function build () {
  let left = 2
  function done () {
    if (--left === 0) {
      console.log('Build completed')
    }
  }
  buildBuiltin(false, done)
  buildPlayer(false, done)
}
build()

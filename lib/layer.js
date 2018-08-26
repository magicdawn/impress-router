const pathToRegexp = require('path-to-regexp')
const debug = require('debug')('impress:layer')

module.exports = class Layer {
  constructor(path, options, fn) {
    // setup regex
    this.regexp = pathToRegexp(path, (this.keys = []), options)

    // fn*(next)
    this.fn = fn
    this.name = fn.name || '<anonymous>'

    // will present after match
    this.path = ''
    this.params = {}

    if (path === '/' && options.end === false) {
      this.regexp.fastSlash = true
    }
  }

  match(path) {
    if (!path) {
      return false
    }

    if (this.regexp.fastSlash) {
      return true
    }

    const m = this.regexp.exec(path)
    if (!m) {
      return false
    }

    // m = [full,group1...groupN]
    this.path = m[0]
    this.params = {}
    let n = 0 // store the anaymous params

    for (let i = 0, len = this.keys.length; i < len; i++) {
      const key = this.keys[i].name || n++
      const val = m[i + 1]
      this.params[key] = decodeParam(val)
    }

    return true
  }
}

function decodeParam(val) {
  /* istanbul ignore next */
  if (typeof val !== 'string') {
    return val
  }

  /* istanbul ignore next */
  try {
    return decodeURIComponent(val)
  } catch (e) {
    const err = new TypeError('Failed to decode param "' + val + '"')
    err.status = 400
    throw err
  }
}

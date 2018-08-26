'use strict'

const app = new (require('koa'))()
const router = new (require('../../'))()
app.use(router)

const _static = require('koa-static')
router.use('/public', _static(__dirname))

app.listen(3000, () => {
  console.log('koa server listening at http://localhost:3000')
})

/**
 * then try 'http://localhost:3000/public/app.js'
 */

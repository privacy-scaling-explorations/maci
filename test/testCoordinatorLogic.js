
const supertest = require('supertest')
const { app } = require('../_build/index')

describe('GET /', function () {
  it('/ should return 404', () => {
    supertest(app)
      .get('/')
      .expect(404)
  })
})

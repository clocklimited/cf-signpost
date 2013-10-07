var createSignpost = require('../signpost')
  , async = require('async')
  , should = require('should')
  , sl = require('regg')()
  , persistence = require('regg')()
  , _register = persistence.register
  , saveMongoDb = require('save-mongodb')
  , MongoClient = require('mongodb').MongoClient
  , moment = require('moment')
  , signpost
  , sectionService
  , articleService
  , dbConnection

describe('signpost', function () {

  function createSections(next) {
    sl.get('persistence').register('section')
    sectionService = require('./mock-section-service')(sl)
    sl.register('sectionService', sectionService)

    async.series(
      [ async.apply(sectionService.create,
          { name: 'Test Section'
          , slug: 'unittest'
          , visible: true
          })
      , async.apply(sectionService.create,
          { name: 'Test Section'
          , slug: 'previewtest'
          , visible: false
          , previewId: 'unit'
          })
      , async.apply(sectionService.create,
          { name: 'Not Yet Live'
          , slug: 'not-yet-live'
          , visible: true
          , liveDate: moment().add('months', 1).startOf('day').toDate()
          , expiryDate: moment().add('months', 2).startOf('day').toDate()
          })
      ], next)
  }

  function createArticles(section, next) {
    sl.get('persistence').register('article')
    articleService = require('./mock-article-service')(sl)
    async.each(
      [ { longTitle: 'Article longTitle'
        , slug: 'article'
        , liveDate: moment().subtract('months', 1).toDate()
        , section: section[0]._id
        , state: 'Published'
        }
      , { longTitle: 'Hidden article'
        , slug: 'hidden-article'
        , previewId: 'prev'
        , state: 'Published'
        , liveDate: moment().add('months', 1).startOf('day').toDate()
        , expiryDate: moment().add('months', 2).startOf('day').toDate()
        , section: section[1]._id
        }
      ], articleService.create, next)
  }

  function dbConnect(next) {
    MongoClient.connect('mongodb://127.0.0.1:27017/' +
      Math.round(Math.random() * 100000000000).toString(36), function (err, db) {

      dbConnection = db

      persistence.register = function (name) {
        return _register(name, saveMongoDb(db.collection(name)))
      }
      next()
    })
  }

  before(function (done) {
    sl.register('persistence', persistence)

    async.waterfall(
      [ dbConnect
      , createSections
      , createArticles
      ], function () {
        signpost = createSignpost(sectionService, articleService)
        done()
      })
  })

  it('should throw if no `sectionService` provided', function () {
    (function () {
      createSignpost()
    }).should.throwError(/sectionService must be provided/)
  })

  it('should throw if no `articleService` provided', function () {
    (function () {
      createSignpost(sectionService)
    }).should.throwError(/articleService must be provided/)
  })

  describe('findSection()', function () {
    it('should callback with a section when matching URL is found', function (done) {
      signpost.findSection('/unittest', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a section when URL has a query string', function (done) {
      signpost.findSection('/unittest?jim=bob&bar=barry', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a section when it is not live but a matching previewId is found', function (done) {
      signpost.findSection('/previewtest?previewId=unit', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it.skip('should callback with a section when it is live but a matching previewId is also found', function (done) {
      signpost.findSection('/unittest?previewId=unit', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a falsey value but no error when not matching URL is found', function (done) {
      signpost.findSection('/no-matching-url', function (err, section) {
        should.not.exist(err)
        section.should.equal(false)
        done()
      })
    })

    it('should callback with a falsey value but no error when a matching URL is found but it is not visible yet',
      function (done) {

      signpost.findSection('/previewtest', function (err, section) {
        should.not.exist(err)
        section.should.equal(false)
        done()
      })
    })

    it('should callback with a section when it is not live (liveDate) but a date is found', function (done) {
      var oneMonthAhead = moment().add('months', 1).format('YYYY-MM-DD')

      signpost.findSection('/not-yet-live?date=' + oneMonthAhead, function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Not Yet Live')
        done()
      })
    })

    it('should callback with a section when it is not live (expiryDate) but a date is found', function (done) {
      var oneMonthAhead = moment().add('months', 2).format('YYYY-MM-DD')

      signpost.findSection('/not-yet-live?date=' + oneMonthAhead, function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Not Yet Live')
        done()
      })
    })
  })

  describe('findArticle()', function () {
    it('should callback with an article and a its section when a matching URL is found', function (done) {
      signpost.findArticle('/unittest/article', function (err, data) {
        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Article longTitle')
        done()
      })
    })

    it('should callback with an article when it is not live but a matching previewId is found', function (done) {
      signpost.findArticle('/unittest/hidden-article?previewId=prev', function (err, data) {

        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Hidden article')
        done()
      })
    })

    it('should callback with an article when it is live but a previewId is also found')

    it('should callback with a falsey value but no error when a matching URL is found but it is not visible yet',
      function (done) {

      signpost.findArticle('/previewtest/hidden-article', function (err, data) {
        should.not.exist(err)
        data.should.equal(false)
        done()
      })
    })

    it('should callback with a falsey value but no error when not matching URL is found', function (done) {
      signpost.findArticle('/unittest/no-such-article', function (err, data) {
        should.not.exist(err)
        data.should.equal(false)
        done()
      })
    })

    it('should callback with an article when it is not live (liveDate) but a date is found', function (done) {
      var oneMonthAhead = moment().add('months', 1).format('YYYY-MM-DD')

      signpost.findArticle('/previewtest/hidden-article?date=' + oneMonthAhead, function (err, data) {
        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Hidden article')
        done()
      })
    })

    it('should callback with an article when it is not live (expiryDate) but a date is found', function (done) {
      var twoMonthAhead = moment().add('months', 2).format('YYYY-MM-DD')

      signpost.findArticle('/previewtest/hidden-article?date=' + twoMonthAhead, function (err, data) {
        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Hidden article')
        done()
      })
    })
  })

  after(function (done) {
    dbConnection.dropDatabase(done)
  })
})

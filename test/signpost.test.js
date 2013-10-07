var createSignpost = require('../signpost')
  , async = require('async')
  , should = require('should')
  , sl = require('regg')()
  , persistence = require('regg')()
  , _register = persistence.register
  , saveMemgo = require('save-memgo')
  , moment = require('moment')
  , sectionService
  , articleService

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
      ], next)
  }

  function createArticles(section, next) {
    sl.get('persistence').register('article')
    articleService = require('./mock-article-service')(sl)
    async.each(
      [ { longTitle: 'Article longTitle'
        , slug: 'article'
        , liveDate: moment().subtract('months', 1).date()
        , section: section[0]._id
        , state: 'Published'
        }
      , { longTitle: 'Hidden article'
        , slug: 'hidden-article'
        , previewId: 'prev'
        , liveDate: moment().add('months', 1).date()
        , section: section[1]._id
        }
      ], articleService.create, next)
  }

  before(function (done) {
    sl.register('persistence', persistence)

    persistence.register = function (name) {
      return _register(name, saveMemgo(name))
    }

    async.waterfall(
      [ createSections
      , createArticles
      ], done)
  })

  after(function (done) {
    sectionService.deleteMany({ name: 'Test Section' }, done)
  })

  describe('findSection()', function () {
    it('should callback with a section when matching URL is found', function (done) {
      createSignpost(sectionService).findSection('/unittest', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a section when URL has a query string', function (done) {
      createSignpost(sectionService).findSection('/unittest?jim=bob&bar=barry', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a section when it is not live but a matching previewId is found', function (done) {
      createSignpost(sectionService).findSection('/previewtest?previewId=unit', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it.skip('should callback with a section when it is live but a matching previewId is also found', function (done) {
      createSignpost(sectionService).findSection('/unittest?previewId=unit', function (err, section) {
        should.not.exist(err)
        section.should.have.property('name', 'Test Section')
        done()
      })
    })

    it('should callback with a falsey value but no error when not matching URL is found', function (done) {
      createSignpost(sectionService).findSection('/no-matching-url', function (err, section) {
        should.not.exist(err)
        section.should.equal(false)
        done()
      })
    })
  })

  describe('findArticle()', function () {
    it('should callback with an article and a its section when a matching URL is found', function (done) {
      createSignpost(sectionService, articleService).findArticle('/unittest/article', function (err, data) {
        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Article longTitle')
        done()
      })
    })

    it('should callback with an article when it is not live but a matching previewId is found', function (done) {
      createSignpost(sectionService, articleService).findArticle(
        '/unittest/hidden-article?previewId=prev', function (err, data) {

        should.not.exist(err)
        data.section.should.have.property('name', 'Test Section')
        data.article.should.have.property('longTitle', 'Hidden article')
        done()
      })
    })

    it('should callback with an article when it is live but a previewId is also found')

    it('should callback with a falsey value but no error when not matching URL is found', function (done) {
      createSignpost(sectionService, articleService).findArticle('/unittest/no-such-article', function (err, data) {
        should.not.exist(err)
        data.should.equal(false)
        done()
      })
    })
  })
})

module.exports = signpost

var urlParse = require('url').parse
  , async = require('async')

function signpost(sectionService, articleService) {
  if (!sectionService) throw new Error('sectionService must be provided')
  if (!articleService) throw new Error('articleService must be provided')

  var self = {}

  function findSection(url, cb) {
    var urlParts = urlParse(url, true)
      , query = { fullUrlPath: urlParts.pathname }
      , options = {}

    if (typeof urlParts.query.previewId !== 'undefined') {
      query['previewId'] = urlParts.query.previewId
    }

    if (typeof urlParts.query.date !== 'undefined') {
      options = { date: urlParts.query.date }
    }

    sectionService.findPublic(query, options, function (error, sections) {
      if (error) return cb(error)
      if (sections.length > 0) {
        cb(null, sections[0])
      } else {
        cb(null, false)
      }
    })
  }

  function findArticle(url, cb) {
    var decodedUrl = decodeURI(url)
      , urlParts = urlParse(url, true)
      , decodedUrlParts = urlParse(decodedUrl, true)
      , lookupFn
      , options = {}

    if (typeof urlParts.query.date !== 'undefined') {
      options = { date: urlParts.query.date }
    }

    if (typeof urlParts.query.previewId !== 'undefined') {
      lookupFn = articleService.find.bind(null, { previewId: urlParts.query.previewId })
    } else {
      lookupFn = articleService.findPublicByUrl.bind(null, urlParts.pathname, options)
    }

    lookupFn(function (error, article) {
      if (error) return cb(error)

      if (typeof article !== 'undefined') {
        returnArticle(article, cb)
      } else {

        articleService.findPublicByUrl(decodedUrlParts.pathname, options, function (error, article) {
          if (error) return cb(error)

          if (typeof article !== 'undefined') {
            returnArticle(article, cb)
          } else {
            cb(null, false)
          }
        })
      }
    })
  }

  function returnArticle(article, cb) {
    async.waterfall([
      function (callback) {
        getSingleArticle(article, function (error, singleArticle) {
          if (error) cb(null, false)

          callback(null, singleArticle)
        })
      }
    , function (singleArticle, callback) {
        getArticleSection(singleArticle.section, function (error, articleSection) {
          if (error) cb('Signpost can‘t get article‘s section')

          callback(null, singleArticle, articleSection)
        })
      }
    ]
    , function (err, singleArticle, section) {
        cb(err, { section: section, article: singleArticle })
      }
    )
  }

  function getSingleArticle(article, callback) {
    // article can come back as either a single article or an array
    if (Array.isArray(article)) {
      if (article.length === 0) {
        return callback(true, false)
      } else {
        return callback(null, article[0])
      }
    } else {
      return callback(null, article)
    }
  }

  function getArticleSection(articleSection, callback) {
    sectionService.read(articleSection, function (error, section) {
      if (error) return callback(error)

      callback(null, section)
    })
  }

  self.findSection = findSection
  self.findArticle = findArticle

  return self
}

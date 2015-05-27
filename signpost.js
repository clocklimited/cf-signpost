module.exports = signpost

var urlParse = require('url').parse

function signpost(sectionService, articleService) {
  if (!sectionService) throw new Error('sectionService must be provided')
  if (!articleService) throw new Error('articleService must be provided')

  var self = {}

  function findSection(url, cb) {
    var decodedUrl

    try {
      decodedUrl = decodeURI(url)
    } catch (e) {
      return cb(e)
    }

    var decodedUrlParts = urlParse(decodedUrl, true)
      , urlParts = urlParse(url, true)
      , query = { $or: [ { fullUrlPath: urlParts.pathname }, { fullUrlPath: decodedUrlParts.pathname } ] }
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
    var decodedUrl

    try {
      decodedUrl = decodeURI(url)
    } catch (e) {
      return cb(e)
    }

    var decodedUrlParts = urlParse(decodedUrl, true)
      , urlParts = urlParse(url, true)
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
    article = getSingleArticle(article)
    if (!article) return cb(null, false)

    sectionService.read(article.section, function (error, section) {
      if (error) return cb(null, false)

      cb(error, { section: section, article: article })
    })
  }

  function getSingleArticle(article) {
    // article can come back as either a single article or an array
    if (Array.isArray(article)) {
      if (article.length === 0) {
        return false
      } else {
        return article[0]
      }
    } else {
      return article
    }
  }


  self.findSection = findSection
  self.findArticle = findArticle

  return self
}

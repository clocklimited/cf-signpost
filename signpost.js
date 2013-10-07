module.exports = signpost

var urlParse = require('url').parse

function signpost(sectionService, articleService) {
  if (!sectionService) throw new Error('sectionService must be provided')
  if (!articleService) throw new Error('articleService must be provided')

  var self = {}

  function findSection(url, cb) {
    var urlParts = urlParse(url, true)
      , query = { fullUrlPath: urlParts.pathname }

    if (typeof urlParts.query.previewId !== 'undefined') {
      query['previewId'] = urlParts.query.previewId
    }

    sectionService.findPublic(query, function (error, sections) {
      if (error) return cb(error)
      if (sections.length > 0) {
        cb(null, sections[0])
      } else {
        cb(null, false)
      }
    })
  }

  function findArticle(url, cb) {
    var urlParts = urlParse(url, true)
      , lookupFn

    if (typeof urlParts.query.previewId !== 'undefined') {
      lookupFn = articleService.find.bind(null, { previewId: urlParts.query.previewId })
    } else {
      lookupFn = articleService.findPublicByUrl.bind(null, urlParts.pathname, {})
    }

    lookupFn(function (error, article) {
      if (error) return cb(error)

      if (typeof article !== 'undefined') {

        var singleArticle
        // article can come back as either a single article or an array
        if (Array.isArray(article)) {
          if (article.length === 0) {
            return cb(null, false)
          } else {
            singleArticle = article[0]
          }
        } else {
          singleArticle = article
        }

        // Find the article's section
        sectionService.read(singleArticle.section, function (error, section) {
          cb(null, { section: section, article: singleArticle })
        })

      } else {
        cb(null, false)
      }
    })
  }

  self.findSection = findSection
  self.findArticle = findArticle

  return self
}
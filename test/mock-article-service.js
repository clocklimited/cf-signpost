var crudService = require('crud-service')
  , _ = require('lodash')
  , isVisible = require('cf-visibility-check')
  , filter = require('./article-filter')

module.exports = function (serviceLocator) {

  var save = serviceLocator.get('persistence').get('article')
    , schema = require('./article-schema')()
    , service = crudService('Article', save, schema, {})

  service.find = function (query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    function sectionsLookup (cb) {
      serviceLocator.get('sectionService').find({}, function (error, sections) {
        if (error) {
          return cb(error)
        }
        cb(null, sections)
      })
    }

    function getBreadcrumb (section, sectionMap) {
      var crumb = []

      if (sectionMap[section]) {
        crumb.push(_.extend(_.pick(sectionMap[section], 'name', 'fullUrlPath')
          , { publicVisible: isVisible(sectionMap[section]) }))

        return getBreadcrumb(sectionMap[section].parent, sectionMap).concat(crumb)
      }
      return crumb
    }

    save.find(query, options, function (error, objects) {
      if (error) return callback(error)
      if (!objects.length) return callback(undefined, objects)

      // Get all the sections for lookup
      sectionsLookup(function (error, sectionMap) {
        if (error) {
          return callback(error)
        }
        callback(undefined, objects.map(function (object) {
          var article = schema.stripUnknownProperties(object)

          // If the article has a section then embellish the object with useful
          // section related info
          if ((sectionMap[article.section]) && (article.section !== null)) {
            // Set the fullUrlPath from the section
            article.__fullUrlPath = sectionMap[article.section].fullUrlPath +
              '/' + article.slug

            // Remove double slashes in url path
            article.__fullUrlPath = article.__fullUrlPath.replace('//', '/')

            // Create the bread crumb
            article.__breadcrumb = getBreadcrumb(article.section, sectionMap)

            // Add the lite section
            article.__liteSection = sectionMap[article.section]
          }

          return article

        }))
      })
    })
  }

  // Convert an array callback response to the first item in the list
  function first (callback) {
    return function (error, items) {
      if (error) {
        return callback(error)
      }
      callback(null, items[0])
    }
  }

  // Find the first public Article with a given URL
  service.findPublicByUrl = function (urlPath, options, callback) {

    // Get just the section part of the URL
    var trimmed = urlPath.replace(/\/+$/, '')
      , lastSlashPos = trimmed.lastIndexOf('/')
      , sectionPath = urlPath.substring(0, lastSlashPos)
      , slug = trimmed.substring(lastSlashPos + 1)

    // First find the sections
    serviceLocator.get('sectionService').find({ fullUrlPath: sectionPath }, function (error, sections) {
      if (error) {
        return callback(error)
      }
      if (sections.length === 0) {
        return callback(null, undefined)
      }
      // then the matching articles
      service.findPublic({ section: sections[0]._id, slug: slug }, options, first(callback))
    })
  }

  // Find the articles that are available to the public
  service.findPublic = function (query, options, callback) {
    var publicQuery = filter.publicQuery(query, options)

    service.find(publicQuery, options, callback)
  }

  return service
}

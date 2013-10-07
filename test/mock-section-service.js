var crudService = require('crud-service')
  , _ = require('lodash')
  , async = require('async')
  , filter = require('./section-filter')

module.exports = function (serviceLocator) {

  var save = serviceLocator.get('persistence').get('section')
    , schema = require('./section-schema')()
    , service = crudService('Section', save, schema, {})
    , originalFind = service.find
    , originalUpdate = service.update
    , originalCreate = service.create
    , originalPartialUpdate = service.partialUpdate

  // Override section create to know about the special 'root' section for the homepage
  service.create = function create(section, createOptions, cb) {
    if (typeof createOptions === 'function') {
      cb = createOptions
    }

    // if root then apply the root only properties
    if (section.root) {
      createOptions.validate = 'root'
      section.slug = ''
      section.fullUrlPath = '/'
      section.visible = true
      section.liveDate = null
      section.expiryDate = null
      section.displayInNav = false
    }
    originalCreate(section, createOptions, cb)
  }

  function updateChildSectionUrl(parentSection, done) {
    service.find({ parent: parentSection._id }, function (error, childSections) {
      if (childSections.length > 0) {
        async.each(childSections, function(childSection, cb) {
          var fullUrlPath = parentSection.fullUrlPath + '/' + childSection.slug
          if (childSection.fullUrlPath === fullUrlPath) {
            return cb()
          }
          service.partialUpdate(
            { fullUrlPath: fullUrlPath
            , _id: childSection._id }
            , {}, function(error) {
            cb(error)
          })

        }, function (error) {
          done(error)
        })
      } else {
        done(null)
      }
    })
  }

  function setFullUrlPath(section, next) {
    if (section.parent) {
      service.read(section.parent, function (error, parentSection) {
        if (error) {
          return next(error)
        }

        section.fullUrlPath = parentSection.fullUrlPath + '/' + section.slug
        next(null, section)
      })
    } else {
      if (section.slug) {
        section.fullUrlPath = '/' + section.slug
      } else {
        section.fullUrlPath = '/'
      }
      next(null, section)
    }
  }

  service.pre('create', setFullUrlPath)
  service.pre('update', setFullUrlPath)

  service.update = function (section, validationOptions, callback) {

    // if root then apply the root only properties
    if (section.root) {
      validationOptions.validate = 'root'
      section.slug = ''
      section.fullUrlPath = '/'
      section.visible = true
      section.liveDate = null
      section.expiryDate = null
      section.displayInNav = false
    }
    return originalUpdate(section, validationOptions, function (error, updatedSection) {
      if (error) {
        return callback(error)
      }
      updateChildSectionUrl(updatedSection, function (error) {
        callback(error, updatedSection)
      })
    })
  }

  service.partialUpdate = function (entity, validationOptions, callback) {

    // If this is a root section then don't allow the slug to be changed
    if (entity.root && entity.slug) {
      return callback(new Error('You can not change the slug of a root section'))
    }

    async.waterfall(
      [ function (done) {
          if (entity.slug) {
            return setFullUrlPath(entity, done)
          }
          done(null, entity)
        }
      , function (entity, done) {
          originalPartialUpdate(entity, validationOptions, done)
        }
      , function (updatedEntity, done) {
        if ((entity.parent) || (entity.slug)) {
          updateChildSectionUrl(updatedEntity, function (error) {
            done(error, updatedEntity)
          })
        } else {
          done(null, updatedEntity)
        }
      }], callback)
  }

  service.find = function (query, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    var x = _.extend({ sort: 'order' }, options)
    return originalFind(query, x, callback)
  }

  service.findPublic = function (query, options, callback) {

    var publicQuery = filter.publicQuery(query, options)

    service.find(publicQuery, options, callback)
  }

  return service
}

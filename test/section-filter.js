var _ = require('lodash')
  , moment = require('moment')

module.exports =
  { publicQuery: function (query, options) {
      var now = options && options.date ? moment(options.date).toDate() : new Date()
        , publicQuery = _.extend({}, query,
          { visible: true
          , $and:
            [ { $or: [ { liveDate: null }, { liveDate: { $lte: now } } ] }
            , { $or: [ { expiryDate: null }, { expiryDate: { $gte: now } } ] }
            ]
          })

      if (query.previewId) {
        publicQuery = query
      }

      return publicQuery
    }
  }

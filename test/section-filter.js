var _ = require('lodash')

module.exports =
  { publicQuery: function (query) {
      var now = new Date()
        , publicQuery = _.extend({}, query,
        { visible: true
        , $and:
          [ { $or: [{ liveDate: null }, { liveDate: { $lte: now } }] }
          , { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } } ] }
          ]
        })

      if (query.previewId) {
        publicQuery = query
      }

      return publicQuery
    }
  }

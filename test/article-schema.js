var schemata = require('schemata')
  , validity = require('validity')
  , dateBeforeExpiryValidator = require('validity-date-before-property')('expiryDate')
  , dateBeforeArchiveValidator = require('validity-date-before-property')('archiveDate', 'archive date')

function requiredIfDisplayDateIsTrue (key, msg, object, callback) {
  var valid = true

  // If the user does not intend to display the date, do not validate
  if (!object.showDisplayDate) {
    return callback(null, undefined)
  }

  if (object[key] == null) {
    valid = false
  }

  return callback(null, valid ? undefined : msg + ' must be set if you intend to display it')
}

module.exports = function () {

  return schemata(
    { _id:
      { type: String }
    , author:
      { type: String
      }
    , state:
      { type: String
      , options: ['Draft', 'Published', 'Archived', 'Trashed']
      , defaultValue: 'Draft'
      , validators:
        { all: []
        }
      }
    , section:
      { type: String
      , validators:
        { draft: []
        , published: [validity.required]
        , archived: []
        }
      }
    , preTitleHtml:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , shortTitle:
      { type: String
      , name: 'Short Head'
      , validators:
        { draft: []
        , published: [validity.required]
        , archived: []
        }
      }
    , longTitle:
      { type: String
      , name: 'Headline'
      , validators:
        { draft: [validity.required]
        , published: [validity.required]
        , archived: []
        }
      }
    , subTitle:
      { type: String
      , name: 'Sell'
      , validators:
        { draft: []
        , published: [validity.required]
        , archived: []
        }
      }
    , slug:
      { type: String
      , validators:
        { draft: []
        , published: [validity.required]
        , archived: []
        }
      }
    , standfirst:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , body:
      { type: Object
      , defaultValue: {}
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , relatedWidgets:
      { type: Object
      , defaultValue: {}
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , pageTitle:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , pageDescription:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , seoKeywords:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , socialTwitter:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , socialFacebook:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , relatedSections:
      { type: Array
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }

    , liveDate:
      { type: Date
      , validators:
        { draft: [dateBeforeExpiryValidator, dateBeforeArchiveValidator]
        , published: [dateBeforeExpiryValidator, dateBeforeArchiveValidator]
        , archived: []
        }
      }
    , expiryDate:
      { type: Date
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , dateCreated:
      { type: Date
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: function () { return new Date() }
      }
    , displayDate:
      { type: Date
      , defaultValue: function () { return new Date() }
      , validators:
        { draft: []
        , published: [requiredIfDisplayDateIsTrue]
        , archived: []
        }
      }
    , archiveDate:
      { type: Date
      , defaultValue: function () {
          // Set the default archive date to 6 months in the future
          var date = new Date()
          date.setMonth(date.getMonth() + 6)
          return date
        }
      , validators:
        { draft: []
        , published: [validity.required]
        , archived: []
        }
      }
    , showDisplayDate:
      { type: Boolean
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: false
      }
    , enableComments:
      { type: Boolean
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: true
      }
    , commentCount:
      { type: Number
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: 0
      }
    , viewCount:
      { type: Number
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: 0
      }
    , enableLike:
      { type: Boolean
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: true
      }
    , likeCount:
      { type: Number
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      , defaultValue: 0
      }
    , type:
      { type: String
      , defaultValue: 'article'
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , subType:
      { type: String
      , defaultValue: ''
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    , secondaryType:
      { type: String
      , validators:
        { draft: []
        , published: []
        , archived: []
        }
      }
    // If this layout is defined use it instead of the sections layout
    , layout:
       { type: Object
      , defaultValue: {}
       }
    // ID used by admin to preview
    , previewId:
      { type: String
      , defaultValue: function () {
          // TODO: Ensure no clash - Serby
          return Math.round(Math.random() * 100000000000).toString(36)
        }
      }
    }
  )
}

var validity = require('validity')
  , schemata = require('schemata')
  , dateBeforePropertyValidator = require('validity-date-before-property')()

module.exports = function () {
  return schemata(
    { _id:
      { type: String
      , tag: ['root']
      }
    , displayInNav:
      { type: Boolean
      , defaultValue: true
      , tag: ['root']
      }
    // Is this section the root section of the site. If so then slug is not editable
    , root:
      { type: Boolean
      , defaultValue: false
      , tag: ['root']
      }
    , name:
      { type: String
      , validators:
        { all: [validity.required]
        }
      , tag: ['root']
      }
    , description:
      { type: String
      , tag: ['root']
      }
    , slug:
      { type: String
      , validators:
        { all: [validity.required]
        }
      }
    , className:
      { type: String
      , tag: ['root']
      }
    , fullUrlPath:
      { type: String
      }
    , parent:
       { type: String
       , tag: ['root']
       }
    , order:
      { type: Number
      , tag: ['root']
      }
    , layout:
      { type: Object
      , tag: ['root']
      , defaultValue: function () {
          var defaultValue = { '0':
            { id: '0'
            , cols: [ { id: '0:0', width: 2, order: 1, widgetArea: {} }
              , { id: '0:1', width: 1, order: 3, widgetArea: {} }] }}
          return defaultValue
        }
      }
    , articleLayout:
      { type: Object
      , tag: ['root']
      , defaultValue: function () {
          var defaultValue = { '0':
            { id: '0'
            , cols:
              [ { id: '0:0'
              , width: 2
              , order: 1
              , widgetArea:
                { widgets:
                  [ { id: 0
                    , type: 'articlePlaceholder' }
                  , { id: 1
                    , type: 'relatedWidgets' } ]
                  }
                }
                , { id: '0:1'
                  , width: 1
                  , order: 3
                  , widgetArea: {}
                  } ]
                }
            }

          return defaultValue
        }
      }
    , visible:
      { type: Boolean
      , tag: ['root']
      , defaultValue: false
      , validators:
        { all: [validity.required]
        }
      }
    , liveDate:
      { type: Date
      , tag: ['root']
      , validators:
        { all: [dateBeforePropertyValidator]
        }
      }
    , expiryDate:
      { type: Date
      , tag: ['root']
      }
    , pageTitle:
      { type: String
      , tag: ['root']
      }
    , pageDescription:
      { type: String
      , tag: ['root']
      }
    , seoKeywords:
      { type: String
      , tag: ['root']
      }
    , advertTag:
      { type: String
      , tag: ['root']
      }
    , showAdverts:
      { type: Boolean
      , defaultValue: true
      , tag: ['root']
      }
    , previewId:
      { type: String
      , tag: ['root']
      , defaultValue: function () {
          // TODO: Ensure no clash - Serby
          return Math.round(Math.random() * 100000000000).toString(36)
        }
      }
    , created:
      { type: Date
      , tag: ['root']
      }
    , teaserLists:
      { type: Object
      , defaultValue: function () {
          return {}
        }
      }
    })
}

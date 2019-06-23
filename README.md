# cf-signpost

[![Greenkeeper badge](https://badges.greenkeeper.io/clocklimited/cf-signpost.svg)](https://greenkeeper.io/)

URL routing for sections and articles

## Installation

      npm install --save cf-signpost

## Usage

```js
var signpost = require('cf-signpost')(sectionService, articleService)
```

Signpost takes a `sectionService` and an `articleService` and returns 2 functions: `findSection` and `findArticle`.

### findSection(url, cb)
When given a URL, finds all sections that match the query and calls the callback with the first one (if there is a section) or false.

If the url contains a valid `previewId` query string parameter, then a search is performed on the sections regardless of their visibility.

### findArticle(url, cb)
When given a URL, finds all public articles that match the query and calls the callback with the first one or false.

If the url contains a valid `previewId` query string parameter, then a search is performed on the articles regardless of their visibility.

### Site example
This can be used in a site as follows:

```js
// Render the page
var signpost = require('cf-signpost')(sectionService, articleService)

// Catch all requests and route them through to the section finder
serviceLocator.router.get('*', function (req, res, next) {

  signpost.findSection(req.url, function (err, section) {
    if (err) return next(err)
    // If a section was found, delegate to the section renderer to render it
    if (section) return sectionRenderer(section)(req, res, next)
    // No section was found, call the next route handle
    next()
  })

})

// Catch all requests and route them through to the article finder
serviceLocator.router.get('*', function (req, res, next) {

  signpost.findArticle(req.url, function (err, data) {
    if (err) return next(err)
    // If an article was found, delegate to the article renderer to render it
    if (data) return articleRenderer(data.section, data.article)(req, res, next)
    // No section was found, call the next route handle
    next()
  })

})
```

## Credits
Built by developers at [Clock](http://clock.co.uk).

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)

# Gatekeeper [![Build Status](https://travis-ci.org/kwantu/gatekeeper.svg?branch=develop)](https://travis-ci.org/kwantu/gatekeeper)
> The Gatekeeper facilitates the creation and updating of all indicator set data

## Getting started
> Install all command line dependancies:  

`npm install -g bower browserify uglifyify mocha-phantomjs jsdoc-to-markdown`

### How to install the npm module:

`npm install git+https://github.com/kwantu/gatekeeper.git#0.1.0`

### How to install the bower module:

`bower install https://github.com/kwantu/gatekeeper.git#0.1.0`

### How to generate the browser based gatekeeper module with browserify: 

`npm run build-js` or `npm run build-js-min` for the minified version.

### How to install the repo for development work:

1. Clone the repo
2. Run `npm install && bower install`

### How to run the unit tests:

1. Server side: `npm test`
2. Client side: `npm test-client`

### How to generate the API documentation:

This is based on the 'jsdoc-to-markdown' module. See https://github.com/jsdoc2md/jsdoc-to-markdown for more information.

`npm run update-docs`

# API Documentation

[View the documentation here ...](https://github.com/kwantu/gatekeeper/blob/develop/docs/API.md)
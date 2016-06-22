# Gatekeeper [![Build Status](https://travis-ci.org/kwantu/gatekeeper.svg?branch=develop)](https://travis-ci.org/kwantu/gatekeeper)
> The Gatekeeper facilitates the creation and updating of all indicator set data

## Getting started
> Install all command line dependancies:  

`npm install -g bower browserify uglifyify mocha-phantomjs jsdoc-to-markdown`

### How to install the npm module:

`npm install git+https://github.com/kwantu/gatekeeper.git#0.1.0`

### How to install the bower module:

`bower install https://github.com/kwantu/gatekeeper.git#0.1.0`

### How to generate the client side gatekeeper module with browserify:

`npm run browserify`

### How to install the repo for development work:

1. First clone the repo
2. Then install node dependancies: `npm install`
3. Install bower dependancies: `bower install`
4. Build the module: `npm run build`

> NOTE: `npm run build` executes the following commands: `npm run browserify && npm run docs && npm test`

### How to run the unit tests:
> Server & client side:  
`npm test`

### How to generate the API documentation:

This is based on the 'jsdoc-to-markdown' module. See https://github.com/jsdoc2md/jsdoc-to-markdown for more information.

`npm run docs`

## API Documentation

[View the documentation here ...](https://github.com/kwantu/gatekeeper/blob/develop/docs/index.md)

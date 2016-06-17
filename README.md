# Gatekeeper [![Build Status](https://travis-ci.org/kwantu/gatekeeper.svg?branch=develop)](https://travis-ci.org/kwantu/gatekeeper)
> The Gatekeeper facilitates the creation and updating of all indicator set data

To install the npm module:

`npm install git+https://github.com/kwantu/gatekeeper.git#0.1.0`

To install the bower module:

`bower install https://github.com/kwantu/gatekeeper.git#0.1.0`

To generate the browser based gatekeeper module with browserify: 

`npm sun build-js`

Minified version:

`npm run build-js-min`

To install the repo for development  work:

1. Clone the repo
2. Run `npm install && bower install`

To run the unit tests:

1. Server side: `npm test`
2. Client side: `npm test-client`

## API Documentation ( How to use the Kwantu Gatekeeper )

> The Gatekeeper is implemented as a javascript class and can be instatiated by:  

`new GK();`  

Below is the list of methods that can be used to interact with the associated database.

### Methods

#### instantiate(documentId, instanceType, setId, profileId, validDate)

This function creates a new document or inserts a sequence in existing document also creates approved and rejected documents.

Example:

` /**  
@param documentId - Any documentId  
@param instanceType - Two possible values (newInstance/newSequence)  
@param setId -setId of the indicator content  
@param profileId - profileId of the indicator content  
@param validDate - validDate of the indicator content  
 
*/  
   
var gatekeeper = new GK();  
gatekeeer.instantiate('detail1001','newSequence','developerDetail',22,'22/04/2016'); `  


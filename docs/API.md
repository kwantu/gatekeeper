<a name="GK"></a>

## GK
Returns GK() object

**Kind**: global class  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

* [GK](#GK)
    * [new GK()](#new_GK_new)
    * [.instantiate(documentId, instanceType, setId, profileId, validDate)](#GK+instantiate) ⇒ <code>Object</code>
    * [.instantiateData(documentId, instanceType, instantiateFrom, indicatorModel, seqNo)](#GK+instantiateData) ⇒ <code>Object</code>
    * [.update(documentId, indicatorModel)](#GK+update) ⇒ <code>Object</code>
    * [.authorise(documentId)](#GK+authorise) ⇒ <code>Object</code>
    * [.reject(documentId)](#GK+reject) ⇒ <code>Object</code>

<a name="new_GK_new"></a>

### new GK()
Represents the gatekeeper module.
This module will hold all functions to access gatekeeper vi GK() object

**Returns**: <code>Object</code> - new GK constructor / class object  
**Example**  
```js
var gatekeeper = new GK();
```
<a name="GK+instantiate"></a>

### gK.instantiate(documentId, instanceType, setId, profileId, validDate) ⇒ <code>Object</code>
Represents the instantiate function.
Creates new document in case of newInstance, also creates approved and rejected documents.
Creates new suence in case of newSequence.

**Kind**: instance method of <code>[GK](#GK)</code>  
**Returns**: <code>Object</code> - Promise Object with respose Object  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

| Param | Type | Description |
| --- | --- | --- |
| documentId | <code>string</code> | document id which needs to be initialised |
| instanceType | <code>string</code> | valued can be (newInstance/newSequence) |
| setId | <code>string</code> | setId |
| profileId | <code>string</code> | profileId |
| validDate | <code>string</code> | validDate |

**Example**  
```js
var gatekeeper = new GK();
gatekeeer.instantiate('abc161','newSequence','developerDetail',22,'22/04/2016');
```
<a name="GK+instantiateData"></a>

### gK.instantiateData(documentId, instanceType, instantiateFrom, indicatorModel, seqNo) ⇒ <code>Object</code>
Represents the instantiateData function.

**Kind**: instance method of <code>[GK](#GK)</code>  
**Returns**: <code>Object</code> - Promise Object with respose Object  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

| Param | Type | Description |
| --- | --- | --- |
| documentId | <code>string</code> | document id which needs to be initialised |
| instanceType | <code>string</code> | valued can be (newInstance/newSequence) |
| instantiateFrom | <code>string</code> | valued can be (fromRequest/fromDefinition/fromAuthorised) |
| indicatorModel | <code>object</code> | viewModel of indicator |
| seqNo | <code>number</code> | Sequence number that needs to be initialised. |

**Example**  
```js
var gatekeeper = new GK();
gatekeeer.instantiateData('abc161','newSequence','fromAuthorised',viewModel,1)
```
<a name="GK+update"></a>

### gK.update(documentId, indicatorModel) ⇒ <code>Object</code>
Represents the update function function.
Updtates the current document pending with input customModel object.
Process all rules, attachments etc.
Updated status to UPDATED or PendingRules if there are any server rules

**Kind**: instance method of <code>[GK](#GK)</code>  
**Returns**: <code>Object</code> - Promise Object with respose Object  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

| Param | Type | Description |
| --- | --- | --- |
| documentId | <code>string</code> | document id which needs to be initialised |
| indicatorModel | <code>object</code> | viewModel of indicator |

**Example**  
```js
var gatekeeper = new GK();
gatekeeer.update('abc161',viewModel)
```
<a name="GK+authorise"></a>

### gK.authorise(documentId) ⇒ <code>Object</code>
Represents the authorise  function.
Updtates the current document pending with status Authorised.
Copied the data to authorised array of authorised document.

**Kind**: instance method of <code>[GK](#GK)</code>  
**Returns**: <code>Object</code> - Promise Object with respose Object  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

| Param | Type | Description |
| --- | --- | --- |
| documentId | <code>string</code> | document id which needs to be initialised |

**Example**  
```js
var gatekeeper = new GK();
gatekeeer.authorise('abc161')
```
<a name="GK+reject"></a>

### gK.reject(documentId) ⇒ <code>Object</code>
Represents the reject  function.
Updtates the current document pending with status Rejetced.
Copied the data to authorised array of rejected document.

**Kind**: instance method of <code>[GK](#GK)</code>  
**Returns**: <code>Object</code> - Promise Object with respose Object  
**Version**: 1.0.0  
**Author:** Hasan Abbas  

| Param | Type | Description |
| --- | --- | --- |
| documentId | <code>string</code> | document id which needs to be initialised |

**Example**  
```js
var gatekeeper = new GK();
gatekeeer.reject('abc161')
```

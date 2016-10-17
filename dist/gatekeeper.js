(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GK = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/** 
 * Represents the gatekeeper module.
 * This module will hold all functions to access gatekeeper vi GK() object
 *
 * @class
 * Returns GK() object 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 *
 * @return {Object} new GK constructor / class object
 *
 */
function GK() {
    //
    var _this = this;
}

GK.prototype.getResponse = function(status, name, message, error, model) {

    var response = {
        status: status,
        name: name,
        message: message,
        error: error,
        model: model
    }
    return response

}

/** 
 * Represents the instantiate function.
 * Creates new document in case of newInstance, also creates approved and rejected documents.
 * Creates new suence in case of newSequence.
 * @method
 * @param {string} documentId - document id which needs to be initialised
 * @param {string} instanceType - valued can be (newInstance/newSequence)
 * @param {string} setId - setId
 * @param {number} profileId - profileId
 * @param {string} validDate - validDate
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.instantiate('abc161','newSequence','developerDetail',22,'22/04/2016');
 *
 * @return {Array} Array containing document ,approved and rejected objects.
 *
 */

GK.prototype.instantiate = function(documentId, instanceType, setId, profileId, validDate) {

    var _this = this;
    return new Promise(function(resolve, reject) {
        try {

            if (instanceType == INSTANCE_TYPE_NEW_INS) {

                dao.get(documentId).done(
                    function(data) {

                        
                        var response = {
                                    status: CONFLICT_CODE,
                                    name: CONFLICT_NAME,
                                    message: 'Document with same id already exists.',
                                    error: true,
                                    model: null
                                };

                        var responseArray = [response];

                        reject(responseArray);

                    }).fail(function(err) {
                       
                       library.saveEntries(setId, profileId, documentId, validDate).then(
                        function(data){
                           

                            resolve(data);

                        }, function(err){
                            
                            reject(err);
                            
                        });



                    });

            } else if (instanceType == INSTANCE_TYPE_NEW_SEQ) {

                dao.get(documentId).done(
                    function(data) {

                        if (data.model.pending.status == ENTRY_STATUS_AUTHORISED || data.model.pending.status == ENTRY_STATUS_REJECTED) {

                            var saveNewSeq = function(newSeq) {
                                //console.log('newSeq==' + newSeq);
                                data.model.pending.seq = newSeq;
                                data.model.pending.data = {};
                                data.model.pending.status = ENTRY_STATUS_INITIALISED;
                                data.model.pending.validDate = validDate;
                                data.model.pending.revision = '';
                                var user = {
                                    "name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,
                                    "userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId,
                                    "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username
                                };
                                data.model.pending.user = user;


                            };

                            var approve_doc_id = documentId + ':approved'
                            dao.get(approve_doc_id).done(function(approvedData) {
                                var seq = JSON.xpath("max(//approved/seq)", ko.toJS(approvedData), {})[0];
                                var new_seq = seq + 1;
                                saveNewSeq(new_seq);

                                var mainRes = {
                                    status: CREATED_CODE,
                                    name: CREATED_NAME,
                                    message: 'Sequence created',
                                    error: false,
                                    model: data
                                };

                                var responseArray = [mainRes];
                                resolve(responseArray);

                            }).fail(function(err) {


                                
                                var mainRes = {
                                    status: err.status,
                                    name: err.name,
                                    message: 'Approved doc not found to create a new sequence',
                                    error: true,
                                    model: null
                                };

                                var responseArray = [mainRes];

                                reject(responseArray);

                            });

                        } else {
                            //console.log('response log in else');
                            var response = {
                                status: SERVER_ERROR_CODE,
                                name: SERVER_ERROR_NAME,
                                message: 'ERROR: Cannot create sequence. Current status should be '+ ENTRY_STATUS_AUTHORISED + ' or ' + ENTRY_STATUS_REJECTED,
                                error: true,
                                model: null
                            };
                            var responseArray = [response];
                            reject(responseArray);
                       }

                    }).fail(function(err) {
                        //create document relating to new seq
                        library.saveEntries(setId, profileId, documentId, validDate).then(
                            function(data) {
                                //console.log('1 data=='+data);
                                resolve(data);
                            }, 
                            function(err) {
                                //console.log('2 err=='+err);
                                
                                 var response = {
                                    status: err.status,
                                    name: err.name,
                                    message: err.message,
                                    error: true,
                                    model: null
                                };
                                var responseArray = [response];
                                reject(responseArray);
                            });
                        });

            } else {
                
                 var response = {
                                    status: SERVER_ERROR_CODE,
                                    name: SERVER_ERROR_NAME,
                                    message: 'Instance parameter not passed',
                                    error: true,
                                    model: null
                                };
                var responseArray = [response];
                reject(responseArray);
            }
        
        } catch (err) {
            //console.log('catch case '+err);
            var response = {
                status: err.status,
                name: err.name,
                message: err.message,
                error: true,
                model: null
            };
            var responseArray = [response];
            reject(responseArray);

        }
    });


};



/** 
 * Represents the instantiateData function.
 *
 * @method
 * @param {string} documentId - document id which needs to be initialised
 * @param {string} instanceType - valued can be (newInstance/newSequence)
 * @param {string} instantiateFrom - valued can be (fromRequest/fromDefinition/fromAuthorised)
 * @param {object} indicatorModel - viewModel of indicator
 * @param {number} seqNo - Sequence number that needs to be initialised.
 
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.instantiateData('abc161','newSequence','fromAuthorised',viewModel,1)
 *
 * @return {Array} Array containing document object.
 *
 */
GK.prototype.instantiateData = function(documentId, instantiateFrom, indicatorModel, seqNo) {

    //from : 1 - input
    //from : 2 - definition
    //from : 3 - authorised
    var _this = this;
    return new Promise(function(resolve, reject) {
        try {

            var getResponse = function(status, name, message, error, model) {

                var response = {
                    status: status,
                    name: name,
                    message: message,
                    error: error,
                    model: model
                }
                return response;
            }

            dao.get(documentId).done(
                function(data) {

                    if (data.model.pending.status == ENTRY_STATUS_INITIALISED) {

                        if (data.model.pending.seq == seqNo) {

                            if (instantiateFrom == FROM_REQUEST) {

                                dao.get(documentId).done(function(data) {

                                    data.model.pending.data[indicatorModel.defaultModel.setId()] = JSON.parse(ko.toJSON(eval('indicatorModel.customModel.' + indicatorModel.defaultModel.setId()), function(key, value) {
                                        if (key === '__ko_mapping__') {
                                            return;
                                        } else if (value == undefined) {
                                            return '';
                                        } else {
                                            return value;
                                        }
                                    }));

                                    data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;
                                    
                                    var response = {
                                        status: UPDATED_CODE,
                                        name: UPDATED_NAME,
                                        message: 'Document initialised.',
                                        error: false,
                                        model: data
                                    };

                                    var responseArray = [response];
                                    resolve(responseArray);

                                }).fail(function(err) {

                                    
                                     var response = {
                                        status: err.status,
                                        name: err.name,
                                        message: 'Cannot find document '+ documentId ,
                                        error: true,
                                        model: null
                                    };

                                    var responseArray = [response];
                                    reject(responseArray);

                                });

                            } else if (instantiateFrom == FROM_DEFINITION) {

                                dao.get(documentId).done(function(data) {

                                    var setId = indicatorModel.defaultModel.setId();
                                    var version = JSON.xpath("/indicators[setId eq '" + setId + "']/version", app.SCOPE.APP_CONFIG, {});
                                    var setModelId = setId + '_' + version;
                                    
                                    //console.log('--------- Log at Gatekeeper --------------');
                                    //console.log('setModelId=='+ setModelId);


                                    dao.get(setModelId).done(function(setModel) {

                                        var definitionModel = eval('setModel.model.pending.data.' + setId);
                                        data.model.pending.data[setId] = definitionModel;
                                        data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;
                                        //console.log('setModel = '+JSON.stringify(setModel));
                                        
                                        //console.log('definitionModel = '+JSON.stringify(definitionModel));
                                        
                                        var response = {
                                            status: UPDATED_CODE,
                                            name: UPDATED_NAME,
                                            message: 'Document initialised.' ,
                                            error: false,
                                            model: data
                                        };

                                        var responseArray = [response];
                                        resolve(responseArray);



                                    }).fail(function(err) {

                                        
                                        var response = {
                                            status: err.status,
                                            name: err.name,
                                            message: 'Cannot find default model '+ setModelId ,
                                            error: true,
                                            model: null
                                        };

                                        var responseArray = [response];
                                        reject(responseArray);

                                    });


                                }).fail(function(err) {

                                    
                                     var response = {
                                            status: err.status,
                                            name: err.name,
                                            message: 'Cannot find document ' + documentId,
                                            error: true,
                                            model: null
                                        };

                                    var responseArray = [response];
                                    reject(responseArray);

                                });

                            } else if (instantiateFrom == FROM_AUTHORISED) {

                                dao.get(documentId).done(function(data) {

                                    var setId = indicatorModel.defaultModel.setId();
                                    var version = JSON.xpath("/indicators[setId eq '" + setId + "']/version", app.SCOPE.APP_CONFIG, {});
                                    var approvedModelId = documentId + ':approved';
                                    dao.get(approvedModelId).done(function(approvedModel) {
                                        var max_seq = JSON.xpath('max(/model/approved/seq)', approvedModel, {})[0];
                                        var lastApprovedModel = JSON.xpath('/model/approved[./seq = ' + max_seq + ']', approvedModel, {})[0];

                                        var newModel = eval('lastApprovedModel.data.' + setId);
                                        data.model.pending.data[setId] = newModel;
                                        data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;

                                        
                                        var response = {
                                            status:UPDATED_CODE,
                                            name: UPDATED_NAME,
                                            message: 'Document initialised.',
                                            error: false,
                                            model: data
                                        };

                                        var responseArray = [response];
                                        resolve(responseArray);

                                    }).fail(function(err) {

                                        
                                         var response = {
                                            status: err.status,
                                            name: err.name,
                                            message: 'Cannot find approved model ' + approvedModelId,
                                            error: true,
                                            model: null
                                        };

                                        var responseArray = [response];
                                        reject(responseArray);

                                    });


                                }).fail(function(err) {

                                      var response = {
                                            status: err.status,
                                            name: err.name,
                                            message:  'Cannot find document ' + documentId,
                                            error: true,
                                            model: null
                                        };


                                    var responseArray = [response];
                                    reject(responseArray);

                                });


                            }

                        } else {

                            
                            var response = {
                                status:SERVER_ERROR_CODE,
                                name: SERVER_ERROR_NAME,
                                message:  'Input sequence should be equal to pending sequence.',
                                error: true,
                                model: null
                            };

                            var responseArray = [response];
                            reject(responseArray);



                        }

                    } else {

                       

                        var response = {
                                status:SERVER_ERROR_CODE,
                                name: SERVER_ERROR_NAME,
                                message:  'Status is not in ' + ENTRY_STATUS_INITIALISED + ' state.',
                                error: true,
                                model: null
                            };


                        var responseArray = [response];
                        reject(responseArray);




                    }

                }).fail(function(err) {

                 var response = {
                                status:err.status,
                                name: err.name,
                                message:  err.message,
                                error: true,
                                model: null
                            };

                var responseArray = [response];
                reject(responseArray);

            });

        } catch (err) {

            reject(err);

        }
    });

};

/** 
 * Represents the update function function.
 * Updtates the current document pending with input customModel object.
 * Process all rules, attachments etc.
 * Updated status to UPDATED or PendingRules if there are any server rules
 * @method
 * @param {string} documentId - document id which needs to be initialised
 * @param {object} indicatorModel - viewModel of indicator

 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.update('abc161',viewModel)
 *
  * @return {Array} Array containing document object.
 *
 */

GK.prototype.update = function(documentId, indicatorModel, processId, subProcessId, subProcessUUID) {

    var self = this;
    return new Promise(function(resolve, reject) {
        try {

            
            dao.get(documentId).done(function(doc) {

                if (indicatorModel.modelErrors().length > 0) {

                    var response = {
                        status: PRECONDITION_FAILED_CODE,
                        name: PRECONDITION_FAILED_NAME,
                        message: 'There are ' + indicatorModel.modelErrors().length + ' errors on form. Please resolve first.',
                        error: true,
                        model: null
                    };
                    var responseArray = [response];
                    reject(responseArray);

                } else {

                    if (doc.model.pending.status == ENTRY_STATUS_DATA_INITIALISED || doc.model.pending.status == ENTRY_STATUS_UPDATED) {

                        var model = JSON.parse(ko.toJSON(eval('indicatorModel.customModel.' + indicatorModel.defaultModel.setId()), function(key, value) {
                            if (key === '__ko_mapping__') {
                                return;
                            } else if (value == undefined) {
                                return '';
                            } else {
                                return value;
                            }
                        }));

                        var allFiles = JSON.xpath("//*[fileData ne '' and uuid ne '']",model,{});
                        for(var ol=0;ol<allFiles.length;ol++){
                            allFiles[ol].fileData = "";
                        }

                        var version = '';

                        if (indicatorModel.customModel.setId() == PROFILE_SET_ID) {
                            version = 'V1.0';
                        } else {
                            version = JSON.xpath("/indicators[setId eq '" + indicatorModel.customModel.setId() + "']/version", app.SCOPE.APP_CONFIG, {});
                        }

                        // Process all attachments
                        /*var files = JSON.xpath("//*[fileData and isChanged eq 'true']",model,{});
                        
                        var attachementsToProcess = [];
                            for(var ol=0;ol<files.length;ol++){
                                var filesObj=files[ol];   
                                if(filesObj.mime == 'image/jpeg' || filesObj.mime == 'image/png')
                                {
                                    
                                    attachementsToProcess.push({ "data": filesObj.fileData.substring(filesObj.fileData.indexOf('base64')+7), "id": filesObj.uuid , "mime": filesObj.mime });
                                }   
                                else{
                                    attachementsToProcess.push({ "data": filesObj.fileData, "id": filesObj.uuid , "mime": filesObj.mime }); 
                                }                                  
                                
                                filesObj.fileData = "";
                                filesObj.isChanged = 'false';
                        }

                        var allFiles = JSON.xpath("//*[fileData ne '' and uuid ne '']",model,{});
                            for(var ol=0;ol<allFiles.length;ol++){
                                allFiles[ol].fileData = "";
                            }   

                        var saveAttachments = function(data, loop) {
                                    
                            dao.saveAttachment(data.id, data.rev, attachementsToProcess[loop].data, 
                                attachementsToProcess[loop].mime, attachementsToProcess[loop].id)
                            .done(function(e) {
                                
                                if (attachementsToProcess.length > (loop + 1)) {
                                    saveAttachments(e, loop + 1);
                                }
                            }).fail(function (e) {
                                //console.log("can not saved attachemnt " + e);
                            });
                        };*/

                        dao.get(indicatorModel.customModel.setId() + '_' + version + "_config").done(function(configDoc) {

                            doc.model.pending.data[indicatorModel.customModel.setId()] = model;

                            //doc.model.pending.status = ENTRY_STATUS_PENDING;

                            if (configDoc.moderation != undefined && configDoc.moderation.required == true) {
                                doc.control.draft = true;
                            }

                            // Update the updated date field
                            doc.updated = moment().format();
                            // Update the contributors list
                            doc.contributors.push({
                                "name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,
                                "userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId,
                                "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username
                            });

                            doc.model.pending.user = {
                                "name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,
                                "userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId,
                                "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username
                            };

                            // Save the document in the database i.e. local PouchDB or Couchbase Lite
                            doc.source = "remote";
                            // Fixed Rule for title fof document : TODO

                            var docTitle = '';
                                 if (typeof configDoc.rules != 'undefined' && typeof configDoc.rules.title != 'undefined') {
                                  var len = configDoc.rules.title.length;
                                  for (var i = 0; i < len; i++) {
                                   var part = configDoc.rules.title[i];
                                   if(part.length > 0) {

                                    if(part.indexOf("'") == 0)
                                    {
                                     docTitle = docTitle + part.substring(1, part.length - 1);
                                    }
                                    else
                                    {
                                     docTitle = docTitle + eval("model." + part);
                                    }
                                   }
                                   if (i < len - 1) {
                                    docTitle = docTitle + " ";
                                   }
                                  }
                                 }
                            if(docTitle == '')
                            {
                                docTitle = 'Entry '+indicatorModel.customModel.setId();
                            }
                            doc.title = docTitle;

                            if(false){//if (configDoc.rules != undefined && configDoc.rules.length > 0) {

                                doc.model.pending.status = ENTRY_STATUS_PENDING_RULES;
                                

                                //Start rule processing here -------------------------
                                var def_processRules = new $.Deferred();
                                processAllRules(0, "update", doc, indicatorModel, configDoc, {
                                    "ruleStatus": ""
                                }, def_processRules).done(function(inModel) {

                                    if (inModel.ruleStatus == 'RULE_COMPLETE') {

                                        doc.model.pending.processingStatus.seq = '';
                                        doc.model.pending.processingStatus.ruleStatus = '';
                                        doc.model.pending.status = ENTRY_STATUS_UPDATED;

                                        //TODO: Fix ENTRY_STATUS_READY_TO_SUBMIT in document. 
                                        // if (app.processId != undefined) {
                                        //     var process = JSON.xpath("/processes[subProcessId eq '" + app.processId + "']", doc, {});

                                        //     if (process.length > 0) {
                                        //         process[0].status = ENTRY_STATUS_READY_TO_SUBMIT; // check here the index
                                        //     }
                                        // }
                                        



                                        indicatorModel.defaultModel.atomId(documentId);
                                        
                                        var response = {
                                            status: UPDATED_CODE,
                                            name: UPDATED_NAME,
                                            message: 'Document updated',
                                            error: false,
                                            model: doc
                                        };

                                        var responseArray = [response];
                                        resolve(responseArray);

                                    } else if (inModel.ruleStatus == 'RULE_SERVER') {

                                        //console.log('dependent onserver rule');

                                        
                                        var response = {
                                            status: UPDATED_CODE,
                                            name: UPDATED_NAME,
                                            message: 'dependent onserver rule',
                                            error: false,
                                            model: doc
                                        };

                                        var responseArray = [response];
                                        resolve(responseArray);


                                    } else if (inModel.ruleStatus == 'RULE_ERROR') {

                                        //console.log('rule error from somewhere');

                                    }

                                }).fail(function(error) {
                                    reject('processAllRules fail promise case failed');
                                });

                            } else {

                                doc.model.pending.status = ENTRY_STATUS_UPDATED;
                                indicatorModel.defaultModel.atomId(documentId);


                                //TODO: Fix ENTRY_STATUS_READY_TO_SUBMIT in document. 
                                // var process = JSON.xpath("/workflows[id eq '" + processId + "' and subProcessId eq '"+ subProcessId+"'']", doc, {});
                                // var process = JSON.xpath("/workflows/processes[id eq '"+ processId+"' and subProcessId eq '"+ subProcessId+"' and subProcessUUID eq '"+ subProcessUUID+"']", doc, {});
                                // if (process.length > 0) {
                                //     process[0].status = ENTRY_STATUS_READY_TO_SUBMIT; // check here the index
                                // }

                               if(configDoc.rules != undefined && configDoc.rules.validateOnline != undefined && configDoc.rules.validateOnline == true)
                               {
                                    service.validateOnline(indicatorModel.customModel.setId(), doc, documentId).done(

                                        function(code){
                                            var response = {
                                                status: UPDATED_CODE,
                                                name: UPDATED_NAME,
                                                message: 'Document updated',
                                                error: false,
                                                model: doc
                                            };
    
                                            var responseArray = [response];
                                            resolve(responseArray);

                                        }


                                    ).fail(function(s){
                                            
                                        var response = {
                                                status: SERVER_ERROR_CODE,
                                                name: SERVER_ERROR_NAME,
                                                message: 'ERROR: Online validation failed. Reason:'+JSON.stringify(s),
                                                error: true,
                                                model: null
                                            };
    
                                        var responseArray = [response];
                                        reject(responseArray);

                                    });

                               }
                               else
                               {    
                                    var response = {
                                        status: UPDATED_CODE,
                                        name: UPDATED_NAME,
                                        message: 'Document updated',
                                        error: false,
                                        model: doc
                                    };
                                    var responseArray = [response];
                                    resolve(responseArray);
                               }


                                


                            }

                        }).fail(function(err) {

                            
                            var response = {
                                status: err.status,
                                name: err.name,
                                message: 'config file not found.',
                                error: true,
                                model: null
                            };
                            var responseArray = [response];
                            reject(responseArray);

                        });




                    } else {    

                        var response = {
                            status: SERVER_ERROR_CODE,
                            name: SERVER_ERROR_NAME,
                            message: 'Status is not in ' + ENTRY_STATUS_DATA_INITIALISED + ' or ' + ENTRY_STATUS_UPDATED + ' state.',
                            error: true,
                            model: null
                        };
                        var responseArray = [response];
                        reject(responseArray);



                    }
                }

            }).fail(function(err) {

                
                var response = {
                    status: err.status,
                    name: err.name,
                    message: err.message,
                    error: true,
                    model: null
                };

                var responseArray = [response];
                reject(responseArray);


            });

        } catch (err) {
            reject(err);
        }
    });



};

/** 
 * Represents the authorise  function.
 * Updtates the current document pending with status Authorised.
 * Copied the data to authorised array of authorised document.
 * @method
 * @param {string} documentId - document id which needs to be initialised
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.authorise('abc161')
 *
  * @return {Array} Array containing document and authorise object.
 *
 */

GK.prototype.authorise = function(documentId) {

    var _this = this;
    return new Promise(function(resolve, reject) {
        try {

            //console.log('documentId=='+documentId);
            if (documentId != null && documentId != undefined && documentId != '') {
                dao.get(documentId).done(function(data) {
                    //console.log('dao.get(documentId) returned data ');
                    //console.log(data);
                     //console.log('data.model.pending.status == '+ data.model.pending.status);
                    if (data.model.pending.status == ENTRY_STATUS_UPDATED) {
                        //console.log('Inside If ');
                        var setId = data.category.term;
                        var path = data.model.pending;
                        var item = eval(path);
                        //console.log('setId == '+setId);
                        //console.log('path == '+path);
                        //console.log('item == ');
                        //console.log(item);
                        
                        data.model.pending.status = ENTRY_STATUS_AUTHORISED;
                        var approve_doc_id = documentId + ':approved';
                        dao.get(approve_doc_id).done(function(approveData) {
                             //console.log('dao.get(approve_doc_id) approveData ==');
                             //console.log(approveData);

                            approveData.model.approved.push(item);
                            var mainRes = _this.getResponse(UPDATED_CODE, UPDATED_NAME, 'Document Model approved', false, data);
                            var approveRes = _this.getResponse(UPDATED_CODE, UPDATED_NAME, 'Approved model incremented', false, approveData);
                            var responseArray = [mainRes, approveRes];
                            //console.log('mainRes==');
                            //console.log(mainRes);
                            //console.log('approveRes==');
                            //console.log(approveRes);
                            //console.log('responseArray==');
                            //console.log(responseArray);


                            resolve(responseArray);
                        }).fail(function(err) {
                            console.log(err);
                        });
                    } else {
                        var response = _this.getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME, 'Status not in updated state', true, null);
                        var responseArray = [response];

                        //console.log('Inside Else==');
                        //console.log(responseArray);

                        reject(responseArray);
                   }
                }).fail(function(err) {
                    var response = _this.getResponse(err.status, err.name, err.message, true, null);
                    var responseArray = [response];
                    
                    //console.log('Inside Fail 1 ==');
                    //console.log(responseArray);

                    reject(responseArray);
                });
            } else {
                var response = _this.getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME, 'Document ID is blank', true, null);
                var responseArray = [response];
                 //console.log('Inside Fail 2 ==');
                    //console.log(responseArray);


                reject(responseArray);
            }
        } catch (err) {
              //console.log('Inside Fail 3 ==');
                console.log(err);

            reject(err);
        }
    });
};

/** 
 * Represents the reject  function.
 * Updtates the current document pending with status Rejetced.
 * Copied the data to authorised array of rejected document.
 * @method
 * @param {string} documentId - document id which needs to be initialised
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.reject('abc161')
 *
 * @return {Array} Array containing document and rejected object.
 *
 */

GK.prototype.reject = function(documentId) {

    var _this = this;

    return new Promise(function(resolve, reject) {
        try {
            
            if (documentId != null && documentId != undefined && documentId != '') {

                dao.get(documentId).done(function(data) {

                    if (data.model.pending.status == ENTRY_STATUS_UPDATED) {
                        var setId = data.category.term;
                        var item = eval('data.model.pending.data' + setId);
                        data.model.pending.status = ENTRY_STATUS_REJECTED;
                        var rejected_doc_id = documentId + ':rejected';
                        dao.get(rejected_doc_id).done(function(rejectedData) {
                            rejectedData.model.rejected.push(item);
                            var mainRes = getResponse(UPDATED_CODE, UPDATED_NAME, 'Document Model approved', false, data);
                            var rejRes = getResponse(UPDATED_CODE, UPDATED_NAME, 'Rejetced model incremented', false, rejectedData);
                            var responseArray = [mainRes, rejRes];
                            resolve(responseArray);

                        }).fail(function(err) {

                            console.log(err);
                        });

                    } else {

                        var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME, 'Status not in updated state', true, null);
                        var responseArray = [response];
                        reject(responseArray);
                    }
                }).fail(function(err) {

                    var response = getResponse(err.status, err.name, err.message, true, null);
                    var responseArray = [response];
                    reject(responseArray);

                });

            } else {

                var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME, 'Document ID is blank', true, null)
                var responseArray = [response];
                reject(responseArray);

            }

        } catch (err) {
            reject(err);
        }
    });




};

GK.prototype.processInitialiseRule = function(documentId, ruleObj, indicatorModel) {

};

GK.prototype.processUniqueRule = function(documentId, ruleObj, indicatorModel) {

};

GK.prototype.processAllRules =
    function(index, scope, object, indicatorModel, configDoc, ruleResponse, def_processRules) {

        var ruleObj = configDoc.rules[index];
        var executeAt = ruleObj.executeAt;
        var event = ruleObj.event;
        var id = ruleObj.id;
        var seq = ruleObj.seq;
        var type = ruleObj.executeRule.ruleType;

        if(scope == event){
            if (executeAt == 'local') {

                switch (type) {
                    case 'update':
                        var source = ruleObj.executeRule.params.source;
                        var str = '';
                        for (var ol = 0; ol < ruleObj.executeRule.params.target.length; ol++) {

                            var targetItem = ruleObj.executeRule.params.target[ol];
                            var targetType = targetItem.type;
                            var targetName = targetItem.name;
                            if (targetType == 'variable') {

                                str = str + eval("indicatorModel.customModel." + indicatorModel.defaultModel.setId() + '.' + targetName + '()') + ' ';

                            } else {

                                str = str + targetName + ' ';
                            }

                        }
                        //-------------------
                        if (source.substring(0, 4) == 'doc:') {
                            eval('object.' + source.substring(source.length, 4) + '= str;');
                        } else {
                            eval('object.model.pending.data.' + indicatorModel.defaultModel.setId() + '.' + source + '= str;');
                        }
                        ruleResponse.ruleStatus = 'RULE_COMPLETE';
                        if (index == configDoc.rules.length - 1) {
                            def_processRules.resolve(ruleResponse);
                        } else {
                            processAllRules(index + 1,scope, object, indicatorModel, configDoc, ruleResponse, def_processRules);
                        }
                        break;
                    case 'initialise':
                        break;
                    case 'unique':
                        break;
                }

            } else {
                //TODO: implement server side post actions   

                object.model.pending.processingStatus.seq = seq;
                object.model.pending.processingStatus.ruleStatus = PROCESSING_STATUS_SERVER_RULES;
                ruleResponse.ruleStatus = 'RULE_SERVER';
                def_processRules.resolve(ruleResponse);

            }
        } else {
            processAllRules(index + 1,scope, object, indicatorModel, configDoc, ruleResponse, def_processRules);
        }


        return def_processRules;
    };




GK.prototype.unlock = function(val) {
    var self = this;
    // Use the native Promise constructor
    return new Promise(function(resolve, reject) {



    });
};

GK.prototype.persist = function(modelArray) {
    var self = this;

    return new Promise(function(resolve, reject) {
        try {
            var itemsToSave=modelArray.length;
            var savedObjects=[];
            for (var i = 0; i < modelArray.length; i++) {
                dao.save(modelArray[i].model).done(function(data) {
                    //console.log(data);
                    savedObjects.push(data);
                    itemsToSave--;
                    if(itemsToSave == 0){
                        resolve(savedObjects);
                    }
                    
                }).fail(function(err) {
                    //console.log(err);
                    savedObjects.push(err);
                    itemsToSave--;
                     if(itemsToSave == 0){
                        reject(savedObjects);
                    }
                    
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};


module.exports = GK;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL1VzZXJzL0hhc2FuL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBcclxuICogUmVwcmVzZW50cyB0aGUgZ2F0ZWtlZXBlciBtb2R1bGUuXHJcbiAqIFRoaXMgbW9kdWxlIHdpbGwgaG9sZCBhbGwgZnVuY3Rpb25zIHRvIGFjY2VzcyBnYXRla2VlcGVyIHZpIEdLKCkgb2JqZWN0XHJcbiAqXHJcbiAqIEBjbGFzc1xyXG4gKiBSZXR1cm5zIEdLKCkgb2JqZWN0IFxyXG4gKiBAYXV0aG9yIEhhc2FuIEFiYmFzXHJcbiAqIEB2ZXJzaW9uIDEuMC4wXHJcbiAqXHJcbiAqIEBleGFtcGxlIFxyXG4gKiB2YXIgZ2F0ZWtlZXBlciA9IG5ldyBHSygpO1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IG5ldyBHSyBjb25zdHJ1Y3RvciAvIGNsYXNzIG9iamVjdFxyXG4gKlxyXG4gKi9cclxuZnVuY3Rpb24gR0soKSB7XHJcbiAgICAvL1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxufVxyXG5cclxuR0sucHJvdG90eXBlLmdldFJlc3BvbnNlID0gZnVuY3Rpb24oc3RhdHVzLCBuYW1lLCBtZXNzYWdlLCBlcnJvciwgbW9kZWwpIHtcclxuXHJcbiAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXHJcbiAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICBtb2RlbDogbW9kZWxcclxuICAgIH1cclxuICAgIHJldHVybiByZXNwb25zZVxyXG5cclxufVxyXG5cclxuLyoqIFxyXG4gKiBSZXByZXNlbnRzIHRoZSBpbnN0YW50aWF0ZSBmdW5jdGlvbi5cclxuICogQ3JlYXRlcyBuZXcgZG9jdW1lbnQgaW4gY2FzZSBvZiBuZXdJbnN0YW5jZSwgYWxzbyBjcmVhdGVzIGFwcHJvdmVkIGFuZCByZWplY3RlZCBkb2N1bWVudHMuXHJcbiAqIENyZWF0ZXMgbmV3IHN1ZW5jZSBpbiBjYXNlIG9mIG5ld1NlcXVlbmNlLlxyXG4gKiBAbWV0aG9kXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkb2N1bWVudElkIC0gZG9jdW1lbnQgaWQgd2hpY2ggbmVlZHMgdG8gYmUgaW5pdGlhbGlzZWRcclxuICogQHBhcmFtIHtzdHJpbmd9IGluc3RhbmNlVHlwZSAtIHZhbHVlZCBjYW4gYmUgKG5ld0luc3RhbmNlL25ld1NlcXVlbmNlKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2V0SWQgLSBzZXRJZFxyXG4gKiBAcGFyYW0ge251bWJlcn0gcHJvZmlsZUlkIC0gcHJvZmlsZUlkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxpZERhdGUgLSB2YWxpZERhdGVcclxuIFxyXG4gKiBAYXV0aG9yIEhhc2FuIEFiYmFzXHJcbiAqIEB2ZXJzaW9uIDEuMC4wXHJcbiAqXHJcbiAqIEBleGFtcGxlIFxyXG4gKiB2YXIgZ2F0ZWtlZXBlciA9IG5ldyBHSygpO1xyXG4gKiBnYXRla2VlZXIuaW5zdGFudGlhdGUoJ2FiYzE2MScsJ25ld1NlcXVlbmNlJywnZGV2ZWxvcGVyRGV0YWlsJywyMiwnMjIvMDQvMjAxNicpO1xyXG4gKlxyXG4gKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgY29udGFpbmluZyBkb2N1bWVudCAsYXBwcm92ZWQgYW5kIHJlamVjdGVkIG9iamVjdHMuXHJcbiAqXHJcbiAqL1xyXG5cclxuR0sucHJvdG90eXBlLmluc3RhbnRpYXRlID0gZnVuY3Rpb24oZG9jdW1lbnRJZCwgaW5zdGFuY2VUeXBlLCBzZXRJZCwgcHJvZmlsZUlkLCB2YWxpZERhdGUpIHtcclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5zdGFuY2VUeXBlID09IElOU1RBTkNFX1RZUEVfTkVXX0lOUykge1xyXG5cclxuICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IENPTkZMSUNUX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IENPTkZMSUNUX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdEb2N1bWVudCB3aXRoIHNhbWUgaWQgYWxyZWFkeSBleGlzdHMuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICBsaWJyYXJ5LnNhdmVFbnRyaWVzKHNldElkLCBwcm9maWxlSWQsIGRvY3VtZW50SWQsIHZhbGlkRGF0ZSkudGhlbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5zdGFuY2VUeXBlID09IElOU1RBTkNFX1RZUEVfTkVXX1NFUSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9PSBFTlRSWV9TVEFUVVNfQVVUSE9SSVNFRCB8fCBkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19SRUpFQ1RFRCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYXZlTmV3U2VxID0gZnVuY3Rpb24obmV3U2VxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbmV3U2VxPT0nICsgbmV3U2VxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuc2VxID0gbmV3U2VxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5kYXRhID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19JTklUSUFMSVNFRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcudmFsaWREYXRlID0gdmFsaWREYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5yZXZpc2lvbiA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1c2VyID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5maXJzdE5hbWUgKyBcIiBcIiArIExPQ0FMX1NFVFRJTkdTLlNFU1NJT04ubGFzdE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcklkXCI6IExPQ0FMX1NFVFRJTkdTLlNVQlNDUklQVElPTlMudXNlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJuYW1lXCI6IExPQ0FMX1NFVFRJTkdTLlNVQlNDUklQVElPTlMudXNlcm5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy51c2VyID0gdXNlcjtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwcm92ZV9kb2NfaWQgPSBkb2N1bWVudElkICsgJzphcHByb3ZlZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhby5nZXQoYXBwcm92ZV9kb2NfaWQpLmRvbmUoZnVuY3Rpb24oYXBwcm92ZWREYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlcSA9IEpTT04ueHBhdGgoXCJtYXgoLy9hcHByb3ZlZC9zZXEpXCIsIGtvLnRvSlMoYXBwcm92ZWREYXRhKSwge30pWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdfc2VxID0gc2VxICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlTmV3U2VxKG5ld19zZXEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpblJlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBDUkVBVEVEX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IENSRUFURURfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1NlcXVlbmNlIGNyZWF0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbbWFpblJlc107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5SZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZXJyLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXJyLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBcHByb3ZlZCBkb2Mgbm90IGZvdW5kIHRvIGNyZWF0ZSBhIG5ldyBzZXF1ZW5jZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW21haW5SZXNdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VBcnJheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVzcG9uc2UgbG9nIGluIGVsc2UnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IFNFUlZFUl9FUlJPUl9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFNFUlZFUl9FUlJPUl9OQU1FLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdFUlJPUjogQ2Fubm90IGNyZWF0ZSBzZXF1ZW5jZS4gQ3VycmVudCBzdGF0dXMgc2hvdWxkIGJlICcrIEVOVFJZX1NUQVRVU19BVVRIT1JJU0VEICsgJyBvciAnICsgRU5UUllfU1RBVFVTX1JFSkVDVEVELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgZG9jdW1lbnQgcmVsYXRpbmcgdG8gbmV3IHNlcVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaWJyYXJ5LnNhdmVFbnRyaWVzKHNldElkLCBwcm9maWxlSWQsIGRvY3VtZW50SWQsIHZhbGlkRGF0ZSkudGhlbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcxIGRhdGE9PScrZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnMiBlcnI9PScrZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGVyci5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGVyci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBTRVJWRVJfRVJST1JfQ09ERSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU0VSVkVSX0VSUk9SX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnN0YW5jZSBwYXJhbWV0ZXIgbm90IHBhc3NlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VBcnJheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnY2F0Y2ggY2FzZSAnK2Vycik7XHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogZXJyLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGVyci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG59O1xyXG5cclxuXHJcblxyXG4vKiogXHJcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RhbnRpYXRlRGF0YSBmdW5jdGlvbi5cclxuICpcclxuICogQG1ldGhvZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9jdW1lbnRJZCAtIGRvY3VtZW50IGlkIHdoaWNoIG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnN0YW5jZVR5cGUgLSB2YWx1ZWQgY2FuIGJlIChuZXdJbnN0YW5jZS9uZXdTZXF1ZW5jZSlcclxuICogQHBhcmFtIHtzdHJpbmd9IGluc3RhbnRpYXRlRnJvbSAtIHZhbHVlZCBjYW4gYmUgKGZyb21SZXF1ZXN0L2Zyb21EZWZpbml0aW9uL2Zyb21BdXRob3Jpc2VkKVxyXG4gKiBAcGFyYW0ge29iamVjdH0gaW5kaWNhdG9yTW9kZWwgLSB2aWV3TW9kZWwgb2YgaW5kaWNhdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzZXFObyAtIFNlcXVlbmNlIG51bWJlciB0aGF0IG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkLlxyXG4gXHJcbiBcclxuICogQGF1dGhvciBIYXNhbiBBYmJhc1xyXG4gKiBAdmVyc2lvbiAxLjAuMFxyXG4gKlxyXG4gKiBAZXhhbXBsZSBcclxuICogdmFyIGdhdGVrZWVwZXIgPSBuZXcgR0soKTtcclxuICogZ2F0ZWtlZWVyLmluc3RhbnRpYXRlRGF0YSgnYWJjMTYxJywnbmV3U2VxdWVuY2UnLCdmcm9tQXV0aG9yaXNlZCcsdmlld01vZGVsLDEpXHJcbiAqXHJcbiAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBjb250YWluaW5nIGRvY3VtZW50IG9iamVjdC5cclxuICpcclxuICovXHJcbkdLLnByb3RvdHlwZS5pbnN0YW50aWF0ZURhdGEgPSBmdW5jdGlvbihkb2N1bWVudElkLCBpbnN0YW50aWF0ZUZyb20sIGluZGljYXRvck1vZGVsLCBzZXFObykge1xyXG5cclxuICAgIC8vZnJvbSA6IDEgLSBpbnB1dFxyXG4gICAgLy9mcm9tIDogMiAtIGRlZmluaXRpb25cclxuICAgIC8vZnJvbSA6IDMgLSBhdXRob3Jpc2VkXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZ2V0UmVzcG9uc2UgPSBmdW5jdGlvbihzdGF0dXMsIG5hbWUsIG1lc3NhZ2UsIGVycm9yLCBtb2RlbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsOiBtb2RlbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihkYXRhKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19JTklUSUFMSVNFRCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEubW9kZWwucGVuZGluZy5zZXEgPT0gc2VxTm8pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5zdGFudGlhdGVGcm9tID09IEZST01fUkVRVUVTVCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLmRhdGFbaW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLnNldElkKCldID0gSlNPTi5wYXJzZShrby50b0pTT04oZXZhbCgnaW5kaWNhdG9yTW9kZWwuY3VzdG9tTW9kZWwuJyArIGluZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpKSwgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ19fa29fbWFwcGluZ19fJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfREFUQV9JTklUSUFMSVNFRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogVVBEQVRFRF9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogVVBEQVRFRF9OQU1FLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0RvY3VtZW50IGluaXRpYWxpc2VkLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGVyci5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBlcnIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgZmluZCBkb2N1bWVudCAnKyBkb2N1bWVudElkICxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluc3RhbnRpYXRlRnJvbSA9PSBGUk9NX0RFRklOSVRJT04pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZXRJZCA9IGluZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmVyc2lvbiA9IEpTT04ueHBhdGgoXCIvaW5kaWNhdG9yc1tzZXRJZCBlcSAnXCIgKyBzZXRJZCArIFwiJ10vdmVyc2lvblwiLCBhcHAuU0NPUEUuQVBQX0NPTkZJRywge30pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2V0TW9kZWxJZCA9IHNldElkICsgJ18nICsgdmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJy0tLS0tLS0tLSBMb2cgYXQgR2F0ZWtlZXBlciAtLS0tLS0tLS0tLS0tLScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXRNb2RlbElkPT0nKyBzZXRNb2RlbElkKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KHNldE1vZGVsSWQpLmRvbmUoZnVuY3Rpb24oc2V0TW9kZWwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmaW5pdGlvbk1vZGVsID0gZXZhbCgnc2V0TW9kZWwubW9kZWwucGVuZGluZy5kYXRhLicgKyBzZXRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuZGF0YVtzZXRJZF0gPSBkZWZpbml0aW9uTW9kZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX0RBVEFfSU5JVElBTElTRUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXRNb2RlbCA9ICcrSlNPTi5zdHJpbmdpZnkoc2V0TW9kZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnZGVmaW5pdGlvbk1vZGVsID0gJytKU09OLnN0cmluZ2lmeShkZWZpbml0aW9uTW9kZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogVVBEQVRFRF9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFVQREFURURfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRG9jdW1lbnQgaW5pdGlhbGlzZWQuJyAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBlcnIuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGVyci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgZmluZCBkZWZhdWx0IG1vZGVsICcrIHNldE1vZGVsSWQgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZXJyLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBlcnIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IGZpbmQgZG9jdW1lbnQgJyArIGRvY3VtZW50SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbnN0YW50aWF0ZUZyb20gPT0gRlJPTV9BVVRIT1JJU0VEKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShmdW5jdGlvbihkYXRhKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2V0SWQgPSBpbmRpY2F0b3JNb2RlbC5kZWZhdWx0TW9kZWwuc2V0SWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBKU09OLnhwYXRoKFwiL2luZGljYXRvcnNbc2V0SWQgZXEgJ1wiICsgc2V0SWQgKyBcIiddL3ZlcnNpb25cIiwgYXBwLlNDT1BFLkFQUF9DT05GSUcsIHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcHJvdmVkTW9kZWxJZCA9IGRvY3VtZW50SWQgKyAnOmFwcHJvdmVkJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFvLmdldChhcHByb3ZlZE1vZGVsSWQpLmRvbmUoZnVuY3Rpb24oYXBwcm92ZWRNb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1heF9zZXEgPSBKU09OLnhwYXRoKCdtYXgoL21vZGVsL2FwcHJvdmVkL3NlcSknLCBhcHByb3ZlZE1vZGVsLCB7fSlbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdEFwcHJvdmVkTW9kZWwgPSBKU09OLnhwYXRoKCcvbW9kZWwvYXBwcm92ZWRbLi9zZXEgPSAnICsgbWF4X3NlcSArICddJywgYXBwcm92ZWRNb2RlbCwge30pWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdNb2RlbCA9IGV2YWwoJ2xhc3RBcHByb3ZlZE1vZGVsLmRhdGEuJyArIHNldElkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5kYXRhW3NldElkXSA9IG5ld01vZGVsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19EQVRBX0lOSVRJQUxJU0VEO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czpVUERBVEVEX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogVVBEQVRFRF9OQU1FLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdEb2N1bWVudCBpbml0aWFsaXNlZC4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBlcnIuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGVyci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgZmluZCBhcHByb3ZlZCBtb2RlbCAnICsgYXBwcm92ZWRNb2RlbElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZXJyLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBlcnIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAgJ0Nhbm5vdCBmaW5kIGRvY3VtZW50ICcgKyBkb2N1bWVudElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6U0VSVkVSX0VSUk9SX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU0VSVkVSX0VSUk9SX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogICdJbnB1dCBzZXF1ZW5jZSBzaG91bGQgYmUgZXF1YWwgdG8gcGVuZGluZyBzZXF1ZW5jZS4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6U0VSVkVSX0VSUk9SX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU0VSVkVSX0VSUk9SX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogICdTdGF0dXMgaXMgbm90IGluICcgKyBFTlRSWV9TVEFUVVNfSU5JVElBTElTRUQgKyAnIHN0YXRlLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xyXG5cclxuICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOmVyci5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXJyLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogIGVyci5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuXHJcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbn07XHJcblxyXG4vKiogXHJcbiAqIFJlcHJlc2VudHMgdGhlIHVwZGF0ZSBmdW5jdGlvbiBmdW5jdGlvbi5cclxuICogVXBkdGF0ZXMgdGhlIGN1cnJlbnQgZG9jdW1lbnQgcGVuZGluZyB3aXRoIGlucHV0IGN1c3RvbU1vZGVsIG9iamVjdC5cclxuICogUHJvY2VzcyBhbGwgcnVsZXMsIGF0dGFjaG1lbnRzIGV0Yy5cclxuICogVXBkYXRlZCBzdGF0dXMgdG8gVVBEQVRFRCBvciBQZW5kaW5nUnVsZXMgaWYgdGhlcmUgYXJlIGFueSBzZXJ2ZXIgcnVsZXNcclxuICogQG1ldGhvZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9jdW1lbnRJZCAtIGRvY3VtZW50IGlkIHdoaWNoIG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBpbmRpY2F0b3JNb2RlbCAtIHZpZXdNb2RlbCBvZiBpbmRpY2F0b3JcclxuXHJcbiBcclxuICogQGF1dGhvciBIYXNhbiBBYmJhc1xyXG4gKiBAdmVyc2lvbiAxLjAuMFxyXG4gKlxyXG4gKiBAZXhhbXBsZSBcclxuICogdmFyIGdhdGVrZWVwZXIgPSBuZXcgR0soKTtcclxuICogZ2F0ZWtlZWVyLnVwZGF0ZSgnYWJjMTYxJyx2aWV3TW9kZWwpXHJcbiAqXHJcbiAgKiBAcmV0dXJuIHtBcnJheX0gQXJyYXkgY29udGFpbmluZyBkb2N1bWVudCBvYmplY3QuXHJcbiAqXHJcbiAqL1xyXG5cclxuR0sucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGRvY3VtZW50SWQsIGluZGljYXRvck1vZGVsLCBwcm9jZXNzSWQsIHN1YlByb2Nlc3NJZCwgc3ViUHJvY2Vzc1VVSUQpIHtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZG9jKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGluZGljYXRvck1vZGVsLm1vZGVsRXJyb3JzKCkubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogUFJFQ09ORElUSU9OX0ZBSUxFRF9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBQUkVDT05ESVRJT05fRkFJTEVEX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGVyZSBhcmUgJyArIGluZGljYXRvck1vZGVsLm1vZGVsRXJyb3JzKCkubGVuZ3RoICsgJyBlcnJvcnMgb24gZm9ybS4gUGxlYXNlIHJlc29sdmUgZmlyc3QuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2MubW9kZWwucGVuZGluZy5zdGF0dXMgPT0gRU5UUllfU1RBVFVTX0RBVEFfSU5JVElBTElTRUQgfHwgZG9jLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19VUERBVEVEKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBKU09OLnBhcnNlKGtvLnRvSlNPTihldmFsKCdpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC4nICsgaW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLnNldElkKCkpLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnX19rb19tYXBwaW5nX18nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFsbEZpbGVzID0gSlNPTi54cGF0aChcIi8vKltmaWxlRGF0YSBuZSAnJyBhbmQgdXVpZCBuZSAnJ11cIixtb2RlbCx7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgb2w9MDtvbDxhbGxGaWxlcy5sZW5ndGg7b2wrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxGaWxlc1tvbF0uZmlsZURhdGEgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmVyc2lvbiA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLnNldElkKCkgPT0gUFJPRklMRV9TRVRfSUQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb24gPSAnVjEuMCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uID0gSlNPTi54cGF0aChcIi9pbmRpY2F0b3JzW3NldElkIGVxICdcIiArIGluZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLnNldElkKCkgKyBcIiddL3ZlcnNpb25cIiwgYXBwLlNDT1BFLkFQUF9DT05GSUcsIHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBhbGwgYXR0YWNobWVudHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyp2YXIgZmlsZXMgPSBKU09OLnhwYXRoKFwiLy8qW2ZpbGVEYXRhIGFuZCBpc0NoYW5nZWQgZXEgJ3RydWUnXVwiLG1vZGVsLHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRhY2hlbWVudHNUb1Byb2Nlc3MgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgb2w9MDtvbDxmaWxlcy5sZW5ndGg7b2wrKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVzT2JqPWZpbGVzW29sXTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihmaWxlc09iai5taW1lID09ICdpbWFnZS9qcGVnJyB8fCBmaWxlc09iai5taW1lID09ICdpbWFnZS9wbmcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5wdXNoKHsgXCJkYXRhXCI6IGZpbGVzT2JqLmZpbGVEYXRhLnN1YnN0cmluZyhmaWxlc09iai5maWxlRGF0YS5pbmRleE9mKCdiYXNlNjQnKSs3KSwgXCJpZFwiOiBmaWxlc09iai51dWlkICwgXCJtaW1lXCI6IGZpbGVzT2JqLm1pbWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5wdXNoKHsgXCJkYXRhXCI6IGZpbGVzT2JqLmZpbGVEYXRhLCBcImlkXCI6IGZpbGVzT2JqLnV1aWQgLCBcIm1pbWVcIjogZmlsZXNPYmoubWltZSB9KTsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlc09iai5maWxlRGF0YSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXNPYmouaXNDaGFuZ2VkID0gJ2ZhbHNlJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFsbEZpbGVzID0gSlNPTi54cGF0aChcIi8vKltmaWxlRGF0YSBuZSAnJyBhbmQgdXVpZCBuZSAnJ11cIixtb2RlbCx7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIG9sPTA7b2w8YWxsRmlsZXMubGVuZ3RoO29sKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbEZpbGVzW29sXS5maWxlRGF0YSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2F2ZUF0dGFjaG1lbnRzID0gZnVuY3Rpb24oZGF0YSwgbG9vcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhby5zYXZlQXR0YWNobWVudChkYXRhLmlkLCBkYXRhLnJldiwgYXR0YWNoZW1lbnRzVG9Qcm9jZXNzW2xvb3BdLmRhdGEsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVtZW50c1RvUHJvY2Vzc1tsb29wXS5taW1lLCBhdHRhY2hlbWVudHNUb1Byb2Nlc3NbbG9vcF0uaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5sZW5ndGggPiAobG9vcCArIDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVBdHRhY2htZW50cyhlLCBsb29wICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJjYW4gbm90IHNhdmVkIGF0dGFjaGVtbnQgXCIgKyBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9OyovXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KGluZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLnNldElkKCkgKyAnXycgKyB2ZXJzaW9uICsgXCJfY29uZmlnXCIpLmRvbmUoZnVuY3Rpb24oY29uZmlnRG9jKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLm1vZGVsLnBlbmRpbmcuZGF0YVtpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC5zZXRJZCgpXSA9IG1vZGVsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZG9jLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX1BFTkRJTkc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZ0RvYy5tb2RlcmF0aW9uICE9IHVuZGVmaW5lZCAmJiBjb25maWdEb2MubW9kZXJhdGlvbi5yZXF1aXJlZCA9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLmNvbnRyb2wuZHJhZnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdXBkYXRlZCBkYXRlIGZpZWxkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2MudXBkYXRlZCA9IG1vbWVudCgpLmZvcm1hdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBjb250cmlidXRvcnMgbGlzdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLmNvbnRyaWJ1dG9ycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5maXJzdE5hbWUgKyBcIiBcIiArIExPQ0FMX1NFVFRJTkdTLlNFU1NJT04ubGFzdE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VySWRcIjogTE9DQUxfU0VUVElOR1MuU1VCU0NSSVBUSU9OUy51c2VySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VybmFtZVwiOiBMT0NBTF9TRVRUSU5HUy5TVUJTQ1JJUFRJT05TLnVzZXJuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2MubW9kZWwucGVuZGluZy51c2VyID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBMT0NBTF9TRVRUSU5HUy5TRVNTSU9OLmZpcnN0TmFtZSArIFwiIFwiICsgTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5sYXN0TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJJZFwiOiBMT0NBTF9TRVRUSU5HUy5TVUJTQ1JJUFRJT05TLnVzZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInVzZXJuYW1lXCI6IExPQ0FMX1NFVFRJTkdTLlNVQlNDUklQVElPTlMudXNlcm5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgZG9jdW1lbnQgaW4gdGhlIGRhdGFiYXNlIGkuZS4gbG9jYWwgUG91Y2hEQiBvciBDb3VjaGJhc2UgTGl0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLnNvdXJjZSA9IFwicmVtb3RlXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXhlZCBSdWxlIGZvciB0aXRsZSBmb2YgZG9jdW1lbnQgOiBUT0RPXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvY1RpdGxlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnRG9jLnJ1bGVzICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiBjb25maWdEb2MucnVsZXMudGl0bGUgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSBjb25maWdEb2MucnVsZXMudGl0bGUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0ID0gY29uZmlnRG9jLnJ1bGVzLnRpdGxlW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHBhcnQubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYocGFydC5pbmRleE9mKFwiJ1wiKSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2NUaXRsZSA9IGRvY1RpdGxlICsgcGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY1RpdGxlID0gZG9jVGl0bGUgKyBldmFsKFwibW9kZWwuXCIgKyBwYXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IGxlbiAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jVGl0bGUgPSBkb2NUaXRsZSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZG9jVGl0bGUgPT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jVGl0bGUgPSAnRW50cnkgJytpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC5zZXRJZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLnRpdGxlID0gZG9jVGl0bGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZmFsc2Upey8vaWYgKGNvbmZpZ0RvYy5ydWxlcyAhPSB1bmRlZmluZWQgJiYgY29uZmlnRG9jLnJ1bGVzLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX1BFTkRJTkdfUlVMRVM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vU3RhcnQgcnVsZSBwcm9jZXNzaW5nIGhlcmUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZfcHJvY2Vzc1J1bGVzID0gbmV3ICQuRGVmZXJyZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzQWxsUnVsZXMoMCwgXCJ1cGRhdGVcIiwgZG9jLCBpbmRpY2F0b3JNb2RlbCwgY29uZmlnRG9jLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicnVsZVN0YXR1c1wiOiBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZGVmX3Byb2Nlc3NSdWxlcykuZG9uZShmdW5jdGlvbihpbk1vZGVsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5Nb2RlbC5ydWxlU3RhdHVzID09ICdSVUxFX0NPTVBMRVRFJykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5tb2RlbC5wZW5kaW5nLnByb2Nlc3NpbmdTdGF0dXMuc2VxID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2MubW9kZWwucGVuZGluZy5wcm9jZXNzaW5nU3RhdHVzLnJ1bGVTdGF0dXMgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19VUERBVEVEO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogRml4IEVOVFJZX1NUQVRVU19SRUFEWV9UT19TVUJNSVQgaW4gZG9jdW1lbnQuIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKGFwcC5wcm9jZXNzSWQgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgdmFyIHByb2Nlc3MgPSBKU09OLnhwYXRoKFwiL3Byb2Nlc3Nlc1tzdWJQcm9jZXNzSWQgZXEgJ1wiICsgYXBwLnByb2Nlc3NJZCArIFwiJ11cIiwgZG9jLCB7fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChwcm9jZXNzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgcHJvY2Vzc1swXS5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfUkVBRFlfVE9fU1VCTUlUOyAvLyBjaGVjayBoZXJlIHRoZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLmF0b21JZChkb2N1bWVudElkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogVVBEQVRFRF9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFVQREFURURfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRG9jdW1lbnQgdXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBkb2NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5Nb2RlbC5ydWxlU3RhdHVzID09ICdSVUxFX1NFUlZFUicpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdkZXBlbmRlbnQgb25zZXJ2ZXIgcnVsZScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogVVBEQVRFRF9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFVQREFURURfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZGVwZW5kZW50IG9uc2VydmVyIHJ1bGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZG9jXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbk1vZGVsLnJ1bGVTdGF0dXMgPT0gJ1JVTEVfRVJST1InKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncnVsZSBlcnJvciBmcm9tIHNvbWV3aGVyZScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgncHJvY2Vzc0FsbFJ1bGVzIGZhaWwgcHJvbWlzZSBjYXNlIGZhaWxlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19VUERBVEVEO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5hdG9tSWQoZG9jdW1lbnRJZCk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1RPRE86IEZpeCBFTlRSWV9TVEFUVVNfUkVBRFlfVE9fU1VCTUlUIGluIGRvY3VtZW50LiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YXIgcHJvY2VzcyA9IEpTT04ueHBhdGgoXCIvd29ya2Zsb3dzW2lkIGVxICdcIiArIHByb2Nlc3NJZCArIFwiJyBhbmQgc3ViUHJvY2Vzc0lkIGVxICdcIisgc3ViUHJvY2Vzc0lkK1wiJyddXCIsIGRvYywge30pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZhciBwcm9jZXNzID0gSlNPTi54cGF0aChcIi93b3JrZmxvd3MvcHJvY2Vzc2VzW2lkIGVxICdcIisgcHJvY2Vzc0lkK1wiJyBhbmQgc3ViUHJvY2Vzc0lkIGVxICdcIisgc3ViUHJvY2Vzc0lkK1wiJyBhbmQgc3ViUHJvY2Vzc1VVSUQgZXEgJ1wiKyBzdWJQcm9jZXNzVVVJRCtcIiddXCIsIGRvYywge30pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChwcm9jZXNzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcHJvY2Vzc1swXS5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfUkVBRFlfVE9fU1VCTUlUOyAvLyBjaGVjayBoZXJlIHRoZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjb25maWdEb2MucnVsZXMgIT0gdW5kZWZpbmVkICYmIGNvbmZpZ0RvYy5ydWxlcy52YWxpZGF0ZU9ubGluZSAhPSB1bmRlZmluZWQgJiYgY29uZmlnRG9jLnJ1bGVzLnZhbGlkYXRlT25saW5lID09IHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2UudmFsaWRhdGVPbmxpbmUoaW5kaWNhdG9yTW9kZWwuY3VzdG9tTW9kZWwuc2V0SWQoKSwgZG9jLCBkb2N1bWVudElkKS5kb25lKFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGNvZGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBVUERBVEVEX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFVQREFURURfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0RvY3VtZW50IHVwZGF0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBkb2NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VBcnJheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuZmFpbChmdW5jdGlvbihzKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBTRVJWRVJfRVJST1JfQ09ERSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU0VSVkVSX0VSUk9SX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdFUlJPUjogT25saW5lIHZhbGlkYXRpb24gZmFpbGVkLiBSZWFzb246JytKU09OLnN0cmluZ2lmeShzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBVUERBVEVEX0NPREUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBVUERBVEVEX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRG9jdW1lbnQgdXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbDogZG9jXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZUFycmF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZXJyLnN0YXR1cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBlcnIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnY29uZmlnIGZpbGUgbm90IGZvdW5kLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VBcnJheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IFNFUlZFUl9FUlJPUl9DT0RFLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU0VSVkVSX0VSUk9SX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnU3RhdHVzIGlzIG5vdCBpbiAnICsgRU5UUllfU1RBVFVTX0RBVEFfSU5JVElBTElTRUQgKyAnIG9yICcgKyBFTlRSWV9TVEFUVVNfVVBEQVRFRCArICcgc3RhdGUuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGVyci5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZXJyLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG51bGxcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuXHJcbn07XHJcblxyXG4vKiogXHJcbiAqIFJlcHJlc2VudHMgdGhlIGF1dGhvcmlzZSAgZnVuY3Rpb24uXHJcbiAqIFVwZHRhdGVzIHRoZSBjdXJyZW50IGRvY3VtZW50IHBlbmRpbmcgd2l0aCBzdGF0dXMgQXV0aG9yaXNlZC5cclxuICogQ29waWVkIHRoZSBkYXRhIHRvIGF1dGhvcmlzZWQgYXJyYXkgb2YgYXV0aG9yaXNlZCBkb2N1bWVudC5cclxuICogQG1ldGhvZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9jdW1lbnRJZCAtIGRvY3VtZW50IGlkIHdoaWNoIG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkXHJcbiBcclxuICogQGF1dGhvciBIYXNhbiBBYmJhc1xyXG4gKiBAdmVyc2lvbiAxLjAuMFxyXG4gKlxyXG4gKiBAZXhhbXBsZSBcclxuICogdmFyIGdhdGVrZWVwZXIgPSBuZXcgR0soKTtcclxuICogZ2F0ZWtlZWVyLmF1dGhvcmlzZSgnYWJjMTYxJylcclxuICpcclxuICAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBjb250YWluaW5nIGRvY3VtZW50IGFuZCBhdXRob3Jpc2Ugb2JqZWN0LlxyXG4gKlxyXG4gKi9cclxuXHJcbkdLLnByb3RvdHlwZS5hdXRob3Jpc2UgPSBmdW5jdGlvbihkb2N1bWVudElkKSB7XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnZG9jdW1lbnRJZD09Jytkb2N1bWVudElkKTtcclxuICAgICAgICAgICAgaWYgKGRvY3VtZW50SWQgIT0gbnVsbCAmJiBkb2N1bWVudElkICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudElkICE9ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2Rhby5nZXQoZG9jdW1lbnRJZCkgcmV0dXJuZWQgZGF0YSAnKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09ICcrIGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19VUERBVEVEKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ0luc2lkZSBJZiAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNldElkID0gZGF0YS5jYXRlZ29yeS50ZXJtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IGRhdGEubW9kZWwucGVuZGluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBldmFsKHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXRJZCA9PSAnK3NldElkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncGF0aCA9PSAnK3BhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdpdGVtID09ICcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19BVVRIT1JJU0VEO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwcm92ZV9kb2NfaWQgPSBkb2N1bWVudElkICsgJzphcHByb3ZlZCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhby5nZXQoYXBwcm92ZV9kb2NfaWQpLmRvbmUoZnVuY3Rpb24oYXBwcm92ZURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdkYW8uZ2V0KGFwcHJvdmVfZG9jX2lkKSBhcHByb3ZlRGF0YSA9PScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYXBwcm92ZURhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcHJvdmVEYXRhLm1vZGVsLmFwcHJvdmVkLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpblJlcyA9IF90aGlzLmdldFJlc3BvbnNlKFVQREFURURfQ09ERSwgVVBEQVRFRF9OQU1FLCAnRG9jdW1lbnQgTW9kZWwgYXBwcm92ZWQnLCBmYWxzZSwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwcm92ZVJlcyA9IF90aGlzLmdldFJlc3BvbnNlKFVQREFURURfQ09ERSwgVVBEQVRFRF9OQU1FLCAnQXBwcm92ZWQgbW9kZWwgaW5jcmVtZW50ZWQnLCBmYWxzZSwgYXBwcm92ZURhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbbWFpblJlcywgYXBwcm92ZVJlc107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdtYWluUmVzPT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cobWFpblJlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdhcHByb3ZlUmVzPT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYXBwcm92ZVJlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXNwb25zZUFycmF5PT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VBcnJheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBfdGhpcy5nZXRSZXNwb25zZShCQURfUkVRVUVTVF9DT0RFLCBCQURfUkVRVUVTVF9OQU1FLCAnU3RhdHVzIG5vdCBpbiB1cGRhdGVkIHN0YXRlJywgdHJ1ZSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ0luc2lkZSBFbHNlPT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gX3RoaXMuZ2V0UmVzcG9uc2UoZXJyLnN0YXR1cywgZXJyLm5hbWUsIGVyci5tZXNzYWdlLCB0cnVlLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnSW5zaWRlIEZhaWwgMSA9PScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2VBcnJheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gX3RoaXMuZ2V0UmVzcG9uc2UoQkFEX1JFUVVFU1RfQ09ERSwgQkFEX1JFUVVFU1RfTkFNRSwgJ0RvY3VtZW50IElEIGlzIGJsYW5rJywgdHJ1ZSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFtyZXNwb25zZV07XHJcbiAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnSW5zaWRlIEZhaWwgMiA9PScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2VBcnJheSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ0luc2lkZSBGYWlsIDMgPT0nKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcblxyXG4gICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKiBcclxuICogUmVwcmVzZW50cyB0aGUgcmVqZWN0ICBmdW5jdGlvbi5cclxuICogVXBkdGF0ZXMgdGhlIGN1cnJlbnQgZG9jdW1lbnQgcGVuZGluZyB3aXRoIHN0YXR1cyBSZWpldGNlZC5cclxuICogQ29waWVkIHRoZSBkYXRhIHRvIGF1dGhvcmlzZWQgYXJyYXkgb2YgcmVqZWN0ZWQgZG9jdW1lbnQuXHJcbiAqIEBtZXRob2RcclxuICogQHBhcmFtIHtzdHJpbmd9IGRvY3VtZW50SWQgLSBkb2N1bWVudCBpZCB3aGljaCBuZWVkcyB0byBiZSBpbml0aWFsaXNlZFxyXG4gXHJcbiAqIEBhdXRob3IgSGFzYW4gQWJiYXNcclxuICogQHZlcnNpb24gMS4wLjBcclxuICpcclxuICogQGV4YW1wbGUgXHJcbiAqIHZhciBnYXRla2VlcGVyID0gbmV3IEdLKCk7XHJcbiAqIGdhdGVrZWVlci5yZWplY3QoJ2FiYzE2MScpXHJcbiAqXHJcbiAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBjb250YWluaW5nIGRvY3VtZW50IGFuZCByZWplY3RlZCBvYmplY3QuXHJcbiAqXHJcbiAqL1xyXG5cclxuR0sucHJvdG90eXBlLnJlamVjdCA9IGZ1bmN0aW9uKGRvY3VtZW50SWQpIHtcclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGRvY3VtZW50SWQgIT0gbnVsbCAmJiBkb2N1bWVudElkICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudElkICE9ICcnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPT0gRU5UUllfU1RBVFVTX1VQREFURUQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNldElkID0gZGF0YS5jYXRlZ29yeS50ZXJtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGV2YWwoJ2RhdGEubW9kZWwucGVuZGluZy5kYXRhJyArIHNldElkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19SRUpFQ1RFRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlamVjdGVkX2RvY19pZCA9IGRvY3VtZW50SWQgKyAnOnJlamVjdGVkJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGFvLmdldChyZWplY3RlZF9kb2NfaWQpLmRvbmUoZnVuY3Rpb24ocmVqZWN0ZWREYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3RlZERhdGEubW9kZWwucmVqZWN0ZWQucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYWluUmVzID0gZ2V0UmVzcG9uc2UoVVBEQVRFRF9DT0RFLCBVUERBVEVEX05BTUUsICdEb2N1bWVudCBNb2RlbCBhcHByb3ZlZCcsIGZhbHNlLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWpSZXMgPSBnZXRSZXNwb25zZShVUERBVEVEX0NPREUsIFVQREFURURfTkFNRSwgJ1JlamV0Y2VkIG1vZGVsIGluY3JlbWVudGVkJywgZmFsc2UsIHJlamVjdGVkRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VBcnJheSA9IFttYWluUmVzLCByZWpSZXNdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShCQURfUkVRVUVTVF9DT0RFLCBCQURfUkVRVUVTVF9OQU1FLCAnU3RhdHVzIG5vdCBpbiB1cGRhdGVkIHN0YXRlJywgdHJ1ZSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlQXJyYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGdldFJlc3BvbnNlKGVyci5zdGF0dXMsIGVyci5uYW1lLCBlcnIubWVzc2FnZSwgdHJ1ZSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlQXJyYXkgPSBbcmVzcG9uc2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoQkFEX1JFUVVFU1RfQ09ERSwgQkFEX1JFUVVFU1RfTkFNRSwgJ0RvY3VtZW50IElEIGlzIGJsYW5rJywgdHJ1ZSwgbnVsbClcclxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZUFycmF5ID0gW3Jlc3BvbnNlXTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZUFycmF5KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcblxyXG5cclxufTtcclxuXHJcbkdLLnByb3RvdHlwZS5wcm9jZXNzSW5pdGlhbGlzZVJ1bGUgPSBmdW5jdGlvbihkb2N1bWVudElkLCBydWxlT2JqLCBpbmRpY2F0b3JNb2RlbCkge1xyXG5cclxufTtcclxuXHJcbkdLLnByb3RvdHlwZS5wcm9jZXNzVW5pcXVlUnVsZSA9IGZ1bmN0aW9uKGRvY3VtZW50SWQsIHJ1bGVPYmosIGluZGljYXRvck1vZGVsKSB7XHJcblxyXG59O1xyXG5cclxuR0sucHJvdG90eXBlLnByb2Nlc3NBbGxSdWxlcyA9XHJcbiAgICBmdW5jdGlvbihpbmRleCwgc2NvcGUsIG9iamVjdCwgaW5kaWNhdG9yTW9kZWwsIGNvbmZpZ0RvYywgcnVsZVJlc3BvbnNlLCBkZWZfcHJvY2Vzc1J1bGVzKSB7XHJcblxyXG4gICAgICAgIHZhciBydWxlT2JqID0gY29uZmlnRG9jLnJ1bGVzW2luZGV4XTtcclxuICAgICAgICB2YXIgZXhlY3V0ZUF0ID0gcnVsZU9iai5leGVjdXRlQXQ7XHJcbiAgICAgICAgdmFyIGV2ZW50ID0gcnVsZU9iai5ldmVudDtcclxuICAgICAgICB2YXIgaWQgPSBydWxlT2JqLmlkO1xyXG4gICAgICAgIHZhciBzZXEgPSBydWxlT2JqLnNlcTtcclxuICAgICAgICB2YXIgdHlwZSA9IHJ1bGVPYmouZXhlY3V0ZVJ1bGUucnVsZVR5cGU7XHJcblxyXG4gICAgICAgIGlmKHNjb3BlID09IGV2ZW50KXtcclxuICAgICAgICAgICAgaWYgKGV4ZWN1dGVBdCA9PSAnbG9jYWwnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndXBkYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHJ1bGVPYmouZXhlY3V0ZVJ1bGUucGFyYW1zLnNvdXJjZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBvbCA9IDA7IG9sIDwgcnVsZU9iai5leGVjdXRlUnVsZS5wYXJhbXMudGFyZ2V0Lmxlbmd0aDsgb2wrKykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJdGVtID0gcnVsZU9iai5leGVjdXRlUnVsZS5wYXJhbXMudGFyZ2V0W29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRUeXBlID0gdGFyZ2V0SXRlbS50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldE5hbWUgPSB0YXJnZXRJdGVtLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0VHlwZSA9PSAndmFyaWFibGUnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ciArIGV2YWwoXCJpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC5cIiArIGluZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpICsgJy4nICsgdGFyZ2V0TmFtZSArICcoKScpICsgJyAnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ciArIHRhcmdldE5hbWUgKyAnICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLnN1YnN0cmluZygwLCA0KSA9PSAnZG9jOicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWwoJ29iamVjdC4nICsgc291cmNlLnN1YnN0cmluZyhzb3VyY2UubGVuZ3RoLCA0KSArICc9IHN0cjsnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWwoJ29iamVjdC5tb2RlbC5wZW5kaW5nLmRhdGEuJyArIGluZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpICsgJy4nICsgc291cmNlICsgJz0gc3RyOycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVSZXNwb25zZS5ydWxlU3RhdHVzID0gJ1JVTEVfQ09NUExFVEUnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT0gY29uZmlnRG9jLnJ1bGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZl9wcm9jZXNzUnVsZXMucmVzb2x2ZShydWxlUmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0FsbFJ1bGVzKGluZGV4ICsgMSxzY29wZSwgb2JqZWN0LCBpbmRpY2F0b3JNb2RlbCwgY29uZmlnRG9jLCBydWxlUmVzcG9uc2UsIGRlZl9wcm9jZXNzUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxpc2UnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd1bmlxdWUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE86IGltcGxlbWVudCBzZXJ2ZXIgc2lkZSBwb3N0IGFjdGlvbnMgICBcclxuXHJcbiAgICAgICAgICAgICAgICBvYmplY3QubW9kZWwucGVuZGluZy5wcm9jZXNzaW5nU3RhdHVzLnNlcSA9IHNlcTtcclxuICAgICAgICAgICAgICAgIG9iamVjdC5tb2RlbC5wZW5kaW5nLnByb2Nlc3NpbmdTdGF0dXMucnVsZVN0YXR1cyA9IFBST0NFU1NJTkdfU1RBVFVTX1NFUlZFUl9SVUxFUztcclxuICAgICAgICAgICAgICAgIHJ1bGVSZXNwb25zZS5ydWxlU3RhdHVzID0gJ1JVTEVfU0VSVkVSJztcclxuICAgICAgICAgICAgICAgIGRlZl9wcm9jZXNzUnVsZXMucmVzb2x2ZShydWxlUmVzcG9uc2UpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3NBbGxSdWxlcyhpbmRleCArIDEsc2NvcGUsIG9iamVjdCwgaW5kaWNhdG9yTW9kZWwsIGNvbmZpZ0RvYywgcnVsZVJlc3BvbnNlLCBkZWZfcHJvY2Vzc1J1bGVzKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gZGVmX3Byb2Nlc3NSdWxlcztcclxuICAgIH07XHJcblxyXG5cclxuXHJcblxyXG5HSy5wcm90b3R5cGUudW5sb2NrID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAvLyBVc2UgdGhlIG5hdGl2ZSBQcm9taXNlIGNvbnN0cnVjdG9yXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblxyXG5cclxuXHJcbiAgICB9KTtcclxufTtcclxuXHJcbkdLLnByb3RvdHlwZS5wZXJzaXN0ID0gZnVuY3Rpb24obW9kZWxBcnJheSkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgaXRlbXNUb1NhdmU9bW9kZWxBcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciBzYXZlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kZWxBcnJheS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZGFvLnNhdmUobW9kZWxBcnJheVtpXS5tb2RlbCkuZG9uZShmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBzYXZlZE9iamVjdHMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtc1RvU2F2ZS0tO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGl0ZW1zVG9TYXZlID09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNhdmVkT2JqZWN0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgc2F2ZWRPYmplY3RzLnB1c2goZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtc1RvU2F2ZS0tO1xyXG4gICAgICAgICAgICAgICAgICAgICBpZihpdGVtc1RvU2F2ZSA9PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHNhdmVkT2JqZWN0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHSzsiXX0=

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

                        version = JSON.xpath("/indicators[setId eq '" + indicatorModel.customModel.setId() + "']/version", app.SCOPE.APP_CONFIG, {});
                        
                        /*if (indicatorModel.customModel.setId() == PROFILE_SET_ID) {
                            version = 'V1.0';
                        } else {
                            version = JSON.xpath("/indicators[setId eq '" + indicatorModel.customModel.setId() + "']/version", app.SCOPE.APP_CONFIG, {});
                        }*/

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
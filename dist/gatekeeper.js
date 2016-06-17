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
function GK(){
	//
	var _this = this;
}

var getResponse = function(status, name, message, error, model,approvedModel, rejectedModel){

        var response = {
                            status: status,
                            name: name,
                            message: message,
                            error: error,
                            model: model,
                            approvedModel:approvedModel,
                            rejectedModel:rejectedModel
                    }
        return  response
    
}

/** 
 * Represents the instantiate function.
 * Creates new document in case of newInstance, also creates approved and rejected documents.
 * Creates new suence in case of newSequence.
 * @method
 * @param {string} documentId - document id which needs to be initialised
 * @param {string} instanceType - valued can be (newInstance/newSequence)
 * @param {string} setId - setId
 * @param {string} profileId - profileId
 * @param {string} validDate - validDate
 
 * @author Hasan Abbas
 * @version 1.0.0
 *
 * @example 
 * var gatekeeper = new GK();
 * gatekeeer.instantiate('abc161','newSequence','developerDetail',22,'22/04/2016');
 *
 * @return {Object} Promise Object with respose Object
 *
 */

GK.prototype.instantiate = function(documentId, instanceType, setId, profileId, validDate){
    
    var self = this;
    var def = new $.Deferred();

    if(instanceType == INSTANCE_TYPE_NEW_INS){

        dao.get(documentId).done(
            function(data){ 
                
                var response = getResponse(CONFLICT_CODE, CONFLICT_NAME,'Document with same id already exists',true,null,null,null )
                    
                def.reject(response);

            }).fail(function(err){

                library.saveEntries(setId, profileId, documentId, validDate).done(function(data){


                    // Taken from old serviceImpl : TODO: review

                    if(setId == PROFILE_SET_ID)
                    {
                        service.createProfileDocuments(LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId, documentId);
                    }
                    else{
                        service.addToLocalRegistry({"uuid":documentId,"setId":setId,"applicationId":app.SCOPE.applicationId, "profileId":app.SCOPE.profileId}); 
                    }

                    def.resolve(data);

                }).fail(function(err){

                    def.reject(err);
                    
                });

            });

    } else if(instanceType == INSTANCE_TYPE_NEW_SEQ) {

         dao.get(documentId).done(
            function(data){
                
               if(data.model.pending.status == ENTRY_STATUS_AUTHORISED || data.model.pending.status == ENTRY_STATUS_REJECTED) {

                    var saveNewSeq = function(newSeq){
                       data.model.pending.seq = newSeq;
                       data.model.pending.data = {};
                       data.model.pending.status = ENTRY_STATUS_INITIALISED;
                       data.model.pending.validDate = validDate;
                       data.model.pending.revision = '';
                       var user= {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
                      
                       data.model.pending.user = user;
                       dao.save(data).done(
                            function(s){
                               // console.log(data);
                                def.resolve(data);
                            }
                        ).fail(function(err){
                            def.reject(err);
                        });

                    };
                    
                    var approve_doc_id = documentId+':approved'
                    dao.get(approve_doc_id).done(function(data){
                        var seq = JSON.xpath("max(//approved/seq)",ko.toJS(data),{})[0];
                        var new_seq = seq + 1;
                        saveNewSeq(new_seq);

                    }).fail(function(err){
                       
                        def.reject(err);
                    });

               } else {

                    var response = getResponse(SERVER_ERROR_CODE, SERVER_ERROR_NAME,
                            'Cannot create sequence.Current status should be'+ ENTRY_STATUS_AUTHORISED + 'or '+ ENTRY_STATUS_REJECTED, true, null, null, null );
                    def.resolve(response);
               }

            }).fail(function(err){
                //create document relating to new seq
                library.saveEntries(setId, profileId, documentId, validDate).done(function(data){
                    def.resolve(data);
                }).fail(function(err){
                    var response = getResponse(err.status, err.name,
                        err.message, true, null, null, null); 
                    def.resolve(response);
                });
            });
    } else {

        console.log('instance type not found');            
    
    }

    return def;
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
 * @return {Object} Promise Object with respose Object
 *
 */
GK.prototype.instantiateData = function(documentId, instantiateFrom, indicatorModel, seqNo){

    //from : 1 - input
    //from : 2 - definition
    //from : 3 - authorised

    var self = this;
    var def = new $.Deferred();

    var getResponse = function(status, name, message, error, model,approvedModel, rejectedModel){

        var response = {
                            status: status,
                            name: name,
                            message: message,
                            error: error,
                            model: model,
                            approvedModel:approvedModel,
                            rejectedModel:rejectedModel
                    }
        return  response
    }

    var savePacket = function(data){
                        dao.save(data).done(
                            function(s){
                             
                                def.resolve(s);
                            }
                        ).fail(function(err){
                            def.reject(err);
                        });
                    };

    dao.get(documentId).done(
            function(data){

                if(data.model.pending.status == ENTRY_STATUS_INITIALISED){

                    if(data.model.pending.seq == seqNo){

                        if(instantiateFrom == FROM_REQUEST){

                            dao.get(documentId).done(function(data){
                                
                                data.model.pending.data[indicatorModel.defaultModel.setId()] = JSON.parse(ko.toJSON(eval('indicatorModel.customModel.'+indicatorModel.defaultModel.setId()), function(key, value) {
                                    if(key === '__ko_mapping__') {
                                        return;
                                    } else if (value == undefined) {
                                        return '';
                                    } else {
                                        return value;
                                    } 
                                }));
                                data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;
                                savePacket(data);
                                var response = getResponse(UPDATED_CODE, UPDATED_NAME,
                                   'Document initialised', false, data, null, null )
                                def.resolve(response);

                               

                            }).fail(function(err){

                                def.reject(err);

                            });

                        } else if(instantiateFrom == FROM_DEFINITION){

                            dao.get(documentId).done(function(data){
                                
                                var setId = indicatorModel.defaultModel.setId();
                                var version =  JSON.xpath("/indicators[setId eq '"+ setId +"']/version",app.SCOPE.APP_CONFIG,{});
                                var setModelId= setId+'_'+version+'_ENTRY';
                                dao.get(setModelId).done(function(setModel){

                                    var definitionModel = eval('setModel.model.pending.data.'+setId);
                                    data.model.pending.data[setId] = definitionModel;
                                    data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;
                                    savePacket(data);
                                    var response = getResponse(UPDATED_CODE, UPDATED_NAME,
                                        'Document initialised', false, data, null, null )
                                    def.resolve(response);

                                }).fail();

                                
                            }).fail(function(err){

                                def.reject(err);

                            });

                        } else if(instantiateFrom == FROM_AUTHORISED){

                            dao.get(documentId).done(function(data){
                                
                                var setId = indicatorModel.defaultModel.setId();
                                var version =  JSON.xpath("/indicators[setId eq '"+ setId +"']/version",app.SCOPE.APP_CONFIG,{});
                                var approvedModelId= documentId+':approved';
                                dao.get(approvedModelId).done(function(approvedModel){
                                    var max_seq =  JSON.xpath('max(/model/approved/seq)',approvedModel,{})[0];
                                    var lastApprovedModel = JSON.xpath('/model/approved[./seq = '+ max_seq +']',approvedModel,{})[0]    ;
                                    
                                   

                               
                                    var newModel =  eval('lastApprovedModel.data.'+setId);
                                    data.model.pending.data[setId] = newModel;
                                    data.model.pending.status = ENTRY_STATUS_DATA_INITIALISED;
                                    savePacket(data);
                                    var response = getResponse(UPDATED_CODE, UPDATED_NAME,
                                        'Document initialised', false, data, null, null )
                                    def.resolve(response);

                                }).fail();

                                
                            }).fail(function(err){

                                def.reject(err);

                            });


                        }

                    } else {

                        var response = getResponse(SERVER_ERROR_CODE, SERVER_ERROR_NAME,
                            'Input sequence should be equal to pending sequence.', true, null, null, null );
                        def.resolve(response);

                    }
                    
                } else {

                        var response = getResponse(SERVER_ERROR_CODE, SERVER_ERROR_NAME,
                            'Status is not in '+ ENTRY_STATUS_INITIALISED+ ' state.', true, null, null, null );
                        def.resolve(response);

                }

            }).fail(function(err){

                var response = getResponse(err.status, err.name, err.message, true, null, null, null); 
                def.resolve(response);

            });



    return def;

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
 * @return {Object} Promise Object with respose Object
 *
 */

GK.prototype.update = function(documentId,indicatorModel){
    
    var self = this;
    var def = new $.Deferred();

    var processAllRules = 
        function(index, documentId, indicatorModel, configDoc, ruleResponse, def_processRules){

            var ruleObj = configDoc.rules[index];   
            var executeAt = ruleObj.executeAt;
            var id = ruleObj.id;
            var seq = ruleObj.seq;
            var type = ruleObj.executeRule.ruleType;

            if(executeAt == 'local'){

                    switch (type) {
                        case 'update': 
                            var source = ruleObj.executeRule.params.source;
                            var str = '';
                            for(var ol=0; ol<ruleObj.executeRule.params.target.length; ol++){

                                var targetItem = ruleObj.executeRule.params.target[ol];
                                var targetType = targetItem.type;
                                var targetName = targetItem.name;
                                if(targetType == 'variable'){
                                   
                                    str  = str + eval("indicatorModel.customModel."+indicatorModel.defaultModel.setId()+'.'+ targetName+'()')+ ' ';

                                } else {

                                    str  = str + targetName + ' ';
                                }

                            }
                            dao.get(documentId).done(function(object){
                                 
                                if(source.substring(0, 4) == 'doc:'){
                                    eval('object.'+ source.substring(source.length, 4) +'= str;');
                                } else {
                                    eval('object.model.pending.data.'+indicatorModel.defaultModel.setId()+'.'+source+'= str;');
                                }
                                
                                dao.save(object).done(function(data){
                                 
                                    ruleResponse.ruleStatus = 'RULE_COMPLETE';
                                    
                                    if(index == configDoc.rules.length - 1){
                                      def_processRules.resolve(ruleResponse);
                                    } else {
                                        processAllRules(index+1, documentId, indicatorModel, configDoc, ruleResponse,def_processRules);    
                                    }

                                }).fail(function(err){
                                  ruleResponse.ruleStatus = 'RULE_ERROR';
                                });

                            }).fail(function(err){

                                

                            });
                           
                            break;
                        case 'initialise':
                            break;
                        case 'unique':
                            break;
                    }

            } else {
                //TODO: implement server side post actions   
                
                dao.get(documentId).done(function(data){
                    data.model.pending.processingStatus.seq = seq;
                    data.model.pending.processingStatus.ruleStatus = PROCESSING_STATUS_SERVER_RULES;
                    dao.save(data).done(function(object){
                         
                         ruleResponse.ruleStatus = 'RULE_SERVER';
                         def_processRules.resolve(ruleResponse);

                    }).fail(function(err){
                         console.log('error function in PROCESSING_STATUS_SERVER_RULES'+ err);
                    });
                }).fail(function(){
                     
                });
            }
            return def_processRules;
    }

    dao.get(documentId).done(function(doc){
                
        if(indicatorModel.modelErrors().length > 0){

            var response = getResponse(PRECONDITION_FAILED_CODE, PRECONDITION_FAILED_NAME,
                    'There are '+indicatorModel.modelErrors().length+ ' errors on form. Please resolve first.', true, null, null, null );
            def.reject(response);

        } else {

            if(doc.model.pending.status == ENTRY_STATUS_DATA_INITIALISED || doc.model.pending.status == ENTRY_STATUS_UPDATED){


                var model = JSON.parse(ko.toJSON(eval('indicatorModel.customModel.'+indicatorModel.defaultModel.setId()), function(key, value) {
                    if(key === '__ko_mapping__') {
                        return;
                    } else if (value == undefined) {
                        return '';
                    } else {
                        return value;
                    } 
                }));
                
                var version='';

                if(indicatorModel.customModel.setId() == PROFILE_SET_ID)
                { 
                    version = 'V1.0';
                }
                else
                { 
                    version =  JSON.xpath("/indicators[setId eq '"+indicatorModel.customModel.setId()+"']/version",app.SCOPE.APP_CONFIG,{});
                }

                // Process all attachments
                var files = JSON.xpath("//*[fileData and isChanged eq 'true']",model,{});
                
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
                        console.log("can not saved attachemnt " + e);
                    });
                };

                var postSave = function(data){
                    indicatorModel.defaultModel.atomId(documentId);
                    if (attachementsToProcess.length > 0) {
                        saveAttachments(data, 0);
                    }
                    var response = getResponse(UPDATED_CODE, UPDATED_NAME,'Document updated', false, data, null, null )
                    def.resolve(response);
                };

                var savePacket = function(finalPkt){

                    //validate online here
                    dao.save(finalPkt).done(postSave).fail(function(err){
                        app.showMessage("Unable to save changes due to version conflict. Please reload the form to see the recent updates.");
                        deffered.reject(err);
                    });

                };

                dao.get(indicatorModel.customModel.setId()+ '_'+version+"_config").done(function(configDoc){

                    doc.model.pending.data[indicatorModel.customModel.setId()] = model;

                    //doc.model.pending.status = ENTRY_STATUS_PENDING;

                    if(configDoc.moderation != undefined && configDoc.moderation.required == true)
                    {
                        doc.control.draft = true;
                    }
                    
                    // Update the updated date field
                    doc.updated = moment().format();
                    // Update the contributors list
                    doc.contributors.push({"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username});

                    doc.model.pending.user = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
                        
                    // Save the document in the database i.e. local PouchDB or Couchbase Lite
                    doc.source = "remote";

                    if(configDoc.rules.length > 0){

                        doc.model.pending.status = ENTRY_STATUS_PENDING_RULES;
                        dao.save(doc).done(function(data){

                            var def_processRules = new $.Deferred();
                            processAllRules(0,documentId, indicatorModel, configDoc,{"ruleStatus":""},def_processRules).done(function(inModel){

                                if(inModel.ruleStatus == 'RULE_COMPLETE'){

                                    dao.get(documentId).done(function(data){
                                        data.model.pending.processingStatus.seq = '';
                                        data.model.pending.processingStatus.ruleStatus = '';
                                        data.model.pending.status = ENTRY_STATUS_UPDATED;


                                        //TODO: Fix ENTRY_STATUS_READY_TO_SUBMIT in document. 
                                        if(app.processId != undefined)
                                        {
                                            var process = JSON.xpath("/processes[subProcessId eq '"+app.processId+"']",data,{});
                                                                                
                                            if(process.length > 0)
                                            {
                                                process[0].status = ENTRY_STATUS_READY_TO_SUBMIT;// check here the index
                                            }   
                                        }
                                        

                                        savePacket(data);

                                    }).fail(function(error){
                                        def.reject('ENTRY_STATUS_UPDATED failed');
                                    });

                                } else if(inModel.ruleStatus == 'RULE_SERVER'){
                                    
                                    console.log('dependent onserver rule');

                                } else if(inModel.ruleStatus == 'RULE_ERROR'){
                                    
                                    console.log('rule error from somewhere');

                                }

                            }).fail(function(error){
                                  def.reject('processAllRules fail promise case failed');
                            });

                        }).fail(function(error){
                            def.reject('ENTRY_STATUS_PENDING_RULES failed');
                        });

                    
                        
                    } else {

                        dao.get(documentId).done(function(data){
                         
                            data.model.pending.status = ENTRY_STATUS_UPDATED;
                            savePacket(data);

                        }).fail(function(error){
                            def.reject('ENTRY_STATUS_UPDATED failed');
                        });

                    }

                }).fail(function(err){

                    var response = getResponse(err.status, err.name, err.message, true, null, null, null); 
                    def.reject(response);       

                });
                   

                
            
            } else {

                var response = getResponse(SERVER_ERROR_CODE, SERVER_ERROR_NAME,
                            'Status is not in '+ ENTRY_STATUS_DATA_INITIALISED +' or '+ ENTRY_STATUS_UPDATED + ' state.', true, null, null, null );
                def.resolve(response);

            }
        }

    }).fail(function(err){

            var response = getResponse(err.status, err.name, err.message, true, null, null, null); 
            def.reject(response);
    });

    return def;
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
 * @return {Object} Promise Object with respose Object
 *
 */

GK.prototype.authorise = function(documentId){
    var self = this;
    var def = new $.Deferred();
    if(documentId != null &&  documentId != undefined && documentId != ''){

        dao.get(documentId).done(function(data){


            if(data.model.pending.status == ENTRY_STATUS_UPDATED){

                var saveDoc = function(doc){
                       dao.save(doc).done(
                            function(s){
                              
                              
                            }
                        ).fail(function(err){
                            def.reject(err);
                        });
                };


                var setId = data.category.term;
                var path = data.model.pending;
                var item = eval(path);
                data.model.pending.status = ENTRY_STATUS_AUTHORISED;
                saveDoc(data);

                var approve_doc_id = documentId+':approved';

                dao.get(approve_doc_id).done(function(approveData){
                    
                    approveData.model.approved.push(item);
                    saveDoc(approveData);


                    def.resolve(approveData);
                 
                }).fail(function(err){
                   
                    console.log(err);
                });

            } else {

                var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME,'Status not in updated state',true,null,null,null )
                def.reject(response);

            }

            

        }).fail(function(err){

           var response = getResponse(err.status, err.name,
                        err.message, true, null, null, null); 
            def.resolve(response);

        });

    }else{

        var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME,'Document ID is blank',true,null,null,null )
                    
        def.reject(response);

    }

    return def;
   
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
 * @return {Object} Promise Object with respose Object
 *
 */

GK.prototype.reject = function(documentId){
    
    var self = this;
    var def = new $.Deferred();
    if(documentId != null &&  documentId != undefined && documentId != ''){

        

        dao.get(documentId).done(function(data){

            if(data.model.pending.status == ENTRY_STATUS_UPDATED){

                var saveDoc = function(doc){
                       dao.save(doc).done(
                            function(s){
                               
                              
                            }
                        ).fail(function(err){
                            def.reject(err);
                        });
                };


                var setId = data.category.term;
                var item = eval('data.model.pending.data'+setId);

                data.model.pending.status = ENTRY_STATUS_REJECTED;
                saveDoc(data);

                var rejected_doc_id = documentId+':rejected';

                dao.get(rejected_doc_id).done(function(rejectedData){
                    
                    rejectedData.model.rejected.push(item);
                    saveDoc(rejectedData);


                    def.resolve(rejectedData);
                    
                }).fail(function(err){
                   
                    console.log(err);
                });

            } else {

                var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME,'Status not in updated state',true,null,null,null )
                def.reject(response);

            }

            

        }).fail(function(err){

           var response = getResponse(err.status, err.name,
                        err.message, true, null, null, null); 
            def.resolve(response);

        });

    }else{

        var response = getResponse(BAD_REQUEST_CODE, BAD_REQUEST_NAME,'Document ID is blank',true,null,null,null )
                    
        def.reject(response);

    }

    return def;

};

var processInitialiseRule = function(documentId, ruleObj, indicatorModel){
    
};

var processUniqueRule = function(documentId, ruleObj, indicatorModel){

};

GK.prototype.unlock = function(val){
    var self = this;
    // Use the native Promise constructor
    return new Promise(function(resolve, reject) {
    
      

    });
};

module.exports = GK;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbi8qKiBcbiAqIFJlcHJlc2VudHMgdGhlIGdhdGVrZWVwZXIgbW9kdWxlLlxuICogVGhpcyBtb2R1bGUgd2lsbCBob2xkIGFsbCBmdW5jdGlvbnMgdG8gYWNjZXNzIGdhdGVrZWVwZXIgdmkgR0soKSBvYmplY3RcbiAqXG4gKiBAY2xhc3NcbiAqIFJldHVybnMgR0soKSBvYmplY3QgXG4gKiBAYXV0aG9yIEhhc2FuIEFiYmFzXG4gKiBAdmVyc2lvbiAxLjAuMFxuICpcbiAqIEBleGFtcGxlIFxuICogdmFyIGdhdGVrZWVwZXIgPSBuZXcgR0soKTtcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IG5ldyBHSyBjb25zdHJ1Y3RvciAvIGNsYXNzIG9iamVjdFxuICpcbiAqL1xuZnVuY3Rpb24gR0soKXtcblx0Ly9cblx0dmFyIF90aGlzID0gdGhpcztcbn1cblxudmFyIGdldFJlc3BvbnNlID0gZnVuY3Rpb24oc3RhdHVzLCBuYW1lLCBtZXNzYWdlLCBlcnJvciwgbW9kZWwsYXBwcm92ZWRNb2RlbCwgcmVqZWN0ZWRNb2RlbCl7XG5cbiAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcHJvdmVkTW9kZWw6YXBwcm92ZWRNb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3RlZE1vZGVsOnJlamVjdGVkTW9kZWxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gIHJlc3BvbnNlXG4gICAgXG59XG5cbi8qKiBcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RhbnRpYXRlIGZ1bmN0aW9uLlxuICogQ3JlYXRlcyBuZXcgZG9jdW1lbnQgaW4gY2FzZSBvZiBuZXdJbnN0YW5jZSwgYWxzbyBjcmVhdGVzIGFwcHJvdmVkIGFuZCByZWplY3RlZCBkb2N1bWVudHMuXG4gKiBDcmVhdGVzIG5ldyBzdWVuY2UgaW4gY2FzZSBvZiBuZXdTZXF1ZW5jZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7c3RyaW5nfSBkb2N1bWVudElkIC0gZG9jdW1lbnQgaWQgd2hpY2ggbmVlZHMgdG8gYmUgaW5pdGlhbGlzZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnN0YW5jZVR5cGUgLSB2YWx1ZWQgY2FuIGJlIChuZXdJbnN0YW5jZS9uZXdTZXF1ZW5jZSlcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZXRJZCAtIHNldElkXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvZmlsZUlkIC0gcHJvZmlsZUlkXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsaWREYXRlIC0gdmFsaWREYXRlXG4gXG4gKiBAYXV0aG9yIEhhc2FuIEFiYmFzXG4gKiBAdmVyc2lvbiAxLjAuMFxuICpcbiAqIEBleGFtcGxlIFxuICogdmFyIGdhdGVrZWVwZXIgPSBuZXcgR0soKTtcbiAqIGdhdGVrZWVlci5pbnN0YW50aWF0ZSgnYWJjMTYxJywnbmV3U2VxdWVuY2UnLCdkZXZlbG9wZXJEZXRhaWwnLDIyLCcyMi8wNC8yMDE2Jyk7XG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBQcm9taXNlIE9iamVjdCB3aXRoIHJlc3Bvc2UgT2JqZWN0XG4gKlxuICovXG5cbkdLLnByb3RvdHlwZS5pbnN0YW50aWF0ZSA9IGZ1bmN0aW9uKGRvY3VtZW50SWQsIGluc3RhbmNlVHlwZSwgc2V0SWQsIHByb2ZpbGVJZCwgdmFsaWREYXRlKXtcbiAgICBcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZiA9IG5ldyAkLkRlZmVycmVkKCk7XG5cbiAgICBpZihpbnN0YW5jZVR5cGUgPT0gSU5TVEFOQ0VfVFlQRV9ORVdfSU5TKXtcblxuICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoXG4gICAgICAgICAgICBmdW5jdGlvbihkYXRhKXsgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoQ09ORkxJQ1RfQ09ERSwgQ09ORkxJQ1RfTkFNRSwnRG9jdW1lbnQgd2l0aCBzYW1lIGlkIGFscmVhZHkgZXhpc3RzJyx0cnVlLG51bGwsbnVsbCxudWxsIClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZGVmLnJlamVjdChyZXNwb25zZSk7XG5cbiAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKXtcblxuICAgICAgICAgICAgICAgIGxpYnJhcnkuc2F2ZUVudHJpZXMoc2V0SWQsIHByb2ZpbGVJZCwgZG9jdW1lbnRJZCwgdmFsaWREYXRlKS5kb25lKGZ1bmN0aW9uKGRhdGEpe1xuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGFrZW4gZnJvbSBvbGQgc2VydmljZUltcGwgOiBUT0RPOiByZXZpZXdcblxuICAgICAgICAgICAgICAgICAgICBpZihzZXRJZCA9PSBQUk9GSUxFX1NFVF9JRClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZS5jcmVhdGVQcm9maWxlRG9jdW1lbnRzKExPQ0FMX1NFVFRJTkdTLkNPTU1VTklUWV9DT05GSUcuY29tbXVuaXR5SWQsIGRvY3VtZW50SWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmFkZFRvTG9jYWxSZWdpc3RyeSh7XCJ1dWlkXCI6ZG9jdW1lbnRJZCxcInNldElkXCI6c2V0SWQsXCJhcHBsaWNhdGlvbklkXCI6YXBwLlNDT1BFLmFwcGxpY2F0aW9uSWQsIFwicHJvZmlsZUlkXCI6YXBwLlNDT1BFLnByb2ZpbGVJZH0pOyBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuXG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgfSBlbHNlIGlmKGluc3RhbmNlVHlwZSA9PSBJTlNUQU5DRV9UWVBFX05FV19TRVEpIHtcblxuICAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKFxuICAgICAgICAgICAgZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICBpZihkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19BVVRIT1JJU0VEIHx8IGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPT0gRU5UUllfU1RBVFVTX1JFSkVDVEVEKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhdmVOZXdTZXEgPSBmdW5jdGlvbihuZXdTZXEpe1xuICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuc2VxID0gbmV3U2VxO1xuICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuZGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX0lOSVRJQUxJU0VEO1xuICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcudmFsaWREYXRlID0gdmFsaWREYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcucmV2aXNpb24gPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXI9IHtcIm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5maXJzdE5hbWUgKyBcIiBcIiArIExPQ0FMX1NFVFRJTkdTLlNFU1NJT04ubGFzdE5hbWUsXCJ1c2VySWRcIjogTE9DQUxfU0VUVElOR1MuU1VCU0NSSVBUSU9OUy51c2VySWQsIFwidXNlcm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU1VCU0NSSVBUSU9OUy51c2VybmFtZX07XG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgZGFvLnNhdmUoZGF0YSkuZG9uZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKS5mYWlsKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHByb3ZlX2RvY19pZCA9IGRvY3VtZW50SWQrJzphcHByb3ZlZCdcbiAgICAgICAgICAgICAgICAgICAgZGFvLmdldChhcHByb3ZlX2RvY19pZCkuZG9uZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZXEgPSBKU09OLnhwYXRoKFwibWF4KC8vYXBwcm92ZWQvc2VxKVwiLGtvLnRvSlMoZGF0YSkse30pWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19zZXEgPSBzZXEgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZU5ld1NlcShuZXdfc2VxKTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShTRVJWRVJfRVJST1JfQ09ERSwgU0VSVkVSX0VSUk9SX05BTUUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0Nhbm5vdCBjcmVhdGUgc2VxdWVuY2UuQ3VycmVudCBzdGF0dXMgc2hvdWxkIGJlJysgRU5UUllfU1RBVFVTX0FVVEhPUklTRUQgKyAnb3IgJysgRU5UUllfU1RBVFVTX1JFSkVDVEVELCB0cnVlLCBudWxsLCBudWxsLCBudWxsICk7XG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgIC8vY3JlYXRlIGRvY3VtZW50IHJlbGF0aW5nIHRvIG5ldyBzZXFcbiAgICAgICAgICAgICAgICBsaWJyYXJ5LnNhdmVFbnRyaWVzKHNldElkLCBwcm9maWxlSWQsIGRvY3VtZW50SWQsIHZhbGlkRGF0ZSkuZG9uZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgZGVmLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShlcnIuc3RhdHVzLCBlcnIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlLCB0cnVlLCBudWxsLCBudWxsLCBudWxsKTsgXG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ2luc3RhbmNlIHR5cGUgbm90IGZvdW5kJyk7ICAgICAgICAgICAgXG4gICAgXG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZjtcbn07XG5cbi8qKiBcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RhbnRpYXRlRGF0YSBmdW5jdGlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9jdW1lbnRJZCAtIGRvY3VtZW50IGlkIHdoaWNoIG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zdGFuY2VUeXBlIC0gdmFsdWVkIGNhbiBiZSAobmV3SW5zdGFuY2UvbmV3U2VxdWVuY2UpXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zdGFudGlhdGVGcm9tIC0gdmFsdWVkIGNhbiBiZSAoZnJvbVJlcXVlc3QvZnJvbURlZmluaXRpb24vZnJvbUF1dGhvcmlzZWQpXG4gKiBAcGFyYW0ge29iamVjdH0gaW5kaWNhdG9yTW9kZWwgLSB2aWV3TW9kZWwgb2YgaW5kaWNhdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gc2VxTm8gLSBTZXF1ZW5jZSBudW1iZXIgdGhhdCBuZWVkcyB0byBiZSBpbml0aWFsaXNlZC5cbiBcbiBcbiAqIEBhdXRob3IgSGFzYW4gQWJiYXNcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKlxuICogQGV4YW1wbGUgXG4gKiB2YXIgZ2F0ZWtlZXBlciA9IG5ldyBHSygpO1xuICogZ2F0ZWtlZWVyLmluc3RhbnRpYXRlRGF0YSgnYWJjMTYxJywnbmV3U2VxdWVuY2UnLCdmcm9tQXV0aG9yaXNlZCcsdmlld01vZGVsLDEpXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBQcm9taXNlIE9iamVjdCB3aXRoIHJlc3Bvc2UgT2JqZWN0XG4gKlxuICovXG5HSy5wcm90b3R5cGUuaW5zdGFudGlhdGVEYXRhID0gZnVuY3Rpb24oZG9jdW1lbnRJZCwgaW5zdGFudGlhdGVGcm9tLCBpbmRpY2F0b3JNb2RlbCwgc2VxTm8pe1xuXG4gICAgLy9mcm9tIDogMSAtIGlucHV0XG4gICAgLy9mcm9tIDogMiAtIGRlZmluaXRpb25cbiAgICAvL2Zyb20gOiAzIC0gYXV0aG9yaXNlZFxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWYgPSBuZXcgJC5EZWZlcnJlZCgpO1xuXG4gICAgdmFyIGdldFJlc3BvbnNlID0gZnVuY3Rpb24oc3RhdHVzLCBuYW1lLCBtZXNzYWdlLCBlcnJvciwgbW9kZWwsYXBwcm92ZWRNb2RlbCwgcmVqZWN0ZWRNb2RlbCl7XG5cbiAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWw6IG1vZGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcHJvdmVkTW9kZWw6YXBwcm92ZWRNb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3RlZE1vZGVsOnJlamVjdGVkTW9kZWxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gIHJlc3BvbnNlXG4gICAgfVxuXG4gICAgdmFyIHNhdmVQYWNrZXQgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhby5zYXZlKGRhdGEpLmRvbmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ocyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVzb2x2ZShzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICApLmZhaWwoZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICAgICAgaWYoZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9PSBFTlRSWV9TVEFUVVNfSU5JVElBTElTRUQpe1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKGRhdGEubW9kZWwucGVuZGluZy5zZXEgPT0gc2VxTm8pe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihpbnN0YW50aWF0ZUZyb20gPT0gRlJPTV9SRVFVRVNUKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5kYXRhW2luZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpXSA9IEpTT04ucGFyc2Uoa28udG9KU09OKGV2YWwoJ2luZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLicraW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLnNldElkKCkpLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihrZXkgPT09ICdfX2tvX21hcHBpbmdfXycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX0RBVEFfSU5JVElBTElTRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYWNrZXQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGdldFJlc3BvbnNlKFVQREFURURfQ09ERSwgVVBEQVRFRF9OQU1FLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQgaW5pdGlhbGlzZWQnLCBmYWxzZSwgZGF0YSwgbnVsbCwgbnVsbCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZWplY3QoZXJyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoaW5zdGFudGlhdGVGcm9tID09IEZST01fREVGSU5JVElPTil7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2V0SWQgPSBpbmRpY2F0b3JNb2RlbC5kZWZhdWx0TW9kZWwuc2V0SWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZlcnNpb24gPSAgSlNPTi54cGF0aChcIi9pbmRpY2F0b3JzW3NldElkIGVxICdcIisgc2V0SWQgK1wiJ10vdmVyc2lvblwiLGFwcC5TQ09QRS5BUFBfQ09ORklHLHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNldE1vZGVsSWQ9IHNldElkKydfJyt2ZXJzaW9uKydfRU5UUlknO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KHNldE1vZGVsSWQpLmRvbmUoZnVuY3Rpb24oc2V0TW9kZWwpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmaW5pdGlvbk1vZGVsID0gZXZhbCgnc2V0TW9kZWwubW9kZWwucGVuZGluZy5kYXRhLicrc2V0SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLmRhdGFbc2V0SWRdID0gZGVmaW5pdGlvbk1vZGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19EQVRBX0lOSVRJQUxJU0VEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVBhY2tldChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGdldFJlc3BvbnNlKFVQREFURURfQ09ERSwgVVBEQVRFRF9OQU1FLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCBpbml0aWFsaXNlZCcsIGZhbHNlLCBkYXRhLCBudWxsLCBudWxsIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZWplY3QoZXJyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoaW5zdGFudGlhdGVGcm9tID09IEZST01fQVVUSE9SSVNFRCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2V0SWQgPSBpbmRpY2F0b3JNb2RlbC5kZWZhdWx0TW9kZWwuc2V0SWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZlcnNpb24gPSAgSlNPTi54cGF0aChcIi9pbmRpY2F0b3JzW3NldElkIGVxICdcIisgc2V0SWQgK1wiJ10vdmVyc2lvblwiLGFwcC5TQ09QRS5BUFBfQ09ORklHLHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFwcHJvdmVkTW9kZWxJZD0gZG9jdW1lbnRJZCsnOmFwcHJvdmVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFvLmdldChhcHByb3ZlZE1vZGVsSWQpLmRvbmUoZnVuY3Rpb24oYXBwcm92ZWRNb2RlbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF4X3NlcSA9ICBKU09OLnhwYXRoKCdtYXgoL21vZGVsL2FwcHJvdmVkL3NlcSknLGFwcHJvdmVkTW9kZWwse30pWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RBcHByb3ZlZE1vZGVsID0gSlNPTi54cGF0aCgnL21vZGVsL2FwcHJvdmVkWy4vc2VxID0gJysgbWF4X3NlcSArJ10nLGFwcHJvdmVkTW9kZWwse30pWzBdICAgIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld01vZGVsID0gIGV2YWwoJ2xhc3RBcHByb3ZlZE1vZGVsLmRhdGEuJytzZXRJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcuZGF0YVtzZXRJZF0gPSBuZXdNb2RlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfREFUQV9JTklUSUFMSVNFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYWNrZXQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShVUERBVEVEX0NPREUsIFVQREFURURfTkFNRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQgaW5pdGlhbGlzZWQnLCBmYWxzZSwgZGF0YSwgbnVsbCwgbnVsbCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVzb2x2ZShyZXNwb25zZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVqZWN0KGVycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoU0VSVkVSX0VSUk9SX0NPREUsIFNFUlZFUl9FUlJPUl9OQU1FLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdJbnB1dCBzZXF1ZW5jZSBzaG91bGQgYmUgZXF1YWwgdG8gcGVuZGluZyBzZXF1ZW5jZS4nLCB0cnVlLCBudWxsLCBudWxsLCBudWxsICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVzb2x2ZShyZXNwb25zZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShTRVJWRVJfRVJST1JfQ09ERSwgU0VSVkVSX0VSUk9SX05BTUUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1N0YXR1cyBpcyBub3QgaW4gJysgRU5UUllfU1RBVFVTX0lOSVRJQUxJU0VEKyAnIHN0YXRlLicsIHRydWUsIG51bGwsIG51bGwsIG51bGwgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoZXJyLnN0YXR1cywgZXJyLm5hbWUsIGVyci5tZXNzYWdlLCB0cnVlLCBudWxsLCBudWxsLCBudWxsKTsgXG4gICAgICAgICAgICAgICAgZGVmLnJlc29sdmUocmVzcG9uc2UpO1xuXG4gICAgICAgICAgICB9KTtcblxuXG5cbiAgICByZXR1cm4gZGVmO1xuXG59O1xuXG4vKiogXG4gKiBSZXByZXNlbnRzIHRoZSB1cGRhdGUgZnVuY3Rpb24gZnVuY3Rpb24uXG4gKiBVcGR0YXRlcyB0aGUgY3VycmVudCBkb2N1bWVudCBwZW5kaW5nIHdpdGggaW5wdXQgY3VzdG9tTW9kZWwgb2JqZWN0LlxuICogUHJvY2VzcyBhbGwgcnVsZXMsIGF0dGFjaG1lbnRzIGV0Yy5cbiAqIFVwZGF0ZWQgc3RhdHVzIHRvIFVQREFURUQgb3IgUGVuZGluZ1J1bGVzIGlmIHRoZXJlIGFyZSBhbnkgc2VydmVyIHJ1bGVzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9jdW1lbnRJZCAtIGRvY3VtZW50IGlkIHdoaWNoIG5lZWRzIHRvIGJlIGluaXRpYWxpc2VkXG4gKiBAcGFyYW0ge29iamVjdH0gaW5kaWNhdG9yTW9kZWwgLSB2aWV3TW9kZWwgb2YgaW5kaWNhdG9yXG5cbiBcbiAqIEBhdXRob3IgSGFzYW4gQWJiYXNcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKlxuICogQGV4YW1wbGUgXG4gKiB2YXIgZ2F0ZWtlZXBlciA9IG5ldyBHSygpO1xuICogZ2F0ZWtlZWVyLnVwZGF0ZSgnYWJjMTYxJyx2aWV3TW9kZWwpXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBQcm9taXNlIE9iamVjdCB3aXRoIHJlc3Bvc2UgT2JqZWN0XG4gKlxuICovXG5cbkdLLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihkb2N1bWVudElkLGluZGljYXRvck1vZGVsKXtcbiAgICBcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZiA9IG5ldyAkLkRlZmVycmVkKCk7XG5cbiAgICB2YXIgcHJvY2Vzc0FsbFJ1bGVzID0gXG4gICAgICAgIGZ1bmN0aW9uKGluZGV4LCBkb2N1bWVudElkLCBpbmRpY2F0b3JNb2RlbCwgY29uZmlnRG9jLCBydWxlUmVzcG9uc2UsIGRlZl9wcm9jZXNzUnVsZXMpe1xuXG4gICAgICAgICAgICB2YXIgcnVsZU9iaiA9IGNvbmZpZ0RvYy5ydWxlc1tpbmRleF07ICAgXG4gICAgICAgICAgICB2YXIgZXhlY3V0ZUF0ID0gcnVsZU9iai5leGVjdXRlQXQ7XG4gICAgICAgICAgICB2YXIgaWQgPSBydWxlT2JqLmlkO1xuICAgICAgICAgICAgdmFyIHNlcSA9IHJ1bGVPYmouc2VxO1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBydWxlT2JqLmV4ZWN1dGVSdWxlLnJ1bGVUeXBlO1xuXG4gICAgICAgICAgICBpZihleGVjdXRlQXQgPT0gJ2xvY2FsJyl7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd1cGRhdGUnOiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gcnVsZU9iai5leGVjdXRlUnVsZS5wYXJhbXMuc291cmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIG9sPTA7IG9sPHJ1bGVPYmouZXhlY3V0ZVJ1bGUucGFyYW1zLnRhcmdldC5sZW5ndGg7IG9sKyspe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJdGVtID0gcnVsZU9iai5leGVjdXRlUnVsZS5wYXJhbXMudGFyZ2V0W29sXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFR5cGUgPSB0YXJnZXRJdGVtLnR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXROYW1lID0gdGFyZ2V0SXRlbS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZih0YXJnZXRUeXBlID09ICd2YXJpYWJsZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciAgPSBzdHIgKyBldmFsKFwiaW5kaWNhdG9yTW9kZWwuY3VzdG9tTW9kZWwuXCIraW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLnNldElkKCkrJy4nKyB0YXJnZXROYW1lKycoKScpKyAnICc7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICA9IHN0ciArIHRhcmdldE5hbWUgKyAnICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24ob2JqZWN0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzb3VyY2Uuc3Vic3RyaW5nKDAsIDQpID09ICdkb2M6Jyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsKCdvYmplY3QuJysgc291cmNlLnN1YnN0cmluZyhzb3VyY2UubGVuZ3RoLCA0KSArJz0gc3RyOycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbCgnb2JqZWN0Lm1vZGVsLnBlbmRpbmcuZGF0YS4nK2luZGljYXRvck1vZGVsLmRlZmF1bHRNb2RlbC5zZXRJZCgpKycuJytzb3VyY2UrJz0gc3RyOycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW8uc2F2ZShvYmplY3QpLmRvbmUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVSZXNwb25zZS5ydWxlU3RhdHVzID0gJ1JVTEVfQ09NUExFVEUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihpbmRleCA9PSBjb25maWdEb2MucnVsZXMubGVuZ3RoIC0gMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZl9wcm9jZXNzUnVsZXMucmVzb2x2ZShydWxlUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzQWxsUnVsZXMoaW5kZXgrMSwgZG9jdW1lbnRJZCwgaW5kaWNhdG9yTW9kZWwsIGNvbmZpZ0RvYywgcnVsZVJlc3BvbnNlLGRlZl9wcm9jZXNzUnVsZXMpOyAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZVJlc3BvbnNlLnJ1bGVTdGF0dXMgPSAnUlVMRV9FUlJPUic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxpc2UnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5pcXVlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vVE9ETzogaW1wbGVtZW50IHNlcnZlciBzaWRlIHBvc3QgYWN0aW9ucyAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnByb2Nlc3NpbmdTdGF0dXMuc2VxID0gc2VxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcucHJvY2Vzc2luZ1N0YXR1cy5ydWxlU3RhdHVzID0gUFJPQ0VTU0lOR19TVEFUVVNfU0VSVkVSX1JVTEVTO1xuICAgICAgICAgICAgICAgICAgICBkYW8uc2F2ZShkYXRhKS5kb25lKGZ1bmN0aW9uKG9iamVjdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgcnVsZVJlc3BvbnNlLnJ1bGVTdGF0dXMgPSAnUlVMRV9TRVJWRVInO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGRlZl9wcm9jZXNzUnVsZXMucmVzb2x2ZShydWxlUmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3IgZnVuY3Rpb24gaW4gUFJPQ0VTU0lOR19TVEFUVVNfU0VSVkVSX1JVTEVTJysgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVmX3Byb2Nlc3NSdWxlcztcbiAgICB9XG5cbiAgICBkYW8uZ2V0KGRvY3VtZW50SWQpLmRvbmUoZnVuY3Rpb24oZG9jKXtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYoaW5kaWNhdG9yTW9kZWwubW9kZWxFcnJvcnMoKS5sZW5ndGggPiAwKXtcblxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoUFJFQ09ORElUSU9OX0ZBSUxFRF9DT0RFLCBQUkVDT05ESVRJT05fRkFJTEVEX05BTUUsXG4gICAgICAgICAgICAgICAgICAgICdUaGVyZSBhcmUgJytpbmRpY2F0b3JNb2RlbC5tb2RlbEVycm9ycygpLmxlbmd0aCsgJyBlcnJvcnMgb24gZm9ybS4gUGxlYXNlIHJlc29sdmUgZmlyc3QuJywgdHJ1ZSwgbnVsbCwgbnVsbCwgbnVsbCApO1xuICAgICAgICAgICAgZGVmLnJlamVjdChyZXNwb25zZSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgaWYoZG9jLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19EQVRBX0lOSVRJQUxJU0VEIHx8IGRvYy5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9PSBFTlRSWV9TVEFUVVNfVVBEQVRFRCl7XG5cblxuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IEpTT04ucGFyc2Uoa28udG9KU09OKGV2YWwoJ2luZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLicraW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLnNldElkKCkpLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGtleSA9PT0gJ19fa29fbWFwcGluZ19fJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdmVyc2lvbj0nJztcblxuICAgICAgICAgICAgICAgIGlmKGluZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLnNldElkKCkgPT0gUFJPRklMRV9TRVRfSUQpXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbiA9ICdWMS4wJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb24gPSAgSlNPTi54cGF0aChcIi9pbmRpY2F0b3JzW3NldElkIGVxICdcIitpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC5zZXRJZCgpK1wiJ10vdmVyc2lvblwiLGFwcC5TQ09QRS5BUFBfQ09ORklHLHt9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIGFsbCBhdHRhY2htZW50c1xuICAgICAgICAgICAgICAgIHZhciBmaWxlcyA9IEpTT04ueHBhdGgoXCIvLypbZmlsZURhdGEgYW5kIGlzQ2hhbmdlZCBlcSAndHJ1ZSddXCIsbW9kZWwse30pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBhdHRhY2hlbWVudHNUb1Byb2Nlc3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBvbD0wO29sPGZpbGVzLmxlbmd0aDtvbCsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWxlc09iaj1maWxlc1tvbF07ICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihmaWxlc09iai5taW1lID09ICdpbWFnZS9qcGVnJyB8fCBmaWxlc09iai5taW1lID09ICdpbWFnZS9wbmcnKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5wdXNoKHsgXCJkYXRhXCI6IGZpbGVzT2JqLmZpbGVEYXRhLnN1YnN0cmluZyhmaWxlc09iai5maWxlRGF0YS5pbmRleE9mKCdiYXNlNjQnKSs3KSwgXCJpZFwiOiBmaWxlc09iai51dWlkICwgXCJtaW1lXCI6IGZpbGVzT2JqLm1pbWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5wdXNoKHsgXCJkYXRhXCI6IGZpbGVzT2JqLmZpbGVEYXRhLCBcImlkXCI6IGZpbGVzT2JqLnV1aWQgLCBcIm1pbWVcIjogZmlsZXNPYmoubWltZSB9KTsgXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlc09iai5maWxlRGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlc09iai5pc0NoYW5nZWQgPSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBhbGxGaWxlcyA9IEpTT04ueHBhdGgoXCIvLypbZmlsZURhdGEgbmUgJycgYW5kIHV1aWQgbmUgJyddXCIsbW9kZWwse30pO1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIG9sPTA7b2w8YWxsRmlsZXMubGVuZ3RoO29sKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsRmlsZXNbb2xdLmZpbGVEYXRhID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfSAgIFxuXG4gICAgICAgICAgICAgICAgdmFyIHNhdmVBdHRhY2htZW50cyA9IGZ1bmN0aW9uKGRhdGEsIGxvb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZGFvLnNhdmVBdHRhY2htZW50KGRhdGEuaWQsIGRhdGEucmV2LCBhdHRhY2hlbWVudHNUb1Byb2Nlc3NbbG9vcF0uZGF0YSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hlbWVudHNUb1Byb2Nlc3NbbG9vcF0ubWltZSwgYXR0YWNoZW1lbnRzVG9Qcm9jZXNzW2xvb3BdLmlkKVxuICAgICAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRhY2hlbWVudHNUb1Byb2Nlc3MubGVuZ3RoID4gKGxvb3AgKyAxKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVBdHRhY2htZW50cyhlLCBsb29wICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2FuIG5vdCBzYXZlZCBhdHRhY2hlbW50IFwiICsgZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgcG9zdFNhdmUgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yTW9kZWwuZGVmYXVsdE1vZGVsLmF0b21JZChkb2N1bWVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dGFjaGVtZW50c1RvUHJvY2Vzcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlQXR0YWNobWVudHMoZGF0YSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoVVBEQVRFRF9DT0RFLCBVUERBVEVEX05BTUUsJ0RvY3VtZW50IHVwZGF0ZWQnLCBmYWxzZSwgZGF0YSwgbnVsbCwgbnVsbCApXG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIHNhdmVQYWNrZXQgPSBmdW5jdGlvbihmaW5hbFBrdCl7XG5cbiAgICAgICAgICAgICAgICAgICAgLy92YWxpZGF0ZSBvbmxpbmUgaGVyZVxuICAgICAgICAgICAgICAgICAgICBkYW8uc2F2ZShmaW5hbFBrdCkuZG9uZShwb3N0U2F2ZSkuZmFpbChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwLnNob3dNZXNzYWdlKFwiVW5hYmxlIHRvIHNhdmUgY2hhbmdlcyBkdWUgdG8gdmVyc2lvbiBjb25mbGljdC4gUGxlYXNlIHJlbG9hZCB0aGUgZm9ybSB0byBzZWUgdGhlIHJlY2VudCB1cGRhdGVzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmZlcmVkLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBkYW8uZ2V0KGluZGljYXRvck1vZGVsLmN1c3RvbU1vZGVsLnNldElkKCkrICdfJyt2ZXJzaW9uK1wiX2NvbmZpZ1wiKS5kb25lKGZ1bmN0aW9uKGNvbmZpZ0RvYyl7XG5cbiAgICAgICAgICAgICAgICAgICAgZG9jLm1vZGVsLnBlbmRpbmcuZGF0YVtpbmRpY2F0b3JNb2RlbC5jdXN0b21Nb2RlbC5zZXRJZCgpXSA9IG1vZGVsO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZG9jLm1vZGVsLnBlbmRpbmcuc3RhdHVzID0gRU5UUllfU1RBVFVTX1BFTkRJTkc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoY29uZmlnRG9jLm1vZGVyYXRpb24gIT0gdW5kZWZpbmVkICYmIGNvbmZpZ0RvYy5tb2RlcmF0aW9uLnJlcXVpcmVkID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5jb250cm9sLmRyYWZ0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSB1cGRhdGVkIGRhdGUgZmllbGRcbiAgICAgICAgICAgICAgICAgICAgZG9jLnVwZGF0ZWQgPSBtb21lbnQoKS5mb3JtYXQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBjb250cmlidXRvcnMgbGlzdFxuICAgICAgICAgICAgICAgICAgICBkb2MuY29udHJpYnV0b3JzLnB1c2goe1wibmFtZVwiOiBMT0NBTF9TRVRUSU5HUy5TRVNTSU9OLmZpcnN0TmFtZSArIFwiIFwiICsgTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5sYXN0TmFtZSxcInVzZXJJZFwiOiBMT0NBTF9TRVRUSU5HUy5TVUJTQ1JJUFRJT05TLnVzZXJJZCwgXCJ1c2VybmFtZVwiOiBMT0NBTF9TRVRUSU5HUy5TVUJTQ1JJUFRJT05TLnVzZXJuYW1lfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZG9jLm1vZGVsLnBlbmRpbmcudXNlciA9IHtcIm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU0VTU0lPTi5maXJzdE5hbWUgKyBcIiBcIiArIExPQ0FMX1NFVFRJTkdTLlNFU1NJT04ubGFzdE5hbWUsXCJ1c2VySWRcIjogTE9DQUxfU0VUVElOR1MuU1VCU0NSSVBUSU9OUy51c2VySWQsIFwidXNlcm5hbWVcIjogTE9DQUxfU0VUVElOR1MuU1VCU0NSSVBUSU9OUy51c2VybmFtZX07XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgZG9jdW1lbnQgaW4gdGhlIGRhdGFiYXNlIGkuZS4gbG9jYWwgUG91Y2hEQiBvciBDb3VjaGJhc2UgTGl0ZVxuICAgICAgICAgICAgICAgICAgICBkb2Muc291cmNlID0gXCJyZW1vdGVcIjtcblxuICAgICAgICAgICAgICAgICAgICBpZihjb25maWdEb2MucnVsZXMubGVuZ3RoID4gMCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19QRU5ESU5HX1JVTEVTO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGFvLnNhdmUoZG9jKS5kb25lKGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZl9wcm9jZXNzUnVsZXMgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NBbGxSdWxlcygwLGRvY3VtZW50SWQsIGluZGljYXRvck1vZGVsLCBjb25maWdEb2Mse1wicnVsZVN0YXR1c1wiOlwiXCJ9LGRlZl9wcm9jZXNzUnVsZXMpLmRvbmUoZnVuY3Rpb24oaW5Nb2RlbCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoaW5Nb2RlbC5ydWxlU3RhdHVzID09ICdSVUxFX0NPTVBMRVRFJyl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhby5nZXQoZG9jdW1lbnRJZCkuZG9uZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcucHJvY2Vzc2luZ1N0YXR1cy5zZXEgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLm1vZGVsLnBlbmRpbmcucHJvY2Vzc2luZ1N0YXR1cy5ydWxlU3RhdHVzID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19VUERBVEVEO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1RPRE86IEZpeCBFTlRSWV9TVEFUVVNfUkVBRFlfVE9fU1VCTUlUIGluIGRvY3VtZW50LiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihhcHAucHJvY2Vzc0lkICE9IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9jZXNzID0gSlNPTi54cGF0aChcIi9wcm9jZXNzZXNbc3ViUHJvY2Vzc0lkIGVxICdcIithcHAucHJvY2Vzc0lkK1wiJ11cIixkYXRhLHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHByb2Nlc3MubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc1swXS5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfUkVBRFlfVE9fU1VCTUlUOy8vIGNoZWNrIGhlcmUgdGhlIGluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGFja2V0KGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVqZWN0KCdFTlRSWV9TVEFUVVNfVVBEQVRFRCBmYWlsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihpbk1vZGVsLnJ1bGVTdGF0dXMgPT0gJ1JVTEVfU0VSVkVSJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkZXBlbmRlbnQgb25zZXJ2ZXIgcnVsZScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihpbk1vZGVsLnJ1bGVTdGF0dXMgPT0gJ1JVTEVfRVJST1InKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3J1bGUgZXJyb3IgZnJvbSBzb21ld2hlcmUnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVqZWN0KCdwcm9jZXNzQWxsUnVsZXMgZmFpbCBwcm9taXNlIGNhc2UgZmFpbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZWplY3QoJ0VOVFJZX1NUQVRVU19QRU5ESU5HX1JVTEVTIGZhaWxlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfVVBEQVRFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGFja2V0KGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYucmVqZWN0KCdFTlRSWV9TVEFUVVNfVVBEQVRFRCBmYWlsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKXtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShlcnIuc3RhdHVzLCBlcnIubmFtZSwgZXJyLm1lc3NhZ2UsIHRydWUsIG51bGwsIG51bGwsIG51bGwpOyBcbiAgICAgICAgICAgICAgICAgICAgZGVmLnJlamVjdChyZXNwb25zZSk7ICAgICAgIFxuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGdldFJlc3BvbnNlKFNFUlZFUl9FUlJPUl9DT0RFLCBTRVJWRVJfRVJST1JfTkFNRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnU3RhdHVzIGlzIG5vdCBpbiAnKyBFTlRSWV9TVEFUVVNfREFUQV9JTklUSUFMSVNFRCArJyBvciAnKyBFTlRSWV9TVEFUVVNfVVBEQVRFRCArICcgc3RhdGUuJywgdHJ1ZSwgbnVsbCwgbnVsbCwgbnVsbCApO1xuICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7XG5cbiAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGdldFJlc3BvbnNlKGVyci5zdGF0dXMsIGVyci5uYW1lLCBlcnIubWVzc2FnZSwgdHJ1ZSwgbnVsbCwgbnVsbCwgbnVsbCk7IFxuICAgICAgICAgICAgZGVmLnJlamVjdChyZXNwb25zZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmO1xuICAgIH07XG5cbi8qKiBcbiAqIFJlcHJlc2VudHMgdGhlIGF1dGhvcmlzZSAgZnVuY3Rpb24uXG4gKiBVcGR0YXRlcyB0aGUgY3VycmVudCBkb2N1bWVudCBwZW5kaW5nIHdpdGggc3RhdHVzIEF1dGhvcmlzZWQuXG4gKiBDb3BpZWQgdGhlIGRhdGEgdG8gYXV0aG9yaXNlZCBhcnJheSBvZiBhdXRob3Jpc2VkIGRvY3VtZW50LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtzdHJpbmd9IGRvY3VtZW50SWQgLSBkb2N1bWVudCBpZCB3aGljaCBuZWVkcyB0byBiZSBpbml0aWFsaXNlZFxuIFxuICogQGF1dGhvciBIYXNhbiBBYmJhc1xuICogQHZlcnNpb24gMS4wLjBcbiAqXG4gKiBAZXhhbXBsZSBcbiAqIHZhciBnYXRla2VlcGVyID0gbmV3IEdLKCk7XG4gKiBnYXRla2VlZXIuYXV0aG9yaXNlKCdhYmMxNjEnKVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gUHJvbWlzZSBPYmplY3Qgd2l0aCByZXNwb3NlIE9iamVjdFxuICpcbiAqL1xuXG5HSy5wcm90b3R5cGUuYXV0aG9yaXNlID0gZnVuY3Rpb24oZG9jdW1lbnRJZCl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWYgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgIGlmKGRvY3VtZW50SWQgIT0gbnVsbCAmJiAgZG9jdW1lbnRJZCAhPSB1bmRlZmluZWQgJiYgZG9jdW1lbnRJZCAhPSAnJyl7XG5cbiAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKGZ1bmN0aW9uKGRhdGEpe1xuXG5cbiAgICAgICAgICAgIGlmKGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPT0gRU5UUllfU1RBVFVTX1VQREFURUQpe1xuXG4gICAgICAgICAgICAgICAgdmFyIHNhdmVEb2MgPSBmdW5jdGlvbihkb2Mpe1xuICAgICAgICAgICAgICAgICAgICAgICBkYW8uc2F2ZShkb2MpLmRvbmUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ocyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICkuZmFpbChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgIHZhciBzZXRJZCA9IGRhdGEuY2F0ZWdvcnkudGVybTtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IGRhdGEubW9kZWwucGVuZGluZztcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGV2YWwocGF0aCk7XG4gICAgICAgICAgICAgICAgZGF0YS5tb2RlbC5wZW5kaW5nLnN0YXR1cyA9IEVOVFJZX1NUQVRVU19BVVRIT1JJU0VEO1xuICAgICAgICAgICAgICAgIHNhdmVEb2MoZGF0YSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXBwcm92ZV9kb2NfaWQgPSBkb2N1bWVudElkKyc6YXBwcm92ZWQnO1xuXG4gICAgICAgICAgICAgICAgZGFvLmdldChhcHByb3ZlX2RvY19pZCkuZG9uZShmdW5jdGlvbihhcHByb3ZlRGF0YSl7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBhcHByb3ZlRGF0YS5tb2RlbC5hcHByb3ZlZC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICBzYXZlRG9jKGFwcHJvdmVEYXRhKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIGRlZi5yZXNvbHZlKGFwcHJvdmVEYXRhKTtcbiAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoQkFEX1JFUVVFU1RfQ09ERSwgQkFEX1JFUVVFU1RfTkFNRSwnU3RhdHVzIG5vdCBpbiB1cGRhdGVkIHN0YXRlJyx0cnVlLG51bGwsbnVsbCxudWxsIClcbiAgICAgICAgICAgICAgICBkZWYucmVqZWN0KHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBcblxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7XG5cbiAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoZXJyLnN0YXR1cywgZXJyLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSwgdHJ1ZSwgbnVsbCwgbnVsbCwgbnVsbCk7IFxuICAgICAgICAgICAgZGVmLnJlc29sdmUocmVzcG9uc2UpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfWVsc2V7XG5cbiAgICAgICAgdmFyIHJlc3BvbnNlID0gZ2V0UmVzcG9uc2UoQkFEX1JFUVVFU1RfQ09ERSwgQkFEX1JFUVVFU1RfTkFNRSwnRG9jdW1lbnQgSUQgaXMgYmxhbmsnLHRydWUsbnVsbCxudWxsLG51bGwgKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgZGVmLnJlamVjdChyZXNwb25zZSk7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmO1xuICAgXG59O1xuXG4vKiogXG4gKiBSZXByZXNlbnRzIHRoZSByZWplY3QgIGZ1bmN0aW9uLlxuICogVXBkdGF0ZXMgdGhlIGN1cnJlbnQgZG9jdW1lbnQgcGVuZGluZyB3aXRoIHN0YXR1cyBSZWpldGNlZC5cbiAqIENvcGllZCB0aGUgZGF0YSB0byBhdXRob3Jpc2VkIGFycmF5IG9mIHJlamVjdGVkIGRvY3VtZW50LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtzdHJpbmd9IGRvY3VtZW50SWQgLSBkb2N1bWVudCBpZCB3aGljaCBuZWVkcyB0byBiZSBpbml0aWFsaXNlZFxuIFxuICogQGF1dGhvciBIYXNhbiBBYmJhc1xuICogQHZlcnNpb24gMS4wLjBcbiAqXG4gKiBAZXhhbXBsZSBcbiAqIHZhciBnYXRla2VlcGVyID0gbmV3IEdLKCk7XG4gKiBnYXRla2VlZXIucmVqZWN0KCdhYmMxNjEnKVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gUHJvbWlzZSBPYmplY3Qgd2l0aCByZXNwb3NlIE9iamVjdFxuICpcbiAqL1xuXG5HSy5wcm90b3R5cGUucmVqZWN0ID0gZnVuY3Rpb24oZG9jdW1lbnRJZCl7XG4gICAgXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWYgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgIGlmKGRvY3VtZW50SWQgIT0gbnVsbCAmJiAgZG9jdW1lbnRJZCAhPSB1bmRlZmluZWQgJiYgZG9jdW1lbnRJZCAhPSAnJyl7XG5cbiAgICAgICAgXG5cbiAgICAgICAgZGFvLmdldChkb2N1bWVudElkKS5kb25lKGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgICAgICAgICBpZihkYXRhLm1vZGVsLnBlbmRpbmcuc3RhdHVzID09IEVOVFJZX1NUQVRVU19VUERBVEVEKXtcblxuICAgICAgICAgICAgICAgIHZhciBzYXZlRG9jID0gZnVuY3Rpb24oZG9jKXtcbiAgICAgICAgICAgICAgICAgICAgICAgZGFvLnNhdmUoZG9jKS5kb25lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKS5mYWlsKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgdmFyIHNldElkID0gZGF0YS5jYXRlZ29yeS50ZXJtO1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gZXZhbCgnZGF0YS5tb2RlbC5wZW5kaW5nLmRhdGEnK3NldElkKTtcblxuICAgICAgICAgICAgICAgIGRhdGEubW9kZWwucGVuZGluZy5zdGF0dXMgPSBFTlRSWV9TVEFUVVNfUkVKRUNURUQ7XG4gICAgICAgICAgICAgICAgc2F2ZURvYyhkYXRhKTtcblxuICAgICAgICAgICAgICAgIHZhciByZWplY3RlZF9kb2NfaWQgPSBkb2N1bWVudElkKyc6cmVqZWN0ZWQnO1xuXG4gICAgICAgICAgICAgICAgZGFvLmdldChyZWplY3RlZF9kb2NfaWQpLmRvbmUoZnVuY3Rpb24ocmVqZWN0ZWREYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdGVkRGF0YS5tb2RlbC5yZWplY3RlZC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICBzYXZlRG9jKHJlamVjdGVkRGF0YSk7XG5cblxuICAgICAgICAgICAgICAgICAgICBkZWYucmVzb2x2ZShyZWplY3RlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShCQURfUkVRVUVTVF9DT0RFLCBCQURfUkVRVUVTVF9OQU1FLCdTdGF0dXMgbm90IGluIHVwZGF0ZWQgc3RhdGUnLHRydWUsbnVsbCxudWxsLG51bGwgKVxuICAgICAgICAgICAgICAgIGRlZi5yZWplY3QocmVzcG9uc2UpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFxuXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyKXtcblxuICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShlcnIuc3RhdHVzLCBlcnIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlLCB0cnVlLCBudWxsLCBudWxsLCBudWxsKTsgXG4gICAgICAgICAgICBkZWYucmVzb2x2ZShyZXNwb25zZSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9ZWxzZXtcblxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBnZXRSZXNwb25zZShCQURfUkVRVUVTVF9DT0RFLCBCQURfUkVRVUVTVF9OQU1FLCdEb2N1bWVudCBJRCBpcyBibGFuaycsdHJ1ZSxudWxsLG51bGwsbnVsbCApXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBkZWYucmVqZWN0KHJlc3BvbnNlKTtcblxuICAgIH1cblxuICAgIHJldHVybiBkZWY7XG5cbn07XG5cbnZhciBwcm9jZXNzSW5pdGlhbGlzZVJ1bGUgPSBmdW5jdGlvbihkb2N1bWVudElkLCBydWxlT2JqLCBpbmRpY2F0b3JNb2RlbCl7XG4gICAgXG59O1xuXG52YXIgcHJvY2Vzc1VuaXF1ZVJ1bGUgPSBmdW5jdGlvbihkb2N1bWVudElkLCBydWxlT2JqLCBpbmRpY2F0b3JNb2RlbCl7XG5cbn07XG5cbkdLLnByb3RvdHlwZS51bmxvY2sgPSBmdW5jdGlvbih2YWwpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBVc2UgdGhlIG5hdGl2ZSBQcm9taXNlIGNvbnN0cnVjdG9yXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIFxuICAgICAgXG5cbiAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR0s7Il19

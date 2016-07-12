'use strict';

/**

entryWrapper
approvedWrapper
rejectedWrapper

All these functions are using 
_ENTRY
_APPROVED
_REJECTED
 files .

 Change in transformer is required for this.
*/

var library = (function(){
 
  
  return {

    entryWrapper: function(setId, profileId, documentId, validDate){

    	var dfd = new $.Deferred();
    	//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
        var entryId = setId + '_'+version+'_ENTRY';
        dao.get(setId+ '_'+version+"_config")
        .done(function(setConfig){

	        dao.get(entryId)
	        .done(function(wrapper){
	        	
	        	wrapper._id = documentId;
	        	delete wrapper._rev;
	        	eval('delete wrapper.model.pending.data.'+setId);
	        	wrapper.type = "indicator";
	        	if(setConfig.moderation != undefined && setConfig.moderation.required == true)
				{
					wrapper.control.draft = true;
				}
				//wrapper.title = documentId;

				wrapper["channels"] = [];
				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel == true)
				{
					wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
				}

				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel == true && setId != PROFILE_SET_ID)
				{
					wrapper.channels.push("profile_"+profileId);
				}

				wrapper['meta-data'].profileId = profileId;
				wrapper['meta-data'].setId = setId;
				wrapper['meta-data'].applicationId = app.SCOPE.applicationId;
				wrapper['meta-data'].communityId = LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId;

				wrapper.updated = moment().format();
				wrapper.model.pending.user = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.author = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.contributors.push({"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username});
				wrapper.category.term = setId;
				wrapper.source = "remote";
				wrapper.created = moment().format();
				wrapper.model.pending.status = ENTRY_STATUS_INITIALISED;
				wrapper.model.pending.seq = 1;
				wrapper.model.pending.validDate = validDate;

				service.getGPS().done(function(gpsData){

			 		wrapper.gps = gpsData;
			 		dfd.resolve(wrapper);

			 	}).fail(function(err){
			 		
			 		wrapper.gps = {};
			 		dfd.resolve(wrapper);
			 	});


	        })
	        .fail(function(e){dfd.reject(e);});
	    })
	    .fail(function(e){dfd.reject(e);});
	   
      	return dfd.promise();
     

    },
    approvedWrapper: function(setId, profileId, documentId){

    	var dfd = new $.Deferred();
    	//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
        var entryId = setId + '_'+version+'_APPROVED';
        dao.get(setId+ '_'+version+"_config")
        .done(function(setConfig){

	        dao.get(entryId)
	        .done(function(wrapper){
	        	
	        	wrapper._id = documentId;
	        	delete wrapper._rev;
	        	wrapper.type = "indicator";
	        	if(setConfig.moderation != undefined && setConfig.moderation.required == true)
				{
					wrapper.control.draft = true;
				}
				wrapper.title = documentId+'_APPROVED';

				wrapper["channels"] = [];
				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel == true)
				{
					wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
				}

				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel == true && setId != PROFILE_SET_ID)
				{
					wrapper.channels.push("profile_"+profileId);
				}

				wrapper['meta-data'].profileId = profileId;
				wrapper['meta-data'].setId = setId;
				wrapper['meta-data'].applicationId = app.SCOPE.applicationId;
				wrapper['meta-data'].communityId = LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId;

				wrapper.updated = moment().format();
				//wrapper.model.workspace.user = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.author = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.contributors.push({"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username});
				wrapper.category.term = setId;
				wrapper.source = "remote";
				wrapper.created = moment().format();
				

				
				service.getGPS().done(function(gpsData){

			 		wrapper.gps = gpsData;
			 		dfd.resolve(wrapper);

			 	}).fail(function(err){
			 		
			 		wrapper.gps = {};
			 		dfd.reject(err);
			 	});


	        })
	        .fail(function(e){dfd.reject(e);});
	    })
	    .fail(function(e){dfd.reject(e);});
	   
      	return dfd.promise();
     

    },
	rejectedWrapper: function(setId, profileId, documentId){

    	var dfd = new $.Deferred();
    	//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
        var entryId = setId + '_'+version+'_REJECTED';
        dao.get(setId+ '_'+version+"_config")
        .done(function(setConfig){

	        dao.get(entryId)
	        .done(function(wrapper){
	        	
	        	wrapper._id = documentId;
	        	delete wrapper._rev;
	        	wrapper.type = "indicator";
	        	if(setConfig.moderation != undefined && setConfig.moderation.required == true)
				{
					wrapper.control.draft = true;
				}
				wrapper.title = documentId+'_REJECTED';

				wrapper["channels"] = [];
				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.communityChannel == true)
				{
					wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
				}

				if(LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel != undefined &&
					LOCAL_SETTINGS.COMMUNITY_CONFIG.profileChannel == true && setId != PROFILE_SET_ID)
				{
					wrapper.channels.push("profile_"+profileId);
				}

				wrapper['meta-data'].profileId = profileId;
				wrapper['meta-data'].setId = setId;
				wrapper['meta-data'].applicationId = app.SCOPE.applicationId;
				wrapper['meta-data'].communityId = LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId;

				wrapper.updated = moment().format();
				//wrapper.model.workspace.user = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.author = {"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username};
				wrapper.contributors.push({"name": LOCAL_SETTINGS.SESSION.firstName + " " + LOCAL_SETTINGS.SESSION.lastName,"userId": LOCAL_SETTINGS.SUBSCRIPTIONS.userId, "username": LOCAL_SETTINGS.SUBSCRIPTIONS.username});
				wrapper.category.term = setId;
				wrapper.source = "remote";
				wrapper.created = moment().format();
				

				

				service.getGPS().done(function(gpsData){

			 		wrapper.gps = gpsData;
			 		dfd.resolve(wrapper);

			 	}).fail(function(err){
			 		
			 		wrapper.gps = {};
			 		dfd.reject(err);
			 	});


	        })
	        .fail(function(e){dfd.reject(e);});
	    })
	    .fail(function(e){dfd.reject(e);});
	   
      	return dfd.promise();
     

    },

    saveEntries: function(setId, profileId, documentId, validDate){
    		
    		var def = new $.Deferred();
            var mainModel = library.entryWrapper(setId, profileId, documentId, validDate).done(
                function(mainDoc){
                    // doc created
                    var approveModel = function(){

                        var def = new $.Deferred();
                    
                        var approve_doc_id = documentId+':approved';
                        library.approvedWrapper(setId, profileId, approve_doc_id).done(
                            function(data){
                                //approve model created
                                def.resolve(data);
                            }
                        ).fail(
                            function(err){
                                def.reject(err);
                            }
                        );

                        return def;

                    };

                    var rejectedModel = function(){

                        var def = new $.Deferred();
                    
                        var rejected_doc_id = documentId+':rejected'
                        var rejectedModel = library.rejectedWrapper(setId, profileId, rejected_doc_id).done(
                            function(data){
                                //rejected model created
                                def.resolve(data);
                            }
                        ).fail(
                            function(err){
                                def.reject(err);
                            }
                        );    
                        return def;
                    };

                    var getResponse = function(status, name, message, error, model){
					    var response = {
				                            status: status,
				                            name: name,
				                            message: message,
				                            error: error,
				                            model: model
					                }
					    return  response
				    }

                    approveModel().done(
                        function(responseFromApprove){

                            rejectedModel().done(function(responseFromreject){

								var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
                                       'Model created', false, mainDoc);

	                        	var approveRes = getResponse(CREATED_CODE, CREATED_NAME,
	                                       'Approved created', false, responseFromApprove);

								var rejectedRes = getResponse(CREATED_CODE, CREATED_NAME,
	                                       'Rejected created', false, responseFromreject);

	                        	var responseArray = [mainRes, approveRes, rejectedRes];
	                    
	                   			def.resolve(responseArray);                                 
                               

                            }).fail(function(errorFromReject){

                            	var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
                                       'Model created', false, mainDoc);

	                        	var approveRes = getResponse(CREATED_CODE, CREATED_NAME,
	                                       'Approved created', false, responseFromApprove);

								var rejectedRes = getResponse(err.status, err.name,
                                    'Rejected object not created with error message '+err.message, true, null);

	                        	var responseArray = [mainRes, approveRes, rejectedRes];
	                    
	                   			def.reject(responseArray);

                            });

                            
                        }).fail(
                            function(errorFromApprove){
                               
                                var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
                                       'Model created', false, mainDoc);

	                        	var approveRes =  getResponse(err.status, err.name,
                                    'Approved object not created '+err.message, true, null)

								var rejectedRes = getResponse(err.status, err.name,
                                    'Rejected object creation skipped due to approve creation failure'+ err.message, true, null);

	                        	var responseArray = [mainRes, approveRes, rejectedRes];
	                    
	                   			def.reject(responseArray);

                            }
                    );

            }).fail(function(err){
            
                var mainRes = getResponse(err.status, err.name,
                    'Model object not created '+err.message, true, null);

            	var approveRes =  getResponse(err.status, err.name,
                    'Approved object not created skipped due to model creation failure '+err.message, true, null)

				var rejectedRes = getResponse(err.status, err.name,
                    'Rejected object creation skipped due to model creation failure'+ err.message, true, null);

            	var responseArray = [mainRes, approveRes, rejectedRes];
        
       			def.reject(responseArray);

            });


            return def;
     

    },

    createProfileInstance: function(){

      //Create instance of standard profile type indicator
      //Create roles file and give roles to current user
      //Create indicator registry file

    }


  };

})();


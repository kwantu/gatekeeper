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

	getGPS: function(){
	 	
		return new Promise(function(resolve, reject) {

			var onSuccess = function(position) {
				
			    resolve({

			    	"latitude" :  position.coords.latitude,
			    	"longitude" : position.coords.longitude,
			    	"accuracy" : position.coords.accuracy,
			    	"Timestamp" : position.timestamp

			    });

			};
			function onError(error) {
				
				deffered.reject(error);
			}

			var positionOption = { timeout: 2000 };
			navigator.geolocation.getCurrentPosition(onSuccess, onError, positionOption);
			return deffered;





		});


	 	
	},
	

    entryWrapper: function(setId, profileId, documentId, validDate){

    	return new Promise(function(resolve, reject) {
			try {

				//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
		    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
		        var entryId = setId + '_'+version;
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
						wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
						wrapper.channels.push("profile_"+profileId);
						wrapper.channels.push("application_"+app.SCOPE.applicationId);
						wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId+"_application_"+app.SCOPE.applicationId);
						

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
					 		resolve(wrapper);

					 	}).fail(function(err){
					 		
					 		wrapper.gps = {};
					 		resolve(wrapper);
					 	});


			        })
			        .fail(function(e){reject(e);});
			    })
			    .fail(function(e){reject(e);});
		} catch(err){
			 reject(err);
		}
	});


    	
     

    },
    approvedWrapper: function(setId, profileId, documentId){

    	return new Promise(function(resolve, reject) {
			try {

				//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
			    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
			        var entryId = setId + '_'+version;
			        dao.get(setId+ '_'+version+"_config")
			        .done(function(setConfig){

				        dao.get(entryId)
				        .done(function(wrapper){
				        	
				        	wrapper._id = documentId;
				        	delete wrapper._rev;
				        	delete wrapper.model.pending;
				        	wrapper.model.approved = [];
				        	wrapper.type = "indicator";
				        	if(setConfig.moderation != undefined && setConfig.moderation.required == true)
							{
								wrapper.control.draft = true;
							}
							wrapper.title = documentId+'_APPROVED';

							wrapper["channels"] = [];

							wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
							wrapper.channels.push("profile_"+profileId);



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
						 		resolve(wrapper);

						 	}).fail(function(err){
						 		
						 		wrapper.gps = {};
						 		resolve(wrapper);
						 	});


				        })
				        .fail(function(e){reject(e);});
				    })
				    .fail(function(e){reject(e);});

				} catch(err){
					 reject(err);
				}
			});


    	
     

    },
	rejectedWrapper: function(setId, profileId, documentId){

		return new Promise(function(resolve, reject) {
			try {	

				//var version = eval('app.SCOPE.APP_CONFIG.indicator.'+setId+'.version');
    	var version =  JSON.xpath("/indicators[setId eq '"+setId+"']/version",app.SCOPE.APP_CONFIG,{});
        var entryId = setId + '_'+version;
        dao.get(setId+ '_'+version+"_config")
        .done(function(setConfig){

	        dao.get(entryId)
	        .done(function(wrapper){
	        	
	        	wrapper._id = documentId;
	        	delete wrapper._rev;
	        	delete wrapper.model.pending;
				wrapper.model.rejected = [];
	        	wrapper.type = "indicator";
	        	if(setConfig.moderation != undefined && setConfig.moderation.required == true)
				{
					wrapper.control.draft = true;
				}
				wrapper.title = documentId+'_REJECTED';

				wrapper["channels"] = [];

				wrapper.channels.push("community_"+LOCAL_SETTINGS.COMMUNITY_CONFIG.communityId);
				wrapper.channels.push("profile_"+profileId);
				

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
			 		resolve(wrapper);

			 	}).fail(function(err){
			 		
			 		wrapper.gps = {};
			 		resolve(wrapper);
			 	});


	        })
	        .fail(function(e){reject(e);});
	    })
	    .fail(function(e){reject(e);});

			} catch(err){
				 reject(err);
			}
		});


    	
     

    },

    saveEntries: function(setId, profileId, documentId, validDate){
    		
    		return new Promise(function(resolve, reject) {
				try {
					var getResponse = function(status, name, message, error, model){
								    var response = {
				                            status: status,
				                            name: name,
				                            message: message,
				                            error: error,
				                            model: model
					                };
					    return  response;
				    };

				   var mainModel = library.entryWrapper(setId, profileId, documentId, validDate).then(

			                function(mainDoc){
			                    // doc created
			                    var approveModel = function(){

			                    	return new Promise(function(res, rej) {
			                    
				                        var approve_doc_id = documentId+':approved';
				                        library.approvedWrapper(setId, profileId, approve_doc_id).then(
				                            function(data){
				                                //approve model created
				                                res(data);
				                            }, function(err){
				                                rej(err);
				                            }
				                        );
				                    });
			                    };

			                    var rejectedModel = function(){

			                    	return new Promise(function(res, rej) {                   
				                        var rejected_doc_id = documentId+':rejected'
				                        var rejectedModel = library.rejectedWrapper(setId, profileId, rejected_doc_id).then(
				                            function(data){
				                                //rejected model created
				                                res(data);
				                            },  function(err){
				                                rej(err);
				                            }
				                        );   

			                    	});
			                    };

			                    

			                    approveModel().then(
			                        function(responseFromApprove){

			                            rejectedModel().then(function(responseFromreject){

											var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
			                                       'Model created', false, mainDoc);

				                        	var approveRes = getResponse(CREATED_CODE, CREATED_NAME,
				                                       'Approved created', false, responseFromApprove);

											var rejectedRes = getResponse(CREATED_CODE, CREATED_NAME,
				                                       'Rejected created', false, responseFromreject);

				                        	var responseArray = [mainRes, approveRes, rejectedRes];
				                    
				                   			resolve(responseArray);                                 
			                               

			                            }, function(errorFromReject){

			                            	var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
			                                       'Model created', false, mainDoc);

				                        	var approveRes = getResponse(CREATED_CODE, CREATED_NAME,
				                                       'Approved created', false, responseFromApprove);

											var rejectedRes = getResponse(errorFromReject.status, errorFromReject.name,
			                                    'Rejected object not created with error message '+errorFromReject.message, true, null);

				                        	var responseArray = [mainRes, approveRes, rejectedRes];
				                    
				                   			reject(responseArray);

			                            });

			                            
			                        }, function(errorFromApprove){
			                               
			                                var mainRes = getResponse(CREATED_CODE, CREATED_NAME,
			                                       'Model created', false, mainDoc);

				                        	var approveRes =  getResponse(errorFromApprove.status, errorFromApprove.name,
			                                    'Approved object not created '+errorFromApprove.message, true, null)

											var rejectedRes = getResponse(errorFromApprove.status, errorFromApprove.name,
			                                    'Rejected object creation skipped due to approve creation failure'+ errorFromApprove.message, true, null);

				                        	var responseArray = [mainRes, approveRes, rejectedRes];
				                    
				                   			reject(responseArray);

			                            });

			            }, function(err){
			            
		                var mainRes = getResponse(err.status, err.name,
		                    'Model object not created '+err.message, true, null);

		            	var approveRes =  getResponse(err.status, err.name,
		                    'Approved object not created skipped due to model creation failure '+err.message, true, null)

						var rejectedRes = getResponse(err.status, err.name,
		                    'Rejected object creation skipped due to model creation failure'+ err.message, true, null);

		            	var responseArray = [mainRes, approveRes, rejectedRes];
		        
		       			reject(responseArray);

		            });
		
		} catch(err){
			 reject(err);
		}
	});


    		

            
     

    },

    createProfileDocuments: function(communityId, profileId){

	  	var channels = [];
	  	channels.push("community_"+communityId);
	  	channels.push("profile_"+profileId);

	  	var registry = 
	  	{
	  		"_id": profileId + ":indicatorInstanceRegistry",
	  		"channels": channels,
	  		"communityId": communityId,
	  		"indicator": [],
	  		"profileId": profileId,
	  		"type": "indicatorInstanceRegistry"
	  	};

	  	var roles =
	  	{
	  		"_id": profileId + ":roles",
	  		"channels": channels,
	  		"roles": [
	  		{
	  			"id": "Owner",
	  			"name": "Owner",
	  			"user": [
	  			]
	  		},
	  		{
	  			"id": "Capturer",
	  			"name": "Capturer",
	  			"user": [
	  			]
	  		},
	  		{
	  			"id": "Guest",
	  			"name": "Guest",
	  			"user": [
	  			]
	  		},
	  		{
	  			"id": "Authoriser",
	  			"name": "Authoriser",
	  			"user": [
	  			]
	  		}
	  		],
	  		"type": "profileRoles"
	  	};


	  



	  	dao.save(registry);
	  	dao.save(roles);
	  	

	  }


  };

})();



var globalurl = '';
var masterDB;
var localDB;
var taxonomyDB;
var authenticatedToSyncGateway = false;


// Data Access Object / Module
var dao = (function(){
  

  //DBNAME + DB_IDENTIFIER is local database name, do not get confused with BUCKET
  
  return {

    // Get a document from the databases
    authenticateToSyncGateway: function(username, password){
      //alert('Test'+username + password);
      var dfd = new $.Deferred();


      var url = 'http://' + COUCHBASE_SERVER + '/' + TAXONOMY_BUCKET + "/_session";
      var method = "POST";
      var postData = JSON.stringify({
        "name": username, "password": password
      });

      var async = true;

      var request = new XMLHttpRequest();
      request.withCredentials = true;

      request.onload = function () {

       var status = request.status; 
       var data = request.responseText; 
       
     }

     request.open(method, url, async);

     request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

     request.send(postData);




     var url = 'http://' + COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET + "/_session";
     var method = "POST";
     var postData = JSON.stringify({
      "name": username, "password": password
    });

     var async = true;

     var request = new XMLHttpRequest();
     request.withCredentials = true;

     request.onload = function () {

       var status = request.status; 
       var data = request.responseText; 
       if(status == 200)
       {
        authenticatedToSyncGateway = true;
        dfd.resolve(data);
      }
      else
      {
        dfd.reject(data);
      }
    }

    request.open(method, url, async);

    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    request.send(postData);

    return dfd.promise();

  },

  get: function(docId){
    
    var dfd = new $.Deferred();
    try{
       //console.log("Fetching object == "+docId);
       
       if (head.mobile && isCordovaApp) {


        cordova.exec(function(data){
          
          dfd.resolve(data);
          
        }, function(e){
          dfd.reject(e)
        }, 'CBLite', 'getDocument',
        [{"dbname": DBNAME + DB_IDENTIFIER, "docId": docId}]
        );

        
      } else {
        
       localDB.get(docId)
       .then(function(data){
        dfd.resolve(data);
      }).catch(function(err){ 
        console.log("Desktop - error in getting document with id: " + docId + ". Error stacktrace: " + err);
        dfd.reject(err);
        return err;
      });
      
    }
  }catch(e)
  {
    dfd.reject(e);
  }
  return dfd.promise();
},

getTaxonomy: function(docId){
  
  var dfd = new $.Deferred();
  
       //console.log("Fetching object == "+docId);
       
       if (head.mobile && isCordovaApp) {

        cordova.exec(function(data){
          
          dfd.resolve(data);
          
        }, function(e){
          dfd.reject(e)
        }, 'CBLite', 'getDocument',
        [{"dbname": TAXONOMY_DBNAME + DB_IDENTIFIER, "docId": docId}]
        );
        
        
      } else {
        
       taxonomyDB.get(docId)
       .then(function(data){
        dfd.resolve(data);
      }).catch(function(err){ 
        console.log("Desktop - error in getting taxonomy with id: " + docId + ". Error stacktrace: " + err);
        dfd.reject(err);
        return err;
      });
      
    }
    
    return dfd.promise();
  },
  
    //Save the document into the database
    save: function(doc){
      // console.log("Saving == "+doc._id);
      var dfd = new $.Deferred();
      
      if (head.mobile && isCordovaApp) {

        if(doc._id.indexOf('_design') != 0)
        {
          cordova.exec(function(data){
            
            dfd.resolve(data);
            
          }, function(e){
            dfd.reject(e)
          }, 'CBLite', 'saveDocument',
          [{"dbname": DBNAME + DB_IDENTIFIER, "docId": doc._id, "doc":doc}]
          );
        }
        else
        {

          var options = {
            url: globalurl + DBNAME + DB_IDENTIFIER + "/" + doc._id,
            type: "PUT",
            data:  JSON.stringify(doc),
            dataType: "json",
            contentType: "application/json"
          };
          
          $.ajax(options)
          .done(function(data, textStatus, xhr){
            dfd.resolve(data);
          })
          .fail(function(xhr, textStatus, errorThrown){
            console.log("Mobile - error in saving document with id: " + doc._id + ". URL: " + globalurl + DBNAME + DB_IDENTIFIER + " Error stacktrace: " + JSON.stringify(xhr));
            dfd.reject(xhr.responseText);
          });

        }

        
        
        
      } else {
        
        localDB.put(doc)
        .then(function(data){
          dfd.resolve(data);
        }).catch(function(err){ 
          console.log("Desktop - error in saving document with id: " + doc._id + ". Error stacktrace: " + err);
          dfd.reject(err);
        });
      }
      
      return dfd.promise();
    },

    saveAttachment :function(docId, revId, attachemnt, mimeType, attachemntName){
      var dfd = new $.Deferred();
      
      if (head.mobile && isCordovaApp) {

        blobUtil.base64StringToBlob(attachemnt, mimeType).then(function (blob) {
          
          var oReq = new XMLHttpRequest();

          oReq.open("PUT", globalurl + DBNAME + DB_IDENTIFIER + "/" + docId + "/" + attachemntName + "?rev=" + revId, true);
          
          oReq.onload = function (oEvent) {

            dfd.resolve(JSON.parse(oReq.responseText));
          };

          
          oReq.send(blob);


        }).catch(function (err) {
          console.log(err);
          dfd.reject(xhr.responseText);
        });
        
        


      } else {
        // Perform operation on the PouchDB database
        
        localDB.putAttachment(docId, attachemntName, revId, attachemnt, mimeType)
        .then(function(data){
          dfd.resolve(data);
        }).catch(function(err){ 
          console.log("Desktop -error in saving attachment to the document with id: " + docId + ". Error stacktrace: " + err);
          dfd.reject(err);
        });
        
        
      }
      return dfd.promise();
    },
    
    getAttachment :function(docId, revId, attachemntName){

      var dfd = new $.Deferred();

      if (head.mobile && isCordovaApp) {
        // Perform operation on the Couchbase Lite database

        var xhr = new XMLHttpRequest();
        xhr.open('GET', globalurl + DBNAME + DB_IDENTIFIER + "/" + docId + "/" + attachemntName, true);
        xhr.responseType = 'blob';

        xhr.onload = function(e) {
          if (this.status == 200) {
            
            var blob = xhr.response;

            blobUtil.blobToBase64String(blob).then(function (base64String) {

              dfd.resolve(base64String);

            }).catch(function (err) {

              console.log("Mobile - error in getting attachment to the document with id: " + docId + ". Error stacktrace: " + err);
              dfd.reject(xhr);

            });

          }
          else{
            console.log("Mobile - error in getting attachment to the document with id: " + docId);
            dfd.reject(xhr);
          }
        };

        xhr.send();

        
      } else {
        // Perform operation on the PouchDB database
        localDB.getAttachment(docId, attachemntName)
        .then(function (blobOrBuffer) {
          
         blobUtil.blobToBase64String(blobOrBuffer).then(function (binaryString) {
          dfd.resolve(binaryString);
        }).catch(function (err) {
         dfd.reject(err);
       });

      }).catch(function (err) {
       console.log("Desktop -error in getting attachment to the document with id: " + docId + ". Error stacktrace: " + err);
       dfd.reject(err);
     });
    }
    return dfd.promise(); 
  },
  
  deleteAttachment :function(docId, revId, attachemntName){
   var dfd = new $.Deferred();
   if (head.mobile && isCordovaApp) {
        // Perform operation on the Couchbase Lite database
        var options = {
          url: globalurl + DBNAME + DB_IDENTIFIER + "/" + docId + "/" + attachemntName + "?rev=" + revId,
          type: "DELETE",
          dataType: "json"
        };
        
        $.ajax(options)
        .done(function(data, textStatus, xhr){
          dfd.resolve(data);
        })
        .fail(function(xhr, textStatus, errorThrown){
          console.log("Mobile - error in deleting attachment to the document with id: " + docId + ". Error stacktrace: " + JSON.stringify(xhr));
          dfd.reject(xhr.responseText);
        });
      } else {
          // Check if the data exists in the local PouchDB
          localDB.removeAttachment(docId, attachemntName, revId)
          .then(function (result) {
            dfd.resolve(result);
          }).catch(function (err) {
            console.log("Desktop - error in deleting attachment to the document with id: " + docId + ". Error stacktrace: " + JSON.stringify(xhr));
            dfd.reject(err);
          });
        }
        return dfd.promise();
      },
      
      upsert: function(document){ 

        var dfd = new $.Deferred();
        
        var sCB = function(doc){
          
          document._rev = doc._rev;
          
          dao.save(document)
          .done(function(s){dfd.resolve(s)})
          .fail(function(e){dfd.reject(e)});
          
        }
        
        var eCB = function(err){ 
          dao.save(document)
          .done(function(s){console.log(s);dfd.resolve(s);})
          .fail(function(e){dfd.reject(e)});
        }
        
        dao.get(document._id)
        .done(sCB)
        .fail(eCB);
        
        return dfd.promise(); 
      },
      
      startPull: function(){

        var dfd = new $.Deferred();
        
        var syncUsername = LOCAL_SETTINGS.SUBSCRIPTIONS.syncUsername;
        var syncPassword = LOCAL_SETTINGS.SUBSCRIPTIONS.syncPassword;

        if (head.mobile && isCordovaApp) {

          cordova.exec(
            function(s){SYNC_SEQ = s; dfd.resolve(s)},
            function(e){dfd.reject(e)},
            'CBLite',
            'pull',
            [{"dbname": DBNAME + DB_IDENTIFIER, "url":'http://'+syncUsername+':'+syncPassword+'@'+COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET}]
            );
          
        }
        else{


          if(authenticatedToSyncGateway == false)
          {

            
            dao.authenticateToSyncGateway(syncUsername, syncPassword)
            .done(
             function (data)
             {

              
               localDB.replicate.from(new PouchDB('http://' + COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET, 
               { 
                ajax: { 
                  timeout: 60000
                }
              }), 
               { 
                live: false, 
                retry: true, 
                timeout: 60000 
              })
               .then(function (result) {
                              //SYNC_SEQ = ""+result.change.last_seq;
                              dfd.resolve("");
                            }).catch(function (err) {
                              dfd.reject(err);
                            });
                          }
                          ).fail( 
                          function(err){dfd.reject(err);}
                          );
                          
                        }
                        else{

                         localDB.replicate.from(new PouchDB('http://' + COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET, 
                         { 
                          ajax: { 
                            timeout: 60000
                          }
                        }), 
                         { 
                          live: false, 
                          retry: true, 
                          timeout: 60000 
                        })
                         .then(function (result) {
                  //SYNC_SEQ = ""+result.change.last_seq;
                  dfd.resolve("");
                }).catch(function (err) {
                  dfd.reject(err);
                });

              }
              
              
              
            }
            
            return dfd.promise(); 
          },

          pullTaxonomies: function(){

            var dfd = new $.Deferred();
            
            var syncUsername = LOCAL_SETTINGS.SUBSCRIPTIONS.syncUsername;
            var syncPassword = LOCAL_SETTINGS.SUBSCRIPTIONS.syncPassword;

            if (head.mobile && isCordovaApp) {

              cordova.exec(
               function(s){dfd.resolve(s)},
               function(e){dfd.reject(e)},
               'CBLite',
               'pull',
               [{"dbname": TAXONOMY_DBNAME + DB_IDENTIFIER, "url":'http://'+syncUsername+':'+syncPassword+'@'+COUCHBASE_SERVER + '/' + TAXONOMY_BUCKET}]
               );
              
              
              
            }
            else{


              if(authenticatedToSyncGateway == false)
              {

                
                dao.authenticateToSyncGateway(syncUsername, syncPassword)
                .done(
                 function (data)
                 {

                  taxonomyDB.replicate.from(new PouchDB('http://' + COUCHBASE_SERVER + '/' + TAXONOMY_BUCKET, 
                  { 
                    ajax: { 
                      timeout: 60000
                    }
                  }), 
                  { 
                    live: false, 
                    retry: true, 
                    timeout: 60000 
                  })
                  .then(function (result) {
                              //SYNC_SEQ = ""+result.change.last_seq;
                              dfd.resolve("");
                            }).catch(function (err) {
                              dfd.reject(err);
                            });

                            
                          }
                          ).fail( 
                          function(err){dfd.reject(err);}
                          );
                          
                        }
                        else{

                          taxonomyDB.replicate.from(new PouchDB('http://' + COUCHBASE_SERVER + '/' + TAXONOMY_BUCKET, 
                          { 
                            ajax: { 
                              timeout: 60000
                            }
                          }), 
                          { 
                            live: false, 
                            retry: true, 
                            timeout: 60000 
                          })
                          .then(function (result) {
                  //SYNC_SEQ = ""+result.change.last_seq;
                  dfd.resolve("");
                }).catch(function (err) {
                  dfd.reject(err);
                });

                
              }
              
              
              
            }
            
            return dfd.promise(); 
          },
          
          startSync: function() {
            var dfd = new $.Deferred();

            dao.get('_local/LOCAL_SETTINGS').then(function(data){ 

              
              var syncUsername = LOCAL_SETTINGS.SUBSCRIPTIONS.syncUsername;
              var syncPassword = LOCAL_SETTINGS.SUBSCRIPTIONS.syncPassword;
            // Start replication with application_applicationUUID, user profile channel and all subscribed channel
            if (head.mobile && isCordovaApp) {


              
              cordova.exec(function(seq){
                SYNC_SEQ = seq;
                dfd.resolve(seq);
                
              }, function(e){
                dfd.reject(e)
              }, 'CBLite', 'sync',
              [{"dbname": DBNAME + DB_IDENTIFIER, "url":'http://'+syncUsername+':'+syncPassword+'@'+COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET}]
              );
              
            } else {
              if(authenticatedToSyncGateway == false) {
                dao.authenticateToSyncGateway(syncUsername, syncPassword).done(function (data){

                 
                  localDB.sync(
                    new PouchDB('http://' + COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET, 
                    { 
                      ajax: { 
                        timeout: 60000
                      }
                    }), 
                    { 
                      live: true, 
                      retry: true, 
                      timeout: 60000 
                    }).on('change', function (info) {
                      
                      SYNC_SEQ = ""+info.change.last_seq;
                      dfd.resolve(data);
                      
                    }).on('active', function () {
                      // Replicate resumed (e.g. user went back online)
                      
                    }).on('complete', function (info) {
                      // Executed when the sync has completed.
                      
                    }).on('error', function(e){
                      dfd.reject(e)
                    });
                  }).fail(function(err){
                    dfd.reject(err);
                  });
                } else {

                 


                  localDB.sync(
                    new PouchDB('http://' + COUCHBASE_SERVER + '/' + COUCHBASE_BUCKET, 
                    { 
                      ajax: { 
                        timeout: 60000
                      }
                    }), 
                    { 
                      live: true, 
                      retry: true, 
                      timeout: 60000 
                    }).on('change', function (info) {
                      
                      SYNC_SEQ = ""+info.change.last_seq;
                      dfd.resolve(data);
                      
                    }).on('active', function () {
                  // Replicate resumed (e.g. user went back online)
                  
                }).on('complete', function (info) {
                  // Executed when the sync has completed.

                }).on('error', 
                function(e){dfd.reject(e)
                });
              }
            }
            
          }).fail(function(err){
            dfd.reject(err);
          });
          return dfd.promise();
        },

        startSyncTaxonomies: function() {

        //No live sync is required for taxonomies so just pulling differences once only
        return dao.pullTaxonomies();

        
      },
      
      changes: function()
      {
        var dfd = new $.Deferred(); 
        if (head.mobile && isCordovaApp) {
          
          $.ajax({
            url: globalurl+DBNAME + DB_IDENTIFIER+"/_changes?since="+LOCAL_SETTINGS.SYNC_SEQ,
            type: "GET",
            dataType: "json",
            success: function (data, textStatus, xhr) {
              dfd.resolve(data);
            },
            error: function (xhr, textStatus, errorThrown) {
              console.log("Error = "+JSON.stringify(xhr));
              dfd.reject(xhr.responseText);
            }
          });
          
        }
        else{
          
          localDB.changes({
            since: parseInt(LOCAL_SETTINGS.SYNC_SEQ)
          }).then(function (result) {
            dfd.resolve(result);
          }).catch(function (err) {
            dfd.reject(err);
          });
          
        }
        
        
        return dfd.promise();
      },

      createDatabase: function()
      {
        var dfd = new $.Deferred();
        if (head.mobile && isCordovaApp) {
          
          if (window.cblite) {
            window.cblite.getURL(function(err, url) {
              if (err) {
               alert("error launching Couchbase Lite: " + err)
             } else {
               globalurl=url;
               
                         //this is a hack for android version 4.1 bug
                         try{
                          var xmlHttp = new XMLHttpRequest();
                          xmlHttp.open( 'GET', globalurl, false );
                          xmlHttp.send( null );
                        }catch(e){
                          
                        }
                         //////////////////////

                         
                         $.ajax({
                           url: globalurl+DBNAME + "master",
                           type: "PUT",
                           data:  "",
                           dataType: "json",
                           contentType: "application/json",
                           success: function (data, textStatus, xhr) {
                             
                             if(xhr.status == 201 || xhr.status == 412)
                             {

                              dao.getIdentifier()
                              .done(function(id){

                                DB_IDENTIFIER = id;
                                dao.createDatabaseImpl(dfd);
                              })
                              .fail(function(e){

                                DB_IDENTIFIER = generateUUID().substring(0,8);
                                dao.saveIdentifier()
                                .done(function(s){dao.createDatabaseImpl(dfd);});
                                

                              });
                              
                            }
                            else
                            {
                              dfd.reject(xhr.responseText);
                            }
                          },
                          error: function (xhr, textStatus, errorThrown) {
                           
                           if(xhr.status == 201 || xhr.status == 412)
                           {
                             
                             dao.getIdentifier()
                             .done(function(id){

                              DB_IDENTIFIER = id;
                              dao.createDatabaseImpl(dfd);
                            })
                             .fail(function(e){

                              DB_IDENTIFIER = generateUUID().substring(0,8);
                              dao.saveIdentifier()
                              .done(function(s){dao.createDatabaseImpl(dfd);});

                            });

                           }
                           else
                           {
                            dfd.reject(xhr.responseText);
                          }
                          
                        }
                      });
                         
                       }
                     });
          } else {
           alert("error, Couchbase Lite plugin not found.")
         }
       }
       else{
        new PouchDB(DBNAME+"master")
        .then(function (tmpDb){
         masterDB = tmpDb;
         dao.getIdentifier()
         .done(function(id){

          DB_IDENTIFIER = id;
          dao.createDatabaseImpl(dfd);
        })
         .fail(function(e){

          DB_IDENTIFIER = generateUUID().substring(0,8);
          dao.saveIdentifier()
          .done(function(s){dao.createDatabaseImpl(dfd);});

        });
         

       });
        
        
      }
      
      return dfd.promise();
    },

    createDatabaseImpl: function(dfd)
    {
      
      if (head.mobile && isCordovaApp) {
        
       
       $.ajax({
         url: globalurl+TAXONOMY_DBNAME + DB_IDENTIFIER,
         type: "PUT",
         data:  "",
         dataType: "json",
         contentType: "application/json",
         success: function (data, textStatus, xhr) {
           
           
         },
         error: function (xhr, textStatus, errorThrown) {
           
           
          
         }
       });
       
       $.ajax({
         url: globalurl+DBNAME + DB_IDENTIFIER,
         type: "PUT",
         data:  "",
         dataType: "json",
         contentType: "application/json",
         success: function (data, textStatus, xhr) {
           
           if(xhr.status == 201 || xhr.status == 412)
           {
             dfd.resolve(data);
           }
           else
           {
            dfd.reject(xhr.responseText);
          }
        },
        error: function (xhr, textStatus, errorThrown) {
         
         if(xhr.status == 201 || xhr.status == 412)
         {
           dfd.resolve(xhr.responseText);
         }
         else
         {
          dfd.reject(xhr.responseText);
        }
        
      }
    });
       
     }
     else{
      new PouchDB(TAXONOMY_DBNAME + DB_IDENTIFIER)
      .then(function (tmpDb){
       taxonomyDB = tmpDb;
       
       new PouchDB(DBNAME + DB_IDENTIFIER)
       .then(function (tmpDb){
         localDB = tmpDb;
         dfd.resolve('Database created');
       });

     });
      
      
    }
    
  },

  deleteDocument :function(docId){
    
    var dfd = new $.Deferred();
    if (head.mobile && isCordovaApp) {


          // cordova.exec(function(data){
            
          //   dfd.resolve(data);
          
          // }, function(e){
          //   dfd.reject(e)
          // }, 'CBLite', 'deleteDocument',
          //   [{"dbname": DBNAME + DB_IDENTIFIER, "docId": doc._id, "rev":doc._rev}]
          // );
          
          var sCB=function(doc){
           
            $.ajax({
              url: globalurl+DBNAME + DB_IDENTIFIER+"/"+doc._id+"?rev="+doc._rev,
              type: "DELETE",
              data: JSON.stringify(doc),
              dataType: "json",
              contentType: "application/json",
              success: function (data, textStatus, xhr) {
                dfd.resolve(data);
              },
              error: function (xhr, textStatus, errorThrown) {
                dfd.reject(xhr.responseText);
              }
            });
          }
          
          
          dao.get(docId)
          .done(sCB)
          .fail(function(e){dfd.reject(e)});
          
        }
        else{
          
          localDB.get(docId).then(function(doc) {
            return localDB.remove(doc);
          }).then(function (result) {
            dfd.resolve(result);
          }).catch(function (err) {
            dfd.reject(err);
          });
          
        }
        
        return dfd.promise();
      },
      
      resetDatabase :function(){
        

        var dfd = new $.Deferred();

        var _DB_IDENTIFIER = DB_IDENTIFIER;
        DB_IDENTIFIER = generateUUID().substring(0,8);
        dao.saveIdentifier()
        .done(function(s){

          if (head.mobile && isCordovaApp) {

           $.ajax({
            url: globalurl+TAXONOMY_DBNAME + _DB_IDENTIFIER,
            type: "DELETE",
            success: function (data, textStatus, xhr) {


              $.ajax({
                url: globalurl+DBNAME + _DB_IDENTIFIER,
                type: "DELETE",
                success: function (data, textStatus, xhr) {
                 dao.createDatabase().done(
                  new function(s){
                    dfd.resolve(data);
                  }
                  ).fail(function(err){
                    dfd.resolve(err);
                  });

                },
                error: function (xhr, textStatus, errorThrown) {
                  dfd.resolve(xhr.responseText);
                }
              });
              

            },
            error: function (xhr, textStatus, errorThrown) {
              dfd.resolve(xhr.responseText);
            }
          });
           
           
           
         }
         else{

          
           taxonomyDB.destroy().then(function (response) {

            localDB.destroy().then(function (response) {

             dao.createDatabase().done(
              new function(s){
                dfd.resolve(s);
              }
              ).fail(function(err){
                dfd.reject(err);
              });

            }).catch(function (err) {
             
             dfd.reject(err);
           });
            
          }).catch(function (err) {
           
            dfd.reject(err);

          });

          
        }

      });     
        
        
        return dfd.promise();
      },

      createDocView : function(docViewId, viewLogic){
        
        var dfd = new $.Deferred();
        
        viewLogic["_id"]="_design/"+docViewId;

        dao.upsert(viewLogic).done(function(data){ dfd.resolve(data)}).fail(function(e){dfd.reject(e)});

        return dfd.promise();
      },
      
      getIdentifier: function(){

        var dfd = new $.Deferred();
        try{
       //console.log("Fetching object == "+docId);
       
       if (head.mobile && isCordovaApp) {
        
        var options = {
          url: globalurl + DBNAME + "master" + "/" + "_local/SETTINGS",
          type: "GET",
          dataType: "json"
        };

        
        $.ajax(options)
        .done(function(data, textStatus, xhr){
          
          dfd.resolve(data.DB_IDENTIFIER);
        })
        .fail(function(xhr, textStatus, errorThrown){
          
          dfd.reject(xhr);
        });
        
      } else {
        
       masterDB.get("_local/SETTINGS")
       .then(function(data){
        dfd.resolve(data.DB_IDENTIFIER);
      }).catch(function(err){ 
        
        dfd.reject(err);
        return err;
      });
      
    }
  }catch(e)
  {
    dfd.reject(e);
  }
  return dfd.promise();


},
saveIdentifier: function(){

  var document = {"DB_IDENTIFIER": DB_IDENTIFIER, "_id":"_local/SETTINGS"};

  var dfd = new $.Deferred();

  var sv = function(doc){

    if (head.mobile && isCordovaApp) {
      
      var options = {
        url: globalurl + DBNAME + "master" + "/" + "_local/SETTINGS",
        type: "PUT",
        data:  JSON.stringify(doc),
        dataType: "json",
        contentType: "application/json"
      };
      
      $.ajax(options)
      .done(function(data, textStatus, xhr){
        dfd.resolve(data);
      })
      .fail(function(xhr, textStatus, errorThrown){
        
        dfd.reject(xhr.responseText);
      });
    } else {
      
      masterDB.put(doc)
      .then(function(data){
        dfd.resolve(data);
      }).catch(function(err){ 
        
        dfd.reject(err);
      });
    }

  };

  
  var sCB = function(doc){
    
    document._rev = doc._rev;
    
    sv(document);
    
  }
  
  var eCB = function(err){ 
    sv(document);
  }


  
  
  if (head.mobile && isCordovaApp) {
    
    var options = {
      url: globalurl + DBNAME + "master" + "/" + "_local/SETTINGS",
      type: "GET",
      dataType: "json"
    };

    
    $.ajax(options)
    .done(sCB)
    .fail(eCB);
    
  } else {
    
   masterDB.get("_local/SETTINGS")
   .then(sCB).catch(eCB);
   
 }
 return dfd.promise(); 


},    
getDocView: function(docViewIds, viewName, opts){
  var dfd = new $.Deferred();
  try{
        // ,limit, skip skip and total no of record should not be equal
        var desc = false;
        if(opts != undefined && opts.descending != undefined)
        {
          desc = opts.descending; 
        }
        if (head.mobile && isCordovaApp) {
          var params = '?include_docs=true&key=' + opts.key + '&limit=' + opts.pageSizeVal + '&size=' + (opts.pageIndexVal * opts.pageSizeVal) + '&descending=' + desc;
          $.ajax({
            url: globalurl+DBNAME + DB_IDENTIFIER+"/_design/"+docViewIds+"/_view/"+viewName + params,
            type: "GET",
            dataType: "json",
            success: function (data, textStatus, xhr) {

              dfd.resolve(data);
            },
            error: function (xhr, textStatus, errorThrown) {
              console.log("error occured while getting doc view "+JSON.stringify(xhr));
              dfd.reject(xhr.responseText);
            }
          });
        } else {
          localDB.query(docViewIds+"/"+viewName,{
            include_docs: true,
            key: opts.key,
            limit: opts.pageSizeVal,
            skip: opts.pageIndexVal * opts.pageSizeVal,
            descending: desc
          }).then(function (res) {
            dfd.resolve(res);
          }).catch(function (err) {
            console.log(err);
            dfd.reject(err);
          });
        }
      }catch(e)
      {
        dfd.reject(e);
      }
      return dfd.promise(); 
    },

    search: function(categories, text)
    {

      var dfd = new $.Deferred();

      var viewName="view_searchData";
      var docId=generateUUID();
      var VIEW_SEARCH={
        "language" : "javascript",
        "views" : {
          "view_searchData" : {
            "map" : "function(doc) {" +
            "var searchableCategories = JSON.parse('" + JSON.stringify(categories) +"');" +
            "if(typeof (doc.title) != 'undefined' " +
            "&& typeof (doc.category) != 'undefined' " +
            "&& typeof (doc.category.term) != 'undefined'){" +
            
            "if(searchableCategories.indexOf(doc.category.term) > -1){" +
            
            "var docTitle = doc.title.toLowerCase();" +
            
            "if( (doc.category.term == 'participant' && doc._id.toLowerCase().indexOf('"+text.toLowerCase()+"') > -1) || docTitle.indexOf('"+text.toLowerCase()+"') > -1) {" +
            "  var jsonObj = {}; jsonObj.isProfile = doc.category.term == '"+PROFILE_SET_ID+"'; emit(doc.title.toUpperCase(),  jsonObj ); " +
            "}" +
            
            "}"+
            
            "}" +
            "}"
          }
        }
      };
      
      
      var successSearchView=function(doc){
        
        
       setTimeout(function(){ 
         
        var options = {
          pageSizeVal: 50,
          pageIndexVal: 0,
          include_docs: true
        }

        dao.getDocView(docId, viewName, options)
        .done(function(data){
          dfd.resolve(data);
        }).fail(function(err){
          dfd.reject(err);
        });

      }, 1000);
       
     };
     
     
     dao.createDocView(docId,VIEW_SEARCH)
     .done(successSearchView)
     .fail(function(err){dfd.reject(err);});


     return dfd.promise(); 
   },

   profileData: function(category, profileId){


    var deffered = new $.Deferred();

    var viewName="view_searchData";
    var docId="Search"+category+profileId;

    var options = {
      pageSizeVal: 500,
      pageIndexVal: 0,
      include_docs: true
    }


    dao.getDocView(docId, viewName, options)
    .done(function(data){
      deffered.resolve(data);
    }).fail(function(err){
      

      var VIEW_SEARCH={
        "language" : "javascript",
        "views" : {
          "view_searchData" : {
            "map" : "function(doc) {" +
            "if(typeof (doc.title) != 'undefined' " +
            "&& typeof (doc.category) != 'undefined' " +
            "&& typeof (doc.category.term) != 'undefined'){" +
            
            "if( doc.category.term == '"+category+"' && doc.channels.indexOf('"+profileId+"') > -1) {" +
            "  var jsonObj = {\"doc\": {  \"updated\": doc.updated, \"_id\": doc._id, \"title\": doc.title, \"category\": { \"term\": doc.category.term } }}; emit(doc.title.toUpperCase(),  jsonObj ); " +
            "}" +
            
            "}" +
            "}"
          }
        }
      };
      
      
      var successSearchView=function(doc){
        
        
       setTimeout(function(){ 
         
        var options = {
          pageSizeVal: 500,
          pageIndexVal: 0,
          include_docs: true
        }

        dao.getDocView(docId, viewName, options)
        .done(function(data){
          deffered.resolve(data);
        }).fail(function(err){
          deffered.reject(err);
        });

      }, 2000);
       
     }
     
     
     dao.createDocView(docId,VIEW_SEARCH)
     .done(successSearchView)
     .fail(function(err){deffered.reject(err);});
     


     
   });
    
    

    
    
    
    return deffered;

    
  }
  



};

})();


'use strict';

// Create the gatekeeper constrctor instance
dao.createDatabase();

var gatekeeper = new GK();


// Gatekeeper module test
describe('# Module: Gatekeeper', function(){
	// Test the new Workflow constructor method


	describe('- new GK() object instance', function(){
		it('Should return the created object.', function(done){
			expect(gatekeeper).to.be.an('object');
			done();
		})
	});
	
	describe('- dao.save(obj) ', function(){
		it('Should return the saved object in memory dao.', function(done){
			var obj = {
				"_id":"abc1",
				"name":"Hasan"
			}
			var object = dao.save(obj).done(function(data){
				console.log(JSON.stringify(data));
				expect(data).to.be.an('object');
				expect(data.ok).to.equal(true);
				done();
			}).fail(function(err){
				console.log(err);
				done();
			});
		})
	});

	describe('- dao.get ', function(){
		it('Should return the object.', function(done){

			var object = dao.get('abc1').done(function(data){
				console.log(JSON.stringify(data));
				expect(data.name).to.equal('Hasan');
				done();
			}).fail(function(err){
				console.log(err);
				done();
			});
			
			
		})
	});

	describe('- dao.save(obj) with same id as above', function(){
		it('Should return the error while save 409', function(done){
			var obj = {
				"_id":"abc1",
				"name":"Hasan"
			}
			var object = dao.save(obj).done(function(data){
				console.log(JSON.stringify(data));
				done();
			}).fail(function(err){
				console.log(err);
				done();
			});
			
			
		})
	});

	describe('- Method: instantiate()', function(){
		
		it('Should return an array with 3 objects in it.', function(done){

			var documentId = 'abc2';
			var type = 'newInstance';
			var setId = 'developerDetail';
			var profile = 10002;
			var validDate = '22/02/2016';
			
			
			var ins = gatekeeper.instantiate(documentId, type, setId, profile, validDate).then(function(data){
				expect(data).to.be.instanceof(Array);
				expect(data[0].error).to.equal(true);
			}).should.notify(done());

			
			
		});
	});

	describe('- Method: instantiateData()', function(){
		
		it('Should return an array with object in DataInitialised status.', function(done){
			var documentId = 'pool_001';
			var type = 'fromDefinition'; // Can be others as well
			var vm = {"globalParameters":"community_id=25000&profile_id=25000&user_profile_id=10007&profile_type=application&parent_id=&app_id=10004-10003&parent_app_id=10004-10003&version=1.5.0&atom_id=&set_id=developerDetail&indicator_id=developerDetailIndicator&template_id=&layout_id=&view_id=default&view_type=edit&mode=cache&_mode=edit&node_id=&search_text=&search_filters=&search_order=relevant&search_tag=&content_type=&next_page=1&size=0&type=&linkType=&node_name=&contentLabel=&scope=&data_store=&copy_entry=&portlet_id=&forum_id=&coll_id=&coll_name=&start=1&end=5&records=10&action=&menu_id=&seq=&ipage=&contra_indicator_id=&contra_set_id=&overiden_app_id=&title=&selectedVirtualBoxName=&workplan_id=&period_type=&period_id=&capture_year=&capture_quarter=&capture_month=&captureState=target&actual_domain=kwantu10.kwantu.net&name=&path=&lang=en&resource=&location=&topic=&approaches=&teams=&actors=&languages=&stakeholders=&donorType=&donorStatus=&eventType=&jobType=&newsType=&google_id=&clean=&google_password=&component_id=indicator&cache=false","customModel":{"developerDetail":{"Role":{},"__ko_mapping__":{"developerName":{},"developerAddress":{},"telephoneNumber":{},"emailAddress":{},"originalprojectcontractprice":{},"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"Role.code":true,"Role.label":true,"Role":true,"developerAddress":true,"developerName":true,"emailAddress":true,"originalprojectcontractprice":true,"telephoneNumber":true},"copiedProperties":{}}},"spatialTaxonomy":{"items":{},"__ko_mapping__":{"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"items.item":true,"items":true},"copiedProperties":{}}}},"externalModel":{},"defaultModel":{"author":{},"category":{},"contributor":{},"control":{"active":{},"deleted":{},"expired":{},"featured":{},"global_meta_info":{},"locked":{"device":{},"form":{},"reserved":{},"session":{}},"moderation":{},"privacy":{"add":{"roles":{}},"create":{"roles":{}},"delete":{"roles":{}},"read":{"roles":{}},"update":{"roles":{}}},"refresh":{},"release":{},"status":{},"type":{}},"icon":{},"links":{},"mailbox":{"domain":{}},"tags":{},"__ko_mapping__":{"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"appId":true,"atomId":true,"author._type":true,"author.community":true,"author.name":true,"author.profile":true,"author":true,"category.__text":true,"category._label":true,"category._scheme":true,"category._term":true,"category":true,"channels":true,"communityId":true,"componentId":true,"contributor.community":true,"contributor.name":true,"contributor.profile":true,"contributor":true,"control.active.__text":true,"control.active._date":true,"control.active._expire":true,"control.active._profileId":true,"control.active":true,"control.deleted.__text":true,"control.deleted._date":true,"control.deleted._profileId":true,"control.deleted":true,"control.draft":true,"control.expired.__text":true,"control.expired._date":true,"control.expired":true,"control.featured.__text":true,"control.featured._endDateTime":true,"control.featured._startDateTime":true,"control.featured":true,"control.global_meta_info.info[0].__text":true,"control.global_meta_info.info[0]._key":true,"control.global_meta_info.info[0]._value":true,"control.global_meta_info.info[1].__text":true,"control.global_meta_info.info[1]._key":true,"control.global_meta_info.info[1]._value":true,"control.global_meta_info.info[2].__text":true,"control.global_meta_info.info[2]._key":true,"control.global_meta_info.info[2]._value":true,"control.global_meta_info.info[3].__text":true,"control.global_meta_info.info[3]._key":true,"control.global_meta_info.info[3]._value":true,"control.global_meta_info.info[4].__text":true,"control.global_meta_info.info[4]._key":true,"control.global_meta_info.info[4]._value":true,"control.global_meta_info.info":true,"control.global_meta_info":true,"control.locked.device.__text":true,"control.locked.device._date":true,"control.locked.device._deviceId":true,"control.locked.device._locked":true,"control.locked.device._profileId":true,"control.locked.device._requestRelease":true,"control.locked.device":true,"control.locked.form.__text":true,"control.locked.form._date":true,"control.locked.form._formId":true,"control.locked.form._locked":true,"control.locked.form._profileId":true,"control.locked.form._requestRelease":true,"control.locked.form":true,"control.locked.reserved.__text":true,"control.locked.reserved._date":true,"control.locked.reserved._expire":true,"control.locked.reserved._locked":true,"control.locked.reserved._profileId":true,"control.locked.reserved._requestRelease":true,"control.locked.reserved":true,"control.locked.session.__text":true,"control.locked.session._date":true,"control.locked.session._expire":true,"control.locked.session._locked":true,"control.locked.session._profileId":true,"control.locked.session._requestRelease":true,"control.locked.session._token":true,"control.locked.session":true,"control.locked":true,"control.moderation.__text":true,"control.moderation._required":true,"control.moderation._status":true,"control.moderation":true,"control.privacy.add.roles.role[0].__text":true,"control.privacy.add.roles.role[0]._id":true,"control.privacy.add.roles.role":true,"control.privacy.add.roles":true,"control.privacy.add":true,"control.privacy.create.roles.role[0].__text":true,"control.privacy.create.roles.role[0]._id":true,"control.privacy.create.roles.role":true,"control.privacy.create.roles":true,"control.privacy.create":true,"control.privacy.delete.roles.role[0].__text":true,"control.privacy.delete.roles.role[0]._id":true,"control.privacy.delete.roles.role":true,"control.privacy.delete.roles":true,"control.privacy.delete":true,"control.privacy.read.roles.role[0].__text":true,"control.privacy.read.roles.role[0]._id":true,"control.privacy.read.roles.role":true,"control.privacy.read.roles":true,"control.privacy.read":true,"control.privacy.update.roles.role[0].__text":true,"control.privacy.update.roles.role[0]._id":true,"control.privacy.update.roles.role":true,"control.privacy.update.roles":true,"control.privacy.update":true,"control.privacy":true,"control.refresh.__text":true,"control.refresh._period":true,"control.refresh":true,"control.release.__text":true,"control.release._date":true,"control.release":true,"control.status.__text":true,"control.status._code":true,"control.status":true,"control.type.__text":true,"control.type._value":true,"control.type":true,"control":true,"dataStore":true,"icon.__text":true,"icon._src":true,"icon":true,"indicatorId":true,"layoutId":true,"links.link[0].__text":true,"links.link[0]._comment":true,"links.link[0]._contra_atom":true,"links.link[0]._contra_indicator":true,"links.link[0]._contra_set":true,"links.link[0]._implicitType":true,"links.link[0]._linkType":true,"links.link[0]._source_atom":true,"links.link[0]._source_indicator":true,"links.link[0]._source_relationship_code":true,"links.link[0]._source_relationship_text":true,"links.link[0]._title":true,"links.link":true,"links":true,"mailbox._active":true,"mailbox.alias":true,"mailbox.domain.__text":true,"mailbox.domain._current":true,"mailbox.domain._custom":true,"mailbox.domain":true,"mailbox.password":true,"mailbox":true,"parentAppId":true,"portletId":true,"profileId":true,"profileType":true,"setId":true,"tags.tag[0].__text":true,"tags.tag[0]._code":true,"tags.tag[0]._label":true,"tags.tag[0]._profileId":true,"tags.tag[0]._type":true,"tags.tag":true,"tags":true,"templateId":true,"use":true,"userProfileId":true,"userProfileName":true,"version":true,"_id":true,"_rev":true},"copiedProperties":{}}}}
			var seq = 1;
			
			gatekeeper.instantiateData(documentId, type, vm, seq).then(function(data){
				console.log(data);
				expect(data).to.be.instanceof(Array);
				expect(data[0].error).to.equal(false);
				expect(data[0].status).to.equal(210);
				
			}).should.notify(done());	
		})
	});


	describe('- Method: update()', function(){
		
		it('Should return an array with object in Updated state after executing all rules etc.', function(done){
			var documentId = 'pool_001';
			var vm = {"globalParameters":"community_id=25000&profile_id=25000&user_profile_id=10007&profile_type=application&parent_id=&app_id=10004-10003&parent_app_id=10004-10003&version=1.5.0&atom_id=&set_id=developerDetail&indicator_id=developerDetailIndicator&template_id=&layout_id=&view_id=default&view_type=edit&mode=cache&_mode=edit&node_id=&search_text=&search_filters=&search_order=relevant&search_tag=&content_type=&next_page=1&size=0&type=&linkType=&node_name=&contentLabel=&scope=&data_store=&copy_entry=&portlet_id=&forum_id=&coll_id=&coll_name=&start=1&end=5&records=10&action=&menu_id=&seq=&ipage=&contra_indicator_id=&contra_set_id=&overiden_app_id=&title=&selectedVirtualBoxName=&workplan_id=&period_type=&period_id=&capture_year=&capture_quarter=&capture_month=&captureState=target&actual_domain=kwantu10.kwantu.net&name=&path=&lang=en&resource=&location=&topic=&approaches=&teams=&actors=&languages=&stakeholders=&donorType=&donorStatus=&eventType=&jobType=&newsType=&google_id=&clean=&google_password=&component_id=indicator&cache=false","customModel":{"developerDetail":{"Role":{},"__ko_mapping__":{"developerName":{},"developerAddress":{},"telephoneNumber":{},"emailAddress":{},"originalprojectcontractprice":{},"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"Role.code":true,"Role.label":true,"Role":true,"developerAddress":true,"developerName":true,"emailAddress":true,"originalprojectcontractprice":true,"telephoneNumber":true},"copiedProperties":{}}},"spatialTaxonomy":{"items":{},"__ko_mapping__":{"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"items.item":true,"items":true},"copiedProperties":{}}}},"externalModel":{},"defaultModel":{"author":{},"category":{},"contributor":{},"control":{"active":{},"deleted":{},"expired":{},"featured":{},"global_meta_info":{},"locked":{"device":{},"form":{},"reserved":{},"session":{}},"moderation":{},"privacy":{"add":{"roles":{}},"create":{"roles":{}},"delete":{"roles":{}},"read":{"roles":{}},"update":{"roles":{}}},"refresh":{},"release":{},"status":{},"type":{}},"icon":{},"links":{},"mailbox":{"domain":{}},"tags":{},"__ko_mapping__":{"ignore":[],"include":["_destroy"],"copy":[],"observe":[],"mappedProperties":{"appId":true,"atomId":true,"author._type":true,"author.community":true,"author.name":true,"author.profile":true,"author":true,"category.__text":true,"category._label":true,"category._scheme":true,"category._term":true,"category":true,"channels":true,"communityId":true,"componentId":true,"contributor.community":true,"contributor.name":true,"contributor.profile":true,"contributor":true,"control.active.__text":true,"control.active._date":true,"control.active._expire":true,"control.active._profileId":true,"control.active":true,"control.deleted.__text":true,"control.deleted._date":true,"control.deleted._profileId":true,"control.deleted":true,"control.draft":true,"control.expired.__text":true,"control.expired._date":true,"control.expired":true,"control.featured.__text":true,"control.featured._endDateTime":true,"control.featured._startDateTime":true,"control.featured":true,"control.global_meta_info.info[0].__text":true,"control.global_meta_info.info[0]._key":true,"control.global_meta_info.info[0]._value":true,"control.global_meta_info.info[1].__text":true,"control.global_meta_info.info[1]._key":true,"control.global_meta_info.info[1]._value":true,"control.global_meta_info.info[2].__text":true,"control.global_meta_info.info[2]._key":true,"control.global_meta_info.info[2]._value":true,"control.global_meta_info.info[3].__text":true,"control.global_meta_info.info[3]._key":true,"control.global_meta_info.info[3]._value":true,"control.global_meta_info.info[4].__text":true,"control.global_meta_info.info[4]._key":true,"control.global_meta_info.info[4]._value":true,"control.global_meta_info.info":true,"control.global_meta_info":true,"control.locked.device.__text":true,"control.locked.device._date":true,"control.locked.device._deviceId":true,"control.locked.device._locked":true,"control.locked.device._profileId":true,"control.locked.device._requestRelease":true,"control.locked.device":true,"control.locked.form.__text":true,"control.locked.form._date":true,"control.locked.form._formId":true,"control.locked.form._locked":true,"control.locked.form._profileId":true,"control.locked.form._requestRelease":true,"control.locked.form":true,"control.locked.reserved.__text":true,"control.locked.reserved._date":true,"control.locked.reserved._expire":true,"control.locked.reserved._locked":true,"control.locked.reserved._profileId":true,"control.locked.reserved._requestRelease":true,"control.locked.reserved":true,"control.locked.session.__text":true,"control.locked.session._date":true,"control.locked.session._expire":true,"control.locked.session._locked":true,"control.locked.session._profileId":true,"control.locked.session._requestRelease":true,"control.locked.session._token":true,"control.locked.session":true,"control.locked":true,"control.moderation.__text":true,"control.moderation._required":true,"control.moderation._status":true,"control.moderation":true,"control.privacy.add.roles.role[0].__text":true,"control.privacy.add.roles.role[0]._id":true,"control.privacy.add.roles.role":true,"control.privacy.add.roles":true,"control.privacy.add":true,"control.privacy.create.roles.role[0].__text":true,"control.privacy.create.roles.role[0]._id":true,"control.privacy.create.roles.role":true,"control.privacy.create.roles":true,"control.privacy.create":true,"control.privacy.delete.roles.role[0].__text":true,"control.privacy.delete.roles.role[0]._id":true,"control.privacy.delete.roles.role":true,"control.privacy.delete.roles":true,"control.privacy.delete":true,"control.privacy.read.roles.role[0].__text":true,"control.privacy.read.roles.role[0]._id":true,"control.privacy.read.roles.role":true,"control.privacy.read.roles":true,"control.privacy.read":true,"control.privacy.update.roles.role[0].__text":true,"control.privacy.update.roles.role[0]._id":true,"control.privacy.update.roles.role":true,"control.privacy.update.roles":true,"control.privacy.update":true,"control.privacy":true,"control.refresh.__text":true,"control.refresh._period":true,"control.refresh":true,"control.release.__text":true,"control.release._date":true,"control.release":true,"control.status.__text":true,"control.status._code":true,"control.status":true,"control.type.__text":true,"control.type._value":true,"control.type":true,"control":true,"dataStore":true,"icon.__text":true,"icon._src":true,"icon":true,"indicatorId":true,"layoutId":true,"links.link[0].__text":true,"links.link[0]._comment":true,"links.link[0]._contra_atom":true,"links.link[0]._contra_indicator":true,"links.link[0]._contra_set":true,"links.link[0]._implicitType":true,"links.link[0]._linkType":true,"links.link[0]._source_atom":true,"links.link[0]._source_indicator":true,"links.link[0]._source_relationship_code":true,"links.link[0]._source_relationship_text":true,"links.link[0]._title":true,"links.link":true,"links":true,"mailbox._active":true,"mailbox.alias":true,"mailbox.domain.__text":true,"mailbox.domain._current":true,"mailbox.domain._custom":true,"mailbox.domain":true,"mailbox.password":true,"mailbox":true,"parentAppId":true,"portletId":true,"profileId":true,"profileType":true,"setId":true,"tags.tag[0].__text":true,"tags.tag[0]._code":true,"tags.tag[0]._label":true,"tags.tag[0]._profileId":true,"tags.tag[0]._type":true,"tags.tag":true,"tags":true,"templateId":true,"use":true,"userProfileId":true,"userProfileName":true,"version":true,"_id":true,"_rev":true},"copiedProperties":{}}}}
			
			gatekeeper.update(documentId, vm).then(function(data){
				console.log(data);
				expect(data).to.be.instanceof(Array);
				expect(data[0].error).to.equal(false);
				expect(data[0].status).to.equal(210);
				
			}).should.notify(done());	
		})
	});

	describe('- Method: authorise()', function(){
		
		it('Should return an array with main object in Authorised state and Authorised object.', function(done){
			var documentId = 'pool_001';
			gatekeeper.authorise(documentId).then(function(data){
				console.log(data);
				expect(data).to.be.instanceof(Array);
				expect(data[0].error).to.equal(false);
				expect(data[0].status).to.equal(210);
				expect(data[1].error).to.equal(false);
				expect(data[1].status).to.equal(210);
				
			}).should.notify(done());	
		})
	});

	describe('- Method: reject()', function(){
		
		it('Should return an array with main object in Rejected state and rejected object.', function(done){
			var documentId = 'pool_001';
			gatekeeper.reject(documentId).then(function(data){
				console.log(data);
				expect(data).to.be.instanceof(Array);
				expect(data[0].error).to.equal(false);
				expect(data[0].status).to.equal(210);
				expect(data[1].error).to.equal(false);
				expect(data[1].status).to.equal(210);
				
			}).should.notify(done());	
		})
	});

});

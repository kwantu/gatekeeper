'use strict';

// Require the test framework modules 
var chai = require("chai");
var should = chai.should();
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Require the Workflow constructor / class 
var GK = require("../../index.js");

// Create the gatekeeper constrctor instance
var gatekeeper = new GK();

// Gatekeeper module test
describe('# Module: GK', function(){
	// Test the new GK constructor method
	describe('- new GK() object instance', function(){
		it('Should return ... ')
	});
	// Describe other tests below
	
});

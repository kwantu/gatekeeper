test:
	./node_modules/.bin/mocha "test/server/**/*.js" --reporter spec -R spec --ui bdd

 .PHONY: test
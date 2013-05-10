test:
	./node_modules/.bin/mocha \
		--reporter list \
		--check-leaks

 .PHONY: test

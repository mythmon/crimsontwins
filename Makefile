TEST_FILES = $(shell find ./test -name "*.js")

test:
	./node_modules/.bin/mocha \
		--reporter progress \
		$(TEST_FILES)

test-w:
	./node_modules/.bin/mocha \
		--reporter min \
		--watch \
		$(TEST_FILES)

 .PHONY: test test-w

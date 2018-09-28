test-unit:
	(cd modules/qewd-openid-connect && npm install && npm test)

test-integration:
	make clean --no-print-directory
	npm run test:docker

test:
	make test-unit --no-print-directory
	make test-integration --no-print-directory

clean:
	(cd modules/qewd-openid-connect && rm -rf node_modules && rm -rf .nyc_output && rm -rf coverage && rm -f yarn.lock && rm -f package-lock.json)
	(rm -rf node_modules && rm -rf .nyc_output && rm -rf coverage && rm -f yarn.lock && rm -f package-lock.json)

lint:
	(cd modules/qewd-openid-connect && npm install && npm run lint)
	(npm install && npm run lint)

.PHONY: test-unit test-integration test clean lint
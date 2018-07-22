
test:
	# authentication-service-idcr
	(cd authentication-service-idcr/modules/ripple-auth && yarn && yarn test)
	(cd authentication-service-idcr/modules/ripple-auth0 && yarn && yarn test)
	(cd authentication-service-idcr/modules/ripple-oauth-openid && yarn && yarn test)
	# authentication-service-phr
	(cd authentication-service-phr/modules/ripple-auth && yarn && yarn test)
	(cd authentication-service-phr/modules/ripple-auth0 && yarn && yarn test)
	(cd authentication-service-phr/modules/ripple-oauth-openid && yarn && yarn test)
	# cdr-service-openehr
	(cd cdr-service-openehr/modules/ripple-cdr-openehr && yarn && yarn test)
	(cd cdr-service-openehr/modules/ripple-openehr-jumper && yarn && yarn test)
	# conductor-service-idcr
	(cd conductor-service-idcr/modules/ripple-conductor-idcr && yarn && yarn test)
	# conductor-service-phr
	(cd conductor-service-phr/modules/ripple-admin && yarn && yarn test)
	(cd conductor-service-phr/modules/ripple-conductor-phr && yarn && yarn test)

.PHONY: test
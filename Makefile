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
	# mpi-service
	(cd mpi-service/modules/ripple-mpi && yarn && yarn test)
	# openid-connect-server
	(cd openid-connect-server/modules/qewd-openid-connect && yarn && yarn test)

lint:
	# authentication-service-idcr
	(cd authentication-service-idcr/modules/ripple-auth && yarn && yarn lint)
	(cd authentication-service-idcr/modules/ripple-auth0 && yarn && yarn lint)
	(cd authentication-service-idcr/modules/ripple-oauth-openid && yarn && yarn lint)
	# authentication-service-phr
	(cd authentication-service-phr/modules/ripple-auth && yarn && yarn lint)
	(cd authentication-service-phr/modules/ripple-auth0 && yarn && yarn lint)
	(cd authentication-service-phr/modules/ripple-oauth-openid && yarn && yarn lint)
	# cdr-service-openehr
	(cd cdr-service-openehr/modules/ripple-cdr-openehr && yarn && yarn lint)
	(cd cdr-service-openehr/modules/ripple-openehr-jumper && yarn && yarn lint)
	# conductor-service-idcr
	(cd conductor-service-idcr/modules/ripple-conductor-idcr && yarn && yarn lint)
	# conductor-service-phr
	(cd conductor-service-phr/modules/ripple-admin && yarn && yarn lint)
	(cd conductor-service-phr/modules/ripple-conductor-phr && yarn && yarn lint)
	# mpi-service
	(cd mpi-service/modules/ripple-mpi && yarn && yarn lint)
	# openid-connect-server
	(cd openid-connect-server/modules/qewd-openid-connect && yarn && yarn lint)

.PHONY: test lint
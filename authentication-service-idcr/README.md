# Ripple-QEWD-Microservices

Email: <code.custodian@ripple.foundation>

2017-18 Ripple Foundation Community Interest Company 

[http://ripple.foundation](http://ripple.foundation)

Author: Rob Tweed, M/Gateway Developments Ltd (@rtweed)

## IDCR Authentication Service

This folder contains the code for the Ripple Authentication Microservice, which provides the Ripple interface to Auth0.

Start up this container as a foreground process using the *rtweed/qewd-server* Docker Container:



        sudo docker run -it --rm -p 8085:8080 -v ~/ripple/authentication-service-idcr:/opt/qewd/mapped rtweed/qewd-server

or, to run it as a daemon process:

        sudo docker run -d --rm -p 8085:8080 -v ~/ripple/authentication-service-idcr:/opt/qewd/mapped rtweed/qewd-server

Note 1: the -p parameter defines the port mapping, using the convention:

      -p {external port}:{internal port}

The *qewd-server* container always uses port 8080 internally.  

The external port is for you to define.  You MUST ensure that it is accessible from the IDCR Conductor service
and matches with its ms-hosts.json configuration.


Note 2: if you're using a Raspberry Pi (RPi), use the RPi-specific Container: *rtweed/qewd-server-rpi*


## Testing

Running integration tests requires some additional steps

You must ensure that auth0 testing endpoint works. To do it, just open [https://auth0-testing.herokuapp.com/healthcheck](https://auth0-testing.herokuapp.com/healthcheck) in the browser. You should the similar response:

    {"ok":true,"timestamp":1530277721964}

Next, you should start up this container as a foreground process using the *killmenot/qewd-server:tests* Docker Container that created for integration testing purpose only:

    sudo docker run -it --rm -p 8085:8080 -v ~/ripple/authentication-service-idcr:/opt/qewd/mapped killmenot/qewd-server:tests

Then you should start redis server at your local machine:

    redis-server

Now, you can run integration tests:

    npm test


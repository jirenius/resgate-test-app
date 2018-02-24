# Resgate test application
RES protocol test application used to test and develop resgate.

While the application is not created for the purpose of learning, it can still be used as a reference when creating a new application using a RES API.

The application consist of a node.js server which will:
* serve a webclient
* start up a bunch of stand-alone microservices

Each service, found in `/microservice/`, has a matching client module found in `/src/module/tab/`.

## Quickstart

Make sure you have:
* [installed NATS server](https://nats.io/download/nats-io/gnatsd/) and have it running
* [installed resgate](https://github.com/jirenius/resgate) and have it running
* [installed node.js](https://nodejs.org/en/download/)

Download and run resgate-test-app:

```
git clone https://github.com/jirenius/resgate-test-app
cd resgate-test-app
npm install
npm run start
```

Open your favourite webapp and go to:

```
http://localhost:8000/
```

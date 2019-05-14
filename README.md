<p align="center"><a href="https://resgate.io" target="_blank" rel="noopener noreferrer"><img width="100" src="https://resgate.io/img/resgate-logo.png" alt="Resgate logo"></a></p>


<h2 align="center"><b>Resgate Test Application</b><br/>Synchronize Your Clients</h2>

---

RES protocol test application used to test and develop [Resgate](https://github.com/resgateio/resgate).

Visit [Resgate.io](https://resgate.io) for more information.


## Purpose

While the application is not created for the purpose of learning, it can still be used as reference when creating a new application using a RES API.

The application consist of a node.js server which will:
* serve a webclient
* start up a bunch of stand-alone microservices

Each service, found in `/microservice/`, has a matching client module found in `/src/module/tab/`.

| Service | Client Module | Description
| --- | --- | ---
| `auth.js` | `auth/Auth.js` | Password authentication with session handling and *Force logout* method
| `clickField.js` | `clickField/ClickField.js` | Click to send custom events to all clients. Access control for methods.
| `delay.js` | *none* | Resources with delayed response, for testing timeouts.<br>Eg. `delayService.model.<milliSecondDelay>`
| `dynamic.js` | `dynamic/Dynamic.js` | Using a model as an unordered key/value list.
| `form.js` | `form/Form.js` | A form that can be edited by many. Test of wrapping model in ModifyModel helper class.
| `notes.js` | `notes/Notes.js` | Paginated list with cycling items, for testing queries.
| `primitive.js` | *none* | Serving collection with only primitive values.
| `ticker.js` | `ticker/Ticker.js` | Counter ticking up every second. Access control for model.
| `viewer.js` | `viewer/Viewer.js` | Deeply nested resources, including recursive references. Testing resource references and generic visualization of linked resources.

## Quickstart

Make sure you have:
* [installed NATS server](https://nats.io/download/nats-io/gnatsd/) and have it running
* [installed Resgate](https://github.com/resgateio/resgate) and have it running
* [installed node.js](https://nodejs.org/en/download/)

Download and run resgate-test-app:

```
git clone https://github.com/jirenius/resgate-test-app
cd resgate-test-app
npm install
npm run start
```

Open your favourite browser and go to:

```
http://localhost:8000/
```

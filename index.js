'use strict';

var app = require('connect')();
var Raven = require('raven');
var http = require('http');
var swaggerTools = require('swagger-tools');
var createStatic = require('connect-static');
var jsyaml = require('js-yaml');
var fs = require('fs');

require('./mongoDB');

// Must configure Raven before doing anything else with it
Raven.config('https://58482206aab24bdaadbdea5e84848d43:ddd2187e6ef44b28b870d92a497cc659@sentry.xenoncloud.net/13').install();

// Load some small snippets for easy use
require('./snippets');

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  app.use(Raven.requestHandler());
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  createStatic({ dir: 'web/css' }, function (err, middleware) {
    if (err) throw err;
    app.use('/css', middleware);
    createStatic({ dir: 'web/js' }, function (err, middleware) {
      if (err) throw err;
      app.use('/js', middleware);
      createStatic({ dir: 'web/fonts' }, function (err, middleware) {
        if (err) throw err;
        app.use('/fonts', middleware);

        app.use(Raven.errorHandler());
        // Get Port for production
        var port = process.env.PORT || 8080;
        // Start the server
        http.createServer(app).listen(port, function () {
          console.log('Your server is listening on port %d (http://localhost:%d)', port, port);
          console.log('Swagger-ui is available on http://localhost:%d/docs', port);
        });
      });
    });
  });
});

## Troubleshooting Run: 2025-05-13 15:35:32

Cleaning node_modules and npm cache...
(npm cache clean --force)
npm warn using --force Recommended protections disabled.
Reinstalling dependencies...
## Troubleshooting Run: 2025-05-13 15:40:54

Cleaning node_modules and npm cache...
(npm cache clean --force)
npm warn using --force Recommended protections disabled.
npm error code ENOTEMPTY
npm error syscall rmdir
npm error path /Users/leemoore/.npm/_cacache
npm error errno -66
npm error ENOTEMPTY: directory not empty, rmdir '/Users/leemoore/.npm/_cacache'
npm error A complete log of this run can be found in: /Users/leemoore/.npm/_logs/2025-05-13T19_40_54_673Z-debug-0.log
Reinstalling dependencies...
npm error code UNABLE_TO_GET_ISSUER_CERT_LOCALLY
npm error errno UNABLE_TO_GET_ISSUER_CERT_LOCALLY
npm error request to https://registry.npmjs.org/@testing-library%2fjest-dom failed, reason: unable to get local issuer certificate
npm error A complete log of this run can be found in: /Users/leemoore/.npm/_logs/2025-05-13T19_35_37_282Z-debug-0.log
Running lint checks...
npm warn exec The following package was not found and will be installed: eslint@9.26.0
npm warn deprecated superagent@8.1.2: Please upgrade to v9.0.0+ as we have fixed a public vulnerability with formidable dependency. Note that v9.0.0+ requires Node.js v14.18.0+. See https://github.com/ladjs/superagent/pull/1800 for insight. This project is supported and maintained by the team at Forward Email @ https://forwardemail.net
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

Oops! Something went wrong! :(

ESLint: 9.26.0

No files matching the pattern "src/" were found.
Please check for typing mistakes in the pattern.

Running TypeScript checks...
npm warn exec The following package was not found and will be installed: tsc@2.0.4

[41m                                                                               [0m
[41m[37m                This is not the tsc command you are looking for                [0m
[41m                                                                               [0m

To get access to the TypeScript compiler, [34mtsc[0m, from the command line either:

- Use [1mnpm install typescript[0m to first add TypeScript to your project [1mbefore[0m using npx
- Use [1myarn[0m to avoid accidentally running code from un-installed packages
Attempting to start the server...

> liminal-type-chat@0.1.0 dev
> npm run dev:server


> liminal-type-chat@0.1.0 dev:server
> cd server && npm run dev


> liminal-type-chat-server@0.1.0 dev
> nodemon --watch src --ext ts,json --exec ts-node src/server.ts

sh: nodemon: command not found
npm error Lifecycle script `dev` failed with error:
npm error code 127
npm error path /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server
npm error workspace liminal-type-chat-server@0.1.0
npm error location /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server
npm error command failed
npm error command sh -c nodemon --watch src --ext ts,json --exec ts-node src/server.ts
---- End of run ----
npm error code EIDLETIMEOUT
npm error Idle timeout reached for host `registry.npmjs.org:443`
npm error A complete log of this run can be found in: /Users/leemoore/.npm/_logs/2025-05-13T19_40_54_997Z-debug-0.log
Running lint checks...

Oops! Something went wrong! :(

ESLint: 9.26.0

No files matching the pattern "src/" were found.
Please check for typing mistakes in the pattern.

Running TypeScript checks...

[41m                                                                               [0m
[41m[37m                This is not the tsc command you are looking for                [0m
[41m                                                                               [0m

To get access to the TypeScript compiler, [34mtsc[0m, from the command line either:

- Use [1mnpm install typescript[0m to first add TypeScript to your project [1mbefore[0m using npx
- Use [1myarn[0m to avoid accidentally running code from un-installed packages
Attempting to start the server...

> liminal-type-chat@0.1.0 dev
> npm run dev:server


> liminal-type-chat@0.1.0 dev:server
> cd server && npm run dev


> liminal-type-chat-server@0.1.0 dev
> nodemon --watch src --ext ts,json --exec ts-node src/server.ts

sh: nodemon: command not found
npm error Lifecycle script `dev` failed with error:
npm error code 127
npm error path /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server
npm error workspace liminal-type-chat-server@0.1.0
npm error location /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server
npm error command failed
npm error command sh -c nodemon --watch src --ext ts,json --exec ts-node src/server.ts
---- End of run ----
## Troubleshooting Run: 2025-05-13 18:08:16

Cleaning node_modules and npm cache...
(npm cache clean --force)
npm warn using --force Recommended protections disabled.
Reinstalling dependencies...
npm warn deprecated superagent@8.1.2: Please upgrade to v9.0.0+ as we have fixed a public vulnerability with formidable dependency. Note that v9.0.0+ requires Node.js v14.18.0+. See https://github.com/ladjs/superagent/pull/1800 for insight. This project is supported and maintained by the team at Forward Email @ https://forwardemail.net
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 911 packages, removed 3 packages, and audited 939 packages in 29s

191 packages are looking for funding
  run `npm fund` for details

5 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
Running lint checks...

Oops! Something went wrong! :(

ESLint: 8.57.1

No files matching the pattern "src/" were found.
Please check for typing mistakes in the pattern.

Running TypeScript checks...
Attempting to start the server...

> liminal-type-chat@0.1.0 dev
> npm run dev:server


> liminal-type-chat@0.1.0 dev:server
> cd server && npm run dev


> liminal-type-chat-server@0.1.0 dev
> nodemon --watch src --ext ts,json --exec ts-node src/server.ts

[33m[nodemon] 3.1.10[39m
[33m[nodemon] to restart at any time, enter `rs`[39m
[33m[nodemon] watching path(s): src/**/*[39m
[33m[nodemon] watching extensions: ts,json[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: contextThreadClient - Type: object | Keys: getContextThreadClient
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: clientInstance - Type: object | Keys: service
Error setting up Swagger documentation: YAMLParseError: Map keys must be unique at line 381, column 3:

                $ref: '#/components/schemas/ErrorResponse'
  /health:
  ^

    at Composer.onError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/composer.js:69:34)
    at Object.resolveBlockMap (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/resolve-block-map.js:61:13)
    at resolveCollection (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-collection.js:13:27)
    at Object.composeCollection (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-collection.js:47:16)
    at composeNode (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-node.js:31:38)
    at Object.resolveBlockMap (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/resolve-block-map.js:81:19)
    at resolveCollection (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-collection.js:13:27)
    at Object.composeCollection (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-collection.js:47:16)
    at Object.composeNode (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-node.js:31:38)
    at Object.composeDoc (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/node_modules/yaml/dist/compose/compose-doc.js:33:23) {
  code: 'DUPLICATE_KEY',
  pos: [ 11576, 11577 ],
  linePos: [ { line: 381, col: 3 }, { line: 381, col: 4 } ]
}
Starting server with configured port: 3000 (from env: 3000)
Liminal Type Chat server listening on port 3000
http://localhost:3000
Dashboard URL: http://localhost:3000/dashboard
Database initialized at db/liminal.db
[0mGET / [32m200[0m 6.601 ms - 678[0m
[0mGET /assets/index-tavbKglZ.js [32m200[0m 2.350 ms - 474429[0m
[0mGET /manifest.json [32m200[0m 1.054 ms - 303[0m
[0mGET /favicon.ico [32m200[0m 1.356 ms - 678[0m
[0mGET /api/v1/domain/health [32m200[0m 1.226 ms - 54[0m
[0mGET /api/v1/domain/health/db [32m200[0m 1.429 ms - 84[0m
[0mGET /api/v1/edge/health/db [32m200[0m 1.735 ms - 84[0m
[0mGET /api/v1/edge/health [32m200[0m 1.015 ms - 54[0m
[0mGET / [36m304[0m 3.542 ms - -[0m
[0mGET /assets/index-tavbKglZ.js [36m304[0m 3.157 ms - -[0m
[0mGET /manifest.json [36m304[0m 1.471 ms - -[0m
[0mGET /favicon.ico [36m304[0m 1.461 ms - -[0m
[0mGET /chat [32m200[0m 3.005 ms - 678[0m
[0mGET /assets/index-tavbKglZ.js [32m200[0m 1.324 ms - 474429[0m
[0mGET /favicon.ico [32m200[0m 0.703 ms - 678[0m
[0mGET /manifest.json [32m200[0m 0.897 ms - 303[0m
[0mGET /favicon.ico [36m304[0m 1.180 ms - -[0m
[0mGET /favicon.ico [36m304[0m 0.901 ms - -[0m
GET /api/v1/conversations route handler: typeof clientInstance.getThreads: function
GET /api/v1/conversations: Threads received from clientInstance.getThreads: []
GET /api/v1/conversations: About to map threads to conversation summaries.
GET /api/v1/conversations: Successfully mapped threads.
[0mGET /api/v1/conversations [32m200[0m 2.711 ms - 20[0m
ERR_HNDLR name: UnauthorizedError, msg: Authentication required
errorHandler: err instanceof AppError: true
Error: Authentication required
UnauthorizedError: Authentication required
    at /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/middleware/auth-middleware.ts:55:19
    at Layer.handle [as handle_request] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:328:13)
    at /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:286:9
    at Function.process_params (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:346:12)
    at next (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:280:10)
    at Function.handle (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:175:3)
    at router (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:47:12)
    at Layer.handle [as handle_request] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/router/index.js:328:13)
errorHandler sending AppError-like response: {"error":{"code":2000,"message":"Authentication required","errorCode":"UNAUTHORIZED","details":"No authorization header provided"}}
[0mGET /api/v1/api-keys/openai [33m401[0m 4.879 ms - 131[0m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/app.ts(1,21): error TS7016: Could not find a declaration file for module 'express'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
src/app.ts(2,18): error TS7016: Could not find a declaration file for module 'cors'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/cors/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/cors` if it exists or add a new declaration (.d.ts) file containing `declare module 'cors';`
src/app.ts(3,20): error TS2307: Cannot find module 'morgan' or its corresponding type declarations.
src/app.ts(4,20): error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
src/app.ts(107,24): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(107,30): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(327,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(327,21): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(618,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(618,21): error TS7006: Parameter 'res' implicitly has an 'any' type.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [
    7016, 7016, 2307,
    2307, 7006, 7006,
    7006, 7006, 7006,
    7006
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/app.ts(1,21): error TS7016: Could not find a declaration file for module 'express'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
src/app.ts(2,18): error TS7016: Could not find a declaration file for module 'cors'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/cors/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/cors` if it exists or add a new declaration (.d.ts) file containing `declare module 'cors';`
src/app.ts(3,20): error TS2307: Cannot find module 'morgan' or its corresponding type declarations.
src/app.ts(4,20): error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
src/app.ts(107,24): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(107,30): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(327,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(327,21): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(618,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(618,21): error TS7006: Parameter 'res' implicitly has an 'any' type.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [
    7016, 7016, 2307,
    2307, 7006, 7006,
    7006, 7006, 7006,
    7006
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/app.ts(1,21): error TS7016: Could not find a declaration file for module 'express'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
src/app.ts(2,18): error TS7016: Could not find a declaration file for module 'cors'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/cors/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/cors` if it exists or add a new declaration (.d.ts) file containing `declare module 'cors';`
src/app.ts(3,20): error TS2307: Cannot find module 'morgan' or its corresponding type declarations.
src/app.ts(4,20): error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
src/app.ts(107,24): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(107,30): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(327,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(327,21): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(618,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(618,21): error TS7006: Parameter 'res' implicitly has an 'any' type.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [
    7016, 7016, 2307,
    2307, 7006, 7006,
    7006, 7006, 7006,
    7006
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/app.ts(1,21): error TS7016: Could not find a declaration file for module 'express'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
src/app.ts(2,18): error TS7016: Could not find a declaration file for module 'cors'. '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/cors/lib/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/cors` if it exists or add a new declaration (.d.ts) file containing `declare module 'cors';`
src/app.ts(3,20): error TS2307: Cannot find module 'morgan' or its corresponding type declarations.
src/app.ts(4,20): error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
src/app.ts(107,24): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(107,30): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(327,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(327,21): error TS7006: Parameter 'res' implicitly has an 'any' type.
src/app.ts(618,15): error TS7006: Parameter '_req' implicitly has an 'any' type.
src/app.ts(618,21): error TS7006: Parameter 'res' implicitly has an 'any' type.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [
    7016, 7016, 2307,
    2307, 7006, 7006,
    7006, 7006, 7006,
    7006
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(58,7): error TS2322: Type 'string' is not assignable to type 'number | StringValue | undefined'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2322 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(59,7): error TS2322: Type 'string' is not assignable to type 'number | StringValue | undefined'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2322 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(58,15): error TS2430: Interface 'ExtendedSignOptions' incorrectly extends interface 'SignOptions'.
  Types of property 'expiresIn' are incompatible.
    Type 'string | number' is not assignable to type 'number | StringValue | undefined'.
      Type 'string' is not assignable to type 'number | StringValue | undefined'.
src/providers/auth/jwt/JwtService.ts(66,16): error TS2769: No overload matches this call.
  Overload 1 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: null, options?: (SignOptions & { algorithm: "none"; }) | undefined): string', gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'null'.
  Overload 2 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, options?: SignOptions | undefined): string', gave the following error.
    Argument of type 'ExtendedSignOptions' is not assignable to parameter of type 'SignOptions'.
      Types of property 'expiresIn' are incompatible.
        Type 'string | number' is not assignable to type 'number | StringValue | undefined'.
          Type 'string' is not assignable to type 'number | StringValue | undefined'.
  Overload 3 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, callback: SignCallback): void', gave the following error.
    Argument of type 'ExtendedSignOptions' is not assignable to parameter of type 'SignCallback'.
      Type 'ExtendedSignOptions' provides no match for the signature '(error: Error | null, encoded?: string | undefined): void'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2430, 2769 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(58,16): error TS2769: No overload matches this call.
  Overload 1 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: null, options?: (SignOptions & { algorithm: "none"; }) | undefined): string', gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'null'.
  Overload 2 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, options?: SignOptions | undefined): string', gave the following error.
    Type 'string' is not assignable to type 'number | StringValue | undefined'.
  Overload 3 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, callback: SignCallback): void', gave the following error.
    Object literal may only specify known properties, and 'expiresIn' does not exist in type 'SignCallback'.
src/providers/auth/jwt/JwtService.ts(60,51): error TS2304: Cannot find name 'tokenOptions'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2769, 2304 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(58,16): error TS2769: No overload matches this call.
  Overload 1 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: null, options?: (SignOptions & { algorithm: "none"; }) | undefined): string', gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'null'.
  Overload 2 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, options?: SignOptions | undefined): string', gave the following error.
    Type 'string' is not assignable to type 'number | StringValue | undefined'.
  Overload 3 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, callback: SignCallback): void', gave the following error.
    Object literal may only specify known properties, and 'expiresIn' does not exist in type 'SignCallback'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2769 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/providers/auth/jwt/JwtService.ts(58,16): error TS2769: No overload matches this call.
  Overload 1 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: null, options?: (SignOptions & { algorithm: "none"; }) | undefined): string', gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'null'.
  Overload 2 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, options?: SignOptions | undefined): string', gave the following error.
    Type 'string' is not assignable to type 'number | StringValue | undefined'.
  Overload 3 of 5, '(payload: string | object | Buffer<ArrayBufferLike>, secretOrPrivateKey: Buffer<ArrayBufferLike> | Secret | PrivateKeyInput | JsonWebKeyInput, callback: SignCallback): void', gave the following error.
    Object literal may only specify known properties, and 'expiresIn' does not exist in type 'SignCallback'.

    at createTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:863:19)
    at getOutput (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1077:36)
    at Object.compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1433:41)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1617:30)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  diagnosticCodes: [ 2769 ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: contextThreadClient - Type: object | Keys: getContextThreadClient
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: clientInstance - Type: object | Keys: service
Starting server with configured port: 3000 (from env: 3000)
Liminal Type Chat server listening on port 3000
http://localhost:3000
Dashboard URL: http://localhost:3000/dashboard
Database initialized at db/liminal.db
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
conversation.ts: MODULE EXECUTION STARTED
Ajv options: {
  allErrors: true,
  strict: true,
  strictTypes: true,
  strictRequired: true,
  strictSchema: true,
  strictNumbers: true,
  strictTuples: true,
  code: {
    optimize: 1,
    regExp: [Function: defaultRegExp] { code: 'new RegExp' },
    formats: _Code { _items: [Array] }
  },
  loopRequired: 200,
  loopEnum: 200,
  meta: true,
  messages: true,
  inlineRefs: true,
  schemaId: '$id',
  addUsedSchema: true,
  validateSchema: true,
  validateFormats: true,
  unicodeRegExp: true,
  int32range: true,
  uriResolver: <ref *1> {
    SCHEMES: {
      http: [Object],
      https: [Object],
      ws: [Object],
      wss: [Object],
      urn: [Object],
      'urn:uuid': [Object]
    },
    normalize: [Function: normalize],
    resolve: [Function: resolve],
    resolveComponents: [Function: resolveComponents],
    equal: [Function: equal],
    serialize: [Function: serialize],
    parse: [Function: parse],
    default: [Circular *1],
    fastUri: [Circular *1],
    code: 'require("ajv/dist/runtime/uri").default'
  }
}
conversation.ts: contextThreadClient at module level - Type: object | Keys: getContextThreadClient
conversation.ts: Imported getContextThreadClient at module level - Type: function | Is it a Jest mock? Not a Jest mock or not a function
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: contextThreadClient - Type: object | Keys: getContextThreadClient
Database connected at: /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/db/liminal.db
Database schema applied successfully.
createConversationRoutes: clientInstance - Type: object | Keys: service
Starting server with configured port: 3000 (from env: 3000)
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/express/lib/application.js:635:24)
    at startServer (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts:11:24)
    at Object.<anonymous> (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts:42:1)
    at Module._compile (node:internal/modules/cjs/loader:1734:14)
    at Module.m._compile (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1618:23)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/ts-node/src/index.ts:1621:12) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3000
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
Error: Cannot find module 'express'
Require stack:
- /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts
- /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts
    at Function.<anonymous> (node:internal/modules/cjs/loader:1405:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1061:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1066:22)
    at Function._load (node:internal/modules/cjs/loader:1215:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1491:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts:1:1) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts',
    '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts'
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
[32m[nodemon] restarting due to changes...[39m
[32m[nodemon] starting `ts-node src/server.ts`[39m
Error: Cannot find module 'express'
Require stack:
- /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts
- /Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts
    at Function.<anonymous> (node:internal/modules/cjs/loader:1405:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1061:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1066:22)
    at Function._load (node:internal/modules/cjs/loader:1215:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1491:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts:1:1) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/app.ts',
    '/Users/leemoore/Library/Mobile Documents/com~apple~CloudDocs/code/liminal-type-chat/server/src/server.ts'
  ]
}
[31m[nodemon] app crashed - waiting for file changes before starting...[39m
sh: line 1: 65097 Killed: 9               npm run dev

# LivEx (Live Examples eXpression)

This repository features LivEx, a Domain Specific Language (DSL) built with [Langium](https://langium.org/) intended to provide an expressive and language-agnostic way of defining examples for a live programming environment.

Live programming environments are development environments where feedback on execution of the program is constantly being given to the programmer, and updated as the source code changes. Which part of the execution to track and showcase to the programmer can be defined by *examples*.

This language is currently evolving along with the [LiveRec project](https://github.com/jbdoderlein/LiveProbes/tree/LivEx) which it uses as an execution back-end. However, the language is intended to be usable for any live programming execution environment.

## Build and run

After cloning the repository locally and installing the project dependencies (`npm i`), you can run the following commands to get LivEx running as a http service on port 3000:

```
npm run langium:generate
npm run build
npm run serve:live
```

The entrypoint is `src/app.ts` and the main way to interact with the service is with a POST request on `/api/code`. The service expects a JSON-formatted body with the field `example` corresponding to a valid LivEx program; the response is a JSON object where each example in the program has its name as a key, and an object containing the method to be called, its arguments, and a list of probes corresponding to the example.

## Use as a Node module

LivEx also exposes an ESM module API:

```ts
import { execRequestAction, parseLivEx } from 'livex';

const source = `
exampleOne: compute(1, "value")
[12] exampleOne: probe PY .frame:answer if £answer > 0£
`;

const parsed = await parseLivEx(source);
console.log(parsed.ast.defs);
console.log(parsed.diagnostics);

const request = execRequestAction(source);
console.log(request.exampleOne.method);
```

The package exports generated AST types from `livex/ast` and the Langium service factory from `livex/services` when lower-level integration is needed.

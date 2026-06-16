import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createLivExServices } from "../../src/language/livex-module.js";
import { DefinitionList, isDefinitionList, isExample, isProbe } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createLivExServices>;
let parse:    ReturnType<typeof parseHelper<DefinitionList>>;
let document: LangiumDocument<DefinitionList> | undefined;

beforeAll(async () => {
    services = createLivExServices(EmptyFileSystem);
    parse = parseHelper<DefinitionList>(services.LivEx);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Parsing tests', () => {

    test('parse simple LivEx model', async () => {
        document = await parse(`
            exampleOne: compute(1, "value")
            [12] exampleOne: probe PY .frame:answer if £answer > 0£
        `);

        // check for absensce of parser errors the classic way:
        //  deacivated, find a much more human readable way below!
        // expect(document.parseResult.parserErrors).toHaveLength(0);

        expect(
            // here we use a (tagged) template expression to create a human readable representation
            //  of the AST part we are interested in and that is to be compared to our expectation;
            // prior to the tagged template expression we check for validity of the parsed document object
            //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
            checkDocumentValid(document) || s`
                Examples:
                  ${document.parseResult.value?.defs?.filter(isExample).map(example => example.name)?.join('\n  ')}
                Probes:
                  ${document.parseResult.value?.defs?.filter(isProbe).map(probe => `${probe.example_name.$refText}:${probe.expr.target}`)?.join('\n  ')}
            `
        ).toBe(s`
            Examples:
              exampleOne
            Probes:
              exampleOne:answer
        `);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isDefinitionList(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${DefinitionList}'.`
        || undefined;
}

import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createLivExServices } from "../../src/language/livex-module.js";
import { DefinitionList, isDefinitionList, isProbe } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createLivExServices>;
let parse:    ReturnType<typeof parseHelper<DefinitionList>>;
let document: LangiumDocument<DefinitionList> | undefined;

beforeAll(async () => {
    services = createLivExServices(EmptyFileSystem);
    parse = parseHelper<DefinitionList>(services.LivEx);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [ document ]);
});

describe('Linking tests', () => {

    test('linking of probe examples', async () => {
        document = await parse(`
            exampleOne: compute(1)
            [12] exampleOne: probe :answer
        `);

        const probes = document.parseResult.value.defs.filter(isProbe);
        expect(
            // here we first check for validity of the parsed document object by means of the reusable function
            //  'checkDocumentValid()' to sort out (critical) typos first,
            // and then evaluate the cross references we're interested in by checking
            //  the referenced AST element as well as for a potential error message;
            checkDocumentValid(document)
                || probes.map(probe => probe.example_name.ref?.name || probe.example_name.error?.message).join('\n')
        ).toBe(s`
            exampleOne
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

import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createLivExServices } from "../../src/language/livex-module.js";
import { DefinitionList, isDefinitionList } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createLivExServices>;
let parse:    ReturnType<typeof parseHelper<DefinitionList>>;
let document: LangiumDocument<DefinitionList> | undefined;

beforeAll(async () => {
    services = createLivExServices(EmptyFileSystem);
    const doParse = parseHelper<DefinitionList>(services.LivEx);
    parse = (input: string) => doParse(input, { validation: true });

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {
  
    test('check no errors', async () => {
        document = await parse(`
            exampleOne: compute(1, "value")
            [12] exampleOne: probe :answer
        `);

        expect(
            // here we first check for validity of the parsed document object by means of the reusable function
            //  'checkDocumentValid()' to sort out (critical) typos first,
            // and then evaluate the diagnostics by converting them into human readable strings;
            // note that 'toHaveLength()' works for arrays and strings alike ;-)
            checkDocumentValid(document) || (document?.diagnostics?.map(diagnosticToString)?.join('\n') ?? '')
        ).toHaveLength(0);
    });

    test('check unresolved example reference validation', async () => {
        document = await parse(`
            [12] missingExample: probe :answer
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            // 'expect.stringContaining()' makes our test robust against future additions of further validation rules
            expect.stringContaining(s`
                missingExample
            `)
        );
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

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}

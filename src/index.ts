import type { LangiumDocument } from 'langium';
import { EmptyFileSystem, URI } from 'langium';
import type { DefinitionList } from './language/generated/ast.js';
import {
    createLivExServices as createServices,
    type LivExServices
} from './language/livex-module.js';
import {
    generateExecRequest,
    type ExecRequest
} from './cli/generator.js';

export { createServices as createLivExServices };
export * from './language/generated/ast.js';
export type { LivExServices } from './language/livex-module.js';
export type {
    ExecRequest,
    ExecRequestExample,
    ExecRequestProbe
} from './cli/generator.js';

export type LivExParserError = LangiumDocument<DefinitionList>['parseResult']['parserErrors'][number];
export type LivExDiagnostic = NonNullable<LangiumDocument<DefinitionList>['diagnostics']>[number];

export interface ParseLivExOptions {
    services?: LivExServices;
    documentUri?: string;
    validation?: boolean;
}

export interface ParseLivExResult {
    ast: DefinitionList;
    document: LangiumDocument<DefinitionList>;
    parserErrors: LivExParserError[];
    diagnostics: LivExDiagnostic[];
}

export interface ParseLivExAstOptions {
    services?: LivExServices;
    throwOnParserErrors?: boolean;
}

let nextDocumentId = 1;

export async function parseLivEx(code: string, options: ParseLivExOptions = {}): Promise<ParseLivExResult> {
    const services = options.services ?? createServices(EmptyFileSystem).LivEx;
    const uri = URI.parse(options.documentUri ?? `memory:///${nextDocumentId++}.lvx`);
    const documents = services.shared.workspace.LangiumDocuments;

    if (documents.hasDocument(uri)) {
        documents.deleteDocument(uri);
    }

    const document = services.shared.workspace.LangiumDocumentFactory.fromString<DefinitionList>(code, uri);
    documents.addDocument(document);
    await services.shared.workspace.DocumentBuilder.build([document], {
        validation: options.validation ?? true
    });

    return {
        ast: document.parseResult.value,
        document,
        parserErrors: document.parseResult.parserErrors,
        diagnostics: document.diagnostics ?? []
    };
}

export function parseLivExAst(code: string, options: ParseLivExAstOptions = {}): DefinitionList {
    const services = options.services ?? createServices(EmptyFileSystem).LivEx;
    const result = services.parser.LangiumParser.parse<DefinitionList>(code);

    if ((options.throwOnParserErrors ?? true) && result.parserErrors.length > 0) {
        throw new Error(`LivEx parser error: ${result.parserErrors.map(error => error.message).join('; ')}`);
    }

    return result.value;
}

export function execRequestAction(code: string, options: ParseLivExAstOptions = {}): ExecRequest {
    return generateExecRequest(parseLivExAst(code, options));
}

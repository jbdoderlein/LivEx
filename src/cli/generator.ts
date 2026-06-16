import { DefinitionList, isExample, isProbe } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export interface ExecRequest {
    [exampleName: string]: ExecRequestExample;
}

export interface ExecRequestExample {
    method: string;
    args: Array<number | string>;
    probes: ExecRequestProbe[];
}

export interface ExecRequestProbe {
    line: number;
    expr: {
        target: string;
        lang: string;
        scopes: string[];
    };
    condition: string;
}

export function generateJavaScript(model: DefinitionList, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = expandToNode`
        "use strict";

        ${joinToNode(model.defs, def => `console.log('Hello, ${def}!');`, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

export function generateExample(): string {
    return "Oh wow hi"
}

export function generateExecRequest(defList: DefinitionList): ExecRequest {
    const result: ExecRequest = {};
    for (const def of defList.defs) { // first pass to register all example names
        if (isExample(def)) {
            const ex = {
                "method": def.target.name,
                "args": def.scenario.args.map(arg => arg.value),
                "probes": []
            };
            result[def.name] = ex;
        } 
    }
    for (const def of defList.defs) { // second pass to register probes for examples
        if (isProbe(def)) {
            const probedExpr = {
                "target": def.expr.target,
                "lang": def.expr.lang ? def.expr.lang : "",
                "scopes": def.expr.scopes,
            }
            const probe = {
                "line": def.line,
                "expr": probedExpr,
                "condition": def.condition
            };
            result[def.example_name.$refText]["probes"].push(probe);
        }
    }
    return result;
}

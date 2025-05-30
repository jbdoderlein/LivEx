grammar LivEx

import "./livex-types"

entry DefinitionList:
    (defs+=Definition)*;

Definition:
    (Example | Scenario | State | Probe | Replacement);

Example returns Example:
    name=ID ':' target=Target  scenario=Scenario (state=State)?;

Target returns Target:
    name=ID;

Scenario returns Scenario:
    '(' ((args+=Arg ',')* args+=Arg)? ')';

Arg returns Arg:
    value=(INT | STRING);

State returns State:
    'state' '[' (setup_statements+=ANY_STMT)+ ']';

Probe returns Probe:
    '[' line=INT ']' (example_name=[Example:ID] ':') 'probe' expr=ProbedExpr ('if' condition=ANY_EXPR)? ;

ProbedExpr returns ProbedExpr:
    (lang=('PY' | 'JS') )? ('.' scopes+=ID)* ":" target=ID ;

Replacement returns Replacement:
    '[' line=INT ']' (example_name=[Example:ID] ':') 'use' '[' ( values+=ANY_EXPR ';')* ']' 'for' expr=ANY_EXPR;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal ANY_EXPR: /£[\s\S]*?£/;
terminal ANY_STMT: /[\s\S]*?;/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
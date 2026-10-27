; Copyright 2026 Oxide Computer Company

; textobjects.scm
;
; Text objects for Helix: `maf` selects an action, `mic` the body of a control,
; `]a` moves to the next parameter, and so on.

; Functions: actions, functions, and parser states, and the prototypes of
; methods and extern functions.
(action
  body: (_) @function.inside) @function.around

(function_declaration
  body: (_) @function.inside) @function.around

(state
  body: (_) @function.inside) @function.around

[
  (extern_function_declaration)
  (method)
] @function.around

; Classes: the declarations that hold other declarations.
(control_definition
  body: (_) @class.inside) @class.around

(parser_definition
  [
    (parser_local_element)
    (state)
  ]+ @class.inside) @class.around

(extern_definition
  (method)+ @class.inside) @class.around

(table
  (table_element)+ @class.inside) @class.around

(header_definition
  (field)* @class.inside) @class.around

(header_union_definition
  (field)* @class.inside) @class.around

(struct_definition
  (field)* @class.inside) @class.around

; Parameters and arguments. A parameter takes in its trailing comma.
(parameter) @parameter.inside @parameter.around

(method_field) @parameter.inside @parameter.around

(argument_list
  ((_expression) @parameter.inside
    .
    ","? @parameter.around) @parameter.around)

(comment) @comment.inside

(comment)+ @comment.around

; Entries: fields, table properties, and the cases of a select or switch.
[
  (field)
  (select_case)
  (switch_case)
  (table_element)
] @entry.around

(tuple
  (_expression) @entry.inside @entry.around)

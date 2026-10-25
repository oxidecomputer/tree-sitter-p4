; Copyright 2026 Oxide Computer Company

; locals.scm
;
; Scopes and local definitions, so that Helix colors each use of a parameter or
; local variable as its definition.

; Prototypes are scopes too, so that their parameters are not taken for
; definitions in the enclosing scope.
[
  (action)
  (block)
  (control_definition)
  (extern_function_declaration)
  (function_declaration)
  (method)
  (package)
  (parser_definition)
] @local.scope

(parameter
  name: (identifier) @local.definition.variable.parameter)

; A declaration names its variable, an assignment does not.
(var_decl
  type: (_)
  left: (lval
    .
    (identifier) @local.definition.variable))

(control_var
  name: (identifier) @local.definition.variable)

(const_definition
  name: (identifier) @local.definition.constant)

; Only the head of a member chain refers to a variable; `hdr` in `hdr.ipv4.ttl`.
(lval
  .
  (identifier) @local.reference)

(fval
  .
  (identifier) @local.reference)

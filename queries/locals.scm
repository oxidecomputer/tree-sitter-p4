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
  (control_declaration)
  (extern_function_declaration)
  (function_declaration)
  (method)
  (package)
  (parser_declaration)
] @local.scope

(parameter
  name: (identifier) @local.definition.variable.parameter)

(variable_declaration
  name: (identifier) @local.definition.variable)

(instantiation
  name: (identifier) @local.definition.variable)

(constant_declaration
  name: (identifier) @local.definition.constant)

; A name used as a value refers to a variable; a member's name does not, so
; `hdr` in `hdr.ipv4.ttl` is a reference and `ipv4` is not.
(_expression/identifier) @local.reference

(assignment_statement
  left: (identifier) @local.reference)

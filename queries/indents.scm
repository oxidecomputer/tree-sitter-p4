; Copyright 2026 Oxide Computer Company

; indents.scm
;
; Indentation for Helix. A line is indented once for each node below that
; begins on an earlier line and encloses it; several nodes beginning on the same
; line count once, so a declaration and its block indent their body together.

[
  (action)
  (block)
  (call)
  (control_definition)
  (error_declaration)
  (extern_definition)
  (extern_function_declaration)
  (function_declaration)
  (header_definition)
  (header_union_definition)
  (macro_invocation)
  (match_kind_declaration)
  (method)
  (obj_initializer)
  (package)
  (parser_definition)
  (select_expr)
  (struct_definition)
  (switch_statement)
  (table)
  (table_element)
  (tuple)
  (tuple_keyset)
] @indent

[
  "}"
  ")"
  "]"
] @outdent

; A branch that is not a block is indented under its condition.
(conditional
  consequence: (_) @indent
  (#not-kind-eq? @indent "block")
  (#set! "scope" "all"))

(conditional
  alternative: (_) @indent
  (#not-kind-eq? @indent "block")
  (#not-kind-eq? @indent "conditional")
  (#set! "scope" "all"))

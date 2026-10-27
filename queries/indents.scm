; Copyright 2026 Oxide Computer Company

; indents.scm
;
; Indentation for Helix. A line is indented once for each node below that
; begins on an earlier line and encloses it; several nodes beginning on the same
; line count once, so a declaration and its block indent their body together.

[
  (action)
  (argument_list)
  (block)
  (control_declaration)
  (enum_declaration)
  (error_declaration)
  (extern_declaration)
  (extern_function_declaration)
  (function_declaration)
  (header_declaration)
  (header_union_declaration)
  (macro_invocation)
  (match_kind_declaration)
  (method)
  (object_initializer)
  (package)
  (parser_declaration)
  (select_expression)
  (struct_declaration)
  (switch_statement)
  (table)
  (table_property)
  (tuple)
  (tuple_keyset)
] @indent

[
  "}"
  ")"
  "]"
] @outdent

; A branch that is not a block is indented under its condition.
(if_statement
  consequence: (_) @indent
  (#not-kind-eq? @indent "block")
  (#set! "scope" "all"))

(for_statement
  body: (_) @indent
  (#not-kind-eq? @indent "block")
  (#set! "scope" "all"))

(if_statement
  alternative: (_) @indent
  (#not-kind-eq? @indent "block")
  (#not-kind-eq? @indent "if_statement")
  (#set! "scope" "all"))

; Copyright 2026 Oxide Computer Company

; rainbows.scm
;
; Rainbow brackets for Helix: a bracket takes its color from the number of
; scopes enclosing it.

[
  (action)
  (annotation_body)
  (bit_type)
  (block)
  (call)
  (cast_expression)
  (conditional)
  (control_definition)
  (error_declaration)
  (extern_definition)
  (extern_function_declaration)
  (function_declaration)
  (header_definition)
  (header_union_definition)
  (int_type)
  (lval)
  (macro_invocation)
  (match_kind_declaration)
  (method)
  (obj_initializer)
  (package)
  (parenthesized_expression)
  (parser_definition)
  (select_expr)
  (slice)
  (stack_type)
  (struct_definition)
  (switch_statement)
  (table)
  (table_element)
  (tuple)
  (tuple_keyset)
  (varbit_type)
] @rainbow.scope

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @rainbow.bracket

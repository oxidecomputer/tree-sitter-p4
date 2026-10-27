; Copyright 2026 Oxide Computer Company

; rainbows.scm
;
; Rainbow brackets for Helix: a bracket takes its color from the number of
; scopes enclosing it.

[
  (action)
  (annotation_body)
  (argument_list)
  (bit_type)
  (block)
  (cast_expression)
  (control_declaration)
  (enum_declaration)
  (error_declaration)
  (extern_declaration)
  (extern_function_declaration)
  (for_statement)
  (function_declaration)
  (header_declaration)
  (header_union_declaration)
  (if_statement)
  (index_expression)
  (int_type)
  (macro_invocation)
  (match_kind_declaration)
  (method)
  (object_initializer)
  (package)
  (parenthesized_expression)
  (parser_declaration)
  (select_expression)
  (slice_expression)
  (array_type)
  (struct_declaration)
  (switch_statement)
  (table)
  (table_property)
  (tuple)
  (tuple_keyset)
  (type_arguments)
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

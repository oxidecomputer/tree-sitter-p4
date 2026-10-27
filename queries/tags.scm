; Copyright 2026 Oxide Computer Company

; tags.scm
;
; Each definition captures its name both as @name, for `tree-sitter tags`, and
; as @definition.<kind>, for Helix's symbol pickers, which take the captured
; node's text as the symbol.

(action
  name: (method_identifier) @name @definition.function)

(function_declaration
  name: (method_identifier) @name @definition.function)

(extern_function_declaration
  name: (method_identifier) @name @definition.function)

(method
  name: (method_identifier) @name @definition.function)

(control_declaration
  name: (method_identifier) @name @definition.class)

(parser_declaration
  name: (method_identifier) @name @definition.class)

(extern_declaration
  name: (type_identifier) @name @definition.interface)

(package
  "package"
  name: (method_identifier) @name @definition.interface)

(table
  name: (type_identifier) @name @definition.section)

(parser_state
  name: (method_identifier) @name @definition.section)

(header_declaration
  name: (type_identifier) @name @definition.struct)

(header_union_declaration
  name: (type_identifier) @name @definition.struct)

(struct_declaration
  name: (type_identifier) @name @definition.struct)

(enum_declaration
  name: (type_identifier) @name @definition.type)

(enum_member
  name: (identifier) @name @definition.constant)

(typedef_declaration
  name: (type_identifier) @name @definition.type)

(constant_declaration
  name: (identifier) @name @definition.constant)

(match_kind_declaration
  (identifier) @name @definition.constant)

(error_declaration
  (identifier) @name @definition.constant)

(preproc
  "#define"
  .
  [
    (identifier_preproc)
    (method_not_constant)
  ] @name @definition.macro)

(call_expression
  function: [
    (identifier) @name
    (member_expression
      member: (identifier) @name)
  ]) @reference.call

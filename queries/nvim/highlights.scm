; Generated from ../highlights.scm by `make queries/nvim/highlights.scm`. Do not edit.

; Copyright 2026 Oxide Computer Company

; highlights.scm
;
; Capture names follow Helix's theme scopes; the Neovim variant in nvim/ is
; derived from this file with Neovim's names. Helix and Neovim both let a later
; pattern override an earlier one for the same node, so general patterns come
; first and the patterns that refine them follow.

; Names
; -----

(identifier) @variable

; By convention, an all-caps name is a constant or a macro.
((identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]*$"))

(identifier_preproc) @constant

(type_identifier) @type

(method_identifier) @function

; Declarations named after a type: controls, parsers, and packages.
(control_declaration
  (method_identifier) @type)

(parser_declaration
  (method_identifier) @type)

(package
  (method_identifier) @type)

(method_field
  (method_identifier) @type)

; Members of a value, and the fields that declare them.
(member_expression
  member: (identifier) @variable.member)

(field
  (identifier) @variable.member)

; Calls, such as `f(x)`, calls through a member, such as `pkt.extract(...)`,
; and method declarations. These follow the members, which they refine.
(call_expression
  function: (identifier) @function)

(call_expression
  function: (member_expression
    member: (identifier) @function.method))

(method
  (method_identifier) @function.method)

(macro_invocation
  (method_identifier) @function.macro)

(macro_invocation
  function: (identifier) @function.macro)

; A macro standing for declarations, key elements, or actions, as in
; `key = { MAC_KEY }`, which is a bare name.
((macro_invocation) @constant
  (#match? @constant "^[A-Za-z_][A-Za-z0-9_]*$"))

(parameter
  (identifier) @variable.parameter)

(method_field
  (identifier) @variable.parameter)

(constant_declaration
  (identifier) @constant)

; Parser states, and the transitions that name them.
(parser_state
  (method_identifier) @label)

(transition_statement
  (identifier) @label)

(select_case
  (identifier) @label)

; The parser states every parser has.
((transition_statement
  (identifier) @constant.builtin)
  (#any-of? @constant.builtin "accept" "reject"))

((select_case
  (identifier) @constant.builtin)
  (#any-of? @constant.builtin "accept" "reject"))

(annotation
  "@" @attribute
  (identifier) @attribute)

; Literals
; --------

(number) @number

(boolean_literal) @boolean

(string_literal) @string

(comment) @comment

; Preprocessor
; ------------

[
  "#define"
  "#elif"
  "#else"
  "#endif"
  "#error"
  "#if"
  "#ifdef"
  "#ifndef"
  "#include"
  "#pragma"
  "#undef"
  "#warning"
] @keyword.directive

(include_path) @string.special.path

(preproc
  (method_not_constant) @function.macro)

; The name of a function-like macro, whose parameter list follows directly.
(preproc
  (identifier_preproc) @function.macro
  .
  "(")

(preproc
  "("
  (identifier) @variable.parameter)

; Types
; -----

[
  "bit"
  "bool"
  "error"
  "int"
  "list"
  "packet_in"
  "packet_out"
  "tuple"
  "varbit"
] @type.builtin

; Keywords
; --------

[
  "actions"
  "apply"
  "counters"
  "default_action"
  "key"
  "meters"
  "priority"
  "size"
  "state"
] @keyword

[
  "control"
  "extern"
  "match_kind"
  "header"
  "header_union"
  "package"
  "parser"
  "struct"
  "table"
  "type"
  "typedef"
] @keyword.type

[
  "abstract"
  "const"
  (direction)
] @keyword.modifier

"action" @keyword.function

[
  "else"
  "if"
  "select"
  "switch"
] @keyword.conditional

"transition" @keyword

[
  "break"
  "continue"
  "for"
] @keyword.repeat

(for_statement
  "in" @keyword.repeat)

[
  "exit"
  "return"
] @keyword.return

"default" @keyword

[
  "_"
  "..."
  (this)
] @variable.builtin

(invalid_header) @constant.builtin

; Match kinds.
(match_kind
  (identifier) @constant.builtin)

(match_kind_declaration
  (identifier) @constant.builtin)

; Errors, which are referred to as `error.Name`.
(error_declaration
  (identifier) @constant)

[
  "exact"
  "lpm"
  "optional"
  "range"
  "ternary"
] @constant.builtin

; The action core.p4 declares, as in `NoAction;` or `NoAction()`.
([
  (identifier)
  (method_identifier)
] @function.builtin
  (#eq? @function.builtin "NoAction"))

; The methods P4-16 gives headers, header stacks, packets, and tables, and its
; built-in functions. The properties of a header stack, such as `next`, are
; left out, since they are common field names too.
(call_expression
  function: (member_expression
    member: (identifier) @function.builtin)
  (#any-of? @function.builtin
    "advance" "apply" "emit" "extract" "isValid" "length" "lookahead"
    "maxSizeInBits" "maxSizeInBytes" "minSizeInBits" "minSizeInBytes"
    "pop_front" "push_front" "setInvalid" "setValid"))

(call_expression
  function: (identifier) @function.builtin
  (#any-of? @function.builtin "static_assert" "verify"))

; What applying a table tells: `t.apply().hit`.
(member_expression
  object: (call_expression)
  member: (identifier) @variable.builtin
  (#any-of? @variable.builtin "action_run" "hit" "miss"))

; Errors, as in `error.NoMatch`.
(member_expression
  object: (identifier) @type.builtin
  member: (identifier) @constant
  (#eq? @type.builtin "error"))

; Operators and punctuation
; -------------------------

[
  "="
  ".."
  "&&&"
  "+:"
] @operator

(binary_expression
  operator: _ @operator)

(unary_expression
  operator: _ @operator)

(assignment_statement
  operator: _ @operator)

"mask" @keyword.operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  "."
  ":"
  ";"
] @punctuation.delimiter

(conditional_expression
  [
    "?"
    ":"
  ] @operator)

; Angle brackets enclose type arguments. In a comparison they are operators,
; reached through binary_expression.
(bit_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(int_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(varbit_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(tuple_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(list_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(type_arguments
  [
    "<"
    ">"
  ] @punctuation.bracket)

(method_field
  [
    "<"
    ">"
  ] @punctuation.bracket)

(type_parameters
  [
    "<"
    ">"
  ] @punctuation.bracket)

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

(type_identifier
  (identifier) @type)

(method_identifier
  (identifier) @function)

; Declarations named after a type: controls, parsers, and packages.
(control_definition
  (method_identifier
    (identifier) @type))

(parser_definition
  (method_identifier
    (identifier) @type))

(package
  (method_identifier
    (identifier) @type))

(method_field
  (method_identifier
    (identifier) @type))

; Calls through a member, such as `pkt.extract(...)`, and method declarations.
;
; These patterns are not anchored to the dot. A pattern anchored to it matches
; only after the first dot, which would miss `isValid` in `hdr.ipv4.isValid()`.
; Only the head of a chain has no dot before it.
(fval
  "."
  (method_identifier
    (identifier) @function.method))

(method
  (method_identifier
    (identifier) @function.method))

(macro_invocation
  (method_identifier
    (identifier) @function.macro))

(macro_invocation
  (fval
    (method_identifier
      (identifier) @function.macro)))

; Members of a value, and the fields that declare them.
(lval
  "."
  (identifier) @variable.other.member)

(fval
  "."
  (identifier) @variable.other.member)

(member_expression
  "."
  (identifier) @variable.other.member)

(field
  (identifier) @variable.other.member)

(parameter
  (identifier) @variable.parameter)

(method_field
  (identifier) @variable.parameter)

(const_definition
  (identifier) @constant)

; Parser states, and the transitions that name them.
(state
  (method_identifier
    (identifier) @label))

(transition
  (identifier) @label)

(select_case
  (identifier) @label)

; The parser states every parser has.
((transition
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

(number) @constant.numeric

(bool) @constant.builtin.boolean

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
  "typedef"
] @keyword.storage.type

[
  "const"
  (direction)
] @keyword.storage.modifier

"action" @keyword.function

[
  "else"
  "if"
  "select"
  "switch"
] @keyword.control.conditional

"transition" @keyword.control

[
  "exit"
  "return"
] @keyword.control.return

"default" @keyword.control

"_" @variable.builtin

; Match kinds.
(key_type
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

"NoAction" @function.builtin

; Operators and punctuation
; -------------------------

[
  (binop)
  (unop)
  "="
  ".."
] @operator

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
; reached through binop.
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

(call
  [
    "<"
    ">"
  ] @punctuation.bracket)

(control_var
  [
    "<"
    ">"
  ] @punctuation.bracket)

(method_field
  [
    "<"
    ">"
  ] @punctuation.bracket)

(package
  [
    "<"
    ">"
  ] @punctuation.bracket)

(type_parameters
  [
    "<"
    ">"
  ] @punctuation.bracket)

; Copyright 2026 Oxide Computer Company

; highlights.scm
;
; Capture names follow Helix's theme scopes. Helix and Neovim both let a later
; pattern override an earlier one for the same node, so general patterns come
; first and the patterns that refine them follow.

; Names
; -----

(identifier_preproc) @constant

(type_identifier) @type
(method_identifier) @function
(annotation) @attribute

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
  "header"
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

"return" @keyword.control.return

"default" @keyword.control

"_" @variable.builtin

; Match kinds.
[
  "exact"
  "lpm"
  "optional"
  "range"
  "ternary"
] @constant.builtin

"NoAction" @function.builtin

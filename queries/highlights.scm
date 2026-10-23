; Copyright 2026 Oxide Computer Company

; highlights.scm
;
; Capture names follow Helix's theme scopes. Helix and Neovim both let a later
; pattern override an earlier one for the same node, so general patterns come
; first and the patterns that refine them follow.

"header" @keyword
"struct" @keyword
"typedef" @keyword
"extern" @keyword
"parser" @keyword
"state" @keyword
"if" @keyword
"else" @keyword
"switch" @keyword
"transition" @keyword
"select" @keyword
"apply" @keyword
"control" @keyword
"package" @keyword
"action" @keyword
"table" @keyword
"key" @keyword
"size" @keyword
"range" @keyword
"lpm" @keyword
"exact" @keyword
"ternary" @keyword
"optional" @keyword
"actions" @keyword
"default" @keyword
"default_action" @keyword
"return" @keyword
"NoAction" @keyword
"const" @keyword
"meters" @keyword
"counters" @keyword
"_" @keyword
"true" @constant
"false" @constant
(direction) @keyword
(number) @number
(bit_type) @type
(varbit_type) @type
(tuple_type) @type
"bool" @type
"error" @type
"int" @type
"bit" @type
"tuple" @type
"varbit" @type
"packet_in" @type
"packet_out" @type
(type_identifier) @type
(method_identifier) @function
(comment) @comment
(string_literal) @string
(annotation) @attribute

; Preprocessor
; ------------

(identifier_preproc) @constant

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

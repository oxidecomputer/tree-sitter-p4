; Copyright 2026 Oxide Computer Company

; Topiary formatting rules for P4-16.
;
; The grammar places comments and preprocessor directives in `extras`, so both
; may appear between any two tokens. Both are leaves. This matters for
; `preproc` in particular: the payload of a directive is matched by an
; anonymous pattern and so is absent from the syntax tree, and reformatting the
; interior of the node would discard source text. The same holds for the string
; form of `annotation_content`.

[
  (annotation)
  (comment)
  (preproc)
  (string_literal)
] @leaf

; Allow blank line before
[
  (comment)
  (control_body_element)
  (field)
  (method)
  (preproc)
  (select_case)
  (state)
  (stmt)
  (table_element)
  (top)
] @allow_blank_line_before

; Input softlines before comments, so that the input decides whether a comment
; sits on a line of its own or trails the construct it annotates.
(comment) @prepend_input_softline

; The grammar gives line and block comments one node type, so the break after a
; comment is decided by the input here too. That is safe for the line form: its
; token ends before the newline that terminates it, so a line comment is always
; followed by a break in the input and always gets one back. Forcing a hardline
; instead would push the closing brace of `header H { /* omitted */ }` onto a
; line of its own, and the second formatting pass would then treat the header
; as multi-line.
(comment) @append_input_softline

; Append line breaks. Where a comment follows the construct on the same line,
; nothing is added, since the rules above have already placed the break.
(
  [
    (control_body_element)
    (field)
    (method)
    (preproc)
    (select_case)
    (state)
    (stmt)
    (table_element)
    (top)
  ] @append_spaced_softline
  .
  (comment)* @do_nothing
)

; Braces. A softline breaks only where the construct holding it already spans
; several lines in the input, which is what keeps a guarded extract such as
; `if (h.isValid()) { pkt.extract(h); }` on one line.
;
; Each brace is captured by its own pattern. A pattern naming both braces
; matches every pairing of them, and a conditional with an else branch would
; then collect the indentation markers four times over.
[
  (action "{" @prepend_space)
  (conditional "{" @prepend_space)
  (control_body "{" @prepend_space)
  (control_definition "{" @prepend_space)
  (extern_definition "{" @prepend_space)
  (function_declaration "{" @prepend_space)
  (header_definition "{" @prepend_space)
  (parser_definition "{" @prepend_space)
  (select_expr "{" @prepend_space)
  (state "{" @prepend_space)
  (struct_definition "{" @prepend_space)
  (table "{" @prepend_space)
  (table_element "{" @prepend_space)
]

[
  (action "{" @append_spaced_softline @append_indent_start)
  (conditional "{" @append_spaced_softline @append_indent_start)
  (control_body "{" @append_spaced_softline @append_indent_start)
  (control_definition "{" @append_spaced_softline @append_indent_start)
  (extern_definition "{" @append_spaced_softline @append_indent_start)
  (function_declaration "{" @append_spaced_softline @append_indent_start)
  (header_definition "{" @append_spaced_softline @append_indent_start)
  (parser_definition "{" @append_spaced_softline @append_indent_start)
  (select_expr "{" @append_spaced_softline @append_indent_start)
  (state "{" @append_spaced_softline @append_indent_start)
  (struct_definition "{" @append_spaced_softline @append_indent_start)
  (table "{" @append_spaced_softline @append_indent_start)
  (table_element "{" @append_spaced_softline @append_indent_start)
  (tuple "{" @append_empty_softline @append_indent_start)
]

[
  (action "}" @prepend_spaced_softline @prepend_indent_end)
  (conditional "}" @prepend_spaced_softline @prepend_indent_end)
  (control_body "}" @prepend_spaced_softline @prepend_indent_end)
  (control_definition "}" @prepend_spaced_softline @prepend_indent_end)
  (extern_definition "}" @prepend_spaced_softline @prepend_indent_end)
  (function_declaration "}" @prepend_spaced_softline @prepend_indent_end)
  (header_definition "}" @prepend_spaced_softline @prepend_indent_end)
  (parser_definition "}" @prepend_spaced_softline @prepend_indent_end)
  (select_expr "}" @prepend_spaced_softline @prepend_indent_end)
  (state "}" @prepend_spaced_softline @prepend_indent_end)
  (struct_definition "}" @prepend_spaced_softline @prepend_indent_end)
  (table "}" @prepend_spaced_softline @prepend_indent_end)
  (table_element "}" @prepend_spaced_softline @prepend_indent_end)
  (tuple "}" @prepend_empty_softline @prepend_indent_end)
]

; `apply` hangs directly off control_body rather than being wrapped in a node.
(control_body
  "apply" @prepend_spaced_softline @allow_blank_line_before
)

; Entries of the braced forms of table_element (`key`, `actions`, entry lists)
; are separated by semicolons, unlike the one in `size = 1024;`, which closes
; the element and breaks by the rule above.
(
  (table_element
    "{"
    ";" @append_spaced_softline
  )
  .
  (comment)* @do_nothing
)

; Elements of a tuple literal.
(
  (tuple
    "," @append_spaced_softline
  )
  .
  (comment)* @do_nothing
)

; A parameter list is its own line-breaking context: the parameters of a
; declaration that spans several lines are not themselves obliged to break.
(
  [
    (action "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (control_definition "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (function_declaration "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (method "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (package "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (parser_definition "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
  ]
  (#scope_id! "parameter_list")
)

(
  [
    (action ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (control_definition ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (function_declaration ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (method ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (package ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (parser_definition ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
  ]
  (#scope_id! "parameter_list")
)

; Calls and tuple keysets use the same input-sensitive layout as parameter
; lists, but need a separate scope because they can occur inside parameters.
(
  [
    (call "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
    (tuple_keyset "(" @prepend_begin_scope @append_empty_scoped_softline @append_indent_start)
  ]
  (#scope_id! "argument_list")
)

(
  [
    (call ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
    (tuple_keyset ")" @append_end_scope @prepend_empty_scoped_softline @prepend_indent_end)
  ]
  (#scope_id! "argument_list")
)

(
  [
    (call "," @append_spaced_scoped_softline)
    (tuple_keyset "," @append_spaced_scoped_softline)
  ]
  (#scope_id! "argument_list")
)

; A parameter carries its own trailing comma; a package instantiation separates
; its arguments with commas of its own.
(
  [
    (method_field "," @append_spaced_scoped_softline)
    (package "," @append_spaced_scoped_softline)
    (parameter "," @append_spaced_scoped_softline)
  ]
  (#scope_id! "parameter_list")
)

; Surround spaces
[
  "action"
  "apply"
  "const"
  "control"
  "default"
  "else"
  "extern"
  "header"
  "if"
  "package"
  "parser"
  "state"
  "struct"
  "table"
  "transition"
  "typedef"
  (binop)
] @prepend_space @append_space

; Append spaces
[
  "bit"
  "bool"
  "error"
  "int"
  "packet_in"
  "packet_out"
  "varbit"
  (bit_type)
  (direction)
  (tuple_type)
  (type_identifier)
  (varbit_type)
] @append_space

(const_definition
  "=" @prepend_space @append_space
)

(var_decl
  "=" @prepend_space @append_space
)

(table_element
  "=" @prepend_space @append_space
)

; The instance name of a package instantiation, as in `V1Switch(...) main;`.
; Every other identifier in the production is wrapped in a method_identifier.
(package
  (identifier) @prepend_space
)

; A package declaration lists the types of its arguments as method identifiers,
; each followed by the name it binds.
(method_field
  (identifier) @prepend_space
)

; An instantiation names its instance after the argument list, as in
; `Checksum() csum;`.
(control_var
  (identifier) @prepend_space
)

; An argument or parameter list hugs the name in front of it. `if` and
; `else if` are the exception, which is why this is not a rule on every
; parenthesis.
[
  (action "(" @prepend_antispace)
  (call "(" @prepend_antispace)
  (control_definition "(" @prepend_antispace)
  (control_var "(" @prepend_antispace)
  (function_declaration "(" @prepend_antispace)
  (method "(" @prepend_antispace)
  (package "(" @prepend_antispace)
  (parser_definition "(" @prepend_antispace)
  (select_expr "(" @prepend_antispace)
]

; Never put a space before a comma or a semicolon
[
  ","
  ";"
] @prepend_antispace

"," @append_space

"." @prepend_antispace @append_antispace

".." @prepend_antispace @append_antispace

; A colon separates a key from its match kind, or an entry from its action. In
; a bit slice it separates the bounds of a range and takes no space.
[
  (select_case ":" @prepend_antispace @append_space)
  (table_element ":" @prepend_antispace @append_space)
]

(slice
  ":" @prepend_antispace @append_antispace
)

; Angle brackets delimit type arguments, never comparisons: the comparison
; operators are reached through (binop).
[
  (bit_type "<" @prepend_antispace @append_antispace)
  (control_definition "<" @prepend_antispace @append_antispace)
  (control_var "<" @prepend_antispace @append_antispace)
  (method "<" @prepend_antispace @append_antispace)
  (package "<" @prepend_antispace @append_antispace)
  (parser_definition "<" @prepend_antispace @append_antispace)
  (tuple_type "<" @prepend_antispace @append_antispace)
  (varbit_type "<" @prepend_antispace @append_antispace)
]

[
  (bit_type ">" @prepend_antispace)
  (control_definition ">" @prepend_antispace)
  (control_var ">" @prepend_antispace)
  (method ">" @prepend_antispace)
  (package ">" @prepend_antispace)
  (parser_definition ">" @prepend_antispace)
  (tuple_type ">" @prepend_antispace)
  (varbit_type ">" @prepend_antispace)
]

; Parentheses and subscripts hug their contents.
"(" @append_antispace

")" @prepend_antispace

"[" @prepend_antispace @append_antispace

"]" @prepend_antispace

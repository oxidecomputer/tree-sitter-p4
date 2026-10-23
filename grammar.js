// Copyright 2026 Oxide Computer Company

module.exports = grammar({
  name: "p4",

  extras: ($) => [/\s|\\\r?\n/, $.comment, $.preproc],

  // See src/scanner.c.
  externals: ($) => [$._define_end, $._error_sentinel],

  word: ($) => $.identifier,

  // Hidden rules that queries may still name, as in `(_definition)`.
  supertypes: ($) => [$._definition, $._statement, $._expression],

  precedences: ($) => [
    [$._expression, $.method_identifier],
    [$.bit_type, $._type],
    [$.int_type, $._type],
    [$.varbit_type, $._type],
  ],

  // `a.b.c` is a prefix of both a member reference and a method call; the
  // parser cannot tell them apart until it reaches the `(` or the end. The
  // same holds after `a.b <`, which opens either a comparison or the type
  // arguments of a call such as `pkt.lookahead<bit<16>>()`.
  //
  // `(t)` is a cast when `t` names a type and an expression follows, and a
  // parenthesized expression otherwise. Without a symbol table the parser keeps
  // both readings until the next token settles it.
  conflicts: ($) => [
    [$.fval, $.lval],
    [$.lval],
    [$.lval, $.method_identifier],
    [$._member_or_index, $.method_identifier],
    [$._cast_type, $.lval],
    [$.macro_invocation, $.package],
    [$._macro_declaration, $.control_var],
  ],

  rules: {
    // A stray semicolon is an empty declaration, as after `struct S { };`.
    source_file: ($) => repeat(choice($._definition, ";")),

    _definition: ($) =>
      choice(
        $.function_declaration,
        $.match_kind_declaration,
        $.header_definition,
        $.struct_definition,
        $.typedef_definition,
        $.const_definition,
        $.extern_definition,
        $.parser_definition,
        $.control_definition,
        $.package,
        $.action,
        $.table,
        $.macro_invocation,
      ),

    // A macro expanding to declarations or statements, invoked without a
    // trailing semicolon, as in `ROTATE_BY_N(1)`. The grammar does not expand
    // macros, so this is the closest it gets to the expansion. It shares its
    // prefix with a call, and is told apart only by the missing semicolon.
    macro_invocation: ($) =>
      seq(
        $.method_identifier,
        "(",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        ")",
      ),

    // The same among declarations, where it shares its prefix with an
    // instantiation, `T(args) name;`, and is told apart only by the missing
    // name. The prefix has to be the instantiation's, type and all, because
    // `type_identifier` would otherwise win statically before the parser
    // reaches the token that decides.
    _macro_declaration: ($) =>
      seq(
        alias($.type_identifier, $.method_identifier),
        "(",
        repeat(seq($._expression, optional(","))),
        ")",
      ),

    package: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "package",
          $.method_identifier,
          optional($.type_parameters),
          "(",
          repeat($.method_field),
          ")",
          ";",
        ),
        // An instantiation, as in `V1Switch(p(), c()) main;`. Its arguments
        // are expressions so that it shares its prefix with a macro
        // invocation, from which only the instance name tells it apart.
        seq(
          $.method_identifier,
          "(",
          optional(
            seq($._expression, repeat(seq(",", $._expression)), optional(",")),
          ),
          ")",
          $.identifier,
          ";",
        ),
      ),

    // The match kinds an architecture adds, as in
    // `match_kind { selector, dleft_hash }`.
    match_kind_declaration: ($) =>
      seq(
        "match_kind",
        "{",
        $.identifier,
        repeat(seq(",", $.identifier)),
        optional(","),
        "}",
      ),

    function_declaration: ($) =>
      seq(
        choice($._type, $.type_identifier),
        $.method_identifier,
        "(",
        repeat($.parameter),
        ")",
        $.block,
      ),

    header_definition: ($) =>
      choice(
        seq("header", $.type_identifier, $.identifier_preproc),
        seq(
          repeat($.annotation),
          "header",
          $.type_identifier,
          "{",
          repeat($.field),
          "}",
        ),
      ),

    struct_definition: ($) =>
      seq(
        repeat($.annotation),
        "struct",
        $.type_identifier,
        "{",
        repeat($.field),
        "}",
      ),

    typedef_definition: ($) =>
      seq(
        repeat($.annotation),
        "typedef",
        choice($._type, $.type_identifier),
        $.type_identifier,
        ";",
      ),

    const_definition: ($) =>
      seq(
        repeat($.annotation),
        "const",
        choice($._type, $.type_identifier),
        $.identifier,
        "=",
        $._expression,
        ";",
      ),

    extern_definition: ($) =>
      seq(
        repeat($.annotation),
        "extern",
        $.type_identifier,
        optional($.type_parameters),
        "{",
        repeat($.method),
        "}",
      ),

    parser_definition: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "parser",
          $.method_identifier,
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "parser",
          $.method_identifier,
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          // Constructor parameters, as for a control.
          optional(seq("(", repeat($.parameter), ")")),
          "{",
          repeat1(choice($.parser_local_element, $.state)),
          "}",
        ),
      ),

    // parserLocalElement in the P4-16 grammar: declarations that precede or
    // sit between the states.
    parser_local_element: ($) =>
      choice(
        $.const_definition,
        $.var_decl,
        seq(repeat($.annotation), $.control_var),
        alias($._macro_declaration, $.macro_invocation),
      ),

    control_definition: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "control",
          $.method_identifier,
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "control",
          $.method_identifier,
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          // Constructor parameters, as in `control C(...)(bit<32> size)`.
          optional(seq("(", repeat($.parameter), ")")),
          "{",
          optional($.control_body),
          "}",
        ),
      ),

    // P4-16 allows exactly one apply block, but the preprocessor directives
    // are extras, so `#if ... apply {...} #else apply {...} #endif` reaches the
    // parser as two of them.
    control_body: ($) =>
      repeat1(choice($.control_body_element, seq("apply", $.block))),

    control_body_element: ($) =>
      choice(
        seq(repeat($.annotation), $.control_var),
        seq(repeat($.annotation), $.table),
        seq(repeat($.annotation), $.action),
        $.const_definition,
        $.var_decl,
        alias($._macro_declaration, $.macro_invocation),
      ),

    table: ($) =>
      seq("table", $.type_identifier, "{", repeat($.table_element), "}"),

    table_element: ($) =>
      choice(
        seq(
          "key",
          "=",
          "{",
          repeat1(
            seq($._expression, ":", $.key_type, repeat($.annotation), ";"),
          ),
          "}",
        ),
        seq(
          "actions",
          "=",
          "{",
          repeat1(seq(repeat($.annotation), $.action_item, ";")),
          "}",
        ),
        seq(
          optional("const"),
          $.identifier,
          "=",
          "{",
          // Possibly empty, as when the entries come from an `#include`.
          repeat(
            seq(
              $.keyset_expression,
              ":",
              repeat($.annotation),
              $.action_item,
              ";",
            ),
          ),
          "}",
        ),
        seq(optional("const"), "default_action", "=", $.action_item, ";"),
        seq("size", "=", $._expression, ";"),
        seq("meters", "=", $.identifier, ";"),
        seq("counters", "=", $.identifier, ";"),
        // Any other property, as P4-16 allows: an architecture's own, such
        // as `implementation = profile;` or `idle_timeout = true;`, with an
        // optional annotation and `const`.
        seq(
          repeat($.annotation),
          optional("const"),
          $.identifier,
          "=",
          $._expression,
          ";",
        ),
      ),

    action_item: ($) => choice($.method_identifier, $.call, "NoAction"),

    // The standard match kinds, or one an architecture declares with
    // `match_kind`, such as `selector` or `atcam_partition_index`.
    key_type: ($) =>
      choice("range", "exact", "ternary", "lpm", "optional", $.identifier),

    state: ($) => seq("state", $.method_identifier, $.block),

    _statement: ($) =>
      choice(
        $.block,
        $.conditional,
        $.switch_statement,
        $.action,
        $.var_decl,
        $.type_decl,
        $.transition,
        $.call_statement,
        // A macro invocation: a call without its semicolon.
        alias($.call, $.macro_invocation),
        $.return_statement,
        $.exit_statement,
        $.empty_statement,
      ),

    block: ($) => seq("{", repeat($._statement), "}"),

    // Preferred to a macro invocation followed by an empty statement.
    call_statement: ($) => prec(1, seq($.call, ";")),

    return_statement: ($) => seq("return", optional($._expression), ";"),

    exit_statement: (_) => seq("exit", ";"),

    empty_statement: (_) => ";",

    switch_statement: ($) =>
      seq("switch", "(", $._expression, ")", "{", repeat($.switch_case), "}"),

    // A label with no block falls through to the next one. A `{` after the
    // colon always opens the block: P4-16 forbids a label that begins with a
    // brace, so it cannot be the next label's tuple.
    switch_case: ($) =>
      prec.right(seq(choice("default", $._expression), ":", optional($.block))),

    type_decl: ($) =>
      seq(
        optional("("),
        choice($._type, $.type_identifier),
        optional(")"),
        $.identifier,
        ";",
      ),

    var_decl: ($) =>
      seq(
        optional(choice($._type, $.type_identifier)),
        // A slice may be assigned to, as in `x[15:8] = y;`.
        choice($.lval, $.slice),
        "=",
        $._expression,
        ";",
      ),

    action: ($) =>
      seq(
        "action",
        $.method_identifier,
        "(",
        repeat($.parameter),
        ")",
        $.block,
      ),

    // The select form takes no trailing semicolon in the P4-16 grammar,
    // where selectExpression ends at the closing brace. One is accepted
    // anyway since it is common in existing code.
    transition: ($) =>
      choice(
        seq("transition", $.identifier, ";"),
        prec.right(seq("transition", $.select_expr, optional(";"))),
      ),

    select_expr: ($) =>
      seq(
        "select",
        "(",
        $.expression_list,
        ")",
        "{",
        repeat($.select_case),
        "}",
      ),

    select_case: ($) => seq($.keyset_expression, ":", $.identifier, ";"),

    expression_list: ($) =>
      seq($._expression, repeat(seq(",", $._expression)), optional(",")),

    call: ($) =>
      seq(
        $.fval,
        optional(seq("<", $.type_argument_list, ">")),
        "(",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        ")",
      ),

    // `x[7:0]` and `x[W - 1:0]`. Whether `[` opens an index or a slice is
    // known only at the `]` or `:`.
    slice: ($) => seq($.lval, "[", $._expression, ":", $._expression, "]"),
    tuple: ($) =>
      seq(
        "{",
        $._expression,
        repeat(seq(",", $._expression)),
        optional(","),
        "}",
      ),

    // Parenthesized keysets use the tupleKeysetExpression production in the
    // P4-16 grammar. A single element remains valid for existing table keys.
    tuple_keyset: ($) =>
      seq(
        "(",
        $.simple_keyset_expression,
        repeat(seq(",", $.simple_keyset_expression)),
        optional(","),
        ")",
      ),

    keyset_expression: ($) =>
      choice($.tuple_keyset, $.simple_keyset_expression),

    simple_keyset_expression: ($) =>
      choice($.range, "default", "_", $._expression),

    _expression: ($) =>
      choice(
        $.conditional_expression,
        $.binary_expression,
        $.unary_expression,
        prec(3, $.call),
        $.member_expression,
        $.cast_expression,
        $.parenthesized_expression,
        $.slice,
        $.lval,
        prec(1, $.tuple),
        prec(1, $.identifier_preproc),
        prec(1, $.string_literal),
        $.number,
        $.bool,
      ),

    conditional_expression: ($) =>
      prec.right(
        -1,
        seq($._expression, "?", $._expression, ":", $._expression),
      ),

    binary_expression: ($) =>
      prec.left(2, seq($._expression, $.binop, $._expression)),

    unary_expression: ($) => prec(4, seq($.unop, $._expression)),

    // Members of a call's result, as in `t.apply().hit`.
    member_expression: ($) =>
      prec(3, seq($.call, repeat1(seq(".", $.identifier)))),

    // A cast binds tighter than any binary operator. When the operand could
    // also begin a binary operation, as in `(x) - y`, the parenthesized
    // reading wins.
    cast_expression: ($) => prec(4, seq($._cast_type, $._expression)),

    parenthesized_expression: ($) =>
      prec.dynamic(1, prec(-1, seq("(", $._expression, ")"))),

    // Kept free of precedence so that `(x)` stays ambiguous between a cast
    // and a parenthesized expression until the next token. For the same
    // reason the name is an aliased identifier: `type_identifier` carries a
    // static precedence that would always win over `lval`.
    _cast_type: ($) =>
      seq("(", choice($._type, alias($.identifier, $.type_identifier)), ")"),

    range: ($) => prec.left(1, seq($._expression, "..", $._expression)),

    string_literal: (_) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              /[^"\\]+/, // any characters except " or \
              seq("\\", /./), // escaped character (any character after backslash)
            ),
          ),
          '"',
        ),
      ),

    binop: (_) =>
      choice(
        "==",
        "!=",
        ">=",
        "<=",
        ">",
        "<",
        "=",
        "+",
        "-",
        // Saturating addition and subtraction, and concatenation.
        "|+|",
        "|-|",
        "++",
        "*",
        "/",
        "%",
        "|",
        "||",
        "&",
        "&&",
        "&&&",
        "<<",
        ">>",
        "^",
      ),

    unop: (_) => choice("!", "~", "-", "+"),

    // As in P4-16, each branch is any statement, so `else if` is a
    // conditional nested in the else branch, and a branch need not be a
    // block. An `else` belongs to the nearest `if`.
    conditional: ($) =>
      prec.right(
        seq(
          "if",
          "(",
          $._expression,
          ")",
          $._statement,
          optional(seq("else", $._statement)),
        ),
      ),

    control_var: ($) =>
      choice(
        seq(
          $.type_identifier,
          optional(seq("<", $.type_argument_list, ">")),
          "(",
          repeat(seq($._expression, optional(","))),
          ")",
          $.identifier,
          optional(seq("=", $.obj_initializer)),
          ";",
        ),
        seq(
          choice($.stack_type, $._type, $.type_identifier),
          $.identifier,
          ";",
        ),
      ),

    // The methods an instance defines, as in
    // `RegisterAction<...>(reg) ra = { void apply(...) { ... } };`.
    obj_initializer: ($) =>
      seq("{", repeat(choice($.function_declaration, $.control_var)), "}"),

    // A member and index chain such as `hdr.vlan_tag[0].vid`.
    lval: ($) => seq($.identifier, repeat($._member_or_index)),

    fval: ($) =>
      choice(
        seq(
          $.identifier,
          repeat($._member_or_index),
          seq(".", $.method_identifier),
        ),
        $.method_identifier,
      ),

    _member_or_index: ($) =>
      choice(seq(".", $.identifier), seq("[", $._expression, "]")),

    // A method of an extern. A constructor has no return type, as in
    // `Register(bit<32> size);`.
    method: ($) =>
      seq(
        optional(choice($._type, $.type_identifier)),
        $.method_identifier,
        optional($.type_parameters),
        "(",
        repeat($.parameter),
        ")",
        ";",
      ),

    parameter: ($) =>
      choice(
        seq($.direction, $.identifier, optional(",")),
        seq(
          $.direction,
          optional("("),
          choice($.stack_type, $._type, $.type_identifier),
          optional(")"),
          $.identifier,
          // A default value, as for a constructor parameter.
          optional(seq("=", $._expression)),
          optional(","),
        ),
        seq(
          optional("("),
          choice($.stack_type, $._type, $.type_identifier),
          optional(")"),
          $.identifier,
          optional(seq("=", $._expression)),
          optional(","),
        ),
      ),

    direction: (_) => choice("in", "out", "inout"),

    field: ($) =>
      seq(
        choice($.stack_type, $._type, $.type_identifier),
        $.identifier,
        ";",
        optional($.line_continuation),
      ),

    method_field: ($) =>
      seq(
        $.method_identifier,
        optional(seq("<", $.type_argument_list, ">")),
        $.identifier,
        ",",
      ),

    _type: ($) =>
      choice(
        "bool",
        "error",
        "int",
        "bit",
        "varbit",
        "packet_in",
        "packet_out",
        $.bit_type,
        $.int_type,
        $.varbit_type,
        $.tuple_type,
      ),

    bit_type: ($) => seq("bit", "<", $._width, ">"),
    int_type: ($) => seq("int", "<", $._width, ">"),
    varbit_type: ($) => seq("varbit", "<", $._width, ">"),

    // A width is a number, a name such as a macro, or, per P4-16, any
    // expression in parentheses, as in `bit<(4 * 8)>`.
    _width: ($) => choice($.number, $.identifier, seq("(", $._expression, ")")),
    tuple_type: ($) => seq("tuple", "<", $.type_argument_list, ">"),

    // The type parameters of a generic declaration, as in
    // `control C<H, M>(...)` or `extern Register<T, I> { ... }`.
    type_parameters: ($) =>
      seq("<", $.type_identifier, repeat(seq(",", $.type_identifier)), ">"),

    type_argument_list: ($) =>
      seq(
        choice($._type, $.type_identifier),
        repeat(seq(",", choice($._type, $.type_identifier))),
      ),

    type_identifier: ($) => prec(1, $.identifier),

    // A header stack: `h_t[4]`. P4-16 allows any compile-time-known size
    // expression, not just a literal.
    stack_type: ($) =>
      seq(choice($._type, $.type_identifier), "[", $._expression, "]"),

    method_identifier: ($) => $.identifier,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    identifier_preproc: (_) => /[A-Z][A-Z0-9_]*/,

    bool: (_) => choice("true", "false"),

    number: ($) =>
      choice(
        $.decimal,
        $.hex,
        $.binary,
        $.octal,
        $.whex,
        $.wbinary,
        $.wdecimal,
      ),

    // P4-16 integer literals: a base prefix, digits that may be separated by
    // underscores, and optionally a width with `w` (unsigned) or `s` (signed).
    decimal: (_) => /\d[\d_]*/,

    hex: (_) => /0[xX][0-9a-fA-F][0-9a-fA-F_]*/,

    binary: (_) => /0[bB][01][01_]*/,

    octal: (_) => /0[oO][0-7][0-7_]*/,

    whex: (_) => /\d+[ws]0[xX][0-9a-fA-F][0-9a-fA-F_]*/,

    wbinary: (_) => /\d+[ws]0[bB][01][01_]*/,

    wdecimal: (_) => /\d+[ws]\d[\d_]*/,

    annotation: ($) => seq("@", $.identifier, optional($.annotation_body)),

    annotation_body: ($) =>
      seq(
        "(",
        optional($.annotation_content),
        repeat(seq(",", $.annotation_content)),
        optional(","),
        ")",
      ),

    annotation_content: ($) =>
      choice($._expression, /["][^"]*["]/, $.annotation),

    comment: (_) =>
      token(
        choice(
          seq("//", /(\\+(.|\r?\n)|[^\\\n])*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    // Anchored at the backslash. A token whose pattern can begin with
    // whitespace is a lexer candidate at every position, which makes the
    // whitespace part of the following token rather than an extra, and
    // leaves node boundaries carrying the preceding indentation.
    line_continuation: (_) => /\\\s*/,
    method_not_constant: (_) => /[a-zA-Z0-9_]*[a-z][a-zA-Z0-9_]*/,

    preproc: ($) =>
      choice(
        seq(
          "#define",
          choice(
            // An object-like macro with a number, another macro, or nothing
            // as its value.
            seq(
              $._macro_name,
              choice($.number, $.identifier_preproc, $._define_end),
            ),
            seq(
              $.identifier_preproc,
              "{",
              $.line_continuation,
              repeat($.field),
              "}",
            ),
            // A function-like macro, whose parameter list opens directly
            // after the name, as in C. The body is an arbitrary token sequence
            // (statements, annotations, `#` and `##`), so it is kept as text
            // up to the end of the logical line or the start of a block
            // comment, which is then lexed as a comment.
            seq(
              choice($.method_not_constant, $.identifier_preproc),
              token.immediate("("),
              repeat(seq($.identifier, optional(","))),
              ")",
              alias(
                token.immediate(/([^\\\n/]|\/[^*\n]|\\(.|\r?\n))*/),
                $.preproc_arg,
              ),
            ),
            seq(
              $.identifier_preproc,
              $.line_continuation,
              repeat(
                seq(
                  optional("("),
                  optional(choice($._type, $.type_identifier)),
                  optional(")"),
                  $.lval,
                  ",",
                  $.line_continuation,
                ),
              ),
              seq(
                optional("("),
                optional(choice($._type, $.type_identifier)),
                optional(")"),
                $.lval,
              ),
              /\s/,
            ),
          ),
        ),
        seq("#include", $.include_path),
        seq(choice("#ifdef", "#ifndef", "#undef"), $._macro_name),
        // A condition or message, kept as text to the end of the line.
        seq(
          choice("#if", "#elif", "#error", "#warning", "#pragma"),
          alias(/.*/, $.preproc_arg),
        ),
        // Only a comment may follow these, and it is lexed as one.
        "#else",
        "#endif",
      ),

    include_path: (_) =>
      token(choice(seq("<", /[^>\n]*/, ">"), seq('"', /[^"\n]*/, '"'))),

    // Include guards such as `_P4_METER_` begin with an underscore, and some
    // names are lowercase, neither of which `identifier_preproc` allows.
    _macro_name: ($) =>
      choice(
        $.identifier_preproc,
        alias(/_[A-Za-z0-9_]*/, $.identifier_preproc),
        alias($.method_not_constant, $.identifier_preproc),
      ),
  },
});

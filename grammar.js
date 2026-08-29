// Copyright 2026 Oxide Computer Company

module.exports = grammar({
  name: "p4",

  extras: ($) => [/\s|\\\r?\n/, $.comment, $.preproc],

  word: ($) => $.identifier,

  precedences: ($) => [
    [$.expr, $.method_identifier],
    [$.bit_type, $._type],
    [$.varbit_type, $._type],
  ],

  // `a.b.c` is a prefix of both a member reference and a method call; the
  // parser cannot tell them apart until it reaches the `(` or the end.
  conflicts: ($) => [[$.fval, $.lval], [$.lval]],

  rules: {
    source_file: ($) => repeat($.top),

    top: ($) => $._definition,

    _definition: ($) =>
      choice(
        $.function_declaration,
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
      ),

    package: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "package",
          choice(
            $.method_identifier,
            seq($.method_identifier, "<", $.type_identifier, ">"),
          ),
          "(",
          repeat($.method_field),
          ")",
          ";",
        ),
        seq(
          $.method_identifier,
          "(",
          choice(seq($.method_identifier, "(", ")"), $.identifier),
          repeat(seq(",", $.method_identifier, "(", ")")),
          optional(","),
          ")",
          $.identifier,
          ";",
        ),
      ),

    function_declaration: ($) =>
      seq(
        choice($._type, $.type_identifier),
        $.method_identifier,
        "(",
        repeat($.parameter),
        ")",
        "{",
        repeat($.stmt),
        "}",
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
        $.expr,
        ";",
      ),

    extern_definition: ($) =>
      seq(
        repeat($.annotation),
        "extern",
        $.type_identifier,
        "{",
        repeat($.method),
        "}",
      ),

    parser_definition: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "parser",
          choice(
            seq($.method_identifier, "<", $.type_identifier, ">"),
            $.method_identifier,
          ),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "parser",
          choice(
            seq($.method_identifier, "<", $.type_identifier, ">"),
            $.method_identifier,
          ),
          "(",
          repeat($.parameter),
          ")",
          "{",
          repeat1($.state),
          "}",
        ),
      ),

    control_definition: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "control",
          choice(
            seq($.method_identifier, "<", $.type_identifier, ">"),
            $.method_identifier,
          ),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "control",
          choice(
            seq($.method_identifier, "<", $.type_identifier, ">"),
            $.method_identifier,
          ),
          "(",
          repeat($.parameter),
          ")",
          "{",
          optional($.control_body),
          "}",
        ),
      ),

    control_body: ($) =>
      choice(
        seq(
          repeat($.control_body_element),
          seq("apply", "{", repeat($.stmt), "}"),
          repeat($.control_body_element),
        ),
        repeat1($.control_body_element),
      ),

    control_body_element: ($) =>
      choice(
        seq(repeat($.annotation), $.control_var),
        seq(repeat($.annotation), $.table),
        seq(repeat($.annotation), $.action),
      ),

    table: ($) =>
      seq("table", $.type_identifier, "{", repeat($.table_element), "}"),

    table_element: ($) =>
      choice(
        seq(
          "key",
          "=",
          "{",
          repeat1(seq($.expr, ":", $.key_type, repeat($.annotation), ";")),
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
          repeat1(
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
        seq("const", $.identifier, "=", $.expr, ";"),
        seq("size", "=", $.expr, ";"),
        seq("meters", "=", $.identifier, ";"),
        seq("counters", "=", $.identifier, ";"),
      ),

    action_item: ($) => choice($.method_identifier, $.call, "NoAction"),

    key_type: (_) => choice("range", "exact", "ternary", "lpm", "optional"),

    state: ($) =>
      choice(
        seq($.method_identifier, "()", $.type_identifier, ";"),
        seq("state", $.method_identifier, "{", repeat($.stmt), "}"),
      ),

    stmt: ($) =>
      choice(
        $.conditional,
        $.action,
        $.var_decl,
        $.type_decl,
        $.transition,
        seq($.call, ";"),
        seq("return", ";"),
      ),

    type_decl: ($) =>
      seq(
        optional("("),
        choice($._type, $.type_identifier),
        optional(")"),
        $.identifier,
        ";",
      ),

    var_choice: ($) =>
      choice(
        // Cast: the parenthesised type has to be matched as a unit, or the
        // optional parens swallow the opening paren of a call instead.
        seq("(", choice($._type, $.type_identifier), ")", $.expr),
        seq("(", $.expr, ")"),
        $.expr,
      ),

    var_decl: ($) =>
      seq(
        optional(choice($._type, $.type_identifier)),
        $.lval,
        "=",
        $.var_choice,
        ";",
      ),

    action: ($) =>
      seq(
        "action",
        $.method_identifier,
        "(",
        repeat($.parameter),
        ")",
        "{",
        repeat($.stmt),
        "}",
      ),

    // The select form takes no trailing semicolon in the P4-16 grammar,
    // where selectExpression ends at the closing brace. One is accepted
    // anyway since it is common in existing code.
    transition: ($) =>
      choice(
        seq("transition", $.identifier, ";"),
        seq("transition", $.select_expr, optional(";")),
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
      seq($.expr, repeat(seq(",", $.expr)), optional(",")),

    call: ($) =>
      seq(
        $.fval,
        "(",
        optional(seq($.expr, repeat(seq(",", $.expr)), optional(","))),
        ")",
      ),

    slice: ($) => seq($.lval, "[", $.number, ":", $.number, "]"),
    tuple: ($) =>
      seq("{", $.expr, repeat(seq(",", $.expr)), optional(","), "}"),

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

    simple_keyset_expression: ($) => choice($.range, "default", "_", $.expr),

    expr: ($) =>
      choice(
        prec.right(-1, seq($.expr, "?", $.expr, ":", $.expr)),
        prec.left(2, seq(optional($.expr), $.binop, $.expr)),
        prec(3, $.call),
        $.slice,
        $.lval,
        prec(1, $.tuple),
        prec(1, $.identifier_preproc),
        prec(1, $.string_literal),
        $.number,
        $.bool,
      ),

    range: ($) => prec.left(1, seq($.expr, "..", $.expr)),

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
        "!",
        "^",
        "~",
      ),

    conditional: ($) => seq($._if, optional($._elseif), optional($._else)),

    _if: ($) => seq("if", "(", repeat($.expr), ")", "{", repeat($.stmt), "}"),
    _elseif: ($) =>
      seq("else", "if", "(", repeat($.expr), ")", "{", repeat($.stmt), "}"),
    _else: ($) => seq("else", "{", repeat($.stmt), "}"),

    control_var: ($) =>
      choice(
        seq(
          $.type_identifier,
          optional(seq("<", $.type_argument_list, ">")),
          "(",
          repeat(seq($.expr, optional(","))),
          ")",
          $.identifier,
          ";",
        ),
        seq(
          choice($.stack_type, $._type, $.type_identifier),
          $.identifier,
          ";",
        ),
      ),

    lval: ($) =>
      seq(
        $.identifier,
        optional(seq("[", $.expr, "]")),
        repeat(seq(".", $.identifier, optional(seq("[", $.expr, "]")))),
      ),

    fval: ($) =>
      choice(
        seq(
          $.identifier,
          repeat(seq(".", $.identifier)),
          seq(".", $.method_identifier),
        ),
        $.method_identifier,
      ),

    method: ($) =>
      seq(
        choice($._type, $.type_identifier),
        $.method_identifier,
        optional(seq("<", $.type_identifier, ">")),
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
          optional(","),
        ),
        seq(
          optional("("),
          choice($.stack_type, $._type, $.type_identifier),
          optional(")"),
          $.identifier,
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
        choice(
          $.method_identifier,
          seq($.method_identifier, "<", $.type_identifier, ">"),
        ),
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
        $.varbit_type,
        $.tuple_type,
      ),

    bit_type: ($) => seq("bit", "<", $.number, ">"),
    varbit_type: ($) => seq("varbit", "<", $.number, ">"),
    tuple_type: ($) => seq("tuple", "<", $.type_argument_list, ">"),

    type_argument_list: ($) =>
      seq(
        choice($._type, $.type_identifier),
        repeat(seq(",", choice($._type, $.type_identifier))),
      ),

    type_identifier: ($) => prec(1, $.identifier),

    // A header stack: `h_t[4]`. P4-16 allows any compile-time-known size
    // expression, not just a literal.
    stack_type: ($) =>
      seq(choice($._type, $.type_identifier), "[", $.expr, "]"),

    method_identifier: ($) => $.identifier,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    identifier_preproc: (_) => /[A-Z][A-Z0-9_]*/,

    bool: (_) => choice("true", "false"),

    number: ($) => choice($.decimal, $.hex, $.whex, $.wdecimal),

    decimal: (_) => /\d+/,

    hex: (_) => /0x(\d|[a-fA-F])+/,

    whex: (_) => /\d+w0x(\d|[a-fA-F])+/,

    wdecimal: (_) => /\d+w\d+/,

    annotation: ($) => seq("@", $.identifier, optional($.annotation_body)),

    annotation_body: ($) =>
      seq(
        "(",
        optional($.annotation_content),
        repeat(seq(",", $.annotation_content)),
        optional(","),
        ")",
      ),

    annotation_content: ($) => choice($.expr, /["][^"]*["]/, $.annotation),

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
    method_not_constant: (_) => /[a-zA-Z_]*[a-z][a-zA-Z]*/,

    preproc: ($) =>
      choice(
        seq(
          "#define",
          choice(
            seq($.identifier_preproc, $.number),
            seq(
              $.identifier_preproc,
              "{",
              $.line_continuation,
              repeat($.field),
              "}",
            ),
            seq(
              $.method_not_constant,
              "(",
              repeat(seq($.identifier, optional(","))),
              ")",
              "(",
              $.expr,
              ")",
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
        seq("#include", choice("<", '"'), /[^">]*/, choice(">", '"')),
        seq("#if", /.*/),
        seq("#else", /.*/),
        "#endif",
      ),
  },
});

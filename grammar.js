module.exports = grammar({
  name: "p4",

  extras: ($) => [/\s|\\\r?\n/, $.comment, $.preproc],

  rules: {
    source_file: ($) => repeat($.top),

    top: ($) => $._definition,

    _definition: ($) =>
      choice(
        $.header_definition,
        $.struct_definition,
        $.typedef_definition,
        $.const_definition,
        $.extern_definition,
        $.parser_definition,
        $.control_definition,
        $.package,
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
          $.type_identifier,
          "(",
          seq($.method_identifier, "(", ")"),
          repeat(seq(",", $.method_identifier, "(", ")")),
          optional(","),
          ")",
          $.identifier,
          ";",
        ),
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
          $.method_identifier,
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
          repeat1(seq($.expr, ":", repeat($.annotation), $.action_item, ";")),
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

    state: ($) => seq("state", $.method_identifier, "{", repeat($.stmt), "}"),

    stmt: ($) =>
      choice(
        $.conditional,
        $.action,
        $.var_decl,
        seq($.transition, ";"),
        seq($.call, ";"),
        seq($.expr, ";"),
        seq("return", ";"),
      ),

    var_decl: ($) =>
      prec(
        1,
        seq(
          optional(choice($._type, $.type_identifier)),
          $.identifier,
          optional(seq("=", $.expr)),
          ";",
        ),
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

    transition: ($) =>
      choice(seq("transition", $.identifier), seq("transition", $.select_expr)),

    select_expr: ($) =>
      seq("select", "(", $.expr, ")", "{", repeat($.select_case), "}"),

    select_case: ($) =>
      choice(
        seq($.expr, ":", $.identifier, ";"),
        seq("default", ":", $.identifier, ";"),
        seq("_", ":", $.identifier, ";"),
      ),

    call: ($) =>
      seq(
        $.fval,
        "(",
        optional(seq($.expr, repeat(seq(",", $.expr)), optional(","))),
        ")",
      ),

    slice: ($) => seq($.lval, "[", $.number, ":", $.number, "]"),
    tuple: ($) => seq("{", $.expr, repeat(seq(",", $.expr)), "}"),

    expr: ($) =>
      choice(
        prec.left(seq($.expr, $.binop, $.expr)),
        prec(1, $.call),
        prec(1, $.slice),
        prec(1, $.tuple),
        $.number,
        $.identifier_preproc,
        $.bool,
        $.lval,
      ),

    binop: (_) =>
      choice(
        "==",
        "!=",
        ">=",
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
      ),

    conditional: ($) => seq($._if, optional($._else)),

    _if: ($) => seq("if", "(", $.expr, ")", "{", repeat($.stmt), "}"),

    _else: ($) => seq("else", "{", repeat($.stmt), "}"),

    control_var: ($) =>
      seq($.type_identifier, "(", repeat($.expr), ")", $.identifier, ";"),

    lval: ($) => seq($.identifier, repeat(seq(".", $.identifier))),
    fval: ($) =>
      seq(
        choice(
          seq(
            $.identifier,
            repeat(seq(".", $.identifier)),
            seq(".", $.method_identifier),
          ),
          $.method_identifier,
        ),
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
          choice($._type, $.type_identifier),
          $.identifier,
          optional(","),
        ),
      ),

    direction: (_) => choice("in", "out", "inout", "packet_in", "packet_out"),

    field: ($) =>
      seq(
        choice($._type, $.type_identifier),
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
        $.bit_type,
        $.varbit_type,
        $.tuple_type,
      ),

    bit_type: ($) => seq("bit", "<", $.number, ">"),
    varbit_type: ($) => seq("varbit", "<", $.number, ">"),
    tuple_type: ($) => seq("tuple", "<", $.type_argument_list, ">"),

    type_argument_list: ($) => seq($._type, repeat(seq(",", $._type))),

    type_identifier: ($) => $.identifier,

    method_identifier: ($) => $.identifier,

    selection_case: ($) =>
      choice(
        seq($.expr, ":", $.identifier, ";"),
        seq("default", ":", $.identifier, ";"),
        seq("_", ":", $.identifier, ";"),
      ),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    identifier_preproc: (_) => /[A-Z][A-Z_]*/,

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

    line_continuation: (_) => /s*\\?s*/,

    preproc: ($) =>
      choice(
        seq(
          "#define",
          choice($.identifier_preproc, $.identifier),
          choice(
            $.number,
            seq("{", optional($.line_continuation), repeat($.field), "}"),
            seq("(", repeat($.expr), ")", "(", repeat($.expr), ")"),
          ),
        ),
        seq("#include", choice("<", '"'), /[^">]*/, choice(">", '"')),
        seq("#if", /.*/),
        seq("#else", /.*/),
        "#endif",
      ),
  },
});

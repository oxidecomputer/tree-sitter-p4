// Copyright 2026 Oxide Computer Company

// Binding strength, from loosest to tightest, after the P4-16 grammar.
// Binding strength, loosest first, following the precedence declarations
// of the P4-16 grammar in p4c. A keyset's mask and range bind looser than any
// operator.
const PREC = {
  keyset: 1,
  logical_or: 2,
  logical_and: 3,
  equality: 4,
  relational: 5,
  bit_or: 6,
  bit_xor: 7,
  bit_and: 8,
  shift: 9,
  additive: 10,
  multiplicative: 11,
  unary: 12,
  postfix: 13,
};

module.exports = grammar({
  name: "p4",

  extras: ($) => [/\s|\\\r?\n/, $.comment, $.preproc],

  // See src/scanner.c.
  externals: ($) => [
    $._define_end,
    $._macro_body,
    $._macro_statements,
    $._error_sentinel,
  ],

  word: ($) => $.identifier,

  // P4-16 reserves its keywords, so a keyword never begins a name. Without
  // this, a keyword where the parser expects no keyword is lexed as a name,
  // and after a syntax error the parser cannot resume at the next `state` or
  // `table`: one half-typed line could leave the rest of the file unparsed.
  // Left out are `error`, since `error.NoMatch` is written as a member
  // access, and `apply` and `state`, which P4-16 also allows as names, as in
  // `void apply(...)` or `t.apply()`.
  reserved: {
    global: (_) => [
      "action",
      "bit",
      "bool",
      "break",
      "const",
      "continue",
      "control",
      "default",
      "else",
      "exit",
      "extern",
      "false",
      "for",
      "header",
      "header_union",
      "if",
      "in",
      "inout",
      "int",
      "match_kind",
      "out",
      "package",
      "parser",
      "return",
      "select",
      "struct",
      "switch",
      "table",
      "this",
      "transition",
      "true",
      "tuple",
      "typedef",
      "varbit",
    ],
  },

  // Hidden rules that queries may still name, as in `(_declaration)`.
  supertypes: ($) => [$._declaration, $._statement, $._expression],

  precedences: ($) => [
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
    [$.block, $.tuple],
    [$.type_parameters, $.type_argument_list],
    [$.call_expression, $._expression, $._type_identifier],
    [$._macro_declaration, $._type_identifier],
    [$._expression, $._type_identifier],
    [$._expression, $.call_expression],
    [$.preproc, $._macro_name],
  ],

  rules: {
    // A stray semicolon is an empty declaration, as after `struct S { };`.
    source_file: ($) => repeat(choice($._declaration, ";")),

    _declaration: ($) =>
      choice(
        $.function_declaration,
        $.match_kind_declaration,
        $.error_declaration,
        $.header_declaration,
        $.header_union_declaration,
        $.struct_declaration,
        $.typedef_declaration,
        $.constant_declaration,
        $.extern_declaration,
        $.extern_function_declaration,
        $.parser_declaration,
        $.control_declaration,
        $.package,
        // A package instance, as in `V1Switch(p(), c()) main;`.
        $.instantiation,
        $.action,
        $.table,
        alias($._macro_declaration, $.macro_invocation),
      ),

    // An object-like macro standing for declarations, key elements, or
    // actions, as in `key = { MAC_ACL_KEY }`. Only the token after the name
    // tells it apart from the start of what it stands for.
    _macro_use: ($) => alias(prec(-1, $.identifier), $.macro_invocation),

    // A macro expanding to declarations, invoked without a trailing
    // semicolon, as in `ROTATE_BY_N(1)`. The grammar does not expand macros,
    // so this is the closest it gets to the expansion. It shares its prefix
    // with an instantiation, `T(args) name;`, and is told apart only by the
    // missing name.
    _macro_declaration: ($) =>
      prec(
        1,
        seq(
          field("name", alias($.identifier, $.method_identifier)),
          field("arguments", $.argument_list),
        ),
      ),

    package: ($) =>
      seq(
        repeat($.annotation),
        "package",
        field("name", $._method_identifier),
        optional($.type_parameters),
        "(",
        repeat($.parameter),
        ")",
        ";",
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

    // The errors a program adds, as in `error { InvalidIPv4Header }`.
    error_declaration: ($) =>
      seq(
        "error",
        "{",
        $.identifier,
        repeat(seq(",", $.identifier)),
        optional(","),
        "}",
      ),

    function_declaration: ($) =>
      seq(
        repeat($.annotation),
        field("type", choice($.stack_type, $._type, $._type_identifier)),
        field("name", $._method_identifier),
        optional($.type_parameters),
        "(",
        repeat($.parameter),
        ")",
        field("body", $.block),
      ),

    header_declaration: ($) =>
      choice(
        seq("header", field("name", $._type_identifier), $.identifier_preproc),
        seq(
          repeat($.annotation),
          "header",
          field("name", $._type_identifier),
          optional($.type_parameters),
          "{",
          repeat($.field),
          "}",
        ),
      ),

    // A header union holds at most one valid header of its members.
    header_union_declaration: ($) =>
      seq(
        repeat($.annotation),
        "header_union",
        field("name", $._type_identifier),
        optional($.type_parameters),
        "{",
        repeat($.field),
        "}",
      ),

    struct_declaration: ($) =>
      seq(
        repeat($.annotation),
        "struct",
        field("name", $._type_identifier),
        // Generic, as in `struct Pair<T> { T first; T second; }`.
        optional($.type_parameters),
        "{",
        repeat($.field),
        "}",
      ),

    // `typedef` names a type; `type` makes a new type from it, which P4Runtime
    // treats as distinct, as in `type bit<9> PortId_t;`.
    typedef_declaration: ($) =>
      seq(
        repeat($.annotation),
        choice("typedef", "type"),
        field("type", choice($.stack_type, $._type, $._type_identifier)),
        field("name", $._type_identifier),
        ";",
      ),

    constant_declaration: ($) =>
      seq(
        repeat($.annotation),
        "const",
        field("type", choice($._type, $._type_identifier)),
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        ";",
      ),

    extern_declaration: ($) =>
      seq(
        repeat($.annotation),
        "extern",
        field("name", $._type_identifier),
        optional($.type_parameters),
        "{",
        repeat($.method),
        "}",
      ),

    // A function the target provides, as in `extern void drop();`.
    extern_function_declaration: ($) =>
      seq(
        repeat($.annotation),
        "extern",
        // Any type but the packet types, which are lexed as keywords here
        // and would then claim `extern packet_in { ... }`.
        field(
          "type",
          choice(
            "bool",
            "error",
            "bit",
            "int",
            "varbit",
            $.bit_type,
            $.int_type,
            $.varbit_type,
            $.tuple_type,
            $.list_type,
            $.generic_type,
            $._type_identifier,
          ),
        ),
        field("name", $._method_identifier),
        optional($.type_parameters),
        "(",
        repeat($.parameter),
        ")",
        ";",
      ),

    parser_declaration: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "parser",
          field("name", $._method_identifier),
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "parser",
          field("name", $._method_identifier),
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          // Constructor parameters, as for a control.
          optional(seq("(", repeat($.parameter), ")")),
          "{",
          repeat1(choice($.parser_local_element, $.parser_state)),
          "}",
        ),
      ),

    // parserLocalElement in the P4-16 grammar: declarations that precede or
    // sit between the states.
    parser_local_element: ($) =>
      choice(
        $.constant_declaration,
        $.variable_declaration,
        $.instantiation,
        alias($._macro_declaration, $.macro_invocation),
      ),

    control_declaration: ($) =>
      choice(
        seq(
          repeat($.annotation),
          "control",
          field("name", $._method_identifier),
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          ";",
        ),
        seq(
          repeat($.annotation),
          "control",
          field("name", $._method_identifier),
          optional($.type_parameters),
          "(",
          repeat($.parameter),
          ")",
          // Constructor parameters, as in `control C(...)(bit<32> size)`.
          optional(seq("(", repeat($.parameter), ")")),
          "{",
          optional(field("body", $.control_body)),
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
        $.variable_declaration,
        $.instantiation,
        seq(repeat($.annotation), $.table),
        $.action,
        $.constant_declaration,
        alias($._macro_declaration, $.macro_invocation),
        $._macro_use,
      ),

    table: ($) =>
      seq(
        "table",
        field("name", $._type_identifier),
        "{",
        repeat($.table_property),
        "}",
      ),

    table_property: ($) =>
      choice(
        seq(
          "key",
          "=",
          "{",
          // Either list may be empty in P4-16.
          repeat(choice($.key_element, $._macro_use)),
          "}",
        ),
        seq(
          "actions",
          "=",
          "{",
          repeat(
            choice(seq(repeat($.annotation), $.action_item, ";"), $._macro_use),
          ),
          "}",
        ),
        seq(
          repeat($.annotation),
          optional("const"),
          $.identifier,
          "=",
          "{",
          // Possibly empty, as when the entries come from an `#include`.
          repeat($.entry),
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

    // `hdr.ipv4.dst : lpm @name("dst");`.
    key_element: ($) =>
      seq(
        field("value", $._expression),
        ":",
        field("match_kind", $.match_kind),
        repeat($.annotation),
        ";",
      ),

    // `NoAction` is an ordinary action, which core.p4 declares.
    // An entry of a table, which may be marked `const` in a mutable list,
    // and given a priority, as in `priority=10: 0x0800 : forward();`.
    entry: ($) =>
      seq(
        optional("const"),
        optional(
          seq(
            "priority",
            "=",
            field("priority", choice($.number, $.parenthesized_expression)),
            ":",
          ),
        ),
        $.keyset_expression,
        ":",
        repeat($.annotation),
        $.action_item,
        repeat($.annotation),
        ";",
      ),

    action_item: ($) => choice($._method_identifier, $.call_expression),

    // The standard match kinds, or one an architecture declares with
    // `match_kind`, such as `selector` or `atcam_partition_index`.
    match_kind: ($) =>
      choice("range", "exact", "ternary", "lpm", "optional", $.identifier),

    parser_state: ($) =>
      seq(
        repeat($.annotation),
        "state",
        field("name", $._method_identifier),
        field("body", $.block),
      ),

    _statement: ($) =>
      choice(
        $.block,
        $.if_statement,
        $.switch_statement,
        $.action,
        $.variable_declaration,
        $.assignment_statement,
        $.transition_statement,
        $.call_statement,
        // A macro invocation: a call without its semicolon. Yields to a
        // longer expression, as in `F(a)(b);`.
        prec(-1, alias($.call_expression, $.macro_invocation)),
        // A constant local to a block, as in `const bit<8> n = 4;`.
        $.constant_declaration,
        $.for_statement,
        $.break_statement,
        $.continue_statement,
        $.return_statement,
        $.exit_statement,
        $.empty_statement,
      ),

    // Annotated as in `@in_hash { h.x = h.y; }`.
    block: ($) => seq(repeat($.annotation), "{", repeat($._statement), "}"),

    // Preferred to a macro invocation followed by an empty statement.
    call_statement: ($) => prec(1, seq($.call_expression, ";")),

    return_statement: ($) =>
      seq("return", optional(field("value", $._expression)), ";"),

    exit_statement: (_) => seq("exit", ";"),

    break_statement: (_) => seq("break", ";"),

    continue_statement: (_) => seq("continue", ";"),

    // `for (bit<8> i = 0; i < 4; i = i + 1) ...`, whose initializer and
    // update are comma-separated statements without their semicolons, or
    // `for (bit<8> i in 0 .. 3) ...`.
    for_statement: ($) =>
      seq(
        // As in `@unroll for (...)`.
        repeat($.annotation),
        "for",
        "(",
        choice(
          seq(
            optional(
              commaSep1(
                field(
                  "initializer",
                  choice(
                    alias($._variable, $.variable_declaration),
                    alias($._assignment, $.assignment_statement),
                    $.call_expression,
                  ),
                ),
              ),
            ),
            ";",
            field("condition", $._expression),
            ";",
            optional(
              commaSep1(
                field(
                  "update",
                  choice(
                    alias($._assignment, $.assignment_statement),
                    $.call_expression,
                  ),
                ),
              ),
            ),
          ),
          seq(
            field("type", choice($._type, $._type_identifier)),
            field("name", $.identifier),
            "in",
            field("collection", choice($._expression, $.range)),
          ),
        ),
        ")",
        field("body", $._statement),
      ),

    empty_statement: (_) => ";",

    switch_statement: ($) =>
      seq(
        "switch",
        "(",
        field("value", $._expression),
        ")",
        "{",
        repeat($.switch_case),
        "}",
      ),

    // A label with no block falls through to the next one. A `{` after the
    // colon always opens the block: P4-16 forbids a label that begins with a
    // brace, so it cannot be the next label's tuple.
    switch_case: ($) =>
      prec.right(seq(choice("default", $._expression), ":", optional($.block))),

    // `bit<8> x;` or `bit<8> x = 0;`.
    // Annotated as in `@pa_no_overlay("ingress") bit<8> x;`.
    variable_declaration: ($) => seq(repeat($.annotation), $._variable, ";"),

    // Without its semicolon, as a for loop's initializer takes it.
    _variable: ($) =>
      seq(
        field("type", choice($.stack_type, $._type, $._type_identifier)),
        field("name", $.identifier),
        optional(seq("=", field("value", $._expression))),
      ),

    // What may be assigned to. Preferred to an expression, which `=` may also
    // continue, as in a named argument.
    _lvalue: ($) =>
      prec(
        2,
        choice(
          $.identifier,
          $.this,
          $.member_expression,
          $.index_expression,
          $.slice_expression,
        ),
      ),

    // A slice may be assigned to, as in `x[15:8] = y;`.
    assignment_statement: ($) => seq($._assignment, ";"),

    // Without its semicolon, as a for loop's initializer and update take it.
    _assignment: ($) =>
      seq(
        field("left", $._lvalue),
        field(
          "operator",
          choice(
            "=",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            "<<=",
            ">>=",
            "&=",
            "|=",
            "^=",
            "|+|=",
            "|-|=",
          ),
        ),
        field("right", $._expression),
      ),

    // Annotated as in `@name("forward") action forward(...)`, which may also
    // stand among the declarations at the top level.
    action: ($) =>
      seq(
        repeat($.annotation),
        "action",
        field("name", $._method_identifier),
        "(",
        repeat($.parameter),
        ")",
        field("body", $.block),
      ),

    // The select form takes no trailing semicolon in the P4-16 grammar,
    // where selectExpression ends at the closing brace. One is accepted
    // anyway since it is common in existing code.
    transition_statement: ($) =>
      choice(
        seq("transition", $.identifier, ";"),
        prec.right(seq("transition", $.select_expression, optional(";"))),
      ),

    select_expression: ($) =>
      seq(
        "select",
        "(",
        // Possibly empty, as in `select() { default: accept; }`.
        optional($.expression_list),
        ")",
        "{",
        repeat($.select_case),
        "}",
      ),

    select_case: ($) => seq($.keyset_expression, ":", $.identifier, ";"),

    expression_list: ($) =>
      seq($._expression, repeat(seq(",", $._expression)), optional(",")),

    // `f(x)`, `pkt.extract(hdr)`, or `pkt.lookahead<bit<16>>()`. Type
    // arguments follow only a name, and carry no precedence, so that after
    // `a.b <` the parser keeps both a comparison and type arguments until a
    // later token rules one out.
    call_expression: ($) =>
      choice(
        // Loses to a cast when both read the whole input: `(T)(x)` casts
        // `(x)` rather than calling `(T)`.
        prec.dynamic(
          -1,
          prec(
            PREC.postfix,
            seq(
              field("function", $._expression),
              field("arguments", $.argument_list),
            ),
          ),
        ),
        // At the level of a name used as an expression; see `_expression`.
        prec(
          1,
          seq(
            field("function", $.identifier),
            field("type_arguments", $.type_arguments),
            field("arguments", $.argument_list),
          ),
        ),
        seq(
          field("function", $.member_expression),
          field("type_arguments", $.type_arguments),
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            choice($._expression, $.named_expression),
            repeat(seq(",", choice($._expression, $.named_expression))),
            optional(","),
          ),
        ),
        ")",
      ),

    // A named argument, `f(x = 1)`, or a member of a structure-valued
    // expression, `{ a = 1, b = 2 }`.
    named_expression: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._expression)),

    type_arguments: ($) => seq("<", $.type_argument_list, ">"),

    // `hdr.ipv4.ttl`, `t.apply().hit`.
    member_expression: ($) =>
      prec(
        PREC.postfix,
        seq(field("object", $._expression), ".", field("member", $.identifier)),
      ),

    // `hdr.vlan[0]`.
    index_expression: ($) =>
      prec(
        PREC.postfix,
        seq(
          field("object", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    // `x[7:0]`, `x[W - 1:0]`, or `pkt.lookahead<bit<8>>()[7:0]`. Whether `[`
    // opens an index or a slice is known only at the `]` or `:`. `x[i +: 8]`
    // takes 8 bits upward from bit `i`.
    slice_expression: ($) =>
      prec(
        PREC.postfix,
        seq(
          field("value", $._expression),
          "[",
          choice(
            seq(field("high", $._expression), ":", field("low", $._expression)),
            seq(
              field("low", $._expression),
              "+:",
              field("width", $._expression),
            ),
          ),
          "]",
        ),
      ),

    // A list, `{ a, b }`, or a structure, `{ x = a, y = b }`, whose last
    // member may be `...` to leave the rest at their defaults.
    tuple: ($) =>
      seq(
        "{",
        optional(
          seq(
            commaSep1(choice($._expression, $.named_expression)),
            optional(","),
          ),
        ),
        "}",
      ),

    // An invalid header or header union.
    invalid_header: (_) => "{#}",

    this: (_) => "this",

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
      choice($.range, $.mask, "default", "_", $._expression),

    _expression: ($) =>
      choice(
        $.conditional_expression,
        $.binary_expression,
        $.unary_expression,
        // Level with a type name, so that `f(a);` and `T(a) t;` stay
        // ambiguous until a later token tells them apart.
        prec(1, $.identifier),
        $.call_expression,
        $.member_expression,
        $.index_expression,
        $.slice_expression,
        $.cast_expression,
        $.parenthesized_expression,
        prec(1, $.tuple),
        $.invalid_header,
        $.this,
        // A default, as in `const int c = ...;` or `{ x = 1, ... }`.
        "...",
        prec(1, $.identifier_preproc),
        prec(1, $.string_literal),
        $.number,
        $.boolean_literal,
      ),

    conditional_expression: ($) =>
      prec.right(
        -1,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          [PREC.logical_or, "||"],
          [PREC.logical_and, "&&"],
          [PREC.equality, choice("==", "!=")],
          [PREC.relational, choice("<", ">", "<=", ">=")],
          [PREC.bit_or, "|"],
          [PREC.bit_xor, "^"],
          [PREC.bit_and, "&"],
          [PREC.shift, choice("<<", ">>")],
          // Saturating addition and subtraction, and concatenation.
          [PREC.additive, choice("+", "-", "|+|", "|-|", "++")],
          [PREC.multiplicative, choice("*", "/", "%")],
        ].map(([p, operator]) =>
          prec.left(
            p,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          field("operator", choice("!", "~", "-", "+")),
          field("argument", $._expression),
        ),
      ),

    // A cast binds tighter than any binary operator. When the operand could
    // also begin a binary operation, as in `(x) - y`, the parenthesized
    // reading wins.
    cast_expression: ($) =>
      prec(PREC.unary, seq($._cast_type, field("value", $._expression))),

    parenthesized_expression: ($) =>
      prec.dynamic(1, prec(-1, seq("(", $._expression, ")"))),

    // Kept free of precedence so that `(x)` stays ambiguous between a cast
    // and a parenthesized expression until the next token.
    _cast_type: ($) => seq("(", choice($._type, $._type_identifier), ")"),

    range: ($) =>
      prec.left(PREC.keyset, seq($._expression, "..", $._expression)),

    // A value and the bits of it that matter, as in `0x0800 &&& 0x0f00`
    // or, equivalently, `0x0800 mask 0x0f00`.
    mask: ($) =>
      prec.left(
        PREC.keyset,
        seq($._expression, choice("&&&", "mask"), $._expression),
      ),

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

    // As in P4-16, each branch is any statement, so `else if` is an
    // if_statement nested in the else branch, and a branch need not be a
    // block. An `else` belongs to the nearest `if`.
    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          "(",
          field("condition", $._expression),
          ")",
          field("consequence", $._statement),
          optional(seq("else", field("alternative", $._statement))),
        ),
      ),

    // `Checksum() csum;`, or with type arguments and an initializer,
    // `RegisterAction<...>(reg) ra = { ... };`.
    instantiation: ($) =>
      seq(
        repeat($.annotation),
        field("type", choice($._type_identifier, $.generic_type)),
        field("arguments", $.argument_list),
        field("name", $.identifier),
        optional(seq("=", field("initializer", $.object_initializer))),
        ";",
      ),

    // The methods an instance defines, as in
    // `RegisterAction<...>(reg) ra = { void apply(...) { ... } };`.
    object_initializer: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.function_declaration,
            $.instantiation,
            $.variable_declaration,
          ),
        ),
        "}",
      ),

    // A method of an extern. A constructor has no return type, as in
    // `Register(bit<32> size);`.
    method: ($) =>
      seq(
        repeat($.annotation),
        // A method an instance must define, in its initializer.
        optional("abstract"),
        optional(field("type", choice($._type, $._type_identifier))),
        field("name", $._method_identifier),
        optional($.type_parameters),
        "(",
        repeat($.parameter),
        ")",
        ";",
      ),

    // Annotated as in `@optional in bool zeros`.
    parameter: ($) =>
      choice(
        seq(
          repeat($.annotation),
          $.direction,
          field("name", $.identifier),
          optional(","),
        ),
        seq(
          repeat($.annotation),
          $.direction,
          optional("("),
          field("type", choice($.stack_type, $._type, $._type_identifier)),
          optional(")"),
          field("name", $.identifier),
          // A default value, as for a constructor parameter.
          optional(seq("=", field("value", $._expression))),
          optional(","),
        ),
        seq(
          repeat($.annotation),
          optional("("),
          field("type", choice($.stack_type, $._type, $._type_identifier)),
          optional(")"),
          field("name", $.identifier),
          optional(seq("=", field("value", $._expression))),
          optional(","),
        ),
      ),

    direction: (_) => choice("in", "out", "inout"),

    field: ($) =>
      seq(
        repeat($.annotation),
        field("type", choice($.stack_type, $._type, $._type_identifier)),
        field("name", $.identifier),
        ";",
        optional($.line_continuation),
      ),

    _type: ($) =>
      choice(
        "bool",
        "error",
        "int",
        "bit",
        "varbit",
        "match_kind",
        "packet_in",
        "packet_out",
        $.bit_type,
        $.int_type,
        $.varbit_type,
        $.tuple_type,
        $.list_type,
        $.generic_type,
      ),

    // A generic type given its arguments, as in `Register<bit<32>, _>` or
    // `register<bit<8>> r`.
    generic_type: ($) =>
      seq(
        field("type", $._type_identifier),
        field("type_arguments", $.type_arguments),
      ),

    bit_type: ($) => seq("bit", "<", $._width, ">"),
    int_type: ($) => seq("int", "<", $._width, ">"),
    varbit_type: ($) => seq("varbit", "<", $._width, ">"),

    // A width is a number, a name such as a macro, or, per P4-16, any
    // expression in parentheses, as in `bit<(4 * 8)>`.
    _width: ($) => choice($.number, $.identifier, seq("(", $._expression, ")")),
    // Possibly empty: `tuple<>`.
    tuple_type: ($) => seq("tuple", "<", optional($.type_argument_list), ">"),

    // A list of compile-time values of one type, as in
    // `list<bit<8>> l = { 1, 2 };`.
    list_type: ($) => seq("list", "<", $.type_argument_list, ">"),

    // The type parameters of a generic declaration, as in
    // `control C<H, M>(...)` or `extern Register<T, I> { ... }`.
    type_parameters: ($) =>
      seq("<", $._type_identifier, repeat(seq(",", $._type_identifier)), ">"),

    type_argument_list: ($) =>
      commaSep1(choice($.stack_type, $._type, $._type_identifier)),

    _type_identifier: ($) => prec(1, alias($.identifier, $.type_identifier)),

    // A header stack: `h_t[4]`. P4-16 allows any compile-time-known size
    // expression, not just a literal.
    stack_type: ($) =>
      seq(choice($._type, $._type_identifier), "[", $._expression, "]"),

    _method_identifier: ($) => alias($.identifier, $.method_identifier),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    identifier_preproc: (_) => /[A-Z][A-Z0-9_]*/,

    boolean_literal: (_) => choice("true", "false"),

    number: ($) =>
      choice(
        $.decimal,
        $.hex,
        $.binary,
        $.octal,
        $.whex,
        $.wbinary,
        $.woctal,
        $.wdecimal,
      ),

    // P4-16 integer literals: a base prefix, digits that may be separated by
    // underscores, and optionally a width with `w` (unsigned) or `s` (signed).
    // As in p4c, an underscore may follow the prefix, as in `0x_FF`.
    decimal: (_) => /\d[\d_]*|0[dD][\d_]+/,

    hex: (_) => /0[xX][0-9a-fA-F_]+/,

    binary: (_) => /0[bB][01_]+/,

    octal: (_) => /0[oO][0-7_]+/,

    whex: (_) => /\d+[ws]0[xX][0-9a-fA-F_]+/,

    wbinary: (_) => /\d+[ws]0[bB][01_]+/,

    woctal: (_) => /\d+[ws]0[oO][0-7_]+/,

    wdecimal: (_) => /\d+[ws]([\d_]+|0[dD][\d_]+)/,

    // A following `(` always opens the body, as in the spec's grammar.
    annotation: ($) =>
      choice(
        prec.right(seq("@", $.identifier, optional($.annotation_body))),
        // A P4-14 style pragma, whose body runs to the end of the line, as in
        // `@pragma deprecated "Use verify_checksum instead."`.
        seq(
          alias(/@pragma[ \t]+/, "@pragma"),
          $.identifier,
          optional(alias(token.immediate(/[ \t][^\n]*/), $.annotation_text)),
        ),
      ),

    // `@name("x")`, `@p4runtime_translation("t", bit<32>)`, or, structured,
    // `@size[16]`.
    annotation_body: ($) =>
      choice(
        seq("(", optional($._annotation_contents), ")"),
        seq("[", optional($._annotation_contents), "]"),
      ),

    _annotation_contents: ($) =>
      seq(commaSep1($.annotation_content), optional(",")),

    annotation_content: ($) =>
      choice(
        $._expression,
        $.named_expression,
        $._type,
        /["][^"]*["]/,
        $.annotation,
      ),

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
            // An object-like macro whose value, if any, is an expression or a
            // list of them on the rest of the logical line, as in
            // `#define SIZE (1 << WIDTH)` or `#define FIELDS hdr.a, hdr.b`, or text
            // holding declarations, statements, or key elements, which the
            // grammar cannot parse out of context; see src/scanner.c.
            seq(
              $._macro_name,
              choice(
                seq(
                  optional(seq($._expression, repeat(seq(",", $._expression)))),
                  $._define_end,
                ),
                alias($._macro_statements, $.preproc_arg),
              ),
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
            // to the end of the logical line; see src/scanner.c.
            seq(
              choice($.method_not_constant, $.identifier_preproc),
              token.immediate("("),
              repeat(seq($.identifier, optional(","))),
              ")",
              choice(alias($._macro_body, $.preproc_arg), $._define_end),
            ),
          ),
        ),
        seq("#include", $.include_path),
        seq(choice("#ifdef", "#ifndef", "#undef"), $._macro_name),
        // A condition or message, kept as text to the end of the logical
        // line, which a backslash continues.
        seq(
          choice("#if", "#elif", "#error", "#warning", "#pragma"),
          alias(/([^\\\r\n]|\\(.|\r?\n))*/, $.preproc_arg),
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

/**
 * One or more of a rule, separated by commas.
 *
 * @param {RuleOrLiteral} rule
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

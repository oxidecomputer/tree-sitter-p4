module.exports = grammar({
  name: 'p4',

  extras: $ => [
    /\s|\\\r?\n/,
    $.comment,
    $.preproc,
  ],

  rules: {
    source_file: $ => repeat($.top),

    top: $ => $._definition,

    _definition: $ => choice(
      $.header_definition,
      $.struct_definition,
      $.extern_definition,
      $.parser_definition,
      $.control_definition,
      $.package,
    ),

    package: $ => seq(
      $.type_identifier,
      '(',
        seq($.method_identifier, '(', ')'),
        repeat(seq(',', $.method_identifier, '(', ')')),
        optional(','),
      ')', $.identifier, ';'
    ),

    header_definition: $ => seq(
      repeat($.annotation),
      'header', $.type_identifier,
      '{',
        repeat($.field),
      '}'
    ),

    struct_definition: $ => seq(
      repeat($.annotation),
      'struct', $.type_identifier,
      '{',
        repeat($.field),
      '}'
    ),

    extern_definition: $ => seq(
      repeat($.annotation),
      'extern', $.type_identifier,
      '{',
        repeat($.method),
      '}'
    ),

    parser_definition: $ => seq(
      repeat($.annotation),
      'parser', $.method_identifier,
      '(', repeat($.parameter), ')',
      '{',
        repeat1($.state),
      '}'
    ),

    control_definition: $ => seq(
      repeat($.annotation),
      'control',
      $.method_identifier,
      '(', repeat($.parameter), ')',
      '{',
        optional($.control_body),
      '}'
    ),

    control_body: $ => seq(
      repeat($.control_body_element),
      seq('apply', '{', repeat($.stmt), '}'),
      repeat($.control_body_element),
    ),

    control_body_element: $ => choice(
      seq(repeat($.annotation), $.control_var),
      seq(repeat($.annotation), $.table),
      seq(repeat($.annotation), $.action),
    ),

    table: $ => seq (
      'table',
      $.type_identifier,
      '{', repeat($.table_element), '}'
    ),

    table_element: $ => choice(
        seq('key', '=', '{', repeat1(
          seq($.expr, ':', $.key_type, repeat($.annotation), ';')), '}'
        ),
        seq('actions', '=', '{', repeat1(
          seq(repeat($.annotation), $.action_item, ';')), '}'),
        seq('size', '=', $.expr, ';'),
        seq(optional('const'), 'default_action', '=',
          choice('NoAction', $.method_identifier), ';'),
        seq('meters', '=', $.identifier, ';'),
        seq('counters', '=', $.identifier, ';'),
    ),

    action_item: $ => choice($.call, 'NoAction'),

    key_type: $ => choice (
      'range',
      'exact',
      'ternary',
      'lpm',
      'optional'
    ),

    state: $ => seq (
      'state',
      $.method_identifier,
      '{',
        repeat($.stmt),
      '}'
    ),

    stmt: $ => choice (
      $.conditional,
      $.action,
      $.var_decl,
      seq($.transition, ';'),
      seq($.call, ';'),
      seq($.expr, ';'),
      seq('return', ';'),
    ),

    var_decl: $ => seq(
      choice($._type, $.type_identifier),
      $.identifier,
      optional(seq('=', $.expr)),
      ';'
    ),

    action: $ => seq (
      'action',
      $.method_identifier,
      '(', repeat($.parameter), ')',
      '{',
        repeat($.stmt),
      '}'
    ),

    transition: $ => seq ('transition', $.identifier),

    call: $ => seq(
      $.fval,
      '(',
        optional('{'),
        optional($.expr),
        repeat(seq(',', $.expr)),
        optional(','),
        optional('}'),
      ')'
    ),

    slice: $ => seq($.lval, '[', $.number, ':', $.number, ']'),

    expr: $ => choice(
      prec.left(seq($.expr, $.binop, $.expr)),
      prec(1, $.call),
      prec(1, $.slice),
      $.number,
      $.lval,
    ),

    binop: $ => choice(
      '==',
      '!=',
      '>=',
      '=',
      '+',
      '-',
      '*',
      '/',
      '%',
      '||',
    ),

    conditional: $ => seq($._if, optional($._else)),

    _if: $ => seq(
      'if', '(', $.expr, ')',
      '{',
        repeat($.stmt),
      '}'
    ),

    _else: $ => seq(
      'else',
      '{',
        repeat($.stmt),
      '}'
    ),

    control_var: $ => seq(
      $.type_identifier,
      '(',
        repeat($.expr),
      ')',
      $.identifier,
      ';'
    ),

    lval: $ => seq($.identifier, repeat(seq('.', $.identifier))),
    fval: $ => seq(
      choice(
        seq(
          $.identifier,
          repeat(seq('.', $.identifier)),
          seq('.', $.method_identifier)
        ),
        $.method_identifier,
      ),
    ),

    method: $ => seq(
      choice($._type, $.type_identifier),
      $.method_identifier,
      optional(seq('<', $.type_identifier, '>')),
      '(',
        repeat($.parameter),
      ')',
      ';'
    ),

    parameter: $ => seq(
      optional($.direction),
      choice($._type, $.type_identifier),
      $.identifier,
      optional(',')
    ),

    direction: $ => choice('in', 'out', 'inout'),

    field: $ => seq(
      choice($._type, $.type_identifier),
      $.identifier,
      ';'
    ),

    _type: $ => choice(
      'bool',
      $.bit_type
    ),

    bit_type: $ => seq('bit', '<', $.number, '>'),

    type_identifier: $ => $.identifier,

    method_identifier: $ => $.identifier,

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice (
      $.decimal,
      $.hex,
      $.whex,
      $.wdecimal,
    ),

    decimal: $ => /\d+/,

    hex: $ => /0x(\d|[a-fA-F])+/,

    whex: $ => seq($.decimal, 'w', $.hex),

    wdecimal: $ => seq($.decimal, 'w', $.decimal),

    annotation: $ => seq(
      '@', $.identifier, optional($.annotation_body),
    ),

    annotation_body: $ => seq(
      '(',
        optional($.annotation_content),
        repeat(seq(',', $.annotation_content)),
        optional(','),
       ')',
    ),

    annotation_content: $ => choice(
      $.expr,
      /["][^"]*["]/,
      $.annotation,
    ),

    comment: _ => token(choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),

    preproc: _ => choice(
      seq('#include', choice('<', '"'), /[^">]*/, choice('>', '"')),
      seq('#if', /.*/),
      seq('#else', /.*/),
      '#endif',
    )
  }
})

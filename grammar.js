/**
 * @file Lama grammar for tree-sitter
 * @author Vasily Fedorov <vasily.fedorov@arsysop.ru>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  BLOCK: 0,
  CASES: 1,
  LET: 2,
  VARIABLE: 3,
  ARGUMENTS: 4,
  BRACKETS: 5,
  ASSIGNMENT: 6,
  LIST_CONS: 7,
  DISJ: 8,
  CONJ: 9,
  EQ: 10,
  ADD: 11,
  MULT: 12,
  INFIX_EXPR: 13,
  UNARY: 14,
  LAZY: 15,
  DOT: 16,
  POSTFIX: 17,
};

export default grammar({
  name: "lama",

  extras: ($) => [$.line_comment, $.block_comment, /\s/],

  inline: ($) => [
    $._expression_block,
    $._function_argument,
    $._literal,
    $._primary_expression,
    $._variable_definitions,
  ],

  word: ($) => $.lident,

  rules: {
    compilation_unit: ($) =>
      seq(repeat($.import_statement), repeat($.scope_expression)),

    import_statement: ($) => seq("import", $.uident, ";"),

    scope_expression: ($) =>
      prec.left(
        choice(
          seq(repeat1($.definition), optional($._expression_block)),
          $._expression_block,
        ),
      ),

    definition: ($) =>
      choice($.variable_definition, $.function_definition, $.infix_definition),

    variable_definition: ($) =>
      seq(choice("var", "public"), $._variable_definitions, optional(";")),

    _variable_definitions: ($) =>
      prec.left(
        seq(
          $.variable_definition_item,
          repeat(seq(",", $.variable_definition_item)),
        ),
      ),

    variable_definition_item: ($) =>
      prec.left(
        PREC.VARIABLE,
        seq($.binding, optional(seq("=", $.expression))),
      ),

    function_definition: ($) =>
      seq(
        optional("public"),
        "fun",
        $.binding,
        "(",
        optional($.function_arguments),
        ")",
        $.function_body,
      ),

    function_arguments: ($) =>
      seq($._function_argument, repeat(seq(",", $._function_argument))),

    _function_argument: ($) =>
      choice(prec(PREC.ARGUMENTS, $.lident), $.pattern),

    function_body: ($) => seq("{", optional($.scope_expression), "}"),

    _expression_block: ($) =>
      prec.left(
        PREC.BLOCK,
        seq($.expression, repeat(seq(";", $._expression_block))),
      ),

    binary_expression: ($) =>
      choice(
        prec.right(PREC.ASSIGNMENT, seq($.expression, ":=", $.expression)),
        prec.right(PREC.LIST_CONS, seq($.expression, ":", $.expression)),
        prec.left(PREC.DISJ, seq($.expression, "!!", $.expression)),
        prec.left(PREC.CONJ, seq($.expression, "&&", $.expression)),
        prec.left(PREC.EQ, seq($.expression, "==", $.expression)),
        prec.left(PREC.EQ, seq($.expression, "!=", $.expression)),
        prec.left(PREC.EQ, seq($.expression, "<=", $.expression)),
        prec.left(PREC.EQ, seq($.expression, "<", $.expression)),
        prec.left(PREC.EQ, seq($.expression, ">=", $.expression)),
        prec.left(PREC.EQ, seq($.expression, ">", $.expression)),
        prec.left(PREC.ADD, seq($.expression, "+", $.expression)),
        prec.left(PREC.ADD, seq($.expression, "-", $.expression)),
        prec.left(PREC.MULT, seq($.expression, "*", $.expression)),
        prec.left(PREC.MULT, seq($.expression, "/", $.expression)),
        prec.left(PREC.MULT, seq($.expression, "%", $.expression)),
        prec.left(PREC.INFIX_EXPR, seq($.expression, $.infix, $.expression)),
      ),

    expression: ($) =>
      choice(
        $.binary_expression,
        prec.left(PREC.UNARY, seq("-", $.postfix_expression)),
        $.postfix_expression,
      ),

    postfix_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        choice(
          $._primary_expression,
          seq(
            $.postfix_expression,
            "(",
            optional(
              seq($._expression_block, repeat(seq(",", $._expression_block))),
            ),
            ")",
          ),
          seq($.postfix_expression, "[", $._expression_block, "]"),
        ),
      ),

    _primary_expression: ($) =>
      prec(
        PREC.BRACKETS,
        choice(
          $.decimal,
          $.lident,
          $._literal,
          seq("infix", $.infix),
          seq("fun", "(", optional($.function_arguments), ")", $.function_body),
          "skip",
          seq("(", optional($.scope_expression), ")"),
          $.list_expression,
          $.array_expression,
          $.s_expression,
          $.if_expression,
          $.while_do_expression,
          $.do_while_expression,
          $.for_expression,
          $.case_expression,
          $.let_expression,
          $.lazy_expression,
          $.eta_expression,
          $.dot_expression,
        ),
      ),

    list_expression: ($) =>
      prec(
        1,
        seq(
          "{",
          optional(
            seq($._expression_block, repeat(seq(",", $._expression_block))),
          ),
          "}",
        ),
      ),
    array_expression: ($) =>
      prec(
        PREC.ARGUMENTS,
        seq(
          "[",
          optional(
            seq($._expression_block, repeat(seq(",", $._expression_block))),
          ),
          "]",
        ),
      ),
    s_expression: ($) =>
      prec.left(
        PREC.ARGUMENTS,
        seq(
          $.uident,
          optional(
            seq(
              "(",
              $._expression_block,
              repeat(seq(",", $._expression_block)),
              ")",
            ),
          ),
        ),
      ),

    let_expression: ($) =>
      prec.right(
        PREC.LET,
        seq(
          "let",
          $.pattern,
          "=",
          $._expression_block,
          "in",
          $._expression_block,
        ),
      ),

    if_expression: ($) =>
      prec.right(
        PREC.LET,
        seq(
          "if",
          $._expression_block,
          "then",
          optional($.scope_expression),
          optional($.else_part),
          "fi",
        ),
      ),
    else_part: ($) =>
      prec.right(
        PREC.LET,
        choice(
          seq(
            "elif",
            $._expression_block,
            "then",
            optional($.scope_expression),
            optional($.else_part),
          ),
          seq("else", optional($.scope_expression)),
        ),
      ),

    while_do_expression: ($) =>
      prec.right(
        PREC.LET,
        seq(
          "while",
          $._expression_block,
          "do",
          optional($.scope_expression),
          "od",
        ),
      ),
    do_while_expression: ($) =>
      prec.right(
        PREC.LET,
        seq(
          "do",
          optional($.scope_expression),
          "while",
          $._expression_block,
          "od",
        ),
      ),
    for_expression: ($) =>
      prec.right(
        PREC.LET,
        seq(
          "for",
          optional($.scope_expression),
          ",",
          $._expression_block,
          ",",
          $._expression_block,
          "do",
          optional($.scope_expression),
          "od",
        ),
      ),

    pattern: ($) =>
      prec.left(PREC.BRACKETS, choice($.cons_pattern, $.simple_pattern)),
    cons_pattern: ($) => seq($.simple_pattern, ":", $.pattern),
    simple_pattern: ($) =>
      choice(
        $.wildcard_pattern,
        $.s_expression_pattern,
        $.array_pattern,
        $.list_pattern,
        seq($.binding, optional(seq("@", $.pattern))),
        $.decimal,
        $._literal,
        $.shape_pattern,
        seq("(", $.pattern, ")"),
      ),
    shape_pattern: (_) =>
      seq("#", choice("box", "val", "str", "array", "sexp", "fun")),
    wildcard_pattern: (_) => "_",
    list_pattern: ($) =>
      seq("{", optional(seq($.pattern, repeat(seq(",", $.pattern)))), "}"),
    array_pattern: ($) =>
      seq("[", optional(seq($.pattern, repeat(seq(",", $.pattern)))), "]"),
    s_expression_pattern: ($) =>
      seq(
        $.uident,
        optional(seq("(", $.pattern, repeat(seq(",", $.pattern)), ")")),
      ),

    case_expression: ($) =>
      seq("case", $._expression_block, "of", $.case_branches, "esac"),
    case_branches: ($) =>
      prec.left(
        PREC.CASES,
        seq($.case_branch, repeat(seq("|", $.case_branch))),
      ),
    case_branch: ($) =>
      prec.left(PREC.CASES, seq($.pattern, "->", $.scope_expression)),

    infix_definition: ($) =>
      seq(
        $.infix_head,
        "(",
        optional($.function_arguments),
        ")",
        $.function_body,
      ),
    infix_head: ($) => seq(optional("public"), $.infixity, $.infix, $.level),
    infixity: (_) => prec(PREC.VARIABLE, choice("infix", "infixl", "infixr")),
    level: ($) => seq(optional(choice("at", "before", "after")), $.infix),

    lazy_expression: ($) => prec.left(PREC.LAZY, seq("lazy", $.expression)),
    eta_expression: ($) => prec.left(PREC.LAZY, seq("eta", $.expression)),

    dot_expression: ($) =>
      prec.left(
        PREC.DOT,
        seq(
          $._expression_block,
          ".",
          choice($.uident, $.lident),
          optional(
            seq(
              "(",
              $._expression_block,
              repeat(seq(",", $._expression_block)),
              ")",
            ),
          ),
        ),
      ),

    binding: ($) => field("name", $.lident),

    _literal: ($) => choice($.string, $.char, $.boolean),
    infix: (_) => /[+*/%$#@!|&^?<>:=\-]+/,
    uident: (_) => /[A-Z][a-zA-Z0-9]*/,
    lident: (_) => /[a-z][a-zA-Z0-9]*/,
    decimal: (_) => /-?\d+/,
    string: (_) => /"([^\"]|"")*"/,
    char: (_) => /’([^’]|’’|\n|\t)’/,
    boolean: ($) => choice($.true, $.false),
    true: (_) => "true",
    false: (_) => "false",

    line_comment: (_) => token(prec(PREC.BLOCK, seq("--", /[^\n]*/))),
    block_comment: (_) =>
      token(prec(PREC.BLOCK, seq("(*", /[^*]*\*+([^*)]+\*+)*/, ")"))),
  },
});

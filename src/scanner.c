// Copyright 2026 Oxide Computer Company

// The grammar parses preprocessor directives as extras, where a newline is
// ordinary whitespace. Two tokens need to know where a directive's logical
// line ends, which the grammar cannot see, so this scanner supplies them:
//
// - The end of a `#define` with no value, such as an include guard: a
//   zero-width token, emitted only when nothing but horizontal whitespace or a
//   comment follows on the line.
// - The body of a macro: text up to the end of the logical line, which a
//   backslash continues. A block comment inside the body is part of the text,
//   while a comment that ends the line is left to be lexed as one.
//
// A function-like macro's body is always text. An object-like macro's value
// is parsed as an expression or a list of fields where it is one, and is text
// only where it holds declarations, statements, or key elements, as in
//
//     #define MAC_KEY             \
//         hdr.eth.src : ternary;  \
//         hdr.eth.dst : ternary;
//
// which is told by a `;`, `@`, or brace that no expression contains. A value
// that begins with a brace is a list of fields, which the grammar parses.

#include "tree_sitter/parser.h"

enum TokenType {
  DEFINE_END,
  MACRO_BODY,
  MACRO_STATEMENTS,
  // Never used in the grammar. Every external token is marked valid during
  // error recovery, so this one being valid means the parser is recovering.
  ERROR_SENTINEL,
};

void *tree_sitter_p4_external_scanner_create(void) { return NULL; }

void tree_sitter_p4_external_scanner_destroy(void *payload) { (void)payload; }

unsigned tree_sitter_p4_external_scanner_serialize(void *payload,
                                                   char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_p4_external_scanner_deserialize(void *payload,
                                                 const char *buffer,
                                                 unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static bool at_line_end(TSLexer *lexer) {
  return lexer->eof(lexer) || lexer->lookahead == '\n' ||
         lexer->lookahead == '\r';
}

// Scans to the end of the logical line, marking the token's end after the last
// character that is not whitespace, a line continuation, or a trailing
// comment. Returns whether there was any such character, and sets
// `*statements` if one of them can only belong to a statement or declaration.
static bool scan_body(TSLexer *lexer, bool *statements) {
  bool has_text = false;
  *statements = false;
  while (!at_line_end(lexer)) {
    int32_t c = lexer->lookahead;
    if (c == ' ' || c == '\t') {
      advance(lexer);
    } else if (c == '\\') {
      advance(lexer);
      if (lexer->lookahead == '\r') {
        advance(lexer);
      }
      if (lexer->lookahead == '\n') {
        advance(lexer);
      } else if (!lexer->eof(lexer)) {
        advance(lexer);
        lexer->mark_end(lexer);
        has_text = true;
      }
    } else if (c == '/') {
      advance(lexer);
      if (lexer->lookahead == '/') {
        // A line comment ends the body.
        break;
      }
      if (lexer->lookahead == '*') {
        // A block comment counts as text only if text follows it, which then
        // marks the end past it.
        advance(lexer);
        bool star = false;
        while (!lexer->eof(lexer) && !(star && lexer->lookahead == '/')) {
          star = lexer->lookahead == '*';
          advance(lexer);
        }
        if (!lexer->eof(lexer)) {
          advance(lexer);
        }
      } else {
        lexer->mark_end(lexer);
        has_text = true;
      }
    } else if (c == '"') {
      // A string may hold `//` or `/*`.
      advance(lexer);
      while (!at_line_end(lexer) && lexer->lookahead != '"') {
        if (lexer->lookahead == '\\') {
          advance(lexer);
        }
        if (!lexer->eof(lexer)) {
          advance(lexer);
        }
      }
      if (lexer->lookahead == '"') {
        advance(lexer);
      }
      lexer->mark_end(lexer);
      has_text = true;
    } else {
      if (c == ';' || c == '@' || c == '{' || c == '}') {
        *statements = true;
      }
      advance(lexer);
      lexer->mark_end(lexer);
      has_text = true;
    }
  }
  return has_text;
}

bool tree_sitter_p4_external_scanner_scan(void *payload, TSLexer *lexer,
                                          const bool *valid_symbols) {
  (void)payload;
  if (valid_symbols[ERROR_SENTINEL]) {
    return false;
  }
  if (!valid_symbols[DEFINE_END] && !valid_symbols[MACRO_BODY] &&
      !valid_symbols[MACRO_STATEMENTS]) {
    return false;
  }

  // Mark the end before looking ahead, so that the end of a define spans no
  // input and the directive does not take in trailing whitespace.
  lexer->mark_end(lexer);
  // A parenthesis directly after a macro's name opens its parameters.
  bool function_like = lexer->lookahead == '(';
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
  }

  bool statements;
  if (valid_symbols[MACRO_BODY] && scan_body(lexer, &statements)) {
    lexer->result_symbol = MACRO_BODY;
    return true;
  }
  if (valid_symbols[MACRO_STATEMENTS] && !function_like &&
      lexer->lookahead != '{' && scan_body(lexer, &statements)) {
    if (statements) {
      lexer->result_symbol = MACRO_STATEMENTS;
      return true;
    }
    // Any other value is left to the grammar, which lexes it afresh.
    return false;
  }
  if (!valid_symbols[DEFINE_END]) {
    return false;
  }
  // The end of a define is valid where only whitespace or comments remain.
  // A scanned body without text has left the token's end at the start.
  lexer->result_symbol = DEFINE_END;
  if (valid_symbols[MACRO_BODY] || at_line_end(lexer)) {
    return true;
  }
  if (lexer->lookahead == '/') {
    advance(lexer);
    return lexer->lookahead == '/' || lexer->lookahead == '*';
  }
  return false;
}

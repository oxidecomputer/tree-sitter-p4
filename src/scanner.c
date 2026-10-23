// Copyright 2026 Oxide Computer Company

// The grammar parses preprocessor directives as extras, where a newline is
// ordinary whitespace. That leaves a `#define` with no value, such as an
// include guard, without an end the grammar can see: the next token may be
// on the following line. This scanner supplies that end as a zero-width
// token, emitted only when nothing but horizontal whitespace or a comment
// follows on the line.

#include "tree_sitter/parser.h"

enum TokenType {
  DEFINE_END,
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

bool tree_sitter_p4_external_scanner_scan(void *payload, TSLexer *lexer,
                                          const bool *valid_symbols) {
  (void)payload;
  if (valid_symbols[ERROR_SENTINEL] || !valid_symbols[DEFINE_END]) {
    return false;
  }

  // Mark the end before looking ahead, so that the token spans no input and
  // the directive does not take in trailing whitespace.
  lexer->mark_end(lexer);
  lexer->result_symbol = DEFINE_END;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    lexer->advance(lexer, false);
  }

  if (lexer->eof(lexer) || lexer->lookahead == '\n' ||
      lexer->lookahead == '\r') {
    return true;
  }
  if (lexer->lookahead == '/') {
    lexer->advance(lexer, false);
    return lexer->lookahead == '/' || lexer->lookahead == '*';
  }
  return false;
}

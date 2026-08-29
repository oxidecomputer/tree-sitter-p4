# Copyright 2026 Oxide Computer Company

# Topiary language definition for P4.
#
# Build the grammar once, then format from the root of this repository:
#
#     make topiary/grammar.so
#     TOPIARY_LANGUAGE_DIR=topiary topiary format -C topiary/languages.ncl FILE.p4
#
# The grammar is built from the working tree, so the queries are always
# exercised against the grammar beside them. To pin a published revision
# instead, replace the `path` with:
#
#     grammar.source.git = {
#       git = "https://github.com/oxidecomputer/tree-sitter-p4",
#       rev = "<commit>",
#     },
#
# Any revision used there has to carry the `line_continuation` fix: without it
# the token following a field's semicolon absorbs the preceding whitespace, and
# the formatter reproduces the original indentation verbatim.
{
  languages = {
    p4 = {
      extensions = ["p4"],
      indent = "    ",
      grammar.source.path = "topiary/grammar.so",
    },
  },
}

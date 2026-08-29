# Topiary formatting for P4

[Topiary][topiary] formats source code from a Tree-sitter grammar and a file
of formatting queries. `p4.scm` holds those queries for P4-16;
`languages.ncl` registers the language with Topiary and points it at the
grammar built from this repository.

## Usage

```sh
make topiary/grammar.so
TOPIARY_LANGUAGE_DIR=topiary topiary format -C topiary/languages.ncl FILE.p4
```

The queries run against the grammar in the working tree, so `grammar.so` is
built from `src/` alongside them.

Run Topiary from the repository root. The grammar path in `languages.ncl` is
relative, and Topiary resolves it against the working directory.

## What the queries do

Topiary has no notion of line width, so whether a construct breaks across lines
is taken from the input: a block already spread over several lines gets one
element per line, and a block written on a single line stays on one. A guarded
extract such as `if (h.isValid()) { pkt.extract(h); }` therefore survives, as
does `actions = { forward; drop; }`. Within that, the formatter normalizes
indentation, spacing around operators and punctuation, and the attachment of
braces:

- `){` becomes `) {`, and `if(` becomes `if (`
- tabs and hand-aligned columns become four-space indentation
- `a=b` becomes `a = b`, and runs of spaces collapse to one
- `extract<T >` becomes `extract<T>`, and `foo ()` becomes `foo()`
- statements crammed onto one line inside a multi-line block are split apart

A comment keeps the position the input gave it, either trailing the construct
it annotates or standing on a line of its own. The grammar gives line and block
comments a single node type, and taking the break from the input serves both:
the line form's token ends before the newline that terminates it, so it is
always followed by a break in the source and always gets one back.

Topiary cannot align columns. It places whitespace from softline, space, and
indentation markers, and has no mechanism for padding a token to a column, so
hand-aligned struct fields are reflowed to single spaces.

## Relationship to the Topiary repository

These queries are maintained here, against the grammar that constrains them.
CI exercises them through `examples/`, and a change to a node name shows up in
the repository where the change was made.

Topiary compiles its query files into its binary with `include_str!`, and has
no mechanism for loading them from a grammar repository, so contributing P4 as
a built-in language means copying `p4.scm` into Topiary's own tree. Treat any
such copy as an export of this file rather than a second place to edit it.

Such a contribution registers the language the way every other contributed
language is registered:

- a feature in the `Cargo.toml` of `topiary-cli`, `topiary-config`, and
  `topiary-queries`
- a `p4()` accessor over the query file in `topiary-queries/src/lib.rs`
- a dispatch arm in `topiary-cli/src/io.rs`
- an entry in `topiary-config/languages.ncl` pinning a revision of this
  repository
- `p4` added to the language lists in `topiary-cli/tests/sample-tester.rs`,
  which drives its samples from `topiary-cli/tests/samples/{input,expected}/`

Those samples are copied from the fixture pair under `tests/` here.

Two details of that registration are easy to miss. The `languages.ncl` entry
needs a `nixHash` beside the revision, as every git-sourced grammar there
carries one and Topiary's Nix build verifies against it. And a newly added
language belongs under the `experimental` feature rather than `contributed`;
the maintainers decide which tier it graduates to. Topiary's own guide for
adding a language documents both, and it changes, so re-read it at the time.

## Grammar dependency

The queries require the `line_continuation` rule to be anchored at its
backslash. Before that fix, a token whose pattern could begin with whitespace
was a lexer candidate at every position, so the whitespace after a field's
semicolon landed inside the following token rather than being skipped as an
extra, and every tree-based formatter reproduced the original indentation
verbatim.

[topiary]: https://github.com/tweag/topiary

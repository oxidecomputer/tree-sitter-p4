# tree-sitter-p4

P4 grammar for [Tree-sitter][tree-sitter]. It recognizes `.p4` source files and
carries syntax highlighting queries in [`queries/highlights.scm`][highlights].

The grammar is still being expanded toward full coverage of the
[P4-16 specification][p4-16-spec].

## Using the grammar

Install the Tree-sitter CLI with a package manager:

```sh
npm install --global tree-sitter-cli@0.26.8
```

or with Cargo:

```sh
cargo install tree-sitter-cli --version 0.26.8
```

Clone this repository, then parse one of the included examples:

```sh
git clone https://github.com/oxidecomputer/tree-sitter-p4.git
cd tree-sitter-p4
tree-sitter parse examples/parser.p4
```

The generated syntax tree is printed to standard output. A node named `ERROR`
or `MISSING` indicates that the grammar did not parse that part of the input.

## Developing the grammar

The grammar source is [`grammar.js`][grammar-js]. After changing it, regenerate
the parser and node type descriptions before parsing the examples:

```sh
tree-sitter generate
tree-sitter parse examples/*.p4
```

The repository also contains formatting queries for [Topiary][topiary]. See
[`topiary/README.md`][topiary-readme] for setup and usage.

## Contributing

This project is still in its early stages, so there are many things that can be
improved, as we aim toward capturing more of the [P4-16 specification][p4-16-spec].

To contribute, just open a pull request!

This project is licensed under the [Mozilla Public License, version 2.0][mpl].

[grammar-js]: grammar.js
[highlights]: queries/highlights.scm
[mpl]: https://www.mozilla.org/en-US/MPL/2.0/
[p4-16-spec]: https://p4.org/p4-spec/docs/P4-16-v1.0.0-spec.html
[topiary]: https://github.com/tweag/topiary
[topiary-readme]: topiary/README.md
[tree-sitter]: https://tree-sitter.github.io/tree-sitter/

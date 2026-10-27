# tree-sitter-p4

P4 grammar for [Tree-sitter][tree-sitter]. It recognizes `.p4` source files and
carries editor queries in [`queries/`][queries]: highlighting, indentation, text
objects, tags, locals, and rainbow brackets for Helix, and highlighting and
folds for Neovim in [`queries/nvim/`][nvim-queries].

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

## Editor setup

Neither editor ships P4 support, so each needs the language registered, the
parser built, and the queries installed.

### Helix

Add the language and grammar to `~/.config/helix/languages.toml`, pinning `rev`
to the commit you want:

```toml
[[language]]
name = "p4"
scope = "source.p4"
file-types = ["p4"]
comment-token = "//"
block-comment-tokens = { start = "/*", end = "*/" }
indent = { tab-width = 4, unit = "    " }

[[grammar]]
name = "p4"
source = { git = "https://github.com/oxidecomputer/tree-sitter-p4", rev = "<commit>" }
```

Then build the grammar and install the queries from a checkout of the same
commit:

```sh
hx --grammar fetch
hx --grammar build
mkdir -p ~/.config/helix/runtime/queries/p4
cp queries/*.scm ~/.config/helix/runtime/queries/p4/
```

`hx --health p4` should then report every query. Rainbow brackets also need
`rainbow-brackets = true` under `[editor]` in `config.toml`.

### Neovim

From a checkout, build the parser and install the Neovim queries where Neovim
looks for them:

```sh
site=~/.local/share/nvim/site
mkdir -p "$site/parser" "$site/queries/p4"
tree-sitter build -o "$site/parser/p4.so"
cp queries/nvim/*.scm "$site/queries/p4/"
```

Then register the file type and start Tree-sitter for it, for example in
`init.lua`:

```lua
vim.filetype.add({ extension = { p4 = "p4" } })
vim.api.nvim_create_autocmd("FileType", {
  pattern = "p4",
  callback = function()
    vim.treesitter.start()
    vim.wo.foldmethod = "expr"
    vim.wo.foldexpr = "v:lua.vim.treesitter.foldexpr()"
  end,
})
```

`queries/nvim/highlights.scm` is generated from `queries/highlights.scm`; after
changing the latter, run `make queries/nvim/highlights.scm`.

## Developing the grammar

The grammar source is [`grammar.js`][grammar-js]. After changing it, regenerate
the parser and node type descriptions before parsing the examples:

```sh
tree-sitter generate
tree-sitter parse examples/*.p4
```

`tree-sitter test` runs the parse trees in `test/corpus`, and checks the
highlights and tags that the comments in `test/highlight` and `test/tags`
expect, as in

```p4
hdr.ethernet.dst = mac;
//           ^ variable.other.member
```

where `^` marks the column above it.

CI also parses p4c's sample programs and dendrite's P4, at pinned commits. The
p4c samples the grammar cannot parse yet are listed, with the reason, in
[`test/p4c-known-failures.txt`][known-failures]; when a change makes one parse,
CI asks for it to be taken off the list.

The repository also contains formatting queries for [Topiary][topiary]. See
[`topiary/README.md`][topiary-readme] for setup and usage.

## Contributing

This project is still in its early stages, so there are many things that can be
improved, as we aim toward capturing more of the [P4-16 specification][p4-16-spec].

To contribute, just open a pull request!

This project is licensed under the [Mozilla Public License, version 2.0][mpl].

[grammar-js]: grammar.js
[known-failures]: test/p4c-known-failures.txt
[mpl]: https://www.mozilla.org/en-US/MPL/2.0/
[nvim-queries]: queries/nvim
[p4-16-spec]: https://p4.org/p4-spec/docs/P4-16-v1.0.0-spec.html
[queries]: queries
[topiary]: https://github.com/tweag/topiary
[topiary-readme]: topiary/README.md
[tree-sitter]: https://tree-sitter.github.io/tree-sitter/

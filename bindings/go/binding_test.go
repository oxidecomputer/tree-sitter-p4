package tree_sitter_p4_test

import (
	"testing"

	tree_sitter_p4 "github.com/oxidecomputer/tree-sitter-p4/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_p4.Language())
	if language == nil {
		t.Errorf("Error loading P4 grammar")
	}
}

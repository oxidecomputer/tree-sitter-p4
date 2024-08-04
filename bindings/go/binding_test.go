package tree_sitter_P4_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-P4"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_P4.Language())
	if language == nil {
		t.Errorf("Error loading P4 grammar")
	}
}

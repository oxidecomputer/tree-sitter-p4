import XCTest
import SwiftTreeSitter
import TreeSitterP4

final class TreeSitterP4Tests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_p4())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading P4 grammar")
    }
}

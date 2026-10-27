// swift-tools-version:5.3

import PackageDescription

let package = Package(
    name: "TreeSitterP4",
    products: [
        .library(name: "TreeSitterP4", targets: ["TreeSitterP4"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterP4",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                "src/scanner.c",
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterP4Tests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterP4",
            ],
            path: "bindings/swift/TreeSitterP4Tests"
        )
    ],
    cLanguageStandard: .c11
)

/* String literals (string constants) are specified as an arbitrary sequence of
 * 8-bit characters, enclosed within double quote signs " (ASCII code 34).
 * Strings start with a double quote sign and extend to the first double quote
 * sign which is not immediately preceded by an odd number of backslash
 * characters (ASCII code 92). P4 does not make any validity checks on strings
 * (i.e., it does not check that strings represent legal UTF-8 encodings).
 *
 * Since P4 does not provide any operations on strings, string literals are
 * generally passed unchanged through the P4 compiler to other third-party tools
 * or compiler-backends, including the terminating quotes. These tools can
 * define their own handling of escape sequences (e.g., how to specify Unicode
 * characters, or handle unprintable ASCII characters).
 */

control MyControl<T>(inout bit<32> var) {
    action test_string_literals() {
        bit<16> x = 10;
        varbit<32> y;

        // Various string literal tests
        // Note: These are not typed, just passed through
        x = "hello world";  // This might be a semantic error, but syntactically valid
        y = "string with \"escaped\" quotes";

        // Mixing string literals with comparisons
        if (x <= 20 && x == "hello") {
            // Some action
        }
    }

    // Test different type declarations and usage
    table example_table {
        key = {
            var : exact;
        }
        actions = {
            test_string_literals;
        }
        size = 1024;
    }
}

control AnotherControl() {
    action another_action() {
        bit<8> val = 42;
        val = "Value is: 42";

        if (val > 0 && val != "") {
            // Precedence test
        }
    }
}

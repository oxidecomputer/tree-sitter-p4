// Expression forms the grammar has to cover: the bitwise and conditional
// operators, header stack indexing, and calls in value position.

header hdr_t {
    bit<8> f;
}

// Header stacks, in the declaration positions P4-16 allows them.
struct headers {
    hdr_t[4] stack;
}

control c(inout hdr_t[4] stack) {
    apply {
        bit<8> a = 1;
        bit<8> b = 2;

        // Bitwise operators.
        x = a ^ b;
        x = ~a;
        x = a & b;
        x = a | b;

        // Conditional expression, including right-associative nesting.
        x = a > b ? a : b;
        x = a > b ? a : b > a ? b : a;

        // Header stack indexing, as value and as assignment target.
        x = stack[0];
        x = stack[0].f;
        stack[1].f = a;
        stack[a + 1].f = b;

        // Calls in value position, member and non-member.
        x = f(a, b);
        x = pkt.length();

        // Bit slices still parse alongside indexing.
        x = a[7:0];
    }
}

// Expression forms the grammar has to cover: the bitwise and conditional
// operators, header stack indexing, calls in value position, casts and
// parentheses, and conditionals.

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

        // An empty statement, as in a doubled semicolon.
        x = a;;

        // Saturating arithmetic and concatenation.
        x = a |+| b;
        x = a |-| b;
        x = a ++ b;

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

        // A chain of `else if`.
        if (a == 1) {
            x = a;
        } else if (a == 2) {
            x = b;
        } else if (a == 3) {
            x = a;
        } else {
            x = b;
        }

        // Branches that are single statements rather than blocks.
        if (a == 4)
            x = a;
        else if (a == 5)
            t.apply();
        else
            x = b;

        // Casts and parenthesized expressions. `(a) == b` and `(a) - b` are
        // parenthesized; `(T)a` and `(bit<8>)a` are casts.
        x = (bit<128>)a << 8 | (bit<128>)b;
        x = m | ((bit<48>)a);
        x = (T)a;
        x = (a) == b;
        x = (a) - b;
        if ((a)) {
            x = a;
        }

        // Members of a call's result.
        if (!t.apply().hit) {
            x = a;
        }
        x = u.apply().miss;

        // Type arguments on a method call, including a closing `>>`.
        x = pkt.lookahead<bit<16>>();
        pkt.extract<hdr_t>(_);

        // Indexing within a member chain, in value and call position, and a
        // slice with expression bounds.
        x = hdr.stack[0].f;
        if (hdr.stack[0].isValid()) {
            x = hdr.stack[0].f[3:0];
        }
        x = hdr.f[W - 1:0];
        hdr.f[7:4] = a;
    }
}

// Slices of a call's result and of a parenthesized expression.
control call_slices(inout H h) {
    action a() {
        h.x = pkt.lookahead<bit<8>>()[7:0];
        h.y = c_hash.get({h.a, h.b})[31:0];
        h.z = (h.count >> 20)[4:0];
    }
    apply { }
}

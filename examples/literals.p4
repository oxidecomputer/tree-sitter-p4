// Widths given by a name or a parenthesized expression.
header widths_h {
    bit<WIDTH> a;
    bit<(4 * 8)> b;
    varbit<(MAX_LEN * 8)> c;
    int<16> d;
}

// Binary, octal, and signed literals, and digit separators.
const bit<8> BIN = 0b1010_0101;
const bit<8> OCT = 0o17;
const bit<4> WBIN = 4w0b1010;
const int<8> NEG = 8s5;
const bit<32> BIG = 1_000_000;
const bit<32> MASK = 0xFFFF_0000;

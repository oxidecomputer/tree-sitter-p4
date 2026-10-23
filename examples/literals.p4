// Widths given by a name or a parenthesized expression.
header widths_h {
    bit<WIDTH> a;
    bit<(4 * 8)> b;
    varbit<(MAX_LEN * 8)> c;
    int<16> d;
}

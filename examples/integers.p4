// Signed integer typedef
typedef int<16> SignedId_t;

// Signed integer struct fields
struct metrics_t {
    int<8>  delta;
    int<32> counter;
}

// Signed integer cast
control c(inout metrics_t m, in int<16> threshold) {
    apply {
        m.delta = (int<8>) 3;
    }
}

// Signed integer with expression width
const int<(3 + 13)> FOO = 1;

// Unsigned integer with expression width
const bit<(1 << 4)> BAR = 1;

// Dynamically sized bit string with expression max width
const varbit<(32 / 2)> BAZ = 1;

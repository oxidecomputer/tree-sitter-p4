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

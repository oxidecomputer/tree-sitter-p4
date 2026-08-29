// Tuple keysets with and without ternary masks, expression-ended ranges,
// trailing commas in tuples, and transition select over one or several
// selector expressions, with and without a trailing semicolon.

header ethernet_h {
    bit<48> dst;
    bit<48> src;
    bit<16> ether_type;
}

struct headers_t {
    ethernet_h eth;
}

extern Checksum {
    bit<16> run<T>(in T data);
}

parser Top(packet_in b, out headers_t hdr) {
    state start {
        transition select(hdr.eth.ether_type, hdr.eth.src) {
            (0x86dd, 0): with_semi;
            default: reject;
        };
    }
    state with_semi {
        transition select(hdr.eth.ether_type, hdr.eth.src) {
            _: accept;
        }
    }
    // A single selector expression takes one keyset rather than a tuple.
    state single_selector {
        transition select(hdr.eth.ether_type) {
            0x86dd: accept;
            0x0800 &&& 0xFF00: with_semi;
            default: reject;
        }
    }
}

control ingress(inout headers_t hdr) {

    Checksum() csum;

    action a() { }
    action a_with_params(bit<16> x) { }

    table t {
        key = {
            hdr.eth.ether_type : ternary;
            hdr.eth.src         : range;
        }

        actions = {
            a;
            a_with_params;
        }

        default_action = a;

        const entries = {
            (0x1111 &&& 0xF000, 1 + 1 .. 2 + 2) : a_with_params(1);
            (0x2222, 3 .. 4)                     : a_with_params(2);
        }
    }

    apply {
        csum.run({
            hdr.eth.dst,
            hdr.eth.src,
        });
    }
}

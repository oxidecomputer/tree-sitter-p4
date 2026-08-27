// Tuple keyset entries with and without ternary masks, trailing commas
// in tuples, and transition select with and without a trailing
// semicolon.

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
        transition select(hdr.eth.ether_type) {
            0x86dd: with_semi;
            default: reject;
        };
    }
    state with_semi {
        transition select(hdr.eth.ether_type) {
            _: accept;
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
        }

        actions = {
            a;
            a_with_params;
        }

        default_action = a;

        const entries = {
            (0x1111 &&& 0xF000) : a_with_params(1);
            (0x2222)            : a_with_params(2);
        }
    }

    apply {
        csum.run({
            hdr.eth.dst,
            hdr.eth.src,
        });
    }
}

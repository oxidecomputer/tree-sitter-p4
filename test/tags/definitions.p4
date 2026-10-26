#define WIDTH 8
//      ^ definition.macro

const bit<8> LIMIT = 4;
//           ^ definition.constant

typedef bit<48> mac_t;
//              ^ definition.type

header eth_h { mac_t dst; }
//     ^ definition.struct

extern Checksum {
//     ^ definition.interface
    bit<16> get();
//          ^ definition.function
}

extern void mark_to_drop();
//          ^ definition.function

control Ingress(inout eth_h hdr) {
//      ^ definition.class
    action forward(mac_t mac) { hdr.dst = mac; }
//         ^ definition.function
    table route {
//        ^ definition.section
        key = { hdr.dst: exact; }
        actions = { forward; }
    }
    apply { route.apply(); }
//                ^ reference.call
}

package Switch(Ingress ig);
//      ^ definition.interface

Switch(Ingress()) main;
//     ^ reference.call

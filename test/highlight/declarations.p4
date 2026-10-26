#include <core.p4>
// <- keyword.directive
//       ^ string.special.path

#define WIDTH 8
//      ^ constant
//            ^ constant.numeric
#define ROTATE(x) x
//      ^ function.macro
//             ^ variable.parameter

const bit<8> LIMIT = 0x0F;
// <- keyword.storage.modifier
//    ^ type.builtin
//       ^ punctuation.bracket
//           ^ constant
//                   ^ constant.numeric

header ipv4_h {
// <- keyword.storage.type
//     ^ type
    @padding bit<4> version;
//  ^ attribute
//   ^ attribute
//                  ^ variable.other.member
}

extern Checksum<T> {
// <- keyword.storage.type
//     ^ type
//              ^ type
    Checksum();
//  ^ function.method
    T get(in T data);
//  ^ type
//    ^ function.method
//        ^ keyword.storage.modifier
//             ^ variable.parameter
}

match_kind { selector }
//           ^ constant.builtin

error { BadHeader }
//      ^ constant

parser P(packet_in pkt, out ipv4_h hdr) {
// <- keyword.storage.type
//     ^ type
//       ^ type.builtin
//                 ^ variable.parameter
//                      ^ keyword.storage.modifier
//                          ^ type
    state start {
//  ^ keyword
//        ^ label
        pkt.extract(hdr.stack.next);
//      ^ variable
//          ^ function.builtin
//                        ^ variable.other.member
        transition select(hdr.version) {
//      ^ keyword.control
//                 ^ keyword.control.conditional
//                            ^ variable.other.member
            4: parse_v4;
//             ^ label
            default: reject;
//          ^ keyword.control
//                   ^ constant.builtin
        }
    }
    state parse_v4 { transition accept; }
//                              ^ constant.builtin
}

package Switch<H>(P<H> p);
// <- keyword.storage.type
//      ^ type
//                ^ type
//                 ^ punctuation.bracket
//                     ^ variable.parameter

Switch<ipv4_h>(P()) main;
// <- type
//    ^ punctuation.bracket
//                  ^ variable

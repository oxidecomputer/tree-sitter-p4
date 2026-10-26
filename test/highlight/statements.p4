control C(inout headers_t hdr, in bit<9> port) {
// <- keyword.storage.type
//      ^ type
//        ^ keyword.storage.modifier
//              ^ type
//                        ^ variable.parameter
    Counter<bit<32>, bit<8>>(256) hits;
//  ^ type
//         ^ punctuation.bracket
//                                ^ variable

    action forward(bit<48> mac) {
//  ^ keyword.function
//         ^ function
//                         ^ variable.parameter
        hdr.ethernet.dst = mac;
//      ^ variable
//          ^ variable.other.member
//                   ^ variable.other.member
//                       ^ operator
        hdr.ipv4.ttl = hdr.ipv4.ttl |-| 1;
//                                  ^ operator
        hdr.ipv4.flags[2:0] = (bit<3>)port;
//                    ^ punctuation.bracket
//                             ^ type.builtin
        hits.count(port);
//           ^ function.method
    }

    table route {
//  ^ keyword.storage.type
//        ^ type
        key = {
//      ^ keyword
            hdr.ipv4.dst: lpm;
//                   ^ variable.other.member
//                        ^ constant.builtin
            port: selector;
//                ^ constant.builtin
        }
        actions = { forward; NoAction; }
//      ^ keyword
//                  ^ function
//                           ^ function.builtin
        size = 1024;
//      ^ keyword
//             ^ constant.numeric
        idle_timeout = true;
//                     ^ constant.builtin.boolean
        const entries = {
            0x0800 mask 0xFF00: forward(1);
//                 ^ keyword.operator
//                              ^ function
        }
    }

    apply {
//  ^ keyword
        if (hdr.ipv4.isValid() && port < 4) {
//      ^ keyword.control.conditional
//                   ^ function.method
//                             ^ operator
//                                     ^ operator
            route.apply();
//          ^ variable
//                ^ function.method
        } else {
//        ^ keyword.control.conditional
            exit;
//          ^ keyword.control.return
        }
        bit<8> x = port > 1 ? 8w1 : 8w2;
//                          ^ operator
//                            ^ constant.numeric
//                                ^ operator
    }
}

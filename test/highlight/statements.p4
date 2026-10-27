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
        hdr.ipv4.ttl |-|= 1;
//                   ^ operator
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
            MAC_KEY
//          ^ constant
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
        default_action = NoAction();
//                       ^ function.builtin
        size = 1024;
//      ^ keyword
//             ^ constant.numeric
        idle_timeout = true;
//                     ^ constant.builtin.boolean
        const entries = {
            priority=1: 0x0806 : forward(2);
//          ^ keyword
            0x0800 mask 0xFF00: forward(1);
//                 ^ keyword.operator
//                              ^ function
        }
    }

    apply {
//  ^ keyword
        if (hdr.ipv4.isValid() && port < 4) {
//      ^ keyword.control.conditional
//                   ^ function.builtin
//                             ^ operator
//                                     ^ operator
            route.apply();
//          ^ variable
//                ^ function.builtin
        } else {
//        ^ keyword.control.conditional
            verify(route.apply().hit, error.NoMatch);
//          ^ function.builtin
//                               ^ variable.builtin
//                                    ^ type.builtin
//                                          ^ constant
            exit;
//          ^ keyword.control.return
        }
        bit<8> x = port > 1 ? 8w1 : 8w2;
//                          ^ operator
//                            ^ constant.numeric
//                                ^ operator
        hdr.ipv4 = {#};
//                 ^ constant.builtin
        x = hdr.ipv4.ttl[i +: 4];
//                         ^ operator
        for (bit<8> i in 0 .. 3) {
//      ^ keyword.control.repeat
//                    ^ keyword.control.repeat
            if (i == x) { break; }
//                        ^ keyword.control.repeat
        }
    }
}

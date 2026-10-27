#include <core.p4>

#define ENTERPRISE 1701

#define STARSHIP { \
    bit<16>   id; \
    bit<16>   length; \
    bit<8>    type; \
    bit<8>    flags; \
    bit<16>   checksum; \
    bit<32>   source; \
    bit<32>   destination; \
    bit<16>   sequence; \
}

const bit<47> enterprise = ENTERPRISE;

#define COMMON_FIELDS			\
	meta.body_checksum,		\
	hdr.inner_eth,			\
	hdr.geneve,			\
	hdr.geneve_opts.ox_external_tag,	\
	hdr.udp.src_port,		\
	hdr.udp.dst_port,		\
	hdr.udp.hdr_length,		\
	(bit<16>)hdr.ipv6.next_hdr,	\
	hdr.ipv6.src_addr,		\
	hdr.ipv6.dst_addr,		\
	hdr.ipv6.payload_len

#define IPV4_FIELDS			\
	meta.l4_length, 		\
	hdr.inner_ipv4

// Includes the inner ipv6 header
#define IPV6_FIELDS			\
	hdr.inner_ipv6

header starship STARSHIP

#define ALIAS ENTERPRISE
#undef ALIAS
#if ENTERPRISE == 1
#error "unreachable"
#elif ENTERPRISE == 1701
#pragma once
#endif

// Directives are extras, so both branches of a conditional reach the parser,
// here as two apply blocks.
control Egress(inout headers hdr) {
#if __TARGET_TOFINO__ == 2
    apply {
        hdr.a.setValid();
    }
#elif __TARGET_TOFINO__ == 3
    apply {
    }
#else
    apply { }
#endif
}

// A function-like macro keeps its body as text: it need not be an expression.
#define IS_SERVICE(p) ((p) == USER_SPACE_SERVICE_PORT)
#define ROTATE(n) \
    action rotate_by_##n() { \
        x = y[##n-1:0]; \
    }

#define switch_hash_width 16

// Macros invoked without a semicolon, where they expand to declarations.
control Rotations(inout headers hdr) {
    ROTATE(1)
    ROTATE(2)
    apply { }
}
#define ipv4_lpm_partitions 2048

// Macros that stand for key elements, actions, and declarations.
#define MAC_KEY                   \
    hdr.inner_eth.dst : ternary;  \
    hdr.inner_eth.src : ternary;
#define MAC_ACTIONS forward; drop;
#define COUNTERS                  \
    @name(".hits")                \
    Counter<bit<32>, bit<8>>(256) hits;

control mac_acl(inout headers_t hdr) {
    action forward() { }
    action drop() { }
    COUNTERS
    table acl {
        key = {
            MAC_KEY
            hdr.udp.dst_port : exact;
        }
        actions = {
            MAC_ACTIONS
            NoAction;
        }
    }
    apply { acl.apply(); }
}

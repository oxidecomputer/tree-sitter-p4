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

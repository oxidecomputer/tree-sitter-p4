header Tcp_h { /* fields omitted */ }
header Udp_h { /* fields omitted */ }
struct Parsed_headers {
    Ethernet_h ethernet;
    Ip_h       ip;
    Tcp_h      tcp;
    Udp_h      udp;
}

// Annotated fields.
struct annotated_t {
    @name(".ingress_metadata") ingress_metadata_t ingress_metadata;
    @flexible bit<1> do_egr_mirroring;
}

// New types, and names for stack types.
@p4runtime_translation("p4.org/psa/v1/PortId_t", 32)
type bit<9> PortId_t;
typedef annotated_t[4] annotated_stack_t;

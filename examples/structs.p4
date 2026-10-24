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

action multicast_inbound() {
    hdr.sidecar.sc_code = 4;
    hdr.sidecar.sc_ingress = (bit<16>) meta.in_port;
    hdr.sidecar.sc_egress = (bit<16>) ig_tm_md.ucast_egress_port;
    hdr.sidecar.sc_ether_type = hdr.ethernet.ether_type;
    hdr.sidecar.sc_payload = 0;
    hdr.sidecar.setValid();
    hdr.ethernet.ether_type = ETHERTYPE_SIDECAR;
    meta.routed = false;
    meta.service_routed = true;
    ig_tm_md.ucast_egress_port = USER_SPACE_SERVICE_PORT;
    meta.multicast = true;
}

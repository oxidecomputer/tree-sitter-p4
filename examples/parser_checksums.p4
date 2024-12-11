parser IngressParser(
    packet_in pkt,
	out sidecar_headers_t hdr,
	out sidecar_ingress_meta_t meta,
	out ingress_intrinsic_metadata_t ig_intr_md)
{
	Checksum() ipv4_checksum;
	Checksum() icmp_checksum;
	Checksum() nat_checksum;
}

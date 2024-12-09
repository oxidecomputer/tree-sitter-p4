control Services(
	inout sidecar_headers_t hdr,
	inout sidecar_ingress_meta_t meta,
	inout ingress_intrinsic_metadata_for_deparser_t ig_dprsr_md,
	inout ingress_intrinsic_metadata_for_tm_t ig_tm_md)
{
	Counter<bit<32>, bit<8>>(SVC_COUNTER_MAX, CounterType_t.PACKETS) service_ctr;
}

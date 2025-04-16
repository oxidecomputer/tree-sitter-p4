bool validate_ipv4_mcast_mac(
    in mac_addr_t mac_addr,
    in ipv4_addr_t ipv4_addr
) {
	// First byte should be 0x01
	bit<8> mac_validate1 = mac_addr[47:40];
	// Second byte should be 0x00
	bit<8> mac_validate2 = mac_addr[39:32];
	// Third byte should be 0x5e
	bit<8> mac_validate3 = mac_addr[31:24];
	// Fourth byte should match IP[23:16] & 0x7f
	bit<8> mac_validate4 = mac_addr[23:16];
	// Extract just the lower 7 bits from the second octet
	bit<7> ipv4_lower7 = ipv4_addr[22:16];
}

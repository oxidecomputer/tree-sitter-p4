/*
 * A sample P4-16 program covering the constructs the Topiary queries format.
 */
#include <core.p4>
#include <v1model.p4>

#define MAX_HOPS 8

const bit<16> TYPE_IPV4=0x800;
const bit<8> TYPE_TCP=6;

typedef bit<9> egressSpec_t;
typedef bit<48> macAddr_t;
typedef tuple<bit<8>,bit<16>> pair_t;

header ethernet_t{
	macAddr_t dstAddr;
	macAddr_t srcAddr; // destination first, per the wire format
	bit<16> etherType;
}

header ipv4_t{
	bit<4> version;
	bit<8> ttl;
	bit<32> srcAddr;
	bit<32> dstAddr;
}

header options_t{
	varbit<320> options;
}

struct metadata{
	bit<14> ecmp_select;
}

struct headers{
	ethernet_t ethernet;
	ipv4_t ipv4;
}

extern packet_in{
	void extract<T >(out T headerLvalue);
	bit<32> length();
}

bit<8>ttl_of(in ipv4_t hdr){
    return;
}

parser MyParser(
    packet_in packet,
    out headers hdr,
    inout metadata meta,
) {
    state start{
        packet.extract(hdr.ethernet);
        transition select(hdr.ethernet.etherType){
            TYPE_IPV4:parse_ipv4;
            8w1..8w3:parse_ipv4;
            default:accept;
        }
    }

    state parse_ipv4 {
        packet.extract(hdr.ipv4);
        if(hdr.ipv4.version==4w4){ packet.extract(hdr.options); }
        transition accept;
    }
}

control MyIngress(inout headers hdr,inout metadata meta){
    Checksum()csum;

    action drop(){
        mark_to_drop();
    }

    action ipv4_forward(macAddr_t dstAddr,egressSpec_t port){
        hdr.ethernet.srcAddr=hdr.ethernet.dstAddr;
        hdr.ipv4.ttl=hdr.ipv4.ttl-1;
        meta.ecmp_select=hdr.ipv4.dstAddr[13:0];
        csum.run(
		hdr.ipv4.srcAddr,
		hdr.ipv4.dstAddr,
	);
        csum.run({hdr.ipv4.srcAddr,hdr.ipv4.dstAddr});
    }

    table ipv4_lpm{
        key={
            hdr.ipv4.dstAddr:lpm;
            hdr.ipv4.ttl:range;
        }
        actions={ipv4_forward;drop;NoAction;}
        size=1024;
        default_action=drop();
        const entries={
            (
              0xC0A80000,
              1..64,
            ):ipv4_forward(0x001122334455,1);
        }
    }

    apply {
        if (hdr.ipv4.isValid()) {
            ipv4_lpm.apply();
        } else {
            drop();
        }
    }
}

package MySwitch(
    MyParser p,
    MyIngress ig,
);

V1Switch(
    MyParser(),
    MyIngress()
) main;

// Standard enum (no trailing comma)
enum Suits { Clubs, Diamonds, Hearts, Spades }

// Standard enum (with trailing comma)
enum Suits2 { Clubs, Diamonds, Hearts, Spades, }

// Annotated standard enum
@my_annotation
enum Suits3 { Clubs, Diamonds, Hearts, Spades, }

// Serializable enum (no trailing comma)
enum bit<16> EtherType {
    VLAN = 0x8100,
    QINQ = 0x9100,
    MPLS = 0x8847,
    IPV4 = 0x0800,
    IPV6 = 0x86dd
}

// Serializable enum (trailing comma)
enum bit<16> EtherType2 {
    VLAN = 0x8100,
    QINQ = 0x9100,
    MPLS = 0x8847,
    IPV4 = 0x0800,
    IPV6 = 0x86dd,
}

// Integer-based serializable enum
enum int<8> MyEnum {
    a = -42,
    b = 42,
}

// Initializers are compile-time-known expressions, not just literals
const bit<8> BASE = 8;
enum bit<8> Offsets {
    first  = BASE,
    second = BASE + 1,
    third  = 1 << 2,
}

// Annotated serializable enum
@name("EtherType")
enum bit<16> EtherType3 { IPV4 = 0x0800 }

// A serializable enum used as a header field
header eth_h {
    bit<48>   dst;
    bit<48>   src;
    EtherType ether_type;
}

// Underlying type given by a typedef, with width-suffixed initializers
typedef bit<9> PortId_t;
enum PortId_t PortIds {
    CPU  = 9w0,
    DROP = 9w511,
}

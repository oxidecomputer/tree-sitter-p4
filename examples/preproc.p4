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

header starship STARSHIP

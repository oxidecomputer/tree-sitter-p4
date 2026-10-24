header hdr {
    bit<8>  e;
    bit<16> t;
    bit<8>  l;
    bit<8>  r;
    bit<1>  v;
}

struct Header_t {
    hdr h;
}

struct Meta_t {}

struct standard_metadata_t {
    bit<16> egress_spec;
}

control ingress(
        inout Header_t h,
        inout Meta_t m,
        inout standard_metadata_t standard_meta
) {
    action index(bit<16> mask) {
        bit<16> csum = 0;
        bit<16> offset = 0;
        offset = csum & mask;
    }
    action a() { standard_meta.egress_spec = 16w0; }
    action a_with_control_params(bit<16> x) { standard_meta.egress_spec = x; }

    table t_exact_ternary {

        key = {
            h.h.e : exact;
            h.h.t : ternary;
        }

        actions = {
            a;
            a_with_control_params;
        }

        default_action = a;

        const entries = {
            (0x01, 0x1111 &&& 0xF   ) : a_with_control_params(1);
            (0x02, 0x1181           ) : a_with_control_params(2);
            (0x03, 0x1111 &&& 0xF000) : a_with_control_params(3);
            (0x04, 0x1211 &&& 0x02F0) : a_with_control_params(4);
            (0x04, 0x1311 &&& 0x02F0) : a_with_control_params(5);
            //TODO (0x06, _                ) : a_with_control_params(6);
        }
    }

}

// Constants and variables among a control's declarations.
control locals(inout Header_t h) {
    const bit<8> K = 1;
    bit<16> mask = 16w0xff;
    apply {
        h.h.t = mask;
    }
}

// Constructor parameters, one with a default value.
control sized(inout Header_t h)(bit<32> table_size, bit<32> meter_size = 1024) {
    apply { }
}

// A switch on the action a table ran, with a label that falls through.
control dispatch(inout Header_t h) {
    action a() { }
    action b() { }
    table t {
        actions = { a; b; NoAction; }
    }
    apply {
        switch (t.apply().action_run) {
            a: { h.h.e = 1; }
            b:
            NoAction: {
                h.h.e = 2;
            }
            default: { }
        }
    }
}

// An instance whose initializer defines a method.
control stateful(inout Header_t h) {
    Register<bit<32>, bit<32>>(1024) reg;
    RegisterAction<bit<32>, bit<32>, bit<32>>(reg) count = {
        void apply(inout bit<32> value, out bit<32> read_value) {
            read_value = value;
            value = value + 1;
        }
    };
    apply {
        count.execute(0);
    }
}

// Properties an architecture defines, beside the standard ones.
control profiled(inout Header_t h) {
    action a() { }
    table t {
        key = { h.h.e: exact; }
        actions = { a; }
        implementation = action_profile;
        idle_timeout = true;
        @name(".t_timeout") supports_timeout = true;
    }
    apply { t.apply(); }
}

// Entries kept in a separate file.
control included(inout Header_t h) {
    action a() { }
    table t {
        key = { h.h.e: exact; }
        actions = { a; }
        const entries = {
            #include "entries.p4"
        }
    }
    apply { t.apply(); }
}

// Annotated blocks.
control annotated_blocks(inout Header_t h) {
    action a() {
        @in_hash { h.h.e = h.h.e + 1; }
    }
    apply { }
}

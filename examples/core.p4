/*
 * This is core.p4
 */
extern packet_in {
    void extract<T>(out T headerLvalue);
    void extract<T>(out T variableSizeHeader, in bit<32> varFieldSizeBits);
    T lookahead<T>();
    bit<32> length();  // This method may be unavailable in some architectures
    void advance(bit<32> bits);
}

extern packet_out {
    void emit<T>(in T hdr);
}

// A stray semicolon after a declaration.
struct empty_t { };

// Match kinds an architecture adds, and a table that uses one.
match_kind {
    selector,
    dleft_hash,
}

control Selected(inout headers hdr) {
    action a() { }
    table t {
        key = { hdr.ethernet.etherType: selector; }
        actions = { a; }
    }
    apply { t.apply(); }
}

// Generic declarations with several type parameters.
parser GenericParser<H, M>(packet_in b, out H hdr, inout M meta);
control GenericControl<H, M>(inout H hdr, inout M meta);
package GenericSwitch<IH, IM>(GenericParser<IH, IM> p, GenericControl<IH, IM> c,);
GenericSwitch<h_t, m_t>(GenericParser(), GenericControl()) generic;
extern GenericRegister<T, I> {
    GenericRegister(bit<32> size);
    T read(in I index);
    void write<V>(in I index, in V value);
}

// Functions the target provides.
@name("drop")
extern void mark_to_drop();
extern bit<16> fold<T>(in T data);

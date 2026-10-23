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

// Generic declarations with several type parameters.
parser GenericParser<H, M>(packet_in b, out H hdr, inout M meta);
control GenericControl<H, M>(inout H hdr, inout M meta);
package GenericSwitch<IH, IM>(GenericParser<IH, IM> p, GenericControl<IH, IM> c,);
extern GenericRegister<T, I> {
    T read(in I index);
    void write<V>(in I index, in V value);
}

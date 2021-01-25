/*
 * Converts a field element (253 bits) to n 50-bit output elements where n <= 5
 * and n > 1
 */
template UnpackElement(n) {
    signal input in;
    signal output out[n];
    assert(n > 1);
    assert(n <= 5);

    // Computes the value of the 50 bits at position `pos` in `in`
    // - create 50 '1' bits
    // - shift left by pos
    // - AND with val
    // - shift right by pos
    signal results[n];
    for (var i = 0; i < n; i ++) {
        var ones = (1 << 50) - 1;
        var pos = (n - i - 1) * 50;
        results[i] <--
        (
            ((ones) << pos) & in
        ) >> pos;
    }

    // Check that the values in `results` are valid (since we used <-- above)
    signal check[n + 1];
    check[0] <== 0;
    for (var i = 0; i < n; i ++) {
        var pos = (n - i - 1) * 50;
        check[i+1] <-- check[i] + (results[i] << pos);
    }

    check[n] === in;

    // Assign results to the output
    for (var i = 0; i < n; i ++) {
        out[i] <== results[i];
    }
}
/*
const extract = (val: BigInt, pos: number): BigInt => {
    return BigInt(
        (
            (
                (BigInt(1) << BigInt(50)) - BigInt(1)
            ) << BigInt(pos)
        ) & BigInt(val)
    ) >> BigInt(pos)
}
*/

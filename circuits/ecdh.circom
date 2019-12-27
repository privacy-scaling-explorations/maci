include "./hasher.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/escalarmulfix.circom";

template EscalarMulFix_patch(n) {
  // Patch to fix EscalarMulFix
  // as BASE can't be a signal input
  signal input e[n];              // Input in binary format
  signal input BASE[2];
  signal output out[2];           // Point (Twisted format)

  var nsegments = (n-1)\246 +1;       // 249 probably would work. But I'm not sure and for security I keep 246
  var nlastsegment = n - (nsegments-1)*249;

  component segments[nsegments];

  component m2e[nsegments-1];
  component adders[nsegments-1];

  var s;
  var i;
  var nseg;
  var nWindows;

  for (s=0; s<nsegments; s++) {
    nseg = (s < nsegments-1) ? 249 : nlastsegment;
    nWindows = ((nseg - 1)\3)+1;

    segments[s] = SegmentMulFix(nWindows);

    for (i=0; i<nseg; i++) {
      segments[s].e[i] <== e[s*249+i];
    }

    for (i = nseg; i<nWindows*3; i++) {
      segments[s].e[i] <== 0;
    }

    if (s==0) {
      segments[s].base[0] <== BASE[0];
      segments[s].base[1] <== BASE[1];
    } else {
      m2e[s-1] = Montgomery2Edwards();
      adders[s-1] = BabyAdd();

      segments[s-1].dbl[0] ==> m2e[s-1].in[0];
      segments[s-1].dbl[1] ==> m2e[s-1].in[1];

      m2e[s-1].out[0] ==> segments[s].base[0];
      m2e[s-1].out[1] ==> segments[s].base[1];

      if (s==1) {
        segments[s-1].out[0] ==> adders[s-1].x1;
        segments[s-1].out[1] ==> adders[s-1].y1;
      } else {
        adders[s-2].xout ==> adders[s-1].x1;
        adders[s-2].yout ==> adders[s-1].y1;
      }
      segments[s].out[0] ==> adders[s-1].x2;
      segments[s].out[1] ==> adders[s-1].y2;
    }
  }

  if (nsegments == 1) {
    segments[0].out[0] ==> out[0];
    segments[0].out[1] ==> out[1];
  } else {
    adders[nsegments-2].xout ==> out[0];
    adders[nsegments-2].yout ==> out[1];
  }
}

template Ecdh() {
  // Note: private key
  // Needs to be hashed, and then pruned before
  // supplying it to the circuit
  signal private input private_key;
  signal input public_key[2];

  signal output shared_key;

  component privBits = Num2Bits(253);
  privBits.in <== private_key;

  component mulFix = EscalarMulFix_patch(253);
  mulFix.BASE[0] <== public_key[0];
  mulFix.BASE[1] <== public_key[1];

  for (var i = 0; i < 253; i++) {
    mulFix.e[i] <== privBits.out[i];
  }

  shared_key <== mulFix.out[0];
}

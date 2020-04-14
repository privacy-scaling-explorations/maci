# Kobi's script

import sys
from math import log, ceil

M = 128 # bit security

n = int(sys.argv[1]) # finite field size
t = int(sys.argv[2]) # width

N = n*t
print('N: %d' % N)

# interpolation
def check1(rf, rp):
  return rf + rp > log(2,5) * min(n, M)  + log(t, 2)

# grobner
def check2(rf, rp):
  return rf + rp > 0.21 * min(M, n)

def check3(rf, rp):
  return (t-1) * rf + rp > 0.14 * min(M, n) - 1

def cost(rf, rp):
  return t*rf + rp

minimal_rf = None
minimal_rp = None

for Rf in range(8,10):
  for Rp in range(0, 200):
    if check1(Rf, Rp) and check2(Rf, Rp) and check3(Rf, Rp):
        c = cost(Rf, Rp)
        if minimal_rf is None or minimal_rp is None or c < cost(minimal_rf, minimal_rp):
            minimal_rf = Rf
            minimal_rp = Rp
            print('Found new (Rf, Rp): (%d, %d), cost: %f' % (Rf, Rp, c))

print('Found minimal (Rf, Rp): (%d, %d), cost: %f, Rp with 7.5%% margin: %d' % (minimal_rf, minimal_rp, cost(minimal_rf, minimal_rp), ceil(1.075*minimal_rp)))

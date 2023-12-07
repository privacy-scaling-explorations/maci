import { arch } from "os";

/**
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => {
  return arch().includes("arm");
};

/*
 * https://github.com/iden3/snarkjs/issues/152
 * Need to cleanup the threads to avoid stalling
 */
export const cleanThreads = async () => {
  if (!globalThis) {
    return Promise.resolve(true);
  }

  const curves = ["curve_bn128", "curve_bls12381"];
  const promises = Promise.all(curves.map((curve) => globalThis[curve]?.terminate?.()).filter(Boolean));

  return promises;
};

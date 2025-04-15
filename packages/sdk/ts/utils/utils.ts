import fs from "fs";
import os from "os";

/**
 * Check if we are running on an arm chip
 * @returns whether we are running on an arm chip
 */
export const isArm = (): boolean => os.arch().includes("arm");

/**
 * Remove a file
 * @param filepath - the path to the file
 */
export const unlinkFile = async (filepath: string): Promise<void> => {
  const isFileExists = fs.existsSync(filepath);

  if (isFileExists) {
    await fs.promises.unlink(filepath);
  }
};

/**
 * Pause the thread for n milliseconds
 * @param ms - the amount of time to sleep in milliseconds
 */
export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

declare global {
  interface ITerminatable {
    terminate: () => Promise<unknown>;
  }

  // eslint-disable-next-line vars-on-top, no-var, camelcase
  var curve_bn128: ITerminatable | undefined;

  // eslint-disable-next-line vars-on-top, no-var, camelcase
  var curve_bls12381: ITerminatable | undefined;
}

/*
 * https://github.com/iden3/snarkjs/issues/152
 * Need to cleanup the threads to avoid stalling
 */
export const cleanThreads = async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!globalThis) {
    return;
  }

  const curves = ["curve_bn128", "curve_bls12381"];
  await Promise.all(
    curves.map((curve) => globalThis[curve as "curve_bn128" | "curve_bls12381"]?.terminate()).filter(Boolean),
  );
};

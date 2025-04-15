/* eslint-disable no-console */
import { task } from "hardhat/config";

import type { IStorageInstanceEntry, IVerifyFullArgs } from "../helpers/types";

import { logGreen, logMagenta, logYellow, warning } from "../../ts/logger";
import { ContractStorage } from "../helpers/ContractStorage";
import { ContractVerifier } from "../helpers/ContractVerifier";

/**
 * Main verification task which runs hardhat-etherscan task for all the deployed contract.
 */
task("verify-full", "Verify contracts listed in storage")
  .addFlag("force", "Ignore verified status")
  .setAction(async ({ force = false }: IVerifyFullArgs, hre) => {
    const storage = ContractStorage.getInstance();
    const verifier = new ContractVerifier(hre);
    const addressList: string[] = [];
    const entryList: IStorageInstanceEntry[] = [];
    let index = 0;

    const addEntry = (address: string, entry: IStorageInstanceEntry) => {
      if (!entry.verify) {
        return;
      }

      addressList.push(address);
      entryList.push(entry);
      index += 1;
    };

    const instances = storage.getInstances(hre.network.name);

    instances.forEach(([key, entry]) => {
      if (entry.id.includes("Poseidon")) {
        return;
      }

      addEntry(key, entry);
    });

    logMagenta({ text: "======================================================================" });
    logMagenta({ text: "======================================================================" });
    logMagenta({ text: `Verification batch with ${addressList.length} entries of ${index} total.` });
    logMagenta({ text: "======================================================================" });

    const summary: string[] = [];
    for (let i = 0; i < addressList.length; i += 1) {
      const address = addressList[i];
      const entry = entryList[i];

      const params = entry.verify;

      logMagenta({ text: "\n======================================================================" });
      logMagenta({ text: `[${i}/${addressList.length}] Verify contract: ${entry.id} ${address}` });
      logMagenta({ text: `\tArgs: ${params?.args}` });

      const verifiedEntity = storage.getVerified(address, hre.network.name);

      if (!force && verifiedEntity) {
        logYellow({ text: warning("Already verified") });
      } else {
        if (params?.impl) {
          // eslint-disable-next-line no-await-in-loop
          const [ok, err] = await verifier.verify(params.impl, "[]", params.name, params.libraries);

          if (ok) {
            storage.setVerified(params.impl, hre.network.name, true);
          } else {
            summary.push(`${params.impl} ${entry.id} implementation ${params.impl}: ${err}`);
          }
        }

        // eslint-disable-next-line no-await-in-loop
        const [ok, err] = await verifier.verify(
          address,
          params?.args ?? "[]",
          params?.name,
          params?.libraries,
          params?.impl,
        );

        if (ok) {
          storage.setVerified(address, hre.network.name, true);
        } else {
          summary.push(`${address} ${entry.id}: ${err}`);
        }
      }
    }

    logGreen({ text: "\n======================================================================" });
    logGreen({ text: `Verification batch has finished with ${summary.length} issue(s).` });
    logGreen({ text: "======================================================================" });
    logGreen({ text: summary.join("\n") });
    logGreen({ text: "======================================================================" });
  });

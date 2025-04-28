import type { IDownloadPollJoiningArtifactsBrowserArgs, IPollJoiningArtifacts } from "./types";

import { getPollJoiningArtifactsUrl } from "./utils";

/**
 * Read the chunks of a response
 *
 * @param response - The response to read the chunks from
 * @returns The chunks and the length
 */
const readChunks = async (reader: ReadableStreamDefaultReader<Uint8Array>): Promise<Uint8Array> => {
  let result = await reader.read();

  const chunks: Uint8Array[] = [];
  let length = 0;

  while (!result.done) {
    const { value } = result;

    length += value.length;
    chunks.push(value as unknown as Uint8Array);

    // continue reading
    // eslint-disable-next-line no-await-in-loop
    result = await reader.read();
  }

  const { acc: obj } = chunks.reduce(
    ({ acc, position }, chunk) => {
      acc.set(chunk, position);

      return { acc, position: position + chunk.length };
    },
    { acc: new Uint8Array(length), position: 0 },
  );

  return obj;
};

/**
 * Download the poll joining artifacts for the browser
 *
 * @param args - The arguments to download the poll joining artifacts for the browser
 * @returns The poll joining artifacts
 */
export const downloadPollJoiningArtifactsBrowser = async ({
  testing = false,
  stateTreeDepth,
}: IDownloadPollJoiningArtifactsBrowserArgs): Promise<IPollJoiningArtifacts> => {
  const { zKeyUrl, wasmUrl } = getPollJoiningArtifactsUrl(testing, stateTreeDepth);

  const [zKeyResponse, wasmResponse] = await Promise.all([fetch(zKeyUrl), fetch(wasmUrl)]);

  const zKeyReader = zKeyResponse.body?.getReader();
  const wasmReader = wasmResponse.body?.getReader();

  if (!zKeyReader || !wasmReader) {
    throw new Error("Failed to read zKey or wasm");
  }

  const [zKey, wasm] = await Promise.all([readChunks(zKeyReader), readChunks(wasmReader)]);

  return { zKey, wasm };
};

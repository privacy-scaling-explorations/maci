/* eslint-disable */

export function process(sourceText) {
  return {
    code: sourceText.replace("#!/usr/bin/env node", ""),
  };
}

export default {
  process,
};

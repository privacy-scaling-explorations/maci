/* eslint-disable */

module.exports = {
  process(sourceText) {
    return {
      code: sourceText.replace("#!/usr/bin/env node", ""),
    };
  },
};

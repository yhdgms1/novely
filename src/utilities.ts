import { UAParser } from "ua-parser-js";

const getDeviceType = (() => {
  let type: UAParser.IDevice['type'] | 'desktop';

  return () => {
    if (!type) {
      type = new UAParser().getDevice().type || 'desktop';
    }

    return type;
  }
})();

export { getDeviceType }

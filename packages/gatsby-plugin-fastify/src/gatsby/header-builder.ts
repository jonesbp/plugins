import compose from "just-compose";
import merge from "just-merge";
import typeOf from "just-typeof";

import { SECURITY_HEADERS, CACHING_HEADERS, IMMUTABLE_CACHING_HEADER } from "../utils/constants";
import type { PluginData } from "../utils/plugin-data";
import type { GatsbyFastifyPluginOptions } from "../utils/config";
import { HeadersOption } from "../utils/headers";

function deepMerge(...headers: HeadersOption[]) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return headers.reduce((accumulator, header) => {
    for (let [key, value] of Object.entries(header)) {
      // console.log(typeOf(value));
      //merge needs empty object to prevent overwriting of references use across multiple routes
      accumulator[key] =
        accumulator.hasOwnProperty(key) && typeOf(value) === `object`
          ? merge({}, accumulator[key], value)
          : value;
    }
    return accumulator;
  }, {});
}

// program methods
const applySecurityHeaders =
  ({ mergeSecurityHeaders }: GatsbyFastifyPluginOptions) =>
  (headers: HeadersOption) => {
    if (!mergeSecurityHeaders) {
      return headers;
    }

    return deepMerge(SECURITY_HEADERS, headers);
  };

const applyCachingHeaders =
  (pluginData: PluginData, { mergeCacheHeaders }: GatsbyFastifyPluginOptions) =>
  (headers: HeadersOption) => {
    if (!mergeCacheHeaders) {
      return headers;
    }

    let chunks: string[] = [];
    // Gatsby v3.5 added componentChunkName to store().components
    // So we prefer to pull chunk names off that as it gets very expensive to loop
    // over large numbers of pages.
    const isComponentChunkSet = !!pluginData.components.entries()?.next()?.value[1]
      ?.componentChunkName;
    chunks = isComponentChunkSet
      ? [...pluginData.components.values()].map((c) => c.componentChunkName)
      : [...pluginData.pages.values()].map((page) => page.componentChunkName);

    chunks.push(`polyfill`, `app`);

    const files = chunks.flatMap((chunk) => pluginData.manifest[chunk]);

    const cachingHeaders: HeadersOption = {};

    for (const file of files) {
      if (typeof file === `string`) {
        cachingHeaders[`/` + file] = IMMUTABLE_CACHING_HEADER;
      }
    }
    return deepMerge(cachingHeaders, CACHING_HEADERS, headers);
  };

export function buildHeadersProgram(
  pluginData: PluginData,
  pluginOptions: GatsbyFastifyPluginOptions
) {
  return compose(
    applySecurityHeaders(pluginOptions),
    applyCachingHeaders(pluginData, pluginOptions)
  )(pluginOptions.headers);
}

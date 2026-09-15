// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// --- Apollo Client 4 + tslib interop ---
// Apollo Client 4 ships dual CJS/ESM via `package.json#exports`. Its
// compiled output requires `tslib` with the assumption that `tslib`
// will resolve to its CJS variant (top-level `__importStar`,
// `__extends`, etc on the exports object).
//
// Metro auto-adds the `import` condition for ESM imports, so when an
// Apollo ESM file pulls in tslib, Metro picks tslib's `import` branch
// (`tslib.es6.mjs`) — which has no `default` export. That causes:
//   Cannot destructure property '__extends' of 'tslib.default' as it
//   is undefined.
//
// `unstable_conditionNames` alone can't fix this because Metro merges
// the auto-injected `import` condition on top of our list. The most
// reliable fix is to alias `tslib` directly at the resolver level so
// every consumer — ESM or CJS, web or native — gets the CJS file.
const tslibCjs = path.dirname(require.resolve("tslib/package.json"));
const tslibCjsEntry = path.join(tslibCjs, "tslib.js");

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  "require",
  "react-native",
  "default",
];

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return { filePath: tslibCjsEntry, type: "sourceFile" };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

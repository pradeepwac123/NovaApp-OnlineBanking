require("ts-node").register({
  project: "tsconfig.seed.json",
  transpileOnly: true,
});

require("./seed.ts");

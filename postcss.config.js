import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Force a CJS config load (most compatible across loaders).
export default require("./postcss.config.cjs");

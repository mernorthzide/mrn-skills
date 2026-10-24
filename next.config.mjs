// Static export: Cloudflare Workers serves out/ as static assets (see wrangler.jsonc).
// globalNotFound: the site has one root layout per language, so the 404 page needs its own <html>.
export default { output: "export", trailingSlash: true, experimental: { globalNotFound: true } };

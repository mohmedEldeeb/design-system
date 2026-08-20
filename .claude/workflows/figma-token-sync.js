export const meta = {
  name: 'figma-token-sync',
  description: 'Pull fresh variables from the Figma design-system file, rebuild the Style Dictionary token pipeline, verify the Storybook token preview, and sync the results onto the Mac at /Volumes/BasharSoft/design-system.',
  whenToUse: 'Run this after adding/changing variables in the "Micro Design System 1.0" Figma file. Pass Figma node IDs in args.nodes to pull new/changed sections; omit them to just rebuild + verify whatever is already in tokens/figma-raw/ and re-sync it to the device.',
  phases: [
    { title: 'Fetch from Figma', detail: 'Pull variable definitions for the given node(s) into tokens/figma-raw/' },
    { title: 'Build', detail: 'npm run tokens:sync — merge raw dumps, run Style Dictionary' },
    { title: 'Verify', detail: 'Build Storybook and screenshot the Design Tokens story to confirm it renders' },
    { title: 'Sync to device', detail: 'Push changed token files to /Volumes/BasharSoft/design-system and commit' },
  ],
}

// -----------------------------------------------------------------------
// This workflow does its actual work (npm, Style Dictionary, Storybook,
// Playwright) in the fast cloud project copy at PROJECT_DIR — that's where
// node_modules, a working Playwright/Chromium install, and no execution
// timeouts live. The last phase then pushes the results (tokens/figma-raw,
// tokens/tokens.json, dist/**) onto the actual Mac via the device bridge
// and commits them there. Component/source edits should go straight to
// the device per the project's convention; this workflow only touches
// generated/synced token files.
//
// args (all optional):
//   {
//     fileKey: "VoUG7CDdw0kGwsfJslEyct",      // defaults to the project's Figma file
//     nodes: [{ nodeId: "12502:26758", label: "text-color-tokens" }, ...],
//     skipDeviceSync: false,                   // set true to only build/verify in the cloud copy
//   }
// Omit `nodes` entirely to skip the Figma fetch and just rebuild + verify
// whatever is currently in tokens/figma-raw/.
// -----------------------------------------------------------------------

const PROJECT_DIR = '/root/design-system'
const DEVICE_DIR = '$HOME/mnt/BasharSoft/design-system'
const FILE_KEY = (args && args.fileKey) || 'VoUG7CDdw0kGwsfJslEyct'
const NODES = (args && args.nodes) || []
const SKIP_DEVICE_SYNC = !!(args && args.skipDeviceSync)

phase('Fetch from Figma')
let fetchSummary = 'Skipped — no Figma node IDs were passed in args.nodes.'
if (NODES.length > 0) {
  const nodeList = NODES.map((n) => `- nodeId "${n.nodeId}" -> tokens/figma-raw/${n.label}.json`).join('\n')
  fetchSummary = await agent(
    `Work inside ${PROJECT_DIR} (a Figma variables -> Style Dictionary -> CSS/Tailwind token pipeline; cd there first). ` +
      `tokens/figma-raw/*.json already holds prior raw dumps you can use as a reference for the expected JSON shape (flat "figma/variable/name": "value" objects, exactly as returned by the Figma MCP get_variable_defs tool).\n\n` +
      `Figma file key: ${FILE_KEY}\n\n` +
      `For each of the following, call the Figma MCP tool get_variable_defs with { fileKey: "${FILE_KEY}", nodeId } and write the raw JSON result verbatim (pretty-printed) to the given path inside ${PROJECT_DIR}, overwriting if it exists:\n${nodeList}\n\n` +
      `If get_variable_defs errors with something like "nothing selected", it means the Figma desktop app connection needs an initial selection — try calling it a second time, and if it still fails after 2 tries, report the failure clearly instead of fabricating data.\n\n` +
      `After writing the files, report: which files you wrote, and — by comparing against the previous raw dump for files that already existed — a short bullet list of any token names that are new or changed (added key, or same key with a different color/value).`,
    { phase: 'Fetch from Figma' }
  )
  log(fetchSummary.split('\n')[0])
}

phase('Build')
const buildSummary = await agent(
  `cd ${PROJECT_DIR} and run \`npm run tokens:sync\` (this runs scripts/build-source-tokens.js to merge tokens/figma-raw/*.json into tokens/tokens.json, then style-dictionary.config.js to regenerate dist/css/variables.css, dist/json/tailwind-tokens.json, and dist/json/tokens.json).\n\n` +
    `Report the full command output. If it fails, read the error, inspect the offending file under tokens/figma-raw/ or tokens/tokens.json, fix an obvious problem if there is one (e.g. malformed JSON from a bad paste), and re-run once. Do not touch style-dictionary.config.js or scripts/build-source-tokens.js unless the failure is clearly caused by a bug in them and you're confident about the fix — if unsure, stop and report the error instead of guessing.\n\n` +
    `Finish by confirming dist/css/variables.css, dist/json/tailwind-tokens.json, and dist/json/tokens.json all have a fresh modification time from this run, and state PASS or FAIL.`,
  { phase: 'Build' }
)
log(buildSummary.includes('FAIL') ? 'Build step reported a failure — check the log.' : 'Token build completed.')

phase('Verify')
const verifySummary = await agent(
  `cd ${PROJECT_DIR} (React + Tailwind + Storybook, tokens generated by Style Dictionary). Verify the Storybook token preview still works after the token rebuild:\n\n` +
    `1. Run \`npx storybook build\` (if it prompts about anonymous telemetry, pipe/answer "n"). Confirm it exits successfully with no build errors.\n` +
    `2. Serve the storybook-static/ output on a free local port (e.g. \`python3 -m http.server <port>\` from that directory, backgrounded) and use Playwright (chromium at /opt/pw-browsers/chromium) to open ` +
    '`http://localhost:<port>/iframe.html?id=foundations-design-tokens--all-tokens&viewMode=story`' +
    `, wait for network idle, and take a full-page screenshot to /tmp/figma-token-sync-verify.png.\n` +
    `3. Inspect the screenshot / page content for a visible error banner (text like "ReferenceError", "is not defined", "failed to render"). If present, this is a FAIL — describe the exact error.\n` +
    `4. Stop the local server when done.\n\n` +
    `Report PASS or FAIL and a one-line reason either way.`,
  { phase: 'Verify' }
)
log(verifySummary.includes('FAIL') ? 'Verification found a problem — check the log.' : 'Storybook token preview verified OK.')

phase('Sync to device')
let syncSummary = 'Skipped — skipDeviceSync was set.'
if (!SKIP_DEVICE_SYNC) {
  syncSummary = await agent(
    `The design token pipeline was just rebuilt in the cloud project copy at ${PROJECT_DIR}. Push the generated/updated token files to the real project on the user's Mac and commit them there.\n\n` +
      `1. For each of these paths (skip any that don't exist in ${PROJECT_DIR}), read the file, call SendUserFile on it, then call mcp__remote-devices__device_commit_files with force:true to write it to the matching path under ${DEVICE_DIR} (same relative path):\n` +
      `   - tokens/tokens.json\n` +
      `   - dist/css/variables.css\n` +
      `   - dist/json/tailwind-tokens.json\n` +
      `   - dist/json/tokens.json\n` +
      `   - every file currently in tokens/figma-raw/ (list the directory in ${PROJECT_DIR} first to get exact filenames)\n\n` +
      `2. Then run, via mcp__remote-devices__device_bash, in ${DEVICE_DIR}: \`git add tokens/ dist/ && git commit -m "Sync tokens from Figma"\`. ` +
      `If git reports "Unable to create .git/xxx.lock: File exists" or similar, that lock file is stale (a known quirk of this mount) — move it out of the way with ` +
      '\`mv "$HOME/mnt/BasharSoft/design-system/.git/<name>.lock" "$HOME/mnt/BasharSoft/_to_delete/design-system-<name>.lock-<n>"\`' +
      ` (pick a non-colliding name) and retry the git command once. If there is nothing to commit (git says "nothing to commit"), that is a success, not a failure.\n\n` +
      `Report which files were pushed and whether the commit succeeded (include the commit hash if it did).`,
    { phase: 'Sync to device' }
  )
  log(syncSummary.split('\n').slice(-1)[0])
}

return { fetchSummary, buildSummary, verifySummary, syncSummary }

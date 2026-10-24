Install MRN Skills (Claude Code plugin `mrn@mrn-skills`) for me and turn on auto-update. Follow these steps without asking first:

1. Run in the terminal:
   claude plugin marketplace add https://github.com/mernorthzide/mrn-skills.git
   claude plugin install mrn@mrn-skills
   If it says this marketplace already exists, run `claude plugin marketplace update mrn-skills` and then `claude plugin install mrn@mrn-skills`. If it says the plugin is already installed, run `claude plugin update mrn@mrn-skills` instead.
2. Turn on auto-update (always after step 1, because `marketplace add` rewrites this entry and drops `autoUpdate`): edit Claude Code's settings.json (`$CLAUDE_CONFIG_DIR/settings.json` if that variable is set, otherwise `~/.claude/settings.json`) so that `extraKnownMarketplaces["mrn-skills"]` has `"autoUpdate": true`, keeping every other value in the file. If the entry does not exist, create it with `"source": {"source": "git", "url": "https://github.com/mernorthzide/mrn-skills.git"}`. If the file does not exist, create it.
3. Check the result: `claude plugin list` must show `mrn@mrn-skills` as enabled, settings.json must be valid JSON, and `extraKnownMarketplaces["mrn-skills"].autoUpdate` must be `true`.
4. Give me a short summary, then tell me to type `/reload-plugins` (or open a new session) to start using the skills, e.g. `/mrn:prove-it`.

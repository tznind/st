# ST

This is a _partial_ [stonetop](https://www.kickstarter.com/projects/1735046512/stonetop) implementation of [PbtA-style](https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse?utm_source=chatgpt.com) character sheets.

It is online at https://tznind.github.io/st/cs.html

See https://github.com/tznind/lc for main template repository.

You can read more about Powered by the Apocalypse, including their permissive license terms, here:

https://lumpley.games/2023/11/22/what-is-pbta/

## Sync changes

If after using the template, if find new features have been added that you want to sync into your repository run the following to sync changes:

```
git remote add upstream https://github.com/tznind/lc
git fetch upstream

git checkout main
git merge upstream/main --allow-unrelated-histories
```

(for merge conflicts e.g. in data folder - always keep your own changes and discard incoming)

## Running Locally

To run the page locally (i.e. not in GitHub Pages) you can use any of:

```powershell
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP  
php -S localhost:8000
```

Then visit `http://localhost:8000/cs.html`

### Adding New Roles

To add a new role with moves:

1. Create a JSON file in `data/moves/` (e.g., `data/moves/new-role.json`)
2. Add the role to `data/availability.json` with a `_movesFile` property:

```json
"New Role": {
  "_movesFile": "data/moves/new-role.json",
  "move1": true,
  "move2": false
}
```

The system will automatically load the moves file and make the role available.


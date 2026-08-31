# LC
This repository is a template for building interactive [PbtA-style](https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse?utm_source=chatgpt.com) character sheets.

## Live Character Sheet

Players can create their own characters, choose skills etc. Data is saved only into the address bar (URL) - allowing sharing/saving for later e.g. as a bookmark.

Showcases (GitHub Pages):
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Demo Site](https://tznind.github.io/lc/cs.html)
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Stonetop](https://tznind.github.io/st/cs.html) ([Source](https://github.com/tznind/st))
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Uncharted Worlds](https://tznind.github.io/uw/cs.html) ([Source](https://github.com/tznind/uw))
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Apocalypse World](https://tznind.github.io/aw/cs.html) ([Source](https://github.com/tznind/aw))
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Dungeon World](https://tznind.github.io/dw/cs.html) ([Source](https://github.com/tznind/dw))
- [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Dungeon World 2 (Beta)](https://tznind.github.io/dw2/cs.html) ([Source](https://github.com/tznind/dw2))
-  [<img width="12" height="12" alt="GitHub logo" src="https://github.com/user-attachments/assets/d45893e9-0b26-4259-8764-a9737ee1426e" /> Monster of the Week](https://tznind.github.io/mw/cs.html) ([Source](https://github.com/tznind/mw))


<a href="https://tznind.github.io/lc/cs.html?name=Captain+Inigo+Montoya&prophecy-value=8&player=Thomas&role=Navigator&mettle=%2B1&conviction=2&track_stat_prophecy=2&move_d4e5f6=1&track_stat_physique=3">
<img src="https://github.com/user-attachments/assets/cff39bd9-d28d-495a-a958-eb86240389ed"/>
</a>

## Creating Moves

Moves are designed for flexibility and ease writing. Simply enter moves into the json file and add to the availability map to relevant role(s).

<a href="https://github.com/tznind/st/tree/main/data/moves"/>
<img src="https://github.com/user-attachments/assets/d8efa576-ee04-4549-9699-ae3caa280952"/>
</a>

_All moves are defined in json files with schemas for helpful autocompletion_

## Getting Started

To create your own game system:

- Create a new repository using this template

<img width="132" height="82" alt="GitHub template button" src="https://github.com/user-attachments/assets/6c97f925-6db8-4687-ba26-101705bf736e" />

- Update the JSON files in the [data](./data) folder with your content.  
- Enable **GitHub Pages** in your repository settings (Settings=>Pages).
- Visit your sheet at:  

```
https://your_name.github.io/your_repository_name/cs.html
```

### Cookbook

For more detailed description of how to create various types of moves see [Cookbook.md](./Cookbook.md)

### Url Length 
There is a maximum url Length of ~8000 characters.  This is enforced by GitHub Pages. In practice, you should not reach this unless you have a large number of free text inputs into which your players add a lot of text. 

See [LIMITATIONS.md](./LIMITATIONS.md) for details.

## Powered by the Apocalypse

You can read more about Powered by the Apocalypse, including their permissive license terms, here:

https://lumpley.games/2023/11/22/what-is-pbta/
The system will automatically load the moves file and make the role available.


## Sync changes

If after using the template, if find new features have been added that you want to sync into your repository run the following to sync changes:

```
git remote add upstream https://github.com/tznind/lc
git fetch upstream

git checkout main
git merge upstream/main --allow-unrelated-histories
```

(for merge conflicts e.g. in data folder - always keep your own changes and discard incoming)

## Testing Locally

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

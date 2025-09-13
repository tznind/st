# LC
This repository is a template for building interactive [PbtA-style](https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse?utm_source=chatgpt.com) character sheets.




<a href="https://tznind.github.io/lc/cs.html?role=Lord+Commander&mettle=%2B1&physique=-1&influence=%2B2&expertise=0&conviction=%2B1&name=Selene+Vortrix&player=Thomas&move_l1a2b3=1&move_lc001_1=1&move_lc001_2=0&takefrom_adapt1_role=Mech+Adept&move_adapt1=1&takefrom_adapt1_move=85757e&move_85757e_1=1&move_85757e_2=0&move_85757e_3=0&move_85757e_pick_1=1&move_85757e_pick_2=1">
<img width="478" height="286" alt="image" src="https://github.com/user-attachments/assets/02a1f67c-de79-4e7e-a043-8e90e0f645f2" />
</a>

_Click the image above to try out a live example on GitHub Pages, or use the link below:_

```
https://tznind.github.io/lc/cs.html?role=Lord+Commander&mettle=%2B1&physique=-1&influence=%2B2&expertise=0&conviction=%2B1&name=Selene+Vortrix&player=Thomas
```

## Features

### State stored in the URL
Any changes you make to a sheet are automatically reflected in the page’s URL.  
This means your players can:

- Bookmark or save the URL to preserve a character’s state.  
- Share the URL with others so they can see the same sheet.  

Each player can track their own sheet independently by keeping their own link.

## Create your own

To make your own rule set with custom moves and roles:

1. Create a new repository from this template:  

   <img width="264" height="163" alt="GitHub template button" src="https://github.com/user-attachments/assets/6c97f925-6db8-4687-ba26-101705bf736e" />

2. Update the JSON files in the `data/` folder with your content.  
3. Enable **GitHub Pages** in your repository settings (Settings=>Pages).  
4. Visit your sheet at:  

```
https://your_name.github.io/your_repository_name/cs.html
```

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


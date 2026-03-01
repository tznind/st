# Modules System

Modules provide optional content that users can opt into. They allow you to add new moves, roles, and cards without modifying the base game data.

## Enabling Modules

Users enable modules via the **🧩 button** in the character sheet UI, which shows a popup with checkboxes for available modules. Changes require a page reload to take effect.

Modules can also be enabled via URL parameters:
- Checkbox style: `cs.html?module_example-module=1`
- Multiple modules: `cs.html?module_example-module=1&module_another-module=1`
- Legacy style: `cs.html?module=example-module` or `cs.html?module=id1,id2`

## Creating a Module

### 1. Register the Module

Add your module to `data/modules.json`:

```json
{
  "modules": [
    {
      "id": "my-module",
      "name": "My Module",
      "description": "Adds new moves and features",
      "path": "data/modules/my-module"
    }
  ]
}
```

### 2. Create the Module Folder

Create a folder structure that mirrors `/data`:

```
data/modules/my-module/
├── availability.json
├── moves/
│   └── everyone.json
└── cards/
    └── my-card/
        ├── card.json
        └── card.html
```

### 3. Define Module Availability

Create `availability.json` in your module folder. This follows the same format as the main `data/availability.json`:

```json
{
  "Everyone": {
    "_movesFile": "data/modules/my-module/moves/everyone.json",
    "my-new-move": false
  }
}
```

## What Modules Can Add

### New Moves to Existing Roles

Add moves to any existing role (including "Everyone" for universal moves):

```json
{
  "Everyone": {
    "_movesFile": "data/modules/my-module/moves/everyone.json",
    "module-move-1": false,
    "module-move-2": true
  },
  "Navigator": {
    "_movesFile": "data/modules/my-module/moves/navigator.json",
    "special-nav-move": false
  }
}
```

The module's `_movesFile` is added to the role's move files and loaded alongside the base moves.

### New Roles

Define entirely new roles that only appear when the module is enabled:

```json
{
  "Psyker": {
    "_movesFile": "data/modules/my-module/moves/psyker.json",
    "description": "A psychic warrior with dangerous powers.",
    "cards": ["psyker-powers"],
    "mind-blast": false,
    "warp-shield": true
  }
}
```

### New Cards

Add cards to existing or new roles:

```json
{
  "Lord Commander": {
    "cards": ["module-special-card"]
  }
}
```

Cards are merged with existing cards - if the base role has `cards: ["ship"]` and your module adds `cards: ["new-card"]`, the result is `cards: ["ship", "new-card"]`.

## Multi-Language Support

Modules support the same translation system as base data. Create translated versions by mirroring the module structure under `data/{lang}/`:

```
data/
├── modules/
│   └── my-module/
│       ├── availability.json      (English)
│       └── moves/
│           └── everyone.json      (English)
└── es/
    └── modules/
        └── my-module/
            ├── availability.json  (Spanish - optional)
            └── moves/
                └── everyone.json  (Spanish - optional)
```

The system automatically tries `data/{lang}/modules/...` first, then falls back to `data/modules/...`.

## Example Module

Here's a complete example module that adds a test move to all characters:

**data/modules.json:**
```json
{
  "modules": [
    {
      "id": "example-module",
      "name": "Example Module",
      "description": "An example module that adds new moves to Everyone role",
      "path": "data/modules/example-module"
    }
  ]
}
```

**data/modules/example-module/availability.json:**
```json
{
  "Everyone": {
    "_movesFile": "data/modules/example-module/moves/everyone.json",
    "module-test-move": false
  }
}
```

**data/modules/example-module/moves/everyone.json:**
```json
[
  {
    "id": "module-test-move",
    "title": "Module Test Move (+Mettle)",
    "description": "This is a test move added by the example module.",
    "category": "Module Moves",
    "outcomes": [
      {
        "range": "≥ 10",
        "text": "Full success!",
        "bullets": []
      },
      {
        "range": "7–9",
        "text": "Partial success.",
        "bullets": []
      },
      {
        "range": "≤ 6",
        "text": "Failure."
      }
    ]
  }
]
```

## Technical Details

### How Merging Works

When a module is loaded:

1. **Availability maps** are merged per-role:
   - Existing roles: module properties are added/merged
   - New roles: added directly to the available roles
   - `_movesFile` paths are collected into `_movesFiles` array
   - `cards` arrays are merged (no duplicates)

2. **Move files** are loaded from both base `_movesFile` and module `_movesFiles`

3. **Move availability flags** (true/false) are merged - module can add new move IDs

### URL Parameter Format

The modules UI uses checkbox-style URL parameters:
- `module_{id}=1` - module is enabled
- Parameter absent - module is disabled

This integrates with the existing persistence system, so checkbox states are automatically saved/restored.

### API

The `JsonLoader` module exposes:
- `getEnabledModules()` - returns array of enabled module IDs
- `loadModulesConfig()` - loads and caches `data/modules.json`

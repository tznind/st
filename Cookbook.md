# Cookbook

This comprehensive guide covers creating roles, moves, and cards for the character sheet system.

All changes can be acomplished by modifying the [data](./data) directory and/or the main [cs.html](./cs.html) page.  Core javascript code of the application should not be modified.

## Table of Contents
- [Events System](#events-system)
- [Help Buttons](#help-buttons)
- [Customizing Stats](#customizing-stats)
  - [Modifying Stats](#modifying-stats)
  - [Stat Shapes](#stat-shapes)
  - [Stat Track Counters](#stat-track-counters)
  - [Clock Stats](#clock-stats)
- [Creating Roles](#creating-roles)
  - [Role Descriptions](#role-descriptions)
- [Text Formatting](#text-formatting)
  - [Bullet Lists](#bullet-lists)
  - [Glossary Terms](#glossary-terms)
  - [Aliases](#aliases)
  - [Using `data-format-text` Attribute](#using-data-format-text-attribute)
- [Basic Moves](#basic-moves)
- [Advanced Move Types](#advanced-move-types)
  - [Pick One Moves (Radio Buttons)](#pick-one-moves-radio-buttons)
  - [Pick Multiple Moves (Checkboxes)](#pick-multiple-moves-checkboxes)
  - [Take From Other Roles](#take-from-other-roles)
  - [Move Categories](#move-categories)
    - [Category Display Order](#category-display-order)
  - [Hidden Checkbox Moves](#hidden-checkbox-moves)
  - [Track Counter Moves](#track-counter-moves)
  - [Submoves](#submoves)
  - [Moves That Grant Cards](#moves-that-grant-cards)
- [Cards System](#cards-system)
  - [Everyone System - Universal Cards and Moves](#everyone-system---universal-cards-and-moves)
- [Multi-Language Support](#multi-language-support)
- [Validation and Error Detection](#validation-and-error-detection)

---

## Events System

The application provides a global event system (`AppEvents`) for hooking into application lifecycle.

### Basic Usage

```javascript
// Listen for initialization complete
AppEvents.on('initializationComplete', function() {
    console.log('App is ready!');
    // Your custom code here
});
```

**Key feature:** If you register after an event already fired, your callback runs immediately. This prevents race conditions during initialization.

### Available Events

- **`initializationComplete`**: Fires when the app finishes loading (roles, moves, cards, URL state)

You can add event listeners in your `cs.html` page or in custom card JavaScript files.

---

## Help Buttons

Add contextual help anywhere in your HTML with automatic popup modals:

```html
<button type="button" class="help-icon"
        data-help-title="Weakened"
        data-help-text="Disadvantage on Strength and Dexterity">?</button>
```

The system automatically handles clicks, keyboard (Escape to close), and display.

Title and help data attributes support [Text Formatting](#text-formatting) notation including [Terms](#glossary-terms),[bullet lists](#bullet-lists), italics etc.

---

## Customizing Stats

Each game system typically has its own set of character statistics. The example system uses five core stats, but you can customize these for your own game.

### Modifying Stats

Stats are defined in [stats.json](./data/stats.json). Each stat has an `id` (used internally) and a `title` (displayed to players):

```json
[
  {
    "id": "mettle",
    "title": "METTLE"
  },
  {
    "id": "physique", 
    "title": "PHYSIQUE"
  },
  {
    "id": "influence",
    "title": "INFLUENCE"
  },
  {
    "id": "expertise",
    "title": "EXPERTISE"
  },
  {
    "id": "conviction",
    "title": "CONVICTION"
  }
]
```

### Stat Shapes

Stats can use different visual shapes by setting the `shape` property:

- **hexagon** (default): Traditional hexagonal stat boxes
- **square**: Square stat boxes with rough edges
- **clock**: Visual clock faces for tracking progress (requires `clock` configuration)
- **double-up**: Two half-height rectangles stacked vertically for tracking two related stats

#### Double-Up Stats

**When to use:** For tracking two closely related stats in the same space (like Armor/HP, Stress/Resolve, etc.).

```json
{
  "id": "armourhp",
  "title": "Armour,Hp",
  "shape": "double-up"
}
```

**Key Features:**
- `title` must be comma-delimited with exactly two values (e.g., "Armour,Hp")
- Creates two separate input fields, each with half height
- Each stat shows its name as placeholder text (in grey) inside its box
- First stat name appears as a label between the two boxes
- Second stat name appears as a label below the entire container
- Each input has independent focus highlighting
- IDs are auto-generated as `{id}_top` and `{id}_bottom`
- Same size as square stats (100px), fitting neatly in the stat row

### Stat Track Counters

**When to use:** For stats that have associated resources that need tracking (like Armor, Wounds, Focus, etc.).

Stats can include track counters that appear below the stat hexagon. These work identically to move track counters and support multiple shapes.

```json
[
  {
    "id": "mettle",
    "title": "METTLE",
    "tracks": [
      {
        "name": "Armor",
        "max": 3,
        "shape": "hexagon"
      }
    ]
  },
  {
    "id": "physique",
    "title": "PHYSIQUE",
    "tracks": [
      {
        "name": "Wounds",
        "max": 6,
        "shape": "circle"
      }
    ]
  }
]
```

**Key Features:**
- `tracks` array supports multiple counters per stat
- `shape` options: "square" (default), "circle", "triangle", "hexagon"
- `name` is optional - omit it to show just the shapes without a label
- `max` defaults to 5 if not specified
- `startLabel` and `endLabel` add text before/after the shapes (e.g., "0" and "max")
- Click shapes to increment/decrement current value
- Values persist in URL automatically
- Appears centered below the stat title

**Example with start/end labels:**
```json
{
  "id": "conviction",
  "title": "CONVICTION",
  "tracks": [
    {
      "name": "Faith",
      "max": 5,
      "shape": "circle",
      "startLabel": "0",
      "endLabel": "max"
    }
  ]
}
```

**Example without labels:**
```json
{
  "id": "expertise",
  "title": "EXPERTISE",
  "tracks": [
    {
      "max": 4,
      "shape": "circle"
    }
  ]
}
```

### Clock Stats

**When to use:** For stats that track progress or countdowns using visual clock faces (like prophecies, doom tracks, project completion, etc.).

Clocks display SVG images that advance when clicked, cycling through different visual states. They're perfect for tracking progress that doesn't fit a simple number.

```json
{
  "id": "prophecy",
  "title": "PROPHECY",
  "shape": "clock",
  "clock": {
    "type": "quarter_twelfths",
    "faces": 6
  },
  "tracks": [
    {
      "name": "Signs",
      "max": 3,
      "shape": "circle"
    }
  ]
}
```

**Key Features:**
- `shape: "clock"` designates this as a clock stat
- `clock.type` specifies the folder name in `clocks/` containing the SVG images
- `clock.faces` defines how many faces (0 through N) the clock has
- Click the clock to advance it (cycles back to 0 after the last face)
- `title` is optional - can be omitted for clocks without labels
- Can still include `tracks` for additional counters below the clock
- Values persist in URL automatically (e.g., `prophecy-value=4`)
- Fully keyboard accessible (Tab to focus, Space/Enter to advance)
- Responsive sizing on mobile devices

**Creating Custom Clock Types:**

1. Create a folder in `clocks/` (e.g., `clocks/my-clock-type/`)
2. Add numbered SVG files: `0.svg`, `1.svg`, `2.svg`, etc.
3. Reference it in stats.json:

```json
{
  "id": "doom",
  "title": "DOOM",
  "shape": "clock",
  "clock": {
    "type": "my-clock-type",
    "faces": 4
  }
}
```

The clock will load `clocks/my-clock-type/0.svg` through `clocks/my-clock-type/4.svg`.

---

## Creating Roles

To add a new role with moves:

1. Create a JSON file in `data/moves/` (e.g., `data/moves/new-role.json`)
2. Add the role to `data/availability.json` with a `_movesFile` property:

```diff
...

  "Lord Commander": {
    "_movesFile": "data/moves/lord-commander.json",
    "cards": ["ship"],
    "l1a2b3": false
-  }
+  },
+ "New Role": {
+  "_movesFile": "data/moves/new-role.json",
+  "move1": true,
+  "move2": false
+}
}
```
_/data/availability.json_

Moves marked `true` are always enabled for the role and cannot be disabled.

You can start with an empty json file for the moves:

```json
[
]
```
_/data/moves/new-role.json_

### Role Descriptions

Add descriptive text to roles using the `description` field in `data/availability.json`:

```json
{
  "Navigator": {
    "_movesFile": "data/moves/navigator.json",
    "description": "Expert in charting courses through unknown space.\n\nNavigators possess a **third eye** that allows them to perceive the warp."
  }
}
```

Descriptions support [text formatting](#text-formatting) including **bold**, *italic*, line breaks (`\n`), and clickable glossary terms.

---

## Text Formatting

All text fields in moves and role descriptions support basic markdown-style formatting:

- **Bold text:** Wrap text in double asterisks: `**bold text**`
- *Italic text:* Wrap text in single asterisks: `*italic text*`
- **Bullet lists:** Start lines with `- ` (dash and space) for bulleted lists
- **Line breaks:** Use `\n` for a line break or `\n\n` for a paragraph break
- **Text input boxes:** Use `__id__` or `__id:placeholder__` syntax to create inline text input boxes
- **Glossary terms:** Any word in bold or italic that matches a term in `data/terms.json` becomes clickable with a popup definition

### Bullet Lists

Consecutive lines starting with `- ` are automatically converted to HTML bullet lists:

```json
{
  "text": "On a miss, choose one:\n- Take a **Debility**\n- Lose valuable equipment\n- Attract unwanted attention"
}
```

Renders as a proper bulleted list with the "Debility" term clickable.

### Text Input Boxes

You can insert inline text input boxes anywhere in your text using the `__id__` syntax. The id between the underscores becomes the input element's id attribute, making it easy to reference later.

**Syntax:**
```
__id__                    # Basic text box without placeholder
__id:Placeholder Text__   # Text box with placeholder text (optional)
```

**Example in a move:**
```json
{
  "id": "gather-intel",
  "title": "Gather Intel",
  "description": "Your second in command __cmdname:Name__ is a real piece of work",
  "outcomes": [
    {
      "range": "≥ 10",
      "text": "The navigation officer __navname:Officer Name__ knows your secret __navsecret__"
    }
  ]
}
```

This creates three inline text inputs:
- `<input id="cmdname" placeholder="Name">` - for the commander's name with placeholder
- `<input id="navname" placeholder="Officer Name">` - for the navigator's name with placeholder
- `<input id="navsecret">` - for the secret without placeholder

**Rendered output:**
```
Your second in command [Name        ] is a real piece of work
The navigation officer [Officer Name] knows your secret [        ]
```
(The grayed-out text in brackets represents placeholder text that disappears when you type)

The text boxes:
- Don't break the line flow (they're inline)
- Have a subtle style to distinguish them from regular text
- Can be filled in by players during the game
- Each has a unique, deterministic id based on what you specify

**Use cases:**
- Player character names: `__pcname:Character Name__`
- NPC names: `__npcname:NPC Name__`, `__villain:Villain Name__`
- Location names: `__hometown:Location__`, `__planet:Planet Name__`
- Custom details: `__secret:Their Secret__`, `__weakness__`, `__desire:What they want__`
- Relationship details: `__bond:Type of bond__`, `__debt:What is owed__`
- Numbers and stats: `__damage:0__`, `__armor:0__`

### Glossary Terms

Terms defined in `data/terms.json` are automatically detected in bold/italic text and made clickable. When clicked, they show a popup with the term's description.

**Example `data/terms.json`:**
```json
[
  {
    "term": "Debility",
    "description": "A lasting condition that hampers your effectiveness. While you have a **Debility**, take -1 ongoing to affected rolls."
  }
]
```

Now anywhere you write `**mark a Debility**` or `*suffer a Debility*`, the word "Debility" becomes clickable and shows the definition popup.

**Move Example:**
```json
{
  "id": "example",
  "title": "Example Move",
  "description": "When you act with **decisive force** or *careful precision*, roll +METTLE.\n\nYou may add your **Influence** to the roll if you're inspiring others.",
  "outcomes": [
    {
      "range": "≥ 10",
      "text": "You succeed **completely** and may choose *one extra benefit*."
    },
    {
      "range": "≤ 6",
      "text": "You fail and must choose one:\n- Take a **Debility**\n- Lose your advantage\n- Face a new complication"
    }
  ],
  "pick": [
    "**Area** - affects multiple targets",
    "*Messy* - leaves collateral damage"
  ]
}
```

**Role Description Example:**
```json
"Navigator": {
  "description": "Expert in charting courses through unknown space.\n\nNavigators possess a **third eye** that allows them to perceive the warp."
}
```

### Aliases

Create alternative names for terms and moves using `data/aliases.json`. This lets you use shorter or more thematic words that automatically link to the full term or move.

**Example `data/aliases.json`:**
```json
[
  {
    "alias": "battle",
    "move": "Attack Someone"
  },
  {
    "alias": "debuff",
    "term": "Debility"
  }
]
```

**How it works:**
- **Term aliases:** Writing `**battle**` will link to the "Debility" term and show its definition
- **Move aliases:** Writing `**navigate**` will link to the "Chart the Immaterium" move
- Aliases are matched case-insensitively, just like regular terms and moves
- Multiple aliases can point to the same term or move

**Use cases:**
- Shorter names: `**fight**` → "Combat Move"
- Thematic variations: `**warp travel**` → "Chart the Immaterium"
- Common abbreviations: `**XP**` → "Experience"

The aliases file is optional - if it's missing or empty, the system works normally without aliases.

### Using `data-format-text` Attribute

While formatting is automatic for moves, help etc - you can also apply it arbitrarily through the `data-format-text` attribute to any HTML element.

For example in [Cards](./README-CARDS.md) or in the main [cs.html](./cs.html) page.

```html
<div class="card mycard-card">
  <h3>Card Title</h3>
  <p data-format-text="Roll **Augury** to see the future. You gain **+1 forward**."></p>
  <div data-format-text>Use **Rally the Cohort** to inspire your crew.</div>
</div>
```

---

## Basic Moves

Basic moves are actions that can have different outcomes based on dice rolls or player choices. They form the core of character abilities.

**When to use:** For any action that involves rolling dice, making choices, or has variable outcomes.

### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "unique_id",
  "title": "Move Name (+Stat)",
  "description": "Optional detailed description",
  "outcomes": [
    {
      "range": "≥ 10",
      "text": "Full success description",
      "bullets": []
    },
    {
      "range": "7–9",
      "text": "Partial success, choose one:",
      "bullets": [
        "Option 1 consequence",
        "Option 2 consequence",
        "Option 3 consequence"
      ]
    },
    {
      "range": "≤ 6",
      "text": "Failure description:",
      "bullets": [
        "Bad outcome 1",
        "Bad outcome 2",
        "Bad outcome 3"
      ]
    }
  ]
}
</pre>
</td> <td> <img src="https://github.com/user-attachments/assets/ce52e203-b5b8-442f-8477-f5c6e189e5ac"> </td> </tr> </table>


**Note:** The example above shows a common three-outcome structure, but you can use any number of outcomes or ranges that make sense for your game. You could have just two outcomes (success/failure), or more complex breakdowns. The `range` field is displayed as-is to players, so write it in whatever way makes sense for your system.

**Move Ordering:**
- `weight` (optional, default 0): Numeric value to control move ordering within a category. Moves are sorted by weight (lower values first), while preserving the original order for moves with the same weight. This allows fine-grained control over move presentation without requiring you to manually reorder the entire JSON file.

Example with weight:
```json
{
  "id": "situational_move",
  "title": "Rare Action",
  "weight": 10,
  "description": "This move appears at the bottom due to positive weight"
}
```

---

## Advanced Move Types

Beyond basic roll-based moves, the system supports several specialized move types for different gameplay needs.

### Pick One Moves (Radio Buttons)

**When to use:** For moves where the character must choose exactly one option from a list.

#### Structure



<table>
<tr>
<td>
<pre>
{
  "id": "move_id",
  "title": "Move Name",
  "description": "When you take this move, choose one of the following",
  "pickOne": [
    "Option 1",
    "Option 2", 
    "Option 3"
  ]
}
</pre>
</td> <td> <img src="https://github.com/user-attachments/assets/b59a9714-a0ec-47ec-805f-178e06a9eca4"> </td> </tr> </table>

**Key Features:**
- `pickOne` creates radio buttons (only one selection allowed)
- Can combine with `multiple` to allow user to take the same move multiple times
- `multiplePick` creates separate columns for multiple independent choices

### Pick Multiple Moves (Checkboxes)

**When to use:** For moves that let characters select multiple benefits or properties.

#### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "multipicksdsd",
  "title": "Move Name",
  "description": "Each time you take this move, pick 2:",
  "multiple": 2,
  "pick": [
    "First Option",
    "Second Option",
    "Third Option",
    "Fourth Option",
    "Fifth Option"
  ]
}
</pre>
</td> <td> <img alt="image" src="https://github.com/user-attachments/assets/0b4198d4-3f20-4af4-858c-d5b535724d07" /> </td> </tr> </table>

**Key Features:**
- `pick` creates checkboxes (multiple selections allowed)
- Can combine `pick` and `pickOne` in the same move
- Often combined with `multiple` for repeated taking

### Take From Other Roles

**When to use:** If a move allows you to pick a move from another role.

#### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "takeFrom1",
  "title": "Cross-Training Move Name",
  "description": "Take a move from an unused role",
  "takeFrom": ["Lord Commander", "Mech Adept"]
}
</pre>
</td> <td> <img alt="image" src="https://github.com/user-attachments/assets/1747a931-4fd0-4d84-af96-30bc370f70b7" /> </td> </tr> </table>


**Key Features:**
- `takeFrom` lists roles this character can learn from
- Creates dropdown menus populated with moves from those roles
- Allows character versatility and cross-class abilities
- By default, filters out moves you already have from current roles

**Allow Duplicates:**

Add `"takeFromAllowsDuplicates": true` to allow selecting the same move multiple times:

```json
{
  "id": "versatile",
  "title": "Versatile Training - Master multiple specializations",
  "description": "Learn the same technique multiple times, adapting it to different situations.",
  "multiple": 3,
  "takeFrom": ["*"],
  "takeFromAllowsDuplicates": true,
  "takeCategory": ["Moves"]
}
```

When `takeFromAllowsDuplicates` is enabled:
- Dropdown shows ALL moves from selected role (including ones you already possess)
- Each instance gets a unique ID suffix (`moveid_1`, `moveid_2`, etc.)
- All IDs within the learned move are suffixed (including granted cards)
- Each instance is completely independent for persistence
- Perfect for learning powerful moves multiple times or acquiring multiple copies of equipment cards

**Practical Example: Equipment Selection**

Create a dedicated "Equipment" role with gear options, then allow players to select multiple pieces:

```json
{
  "id": "ye",
  "title": "Your Equipment",
  "description": "You have lots of equipment, tick to add and detail",
  "multiple": 10,
  "takeFrom": ["Equipment"],
  "takeFromAllowsDuplicates": true
}
```

This creates a dropdown showing all Equipment moves (Weapon, Armor, Vehicle, etc.). Players can select the same item multiple times - perfect for tracking multiple weapons, armor sets, or other gear with individual customization.

### Move Categories

**When to use:** To organize moves into logical groups on the character sheet.

#### Structure

```
{
  "id": "move_id",
  "title": "Move Name",
  "category": "Equipment",
  // ... rest of move definition
}
```

**Key Features:**
- Moves without `category` appear under the default "Moves" section
- Categories appear as separate sections on the character sheet
- Common categories: `"Advancement"`, `"Equipment"`, `"Companion"`

#### Category Display Order

Control the order categories appear on the character sheet using `data/categories.json`:

```json
{
  "order": ["Moves", "Equipment", "Advancement", "Character Details"]
}
```

**Key Features:**
- Categories appear in the order specified in the `order` array
- Categories not listed will appear alphabetically after the ordered categories
- If `categories.json` is missing or has no `order` array, all categories are sorted alphabetically

### Hidden Checkbox Moves

**When to use:** For moves that should appear as part of the character sheet layout rather than selectable options.

#### Structure

```json
{
  "id": "background",
  "title": "Background",
  "category": "Character Details",
  "hideCheckbox": true,
  "details": true,
  "outcomes": [
    {
      "range": "",
      "text": "Describe your character's background and history."
    }
  ]
}
```

In `availability.json`, set the move to `true` to force it always on:

```json
{
  "Navigator": {
    "_movesFile": "data/moves/navigator.json",
    "background": true
  }
}
```

**Key Features:**
- `hideCheckbox: true` hides the checkbox when the move is force-ticked (set to `true` in availability.json)
- The move content remains visible without the checkbox
- Perfect for character sheet elements like backgrounds, notes, or permanent features
- Works great with `category` to organize character sheet sections
- Can be combined with `details: true` for freeform text input

### Track Counter Moves

**When to use:** For moves that grant temporary points that can be spent for various effects (like Inspire, Hold, Focus, etc.).

#### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "track_move",
  "title": "Move Name (+Stat)",
  "tracks": [
    {
      "name": "Resource",
      "max": 3,
      "shape": "triangle"
    },
    {
      "name": "Special",
      "max": 2,
      "shape": "hexagon"
    }
  ],
  "outcomes": [
    {
      "range": "≥ 10",
      "text": "Success. Gain 2 Resource. Spend Resource to:",
      "bullets": [
        "Spend 1: Effect option",
        "Spend 2: Better effect",
        "Special: Major effect"
      ]
    }
  ]
}
</pre>
    },
    {
      "range": "≤ 6",
      "text": "Your attempt falls flat - choose",
      "bullets": ["Bad outcome 1", "Bad outcome 2"]
    }
  ]
}
</pre>
</td> <td> <img alt="image" src="https://github.com/user-attachments/assets/0636c795-4522-427a-85de-a2cdeeb4f8c3" />
 </td> </tr> </table>

**Key Features:**
- `tracks` array supports multiple counters (or single `track` for one)
- **Few tracks (1-3)**: Appear horizontally in the title area, right to left
- **Many tracks (4+)**: Automatically switch to a flexible flow layout below the title, perfect for inventory-style moves
- `shape` options: "square" (default), "circle", "triangle", "hexagon"
- `startLabel` and `endLabel` add text before/after the shapes (e.g., "0" and "max")
- `dynamic: true` adds a "max..." button to adjust maximum via prompt
- Click shapes to increment/decrement current value
- Values persist in URL (current value: `track_{id}`, max: `track_{id}_max`)
- Max can be set via URL: `track_inspire1_0_max=5` shows 5 shapes
- Values reset when move unchecked
- Flow layout adapts to track size: items with 1-2 points are narrow, items with 6+ points are wider

**Example with start/end labels:**
```json
{
  "id": "gather_strength",
  "title": "Gather Strength (+Mettle)",
  "tracks": [
    {
      "name": "Power",
      "max": 4,
      "shape": "hexagon",
      "startLabel": "weak",
      "endLabel": "strong"
    }
  ],
  "outcomes": [
    {
      "range": "≥ 10",
      "text": "Gain 3 Power. Spend Power for special effects."
    }
  ]
}
```

### Submoves

**When to use:** For moves that provide multiple related options or actions that each have their own outcomes (like different combat maneuvers, various command options, etc.).

Submoves allow you to create a single move that contains multiple sub-actions, each with its own title, description, and outcomes. This is perfect for versatile abilities that offer different approaches.

#### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "cmdstruct",
  "title": "Command Structure",
  "description": "Your mastery of military hierarchy allows you to efficiently direct forces at all levels. You may use the following command options:",
  "category": "Command Moves",
  "submoves": [
    {
      "title": "Give an Order",
      "description": "When you issue a direct command to subordinates in combat, roll **+Influence**.",
      "outcomes": [
        {
          "range": "≥ 10",
          "text": "They execute your order flawlessly.",
          "bullets": []
        },
        {
          "range": "7–9",
          "text": "They carry out your order, but choose one:",
          "bullets": [
            "They take longer than expected",
            "They suffer casualties",
            "They complete it but are out of position"
          ]
        }
      ]
    },
    {
      "title": "Coordinate Forces",
      "description": "When you orchestrate multiple units, roll **+Expertise**.",
      "outcomes": [
        {
          "range": "≥ 10",
          "text": "Perfect synchronization. Choose two:",
          "bullets": [
            "Maximize tactical advantage",
            "Minimize casualties",
            "Create an opening for allies"
          ]
        }
      ]
    }
  ]
}
</pre>
</td>
<td>
<i>Submoves render below the main move description, each with their own title and outcomes.</i>
</td>
</tr>
</table>

**Key Features:**
- `submoves` is an array of submove objects
- Each submove has:
  - `title` (required): The submove name
  - `description` (optional): When/how to use this submove
  - `outcomes` (optional): Array of outcomes, same format as regular moves
- Submoves render **after** the main move's description and outcomes
- A move can have both main outcomes **and** submoves
- Text formatting works in all submove fields (bold, italic, bullets, etc.)
- Perfect for moves that offer multiple tactical choices or approaches
- Set `"useTwoColumnsForSubmoves": true` on the move to lay out its submoves in a 2-column grid instead of stacking them vertically (falls back to 1 column on narrow screens); useful when a move has many similarly-shaped submoves, e.g. a list of magic schools

### Moves That Grant Cards

**When to use:** When a move should give the character a new card interface for tracking complex information.  For example 'gain a crew...'.

This allows you to create completely bespoke elements in the character sheet.

#### Structure

<table>
<tr>
<td>
<pre>
{
  "id": "cardmove1",
  "title": "Move Name",
  "grantsCard": "card-name",
  "outcomes": [
    {
      "range": "",
      "text": "Description of what you gain"
    }
  ]
}
</pre>
</td> <td> <img alt="image" src="https://github.com/user-attachments/assets/adadfbc1-6556-4930-9d1d-ce1664153f87" />
 </td> </tr> </table>

In order to work a card must have a corresponding card.json and card.html in the [cards](./data/cards) folder:

```json
{
  "id": "card-name",
  "title": "Example Card Title",
  "path": "data/cards/card-name",
  "description": "Simple example card",
  "version": "2.0.0",
  "author": "Thomas",
  "files": {
    "html": "card.html"
  }
}
```
_card.json_

And html for the card itself:

```html
<p>Example Card</p>
<label for="example-card-input">
Type some text<input type="text" id="example-card-input" />
</label>
```
_card.html_

As long as the inputs in the html have ids then they will be automatically persisted without any additional requirements.

File structure for a new card and move
```
/data
  /cards
    /new-card-name
      card.html
      card.json
 /moves
    /your-role.json (add move here) 
```

Cards can also be added directly to roles (i.e. if a move is not required and role always has it):

```diff
"New Role": {
  "_movesFile": "data/moves/new-role.json",
+  "cards": ["card-name"],
  "aaabvb": false,
```

**Key Features:**
- `grantsCard` references a card by its folder name
- The card must exist in `data/cards/[card-name]/`
- Cards appear inline when the move is selected
- `grantsCardAllowsDuplicates: true` - Combined with `multiple`, creates separate card instances for each checkbox (e.g., `multiple: 2` creates two independent squad cards)

## Cards System

The cards system allows you to embed rich, interactive HTML forms into character sheets with custom styling, JavaScript functionality, and automatic persistence.

### How It Works

1. **Folder Structure**: Each card lives in its own folder under `data/cards/[cardname]/`
2. **Card Definition**: Each card has a `card.json` file defining its metadata and files
3. **Custom Files**: Cards can have their own HTML, CSS, and JavaScript files
4. **Role Assignment**: Roles specify which cards they have access to via the `_cards` array in `availability.json`
5. **Automatic Loading**: Cards and their assets are automatically loaded when a role is selected
6. **Persistence**: All inputs with `id` attributes are automatically persisted to the URL

### Creating Cards

#### Folder Structure
Each card requires its own folder under `data/cards/`:

```
data/cards/mycard/
├── card.json     # Card definition and metadata
├── card.html     # HTML template
├── card.css      # Custom styling (optional)
└── card.js       # Custom JavaScript (optional)
```

#### When Do You Need JavaScript?

**Most cards don't need JavaScript!** The following features work automatically with just HTML:

✅ **No JavaScript needed for:**
- Basic form inputs (text, number, checkbox, select, textarea)
- Automatic persistence to URL
- Dynamic tables (`data-dynamic-table`)
- Track counters (`data-track` attributes)
- Hide-when-untaken visibility (`data-hide-when-untaken`)
- Form validation (HTML5 validation attributes)

⚠️ **Only create `card.js` if you need:**
- Auto-fill based on selections (e.g., ship class presets)
- Custom validation beyond HTML5
- Field dependencies (e.g., "void shields require plasma drive")
- Programmatic table manipulation (add/clear rows via code)
- Programmatic track manipulation (add/update tracks via code)
- Custom event handlers or business logic

**Examples:**
- The `robotic-companion` card has NO JavaScript - just basic HTML form inputs
- The `squad` card has NO JavaScript - uses dynamic tables, tracks, and hide-when-untaken, all with just HTML!

#### Card Definition (card.json)
```json
{
  "id": "mycard",
  "title": "My Custom Card",
  "path": "data/cards/mycard",
  "description": "A custom card for tracking something important",
  "version": "1.0.0",
  "author": "Your Name",
  "files": {
    "html": "card.html",
    "css": "card.css",
    "js": "card.js"
  }
}
```

#### HTML Template (card.html)
```html
<div class="card mycard-card">
  <h3 class="card-title">My Custom Card</h3>
  
  <div class="card-section">
    <div class="form-field">
      <label for="mycard_field">Field Label:</label>
      <input type="text" id="mycard_field" name="mycard_field" placeholder="Enter value">
    </div>
  </div>
</div>
```

#### Custom Styling (card.css)
```css
.mycard-card {
  border-left: 4px solid #059669;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.mycard-card .card-title {
  color: #059669;
}
```

#### Custom JavaScript (card.js)
```javascript
// Export initialization function for the card system
window.CardInitializers = window.CardInitializers || {};
window.CardInitializers.mycard = function() {
    // Custom card logic here
    console.log('My card initialized!');
    
    // Example: Add custom event handlers
    const field = document.getElementById('mycard_field');
    if (field) {
        field.addEventListener('input', function() {
            // Custom validation or logic
        });
    }
};
```

#### Supported Input Types
- `<input type="text">`, `<input type="number">`, `<input type="email">` etc.
- `<input type="checkbox">`
- `<select>` dropdowns
- `<textarea>` for multi-line text
- Any HTML form element with an `id`

#### Requirements
1. **Unique IDs**: All inputs that should be persisted **must have unique `id` attributes**
2. **Card Definition**: Every card must have a valid `card.json` file
3. **CSS Classes**: Use `.card` class for consistent base styling
4. **File Names**: Use the exact filenames specified in `card.json`

#### Built-in CSS Classes
The system provides base CSS classes:
- `.card` - Main card container with border and padding
- `.card-title` - Card title heading styling (automatically becomes collapsible)
- `.card-section` - Logical sections within cards
- `.form-field` - Individual input field containers
- `.card-error` - Error state styling
- `.card-content` - Wrapper for collapsible content (auto-generated)
- `.card-collapse-toggle` - +/- button for expanding/collapsing (auto-generated)

#### Card Collapse Functionality

**All cards are automatically collapsible**. The system:
- Converts any `<h3>` or `.card-title` element into a clickable collapse toggle
- Wraps all content below the title in a `.card-content` div
- Adds a +/- toggle button to the title
- Preserves collapse state during re-renders
- Starts cards in collapsed state by default

**Required for collapse functionality:**
```html
<div class="card mycard-card">
  <h3>Card Title</h3>  <!-- This becomes the collapsible header -->
  <!-- Everything below becomes collapsible content -->
</div>
```

**CSS for collapsed state:**
```css
.card.mycard-card .card-content.collapsed {
  display: none;
}
```

**Collapse controls:**
- Click title or +/- button to toggle
- Keyboard accessible (Tab to title, Enter/Space to toggle)
- Global "Collapse All" / "Expand All" buttons affect all cards
- State preserved when switching between roles

### Assigning Cards to Roles

Edit `data/availability.json` and add a `cards` array to any role:

```json
{
  "Navigator": {
    "_movesFile": "data/moves/navigator.json",
    "cards": ["ship", "crew"],
    "moveId1": true,
    "moveId2": false
  }
}
```

### Dynamic Tables in Cards

**When to use:** For tracking arbitrary rows of data (crew members, inventory, squad rosters, etc.).

#### Basic Usage (No JavaScript Required!)

Dynamic tables are **automatically initialized** by the card system. Just add the HTML - no JavaScript needed unless you want programmatic manipulation.

**HTML** (`card.html`):
```html
<table id="members" data-dynamic-table data-table-max="10">
  <thead>
    <tr>
      <th data-field="name">Name</th>
      <th data-field="role">Role</th>
      <th data-field="hp" data-type="number">HP</th>
      <th data-field="status" data-options="Ready,Injured,Recovering">Status</th>
      <th></th> <!-- Empty header for delete button column -->
    </tr>
  </thead>
  <tbody></tbody>
</table>
<button type="button" data-table-add="members">+ Add Row</button>
```

That's it! The table will automatically:
- Add/delete rows via the button
- Persist data to the URL
- Work with duplicate cards

#### Advanced: Programmatic Manipulation (Optional)

**Only create a `card.js` file if you need to manipulate tables via code.** For example:

**JavaScript** (`card.js`):
```javascript
window.CardInitializers.mycard = function(container, suffix) {
  const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

  // Example: Add a quick-add button for common entries
  helpers.addEventListener('quick_add_btn', 'click', () => {
    helpers.addTableRow('members', {
      name: 'New Member',
      role: 'Soldier',
      hp: 10,
      status: 'Ready'
    });
  });
};
```

#### Attributes

- `data-dynamic-table` - Enables automatic row management
- `data-table-max="10"` - Optional max rows (default: unlimited)
- `data-field="name"` - Column field name (required on each `<th>`)
- `data-type="number"` - Input type: "text" (default), "number", or "checkbox"
- `data-options="opt1,opt2"` - Creates dropdown with comma-separated options
- `data-readonly` - Makes column read-only (for calculated fields)
- `data-table-add="table_id"` - Links button to table for adding rows

#### Helper Methods

The scoped helpers object provides methods for programmatic table manipulation:

```javascript
const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

// Add a row with values
helpers.addTableRow('members', {
  name: 'John Doe',
  role: 'Medic',
  hp: 12,
  status: 'Ready'
});

// Clear all rows
helpers.clearTable('members');

// Get all table data
const data = helpers.getTableData('members');
// Returns: [{name: 'John', role: 'Medic', hp: 12, status: 'Ready'}, ...]

// Set table data (replaces all rows)
helpers.setTableData('members', [
  {name: 'Alice', role: 'Scout', hp: 10, status: 'Ready'},
  {name: 'Bob', role: 'Heavy', hp: 15, status: 'Injured'}
]);
```

All helpers automatically handle suffix for duplicate cards - just use the base table ID.

#### Features

- Automatic add/delete row buttons
- URL persistence (each cell auto-saved)
- Re-indexing when deleting from middle
- Works with duplicate cards (both `takeFromAllowsDuplicates` and `grantsCardAllowsDuplicates`)
- Multiple tables per card supported
- Programmatic manipulation via helper methods

### Using the Wizard System in Cards

The Wizard system provides an interactive modal popup for making selections. Available globally as `window.Wizard.show()`, returns a Promise.

**Example:**

```javascript
window.CardInitializers.mycard = function(container, suffix) {
  const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

  helpers.addEventListener('loadout_btn', 'click', async () => {
    const wizardData = [
      {
        type: 'get',  // Auto-receive (displayed, not selectable)
        options: ['Basic Armor', 'Radio']
      },
      {
        type: 'pickOne',  // Radio buttons (pick exactly one)
        title: 'Choose Primary Weapon:',
        options: ['Lasgun', 'Bolter', 'Plasma Gun']
      },
      {
        type: 'pick',  // Checkboxes (pick multiple)
        title: 'Additional Gear:',
        options: ['Grenades', 'Medkit', 'Ammunition']
      }
    ];

    const result = await window.Wizard.show(wizardData, {
      title: 'Squad Loadout'
    });

    if (result) {
      // result = ['Basic Armor', 'Radio', 'Bolter', 'Grenades', ...]
      result.forEach(item => {
        helpers.addTableRow('equipment', { item: item });
      });
    }
  });
};
```

**Data Structure:**
- `type`: `'get'`, `'pickOne'`, or `'pick'`
- `title`: Optional heading
- `options`: Array of strings

**Return:** `null` if cancelled, or array of selected strings

---

### Card Helper Functions

The CardHelpers module provides utilities to make card development easier and reduce boilerplate code.

#### Hide Untaken Options

Automatically hide optional fields/elements when they're "untaken" (empty/unchecked) and "Hide untaken moves" is enabled.

**Works with any input type:** checkbox, radio, text, select, number, date, etc.

**Usage:**

Add `data-hide-if-untaken` to any optional element you want to hide when untaken:

**Checkboxes:**
```html
<div class="card initiates-card">
  <h3 class="card-title">Initiates of Danu</h3>

  <!-- These elements will auto-hide when unchecked and "Hide untaken moves" is enabled -->
  <div class="initiate-row">
    <input type="checkbox" id="enfys_selected" data-hide-if-untaken>
    <label for="enfys_selected" data-hide-if-untaken>
      <h4>Enfys, the acolyte</h4>
      <!-- Rest of initiate content -->
    </label>
  </div>

  <div class="initiate-row">
    <input type="checkbox" id="afon_selected" data-hide-if-untaken>
    <label for="afon_selected" data-hide-if-untaken>
      <h4>Afon, a fellow initiate</h4>
      <!-- Rest of initiate content -->
    </label>
  </div>
</div>
```

**Radio buttons (hide unpicked options):**
```html
<div class="form-field">
  <label>Pick a Specialty:</label>
  <div class="specialty-options">
    <input type="radio" id="engineering" name="specialty" value="engineering" data-hide-if-untaken>
    <label for="engineering" data-hide-if-untaken>Engineering</label>

    <input type="radio" id="fighting" name="specialty" value="fighting" data-hide-if-untaken>
    <label for="fighting" data-hide-if-untaken>Fighting</label>

    <input type="radio" id="medical" name="specialty" value="medical" data-hide-if-untaken>
    <label for="medical" data-hide-if-untaken>Medical</label>
  </div>
</div>
```

**How it works:**
- No JavaScript required in your card
- Elements are automatically hidden when:
  1. The element itself is "untaken" (unchecked for checkboxes, empty for text/select/etc.), AND
  2. The global "Hide untaken moves" checkbox is enabled
- Elements automatically show when either condition changes
- Works with any element type (inputs, labels, divs, sections, rows, etc.)
- Supports all input types:
  - **Checkbox/Radio**: Hidden when unchecked
  - **Text/Textarea**: Hidden when empty
  - **Select**: Hidden when no value selected
  - **Number/Date**: Hidden when empty

#### Add Track Counters

Track counters are **automatically initialized** from data attributes. Just add the HTML - no JavaScript needed unless you want programmatic control.

**Basic Usage (No JavaScript Required!):**

```html
<div class="card mycard-card">
  <h3>My Card</h3>

  <!-- Single track with circles -->
  <div id="loyalty_track"
       data-track
       data-track-name="Loyalty"
       data-track-max="3"
       data-track-shape="circle"></div>

  <!-- Multiple tracks in separate containers -->
  <div id="wounds_track"
       data-track
       data-track-name="Wounds"
       data-track-max="6"
       data-track-shape="square"></div>

  <div id="armor_track"
       data-track
       data-track-name="Armor"
       data-track-max="3"
       data-track-shape="hexagon"></div>
</div>
```

That's it! The tracks will automatically initialize and persist to the URL.

**Advanced: Programmatic Control (Optional)**

Only create a `card.js` file if you need to add tracks dynamically via code:

```javascript
window.CardInitializers.mycard = function(container, suffix) {
  const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

  // Programmatically add tracks
  helpers.addTrack('loyalty-container', [
    {
      name: 'Loyalty',
      max: 3,
      shape: 'circle'
    }
  ]);
};
```

**Track Configuration:**

**Data Attributes:**
- `data-track` (required): Marks element as a track container
- `data-track-name` (required): Display name for the track
- `data-track-max` (optional, default 5): Maximum number of points
- `data-track-shape` (optional, default 'square'): Shape of track points
  - Options: `'square'`, `'circle'`, `'triangle'`, `'hexagon'`
- `data-track-start-label` (optional): Label text displayed before shapes
- `data-track-end-label` (optional): Label text displayed after shapes
- `data-track-dynamic` (optional, default false): Add a "max..." button to adjust maximum

**Programmatic (addTrack method):**
- `name` (required): Display name for the track
- `max` (optional, default 5): Maximum number of points
- `shape` (optional, default 'square'): Shape of track points
- `startLabel` (optional): Label text displayed before shapes
- `endLabel` (optional): Label text displayed after shapes
- `dynamic` (optional, default false): Add a "max..." button to adjust maximum

**Features:**
- Automatic click handling and persistence
- Works with duplicate cards (automatically handles suffixes)
- Visual feedback (filled/unfilled shapes)
- Keyboard accessible (Tab to focus, Space/Enter to click)
- All values persist to URL automatically
- CSS automatically adjusted for card context (static positioning vs absolute for moves)

**Example with dynamic max (data attributes):**

```html
<div id="inventory_track"
     data-track
     data-track-name="Inventory Slots"
     data-track-max="5"
     data-track-shape="square"
     data-track-dynamic="true"></div>
```

**Example with start/end labels (data attributes):**

```html
<div id="stress_track"
     data-track
     data-track-name="Stress"
     data-track-max="6"
     data-track-shape="circle"
     data-track-start-label="calm"
     data-track-end-label="breaking"></div>
```

#### Automatic Suffixing for Duplicate Cards

When cards are used with `grantsCardAllowsDuplicates` or `takeFromAllowsDuplicates`, all form control attributes are **automatically suffixed** - no manual code required!

**Automatically suffixed attributes:**
- `id` - Element IDs (e.g., `sq_name` → `sq_name_1`)
- `for` - Label associations (e.g., `for="sq_name"` → `for="sq_name_1"`)
- `name` - Form control grouping (e.g., `name="sq_specialty"` → `name="sq_specialty_1"`)
- `data-table-add` - Dynamic table buttons

**Example - Radio buttons just work:**

```html
<!-- In your card HTML -->
<input type="radio" id="sq_spec_engineering" name="sq_specialty" value="engineering">
<input type="radio" id="sq_spec_fighting" name="sq_specialty" value="fighting">
<input type="radio" id="sq_spec_medical" name="sq_specialty" value="medical">
```

**Result for duplicate instances:**
- Card 1: `name="sq_specialty_1"` (all three radio buttons share this name)
- Card 2: `name="sq_specialty_2"` (independent from Card 1)
- Each card instance has its own radio button group

**No JavaScript required** - the suffixing happens automatically during card rendering!

### Everyone System - Universal Cards and Moves

The "Everyone" role provides universal access to cards and moves for all characters:

```json
{
  "Everyone": {
    "_movesFile": "data/moves/everyone.json",
    "cards": ["common"],
    "universal_move": true,
    "basic_combat": true,
    "optional_skill": false
  }
}
```

**Key Features:**
- **Automatic Inclusion**: Everyone moves/cards are automatically added to any selected role combination
- **Invisible to Users**: "Everyone" never appears in role dropdowns or takeFrom lists
- **Universal Access**: Perfect for basic equipment, common knowledge, fundamental abilities
- **Same Structure**: Uses the same format as regular roles (moves file, cards array, move flags)

**Use Cases:**
- Basic combat moves available to all characters
- Common equipment cards (weapons, armor, tools)
- Universal knowledge or social moves
- Core mechanics that every character should have access to

**Implementation:**
The system automatically merges Everyone's availability data with any selected roles, making the moves and cards available without the user needing to select "Everyone" explicitly.

### Examples

#### Ship Card (`data/cards/ship/`)
- **Rich HTML**: Ship stats, components, and weapon systems
- **Custom CSS**: Blue theme with ship emoji, hover effects, and stat-specific styling
- **Custom JavaScript**: Auto-fill stats by ship class, hull damage warnings, component dependencies
- **Features**: Warp-capable ship validation, component requirements

#### Crew Card (`data/cards/crew/`)  
- **Rich HTML**: Crew stats, experience levels, and status conditions
- **Custom CSS**: Red theme with person emoji, status-specific colors
- **Custom JavaScript**: Stat validation, experience logic, name generator, status conflicts
- **Features**: Random name generation, loyalty/corruption balancing, role-based suggestions

### Advanced Usage

#### From Moves
Moves can grant cards when selected using the `grantsCard` property. For example, an "Acquire Robotic Companion" move can show the robotic companion card inline when the move is taken.

### File Structure
```
data/
  ├── cards/
  │   ├── ship/
  │   │   ├── card.json      # Ship card definition
  │   │   ├── card.html      # Ship HTML template
  │   │   ├── card.css       # Ship custom styles
  │   │   └── card.js        # Ship custom JavaScript
  │   ├── crew/
  │   │   ├── card.json      # Crew card definition
  │   │   ├── card.html      # Crew HTML template
  │   │   ├── card.css       # Crew custom styles
  │   │   └── card.js        # Crew custom JavaScript
  │   └── yourcard/       # Your custom card folder
  └── availability.json    # Defines which roles get which cards
```

### Benefits

1. **Zero Code Changes**: Adding new cards requires no core system modifications
2. **Complete Customization**: Each card can have its own HTML, CSS, and JavaScript
3. **Automatic Asset Loading**: CSS and JS files are automatically loaded and cached
4. **Automatic Persistence**: All inputs are automatically saved to the URL
5. **Rich Interactivity**: Cards can have complex custom logic and validation
6. **Professional Styling**: Custom themes with hover effects and visual feedback
7. **Role-Based Access**: Cards only appear for appropriate roles
8. **Modular Design**: Cards are self-contained and don't affect each other
9. **Version Control**: Each card tracks its own version and metadata
10. **Developer Friendly**: Clear separation of concerns and easy debugging

### Implementation Notes

- **Async Loading**: Cards, CSS, and JavaScript are loaded asynchronously and cached
- **Smart Caching**: Assets are only loaded once per session to improve performance
- **Error Handling**: Failed card loads show helpful error messages instead of breaking
- **DOM Integration**: Cards integrate seamlessly with existing form and persistence systems
- **Script Isolation**: Each card's JavaScript runs in its own scope to prevent conflicts
- **Style Scoping**: Card CSS is namespaced to avoid affecting other elements
- **Persistence Compatible**: All card inputs work with URL persistence and "Copy URL"
- **Clear Button**: The "Clear" button removes all card data along with other form data
- **Development Mode**: Use `window.Cards.clearCache()` to reload cards during development

---

## Multi-Language Support

The system supports translations for moves, stats, and cards with automatic fallback to English.

### Language Selection

Set language via URL parameter: `cs.html?lang=es` (Spanish), `cs.html?lang=fr` (French), etc.
Default: English (`en`)

### Translation Files

Create translations by mirroring the `data/` structure with a language prefix:

```
data/
  ├── moves/lord-commander.json      (English - base)
  ├── stats.json                     (English - base)
  ├── cards/ship/                    (English - base)
  └── es/                            (Spanish translations)
      ├── moves/lord-commander.json  (Spanish overlay - optional)
      ├── stats.json                 (Spanish overlay - optional)
      └── cards/ship/                (Spanish card folder)
          └── card.html              (Translated HTML - required)
```

### Translation Behavior

**Moves & Stats** (JSON merging):
- Translation overlays onto English base by matching `id` fields
- Missing translations fall back to English
- Only translate what changes (title, description, outcomes, etc.)

**Cards** (automatic fallback):
- **Only `card.html` is required** for a translated card
- `card.json`, `card.css`, and `card.js` automatically use English versions if not provided
- Same element IDs required for form compatibility

> **Important**
> Language codes must be exactly **2 lowercase letters** (e.g., `es`, `fr`, `de`).
> Regional variants like `en-US` or `pt-BR` are not currently supported.

### Example Translation

Spanish move (only translate what changes):
```json
[
  {
    "id": "l1a2b3",
    "title": "Reunir a la Cohorte (+Influencia)",
    "outcomes": [
      {
        "range": "≥ 10",
        "text": "Tu voz atraviesa el estruendo de la batalla...",
        "bullets": []
      }
    ]
  }
]
```

---

## Validation and Error Detection

The system automatically checks for common configuration errors and displays warnings to help you catch issues during development.

### Validation Warning Button

When validation errors are detected, a red warning button (⚠️) appears in the top-right corner of the page:

- **Click the button** to view detailed error information
- **Error count** is displayed on the button
- Checks run automatically every 5 seconds

### What Gets Validated

**1. Duplicate HTML IDs**
- Detects when multiple elements share the same `id` attribute
- This can break form persistence and card functionality
- **Fix**: Ensure all input IDs are unique across your entire sheet

**2. Duplicate Move IDs Across Files**
- Detects when the same move `id` appears in different move JSON files
- This causes unpredictable behavior when loading moves
- **Fix**: Give each move a unique ID, even across different role files

**3. Move IDs with Underscores**
- Detects move IDs containing `_` characters (e.g., `my_move_id`)
- Underscores break the suffix extraction system used for duplicate cards
- **Fix**: Use hyphens instead (e.g., `my-move-id`)

### Example Errors

```
VALIDATION ERRORS (2):
══════════════════════════════════════════════════

1. Duplicate ID "ship_name" found 2 times
  1. <input.form-control> in <div>
  2. <input.form-control> in <div>

2. Move ID "acquire-ship" contains underscores
Move IDs should use hyphens instead of underscores to ensure
proper suffix extraction for duplicate cards.
Change "acquire_ship" to "acquire-ship"

══════════════════════════════════════════════════
```

### Best Practices

- **Run validation frequently** during development
- **Fix errors immediately** - don't ignore the warning button
- **Test with duplicate cards** if you use `takeFromAllowsDuplicates: true`
- **Use consistent naming** - prefer hyphens over underscores in all IDs


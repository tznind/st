
window.FoxMoves = [
    {
        id: "l1a2b3",
        title: "The prodigal returned (+Charisma)",
        description:"When you declare that you know someone outside of Stonetop, someone who can help, name them and roll.",
        outcomes: [{
                range: "≥ 10",
                text: "Yeah they can help (tell us why they're willing).",
                bullets: []
            },
            {
                range: "7–9",
                text: "They can help but pick 1 from the list below:",
                bullets: [
                    "They still hold a grudge",
                    "They're going to need something from you first",
                    "They swore off this sort of thing a long time ago",
                    "You can't exactly, y'know, trust them"
                ]
            },
            {
                range: "≤ 6",
                text: "The GM chooses 1 and then some"
            }
        ]
    },
    {
        id: "d4e5f6",
        title: "Dabbler - (Requires level 2+ and the Fox)",
        description: "Each time you take this move, learn a new skill from Heavy, Marshal, Ranger, or Seeker",
        takefrom: ["Marshal"]
    },
    {
        id: "g7h8i9",
        title: "Danger Sense (+Intelligence)",
        description: "You can always ask the GM, \"Is there an ambush or trap here?\" If they say \"yes\", roll +Intelligence.",
        outcomes: [{
            range: "≥ 10",
            text: "Ask the GM both of the questions below",
            bullets: [
                "What will trigger the ambush or trap?",
                "What will happen once its triggered?"
            ]
        },
        {
            range: "7–9",
            text: "Ask 1",
            bullets: [
                "They still hold a grudge",
                "They're going to need something from you first",
                "They swore off this sort of thing a long time ago",
                "You can't exactly, y'know, trust them"
            ]
        },
        {
            range: "≤ 6",
            text: "Don't mark XP; you know there's a trap or ambush, but nothing bad happens just yet."
        }
        ]
    },
    {
        id: "1587dd",
        title: "Skill at Arms",
        description: "When you wield a weapon with speed and grace, roll +Dexterity to Clash (instead of +Strength).",
    },
    {
        id: "ff0011",
        title: "Silver Tongued (+Charisma)",
        description: "When you use words to avoid suspicion or trouble, roll +Charisma.",
        outcomes: [{
                range: "≥ 10",
                text: "Hold 3 Nerve, spend to:",
                bullets: [
                    "Move about or maneuver unchallenged",
                    "Withstand direct scrutiny or questioning",
                    "Direct suspicion or attention elsewhere"
                ]
            },
            {
                range: "7–9",
                text: "Hold 1 Nerve",
                bullets: [
                ]
            }
        ]
    }
]

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
    }
]
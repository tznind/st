
window.MarshalMoves = [
    {
        id: "j1k2l3",
        title: "We happy few (+Charisma)",
        description: "When you give an inspiring speech to your allies before facing a dire threat.",
        outcomes: [{
                range: "≥ 10",
                text: "Each ally holds 2 Inspiration.  Once battle is joined, your allies can spend to:",
                bullets: [
                    "Act fearlessly in the face of terror or overwhelming odds",
                    "Keep 1 HP instead of being reduced to 0 HP",
                    "Add 1d6 to a damage roll they just made"
                ]
            },
            {
                range: "7–9",
                text: "Each ally holds 1 Inspiration",
                bullets: [
                ]
            },
            {
                range: "≤ 6",
                text: "Each ally holds 1 Inspiration, but you have disadvantage on all rolls until you share your nagging doubts with someone else."
            }
        ]
    }
]
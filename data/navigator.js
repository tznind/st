/**
 * Navigator Moves Data
 */

window.NavigatorMoves = [
    {
        id: "a1b2c3",
        title: "Chart the Immaterium (+Conviction)",
        outcomes: [{
                range: "≥ 10",
                text: "The passage is smooth and precise. You emerge exactly where intended.",
                bullets: []
            },
            {
                range: "7–9",
                text: "You reach the destination, but choose one:",
                bullets: [
                    "The voyage takes longer than expected",
                    "The ship suffers debility or damage",
                    "You attract unwanted attention"
                ]
            },
            {
                range: "≤ 6",
                text: "GM chooses one:",
                bullets: [
                    "You emerge off-course",
                    "The voyage has taken far too long",
                    "A warp intrusion threatens the ship",
                    "Your mind or soul suffers strain; mark 1 Debility or permanent stigma."
                ]
            }
        ]
    },
    {
        id: "d4e5f6",
        title: "Scan the Astropathic Beacon",
        outcomes: [{
                range: "≥ 10",
                text: "You receive a clear psychic signal.",
                bullets: []
            },
            {
                range: "7–9",
                text: "The signal is fuzzy, choose one:",
                bullets: [
                    "You misinterpret part of the message",
                    "The beacon signals a false location"
                ]
            },
            {
                range: "≤ 6",
                text: "The signal is incomprehensible:",
                bullets: [
                    "You feel psychic backlash",
                    "Your mind is shaken, mark 1 Debility"
                ]
            }
        ]
    },
    {
        id: "g7h8i9",
        title: "Navigate the Warp Currents",
        outcomes: [{
                range: "≥ 10",
                text: "Your navigation is flawless.",
                bullets: []
            },
            {
                range: "7–9",
                text: "Partial success:",
                bullets: [
                    "You drift slightly off course",
                    "Minor strain on crew"
                ]
            },
            {
                range: "≤ 6",
                text: "Catastrophic:",
                bullets: [
                    "Major warp disruption",
                    "Crew suffers stress and debility"
                ]
            }
        ]
    },
    {
        id: "nav001",
        title: "Navigator's Intuition - Sense warp disturbances",
        outcomes: [{
            range: "≥ 10",
            text: "Your third eye perceives all warp fluctuations clearly. You see the path forward.",
            bullets: []
        },
        {
            range: "7–9",
            text: "You sense the disturbance, but:",
            bullets: [
                "The vision is clouded or confusing",
                "You also attract unwanted attention from warp entities"
            ]
        },
        {
            range: "≤ 6",
            text: "The warp's touch overwhelms you:",
            bullets: [
                "You're stunned by psychic backlash",
                "False visions mislead you",
                "Mark 1 Debility from warp strain"
            ]
        }]
    },
    {
        id: "1587dd",
        title: "Blighted Eye - Your eye is a weapon inflicting moderate damage",
        outcomes: [{
            range: "",
            text: "Pick one"
        }],
        pick: [
            "Area",
            "Messy"
        ]
    }
];

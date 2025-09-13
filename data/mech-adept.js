/**
 * Mech Adept Moves Data
 */

window.MechAdeptMoves = [
    {
        id: "m1a2b3",
        title: "Invoke the Machine Spirit (+Conviction)",
        outcomes: [{
                range: "≥ 10",
                text: "The machine spirit answers eagerly, purring with devotion. Systems operate at peak efficiency.",
                bullets: []
            },
            {
                range: "7–9",
                text: "The spirit responds, but demands concession. Choose one:",
                bullets: [
                    "The machine works, but sluggishly or erratically",
                    "It requires ritual sacrifice of resources, time, or components",
                    "The spirit whispers cryptic warnings—GM will tell you what"
                ]
            },
            {
                range: "≤ 6",
                text: "The spirit rebels in fury:",
                bullets: [
                    "It locks up or malfunctions at the worst possible moment",
                    "It hungers for your blood—suffer 1 Harm",
                    "You awaken echoes of something beyond the machine, an alien or warp-born presence"
                ]
            }
        ]
    },
    {
        id: "m4c5d6",
        title: "Augmetic Overload (+Physique)",
        outcomes: [{
                range: "≥ 10",
                text: "Your enhancements surge with flawless precision. You perform superhuman feats with no ill effect.",
                bullets: []
            },
            {
                range: "7–9",
                text: "Power flows, but imperfectly. Choose one:",
                bullets: [
                    "Gain what you seek, but your augmetics suffer stress—mark 1 Debility",
                    "The surge draws dangerous attention (electrical storms, enemy sensors, hostile spirits)",
                    "You succeed, but your flesh protests—mark 1 Harm"
                ]
            },
            {
                range: "≤ 6",
                text: "Catastrophic feedback:",
                bullets: [
                    "Your augmetics shut down at a critical moment",
                    "You fry delicate systems nearby",
                    "The machine spirit claims part of your flesh—permanent mutation or scar"
                ]
            }
        ]
    },
    {
        id: "m7e8f9",
        title: "Techno-Exorcism (+Expertise)",
        outcomes: [{
                range: "≥ 10",
                text: "The corrupted device is purged. Holy code floods its systems, restoring it to sanctity.",
                bullets: []
            },
            {
                range: "7–9",
                text: "The corruption recoils but not completely. Choose one:",
                bullets: [
                    "The device functions but remains tainted—GM will say how",
                    "You draw the attention of hostile entities (data-daemons, rogue code, or worse)",
                    "The exorcism drains you; mark 1 Debility"
                ]
            },
            {
                range: "≤ 6",
                text: "The corruption fights back:",
                bullets: [
                    "The device is utterly destroyed in the conflict",
                    "The infection spreads to your own augmetics",
                    "The machine's scream echoes in your skull—mark permanent stigma"
                ]
            }
        ]
    },
    {
        id: "85757e",
        title: "Relic Weapon - You have a priceless relic of the before time, choose 2 then +1 for each additional time you take this move:",
        multiple: 3,
        pick: [
            "+1 Harm",
            "Armor Piercing",
            "Reliable",
            "Precise",
            "Terrifying",
            "Messy"
        ]
    }
];

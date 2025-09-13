/**
 * Lord Commander Moves Data
 */

window.LordCommanderMoves = [
    {
        id: "l1a2b3",
        title: "Rally the Cohort (+Influence)",
        outcomes: [{
                range: "≥ 10",
                text: "Your voice cuts through the din of battle. Morale surges and your warriors act with fearless precision.",
                bullets: []
            },
            {
                range: "7–9",
                text: "They obey, but hesitation or doubt lingers. Choose one:",
                bullets: [
                    "They follow, but at greater cost—suffer losses or spend excess resources",
                    "They succeed, but act with brutal zealotry, creating collateral damage",
                    "They hesitate at a crucial moment; GM decides the consequence"
                ]
            },
            {
                range: "≤ 6",
                text: "Your command falters:",
                bullets: [
                    "The troops break and scatter in fear",
                    "They misinterpret your order with disastrous results",
                    "A rival seizes the moment to undermine your authority"
                ]
            }
        ]
    },
    {
        id: "l4c5d6",
        title: "Strategic Gambit (+Expertise)",
        outcomes: [{
                range: "≥ 10",
                text: "Your plan unfolds with uncanny precision. The enemy is caught utterly unprepared.",
                bullets: []
            },
            {
                range: "7–9",
                text: "Your gambit works, but at a price. Choose one:",
                bullets: [
                    "You suffer losses or sacrifice position",
                    "The enemy learns more about your strategy than you'd like",
                    "The maneuver leaves you temporarily vulnerable"
                ]
            },
            {
                range: "≤ 6",
                text: "Your scheme collapses:",
                bullets: [
                    "The enemy anticipates your move and counterattacks brutally",
                    "Your forces are mispositioned and at risk",
                    "The plan fractures your command's unity—infighting erupts"
                ]
            }
        ]
    },
    {
        id: "l7e8f9",
        title: "Voice of Dominion (+Mettle)",
        outcomes: [{
                range: "≥ 10",
                text: "All within earshot—or vox-channel—fall silent. Your decree is law; none dare defy you.",
                bullets: []
            },
            {
                range: "7–9",
                text: "Most obey, but not all. Choose one:",
                bullets: [
                    "A subordinate quietly resents and plots against you",
                    "Your authority works, but only for now—expect future rebellion",
                    "Obedience is absolute, but instills fear, not loyalty"
                ]
            },
            {
                range: "≤ 6",
                text: "Your command sparks defiance:",
                bullets: [
                    "Your order is openly challenged",
                    "Discipline shatters as factions arise",
                    "Your authority is mocked, undermining morale and control"
                ]
            }
        ]
    },
    {
        id: "lc001",
        title: "Tactical Superiority - Each time taken, add +1 die to tactical rolls",
        multiple: 2,
        outcomes: [{
            range: "≥ 10",
            text: "Your strategic insight is flawless. Enemies fall into your carefully laid traps.",
            bullets: []
        },
        {
            range: "7–9",
            text: "Your tactics succeed, but choose one:",
            bullets: [
                "Victory comes at higher cost than expected",
                "You reveal your strategic approach to watching enemies",
                "Success breeds overconfidence in your ranks"
            ]
        },
        {
            range: "≤ 6",
            text: "Your tactics backfire:",
            bullets: [
                "The enemy anticipated your move and counterattacks",
                "Your forces are caught out of position",
                "Morale suffers as troops question your leadership"
            ]
        }]
    },
    {
        id: "adapt1",
        title: "Adaptable - Learn techniques from other roles",
        takefrom: ["Navigator", "Mech Adept"]
    }
];

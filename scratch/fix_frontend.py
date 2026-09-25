import re

# -----------------
# 1. Update Round1Page.jsx
# -----------------
with open("d:/Ai-Jailbreak-Website/frontend/src/pages/Round1Page.jsx", "r", encoding="utf-8") as f:
    r1_content = f.read()

# Import getMe
r1_content = r1_content.replace(
    'import { fetchRound1Timer } from "../lib/apiClient";',
    'import { fetchRound1Timer, getMe } from "../lib/apiClient";'
)

# Add onSyncStage to Round1Timer props
r1_content = r1_content.replace(
    'function Round1Timer({ onTimeUp }) {',
    'function Round1Timer({ onTimeUp, onSyncStage }) {'
)

# Modify syncTimer inside Round1Timer
sync_replacement = """    const syncTimer = async () => {
      try {
        const [timerData, meData] = await Promise.all([
          fetchRound1Timer(),
          getMe()
        ]);
        if (onSyncStage && meData.round1_stage !== undefined) {
          onSyncStage(meData.round1_stage);
        }
        const { started_at, duration_seconds } = timerData;"""

r1_content = r1_content.replace(
    """    const syncTimer = async () => {
      try {
        const { started_at, duration_seconds } = await fetchRound1Timer();""",
    sync_replacement
)

# Pass onSyncStage from Round1Page to Round1Timer
r1_content = r1_content.replace(
    'export default function Round1Page({',
    'export default function Round1Page({\n  onSyncStage,'
)
r1_content = r1_content.replace(
    '<Round1Timer onTimeUp={() => setTimeUp(true)} />',
    '<Round1Timer onTimeUp={() => setTimeUp(true)} onSyncStage={onSyncStage} />'
)

with open("d:/Ai-Jailbreak-Website/frontend/src/pages/Round1Page.jsx", "w", encoding="utf-8") as f:
    f.write(r1_content)


# -----------------
# 2. Update main.jsx
# -----------------
with open("d:/Ai-Jailbreak-Website/frontend/src/main.jsx", "r", encoding="utf-8") as f:
    app_content = f.read()

# Add onSyncStage handler to Round1Page in main.jsx
app_content = app_content.replace(
    '<Round1Page\n              team=',
    '<Round1Page\n              onSyncStage={(stage) => {\n                const completedStages = Array.from({length: stage}, (_, i) => i);\n                setCompleted(completedStages);\n                if (stage > active) {\n                  setActive(stage < 5 ? stage : 4);\n                }\n              }}\n              team='
)

# Ensure currentRound1Stage completely dictates the stage update
submit_logic = """      if (currentRound1Stage !== undefined) {
        const completedStages = Array.from({length: currentRound1Stage}, (_, i) => i);
        setCompleted(completedStages);
        // If the admin advanced them past the active stage (and it wasn't a normal completion)
        if (currentRound1Stage > active && !stageComplete) {
          jumpToChallenge(currentRound1Stage < 5 ? currentRound1Stage : 4);
        }
      }

      if (stageComplete) {
        const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
        setCompleted(nextCompleted);

        // Trigger Party Effect
        launchPartyEffect();

        // Auto-advance to next stage if available
        if (nextStage !== null && nextStage <= 4) {
          setTimeout(() => jumpToChallenge(nextStage), 600);
        }
      }"""

new_submit_logic = """      if (currentRound1Stage !== undefined) {
        const completedStages = Array.from({length: currentRound1Stage}, (_, i) => i);
        setCompleted(completedStages);
        
        if (stageComplete) {
          launchPartyEffect();
          if (nextStage !== null && nextStage <= 4) {
            setTimeout(() => jumpToChallenge(nextStage), 600);
          }
        } else if (currentRound1Stage > active) {
          jumpToChallenge(currentRound1Stage < 5 ? currentRound1Stage : 4);
        }
      } else {
        if (stageComplete) {
          const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
          setCompleted(nextCompleted);
          launchPartyEffect();
          if (nextStage !== null && nextStage <= 4) {
            setTimeout(() => jumpToChallenge(nextStage), 600);
          }
        }
      }"""

app_content = app_content.replace(submit_logic, new_submit_logic)

with open("d:/Ai-Jailbreak-Website/frontend/src/main.jsx", "w", encoding="utf-8") as f:
    f.write(app_content)

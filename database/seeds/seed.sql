-- Seed Data for AI Arena Worlds, Characters, Tutorials, Skill Tree, Achievements, Quests, and Shop Items

INSERT INTO characters (id, name, archetype, description, accent_color, starter_unlocked) VALUES
  ('nova-cadet', 'Kaelen Vance', 'Signal Pathfinder', 'Versatile systems explorer trained to debug broken prompts and rescue AI workflows.', '#14B8A6', TRUE),
  ('logic-sentinel', 'Aria Sato', 'Verification Auditor', 'Sharp forensic investigator specialising in catching hallucinations and hidden bias.', '#38BDF8', TRUE),
  ('forge-architect', 'Marcus Reed', 'Automation Engineer', 'Pipeline specialist skilled at tool orchestration and deterministic guardrails.', '#F59E0B', TRUE),
  ('synth-muse', 'Lyra Sen', 'Creative Director', 'Iterative storyteller crafting sharp, original visual and narrative direction.', '#A78BFA', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO worlds (id, name, domain, theme_color, unlock_order, required_xp, description, boss_mission_id) VALUES
  ('prompt-academy', 'Prompt Academy', 'prompt', '#14B8A6', 1, 0, 'A floating training academy where broken instruction cores need structured prompts.', 'academy-boss-core'),
  ('verification-city', 'Verification City', 'evaluation', '#38BDF8', 2, 100, 'An atmospheric investigative metropolis overrun by confident AI hallucinations.', 'verification-boss-ledger'),
  ('tool-forge', 'Tool Forge', 'tools', '#F59E0B', 3, 250, 'High-precision orbital workshops teaching tool choice, CSV pipelines, and token budgets.', 'tool-for-reviews'),
  ('automation-factory', 'Automation Factory', 'workflow', '#818CF8', 4, 420, 'Multi-stage orchestration plants where human-in-the-loop gates prevent costly failures.', 'automation-boss-orchestrator'),
  ('ethics-citadel', 'Ethics Citadel', 'responsible', '#34D399', 5, 600, 'The governance fortress defending privacy, fairness, and safety across civic AI systems.', 'ethics-boss-charter'),
  ('creative-studio', 'Creative Studio', 'creative', '#F472B6', 6, 800, 'An experimental synthesis atrium transforming flat clichés into distinctive original ideas.', 'creative-boss-synthesis'),
  ('grandmaster-arena', 'Grandmaster Arena', 'all', '#FBBF24', 7, 1100, 'The orbital summit testing mastery across every AI competency.', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, boss_mission_id = EXCLUDED.boss_mission_id;

INSERT INTO tutorials (id, world_id, title, steps_json) VALUES
  ('tut-prompt-101', 'prompt-academy', 'Anatomy of a Clear Prompt', '[{"title":"Assign Role & Audience","body":"Always tell the AI who it is acting as and who will read the answer."},{"title":"Lock Format & Limits","body":"Specify bullets, JSON, or tables plus a hard word limit."},{"title":"Add Verification Rules","body":"Explicitly tell the AI to cite sources and forbid inventing facts."}]'::jsonb),
  ('tut-verify-101', 'verification-city', 'Spotting Fluent Hallucinations', '[{"title":"Check Unsourced Numbers","body":"Precise-sounding statistics with no named report are prime suspects."},{"title":"Audit Proper Nouns","body":"Models often mix up origin institutions, dates, and laws."}]'::jsonb),
  ('tut-tools-101', 'tool-forge', 'Choosing the Right Tool & Context', '[{"title":"Know Context Limits","body":"Never paste 10,000 rows directly into chat; combine code execution or chunked search."}]'::jsonb),
  ('tut-workflow-101', 'automation-factory', 'Human-in-the-Loop Gates', '[{"title":"Isolate Irreversible Actions","body":"Redact PII first and require human approval before refunds, payments, or external sends."}]'::jsonb),
  ('tut-ethics-101', 'ethics-citadel', 'Privacy & Risk Triage', '[{"title":"Never Paste Secrets","body":"API keys, private medical records, and customer lists must stay out of public bots."}]'::jsonb),
  ('tut-creative-101', 'creative-studio', 'Beating Generic Clichés', '[{"title":"Replace Adjectives with Concrete Detail","body":"Trade vague superlatives for grounded sensory details and constraints."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET steps_json = EXCLUDED.steps_json;

INSERT INTO skill_tree (id, domain, name, description, cost_points, prerequisite_id) VALUES
  ('skill-role-framing', 'prompt', 'Role Framing', 'Unlocks structured persona & constraint templates in briefing missions.', 1, NULL),
  ('skill-negative-bounds', 'prompt', 'Negative Constraints', 'Improves signal detection for anti-hallucination and style exclusions.', 1, 'skill-role-framing'),
  ('skill-citation-audit', 'evaluation', 'Source Forensics', 'Highlights claim structure hints during verification audits.', 1, NULL),
  ('skill-token-compression', 'tools', 'Token Compression', 'Tracks context density telemetry and token budget indicators.', 1, NULL),
  ('skill-hitl-gate', 'workflow', 'Safety Checkpoints', 'Reveals risk-gate dependency markers inside workflow designers.', 1, NULL),
  ('skill-privacy-shield', 'responsible', 'PII Redaction Shield', 'Highlights sensitive data patterns during privacy reviews.', 1, NULL),
  ('skill-divergent-lens', 'creative', 'Divergent Ideation', 'Unlocks multi-persona brainstorm frames in Creative Studio.', 1, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO achievements (id, name, description, category, reward_coins) VALUES
  ('first-clear', 'First Mission Cleared', 'Complete your first AI Arena mission with a score of 50+.', 'progress', 30),
  ('one-shot', 'One-Shot Sniper', 'Score 80%+ efficiency without needing a simulator retry.', 'efficiency', 50),
  ('zero-hint', 'Zero-Assist Purist', 'Clear 3 missions with 0 hints revealed.', 'mastery', 60),
  ('speedrunner', 'Speedrunner', 'Clear a mission in under 45% of par time with 70%+ quality.', 'efficiency', 50),
  ('hallucination-hunter', 'Hallucination Hunter', 'Score 85%+ on a Spot the Flaws mission.', 'domain', 45),
  ('pipeline-architect', 'Pipeline Architect', 'Score 85%+ on a Workflow Design mission.', 'domain', 45),
  ('safety-guardian', 'Safety Guardian', 'Score 85%+ on a Risk Classification mission.', 'domain', 45),
  ('six-domains', 'Six-Domain Explorer', 'Complete at least one mission in all 6 AI skill domains.', 'mastery', 100)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, reward_coins = EXCLUDED.reward_coins;

INSERT INTO quests (id, title, quest_type, target_count, reward_xp, reward_coins, criteria_json) VALUES
  ('daily-precision', 'Complete 1 Mission at Grade A or S', 'daily', 1, 60, 40, '{"minGrade":"A"}'::jsonb),
  ('daily-zero-hint', 'Finish 1 Mission with Zero Hints', 'daily', 1, 50, 35, '{"hintsUsed":0}'::jsonb),
  ('weekly-explorer', 'Clear Missions Across 3 Worlds', 'weekly', 3, 180, 120, '{"distinctWorlds":3}'::jsonb),
  ('story-restore-academy', 'Restore Prompt Academy Core', 'story', 1, 200, 150, '{"missionId":"academy-boss-core"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, reward_coins = EXCLUDED.reward_coins;

INSERT INTO items (id, name, slot, price_coins, description, metadata_json) VALUES
  ('suit-teal-vanguard', 'Teal Vanguard Suit', 'suit', 0, 'Standard expedition flight suit issued to all AI Arena operators.', '{"color":"#14B8A6"}'::jsonb),
  ('suit-gold-astrolabe', 'Solar Gold Suit', 'suit', 140, 'Ceremonial gold-trimmed explorer rig earned through mission coins.', '{"color":"#F59E0B"}'::jsonb),
  ('suit-cobalt-nexus', 'Cobalt Nexus Suit', 'suit', 180, 'Midnight-cobalt tactical plating with crisp teal seam highlights.', '{"color":"#38BDF8"}'::jsonb),
  ('visor-amber-optics', 'Amber Telemetry Visor', 'visor', 90, 'Warm gold visor overlay for your explorer sprite.', '{"visor":"#FBBF24"}'::jsonb),
  ('companion-nova-prism', 'NOVA Prism Shell', 'companion', 160, 'Equips NOVA with a faceted golden resonance shell.', '{"shell":"prism"}'::jsonb),
  ('frame-grandmaster', 'Laurel Passport Frame', 'badge_frame', 220, 'Decorative crest border displayed on your public Skill Passport.', '{"border":"gold"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_coins = EXCLUDED.price_coins;

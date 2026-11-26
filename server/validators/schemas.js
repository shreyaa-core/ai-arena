import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  alias: z.string().trim().min(2).max(60).optional(),
  characterId: z.string().max(64).optional(),
  language: z.enum(["en", "bn", "hi"]).optional(),
  experienceLevel: z.enum(["beginner", "occasional", "regular", "advanced"]).optional(),
  learningGoal: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profilePatchSchema = z.object({
  alias: z.string().trim().min(1).max(60).optional(),
  characterId: z.string().max(64).optional(),
  avatarColor: z.string().max(16).optional(),
  visorStyle: z.string().max(32).optional(),
  language: z.enum(["en", "bn", "hi"]).optional(),
  experienceLevel: z.enum(["beginner", "occasional", "regular", "advanced"]).optional(),
  learningGoal: z.string().max(120).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const settingsPatchSchema = z.object({
  sfxVolume: z.number().min(0).max(1).optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  musicEnabled: z.boolean().optional(),
  voiceNarration: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  largeText: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
});

export const attemptSchema = z.object({
  missionId: z.string().min(1).max(64),
  mode: z.enum(["training", "campaign", "blitz", "duel", "boss"]).default("campaign"),
  domain: z.enum(["prompt", "evaluation", "tools", "workflow", "responsible", "creative"]),
  rubricScore: z.number().int().min(0).max(100),
  efficiency: z.number().int().min(0).max(100),
  grade: z.enum(["S", "A", "B", "C", "D"]),
  xpEarned: z.number().int().min(0).max(500).default(0),
  coinsEarned: z.number().int().min(0).max(300).default(0),
  secondsSpent: z.number().int().min(0).max(7200).default(0),
  hintsUsed: z.number().int().min(0).max(20).default(0),
  turnsUsed: z.number().int().min(0).max(50).default(0),
  evaluatorType: z.string().max(32).default("deterministic"),
  responseJson: z.record(z.any()).optional(),
});

export const assessmentSubmitSchema = z.object({
  assessmentType: z.enum(["onboarding", "checkpoint", "final"]),
  domainScores: z.array(
    z.object({
      domain: z.enum(["prompt", "evaluation", "tools", "workflow", "responsible", "creative"]),
      score: z.number().int().min(0).max(100),
      strengths: z.array(z.string()).default([]),
      weaknesses: z.array(z.string()).default([]),
    }),
  ).min(1),
});

export const shopPurchaseSchema = z.object({
  itemId: z.string().min(1).max(64),
  idempotencyKey: z.string().min(4).max(128).optional(),
});

export const guestMigrateSchema = z.object({
  profile: profilePatchSchema.optional(),
  submissions: z.array(
    z.object({
      challengeId: z.string().min(1).max(64),
      score: z.number().int().min(0).max(100),
      efficiency: z.number().int().min(0).max(100).optional(),
      grade: z.enum(["S", "A", "B", "C", "D"]).optional(),
      xp: z.number().int().min(0).max(500).optional(),
      seconds: z.number().int().min(0).max(7200).optional(),
      hintsUsed: z.number().int().min(0).max(20).optional(),
      turnsUsed: z.number().int().min(0).max(50).optional(),
      mode: z.string().max(24).optional(),
      at: z.string().optional(),
    }),
  ).max(200),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  worldId: z.string().max(64).optional(),
  missionTitle: z.string().max(140).optional(),
  language: z.enum(["en", "bn", "hi"]).default("en"),
});

export const aiEvaluateSchema = z.object({
  challengeId: z.string().max(64),
  challengeTitle: z.string().max(140),
  scenario: z.string().max(2000),
  task: z.string().max(1000),
  promptText: z.string().trim().min(1).max(4000),
});

export const aiPlaygroundSchema = z.object({
  systemPrompt: z.string().max(2000).optional(),
  userPrompt: z.string().trim().min(1).max(3000),
  temperature: z.number().min(0).max(1.5).default(0.4),
  maxTokens: z.number().int().min(50).max(1024).default(450),
});

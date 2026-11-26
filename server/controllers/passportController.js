import { fetchPlayerStateSnapshot, fetchPublicPassportByCode } from "../repositories/gameRepository.js";
import { findUserById } from "../repositories/userRepository.js";

export async function getMyPassport(req, res, next) {
  try {
    const [user, snapshot] = await Promise.all([
      findUserById(req.user.id),
      fetchPlayerStateSnapshot(req.user.id),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      alias: user.alias,
      rankTitle: user.rank_title,
      aeiScore: user.aei_score,
      aeiBand: user.aei_band,
      xp: user.xp,
      domains: snapshot.mastery,
      achievements: snapshot.achievements,
      latestAssessment: snapshot.assessments[0] || null,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getPublicCertificate(req, res, next) {
  try {
    const code = req.params.code;
    const cert = await fetchPublicPassportByCode(code);
    if (!cert) return res.status(404).json({ error: "Certificate code not found" });
    return res.json({ certificate: cert });
  } catch (err) {
    return next(err);
  }
}

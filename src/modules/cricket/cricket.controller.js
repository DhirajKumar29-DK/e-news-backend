import * as cricketService from './cricket.service.js';

export async function getMatches(req, res) {
  try {
    const { type = 'all', category = 'all', scope = '' } = req.query;
    const matches = await cricketService.getAllMatches(type, category, scope);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLiveMatch(req, res) {
  try {
    const { id } = req.params;
    const liveData = await cricketService.getLiveMatchWidget(id);
    res.json({ success: true, data: liveData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getScorecard(req, res) {
  try {
    const { id } = req.params;
    const scorecard = await cricketService.getScorecard(id);
    res.json({ success: true, data: scorecard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCommentary(req, res) {
  try {
    const { id } = req.params;
    const commentary = await cricketService.getCommentary(id);
    res.json({ success: true, data: commentary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMatchInfo(req, res) {
  try {
    const { id } = req.params;
    const info = await cricketService.getMatchInfo(id);
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRankings(req, res) {
  try {
    const { format = 't20', category = 'teams' } = req.query;
    const rankings = await cricketService.getRankings(format, category);
    res.json({ success: true, data: rankings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

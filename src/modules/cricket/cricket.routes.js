import { Router } from 'express';
import * as cricketController from './cricket.controller.js';

const router = Router();

// Matches List (all, live, upcoming, recent)
router.get('/matches', cricketController.getMatches);

// Live Match Widget data (Hero banner, Batters on crease, Current Bowler, Ball badges)
router.get('/match/:id/live', cricketController.getLiveMatch);

// Full Inning Scorecard (Batting, Bowling, FOW, Extras, DNB)
router.get('/match/:id/scorecard', cricketController.getScorecard);

// Ball-by-ball commentary & Over summaries
router.get('/match/:id/commentary', cricketController.getCommentary);

// Squads, Playing XI & Match Info
router.get('/match/:id/info', cricketController.getMatchInfo);

// ICC Official Rankings (Test, ODI, T20: Teams, Batters, Bowlers, All-rounders)
router.get('/rankings', cricketController.getRankings);

export default router;

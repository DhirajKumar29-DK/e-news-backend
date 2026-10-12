// Dynamic Country Flags & Logos Engine (No manual hardcoding required)

// Standard ISO-2 mapping for all world cricket nations & associates
const COUNTRY_ISO_MAP = {
  'india': 'in',
  'ind': 'in',
  'australia': 'au',
  'aus': 'au',
  'england': 'gb-eng',
  'eng': 'gb-eng',
  'pakistan': 'pk',
  'pak': 'pk',
  'south africa': 'za',
  'sa': 'za',
  'new zealand': 'nz',
  'nz': 'nz',
  'west indies': 'jm',
  'wi': 'jm',
  'sri lanka': 'lk',
  'sl': 'lk',
  'bangladesh': 'bd',
  'ban': 'bd',
  'afghanistan': 'af',
  'afg': 'af',
  'ireland': 'ie',
  'ire': 'ie',
  'zimbabwe': 'zw',
  'zim': 'zw',
  'scotland': 'gb-sct',
  'scot': 'gb-sct',
  'netherlands': 'nl',
  'ned': 'nl',
  'nepal': 'np',
  'nep': 'np',
  'usa': 'us',
  'united states': 'us',
  'canada': 'ca',
  'can': 'ca',
  'uganda': 'ug',
  'namibia': 'na',
  'nam': 'na',
  'oman': 'om',
  'uae': 'ae',
  'united arab emirates': 'ae',
  'papua new guinea': 'pg',
  'png': 'pg',
  'hong kong': 'hk',
  'kenya': 'ke',
  'italy': 'it',
  'germany': 'de',
  'singapore': 'sg',
  'jersey': 'je',
  'kuwait': 'kw',
  'malaysia': 'my',
  'qatar': 'qa',
  'bahrain': 'bh'
};

// Common T20 leagues logo fallback mapping
const LEAGUE_TEAMS_MAP = {
  'csk': 'https://documents.iplt20.com/ipl/CSK/logos/Logo-CSK.png',
  'chennai super kings': 'https://documents.iplt20.com/ipl/CSK/logos/Logo-CSK.png',
  'mi': 'https://documents.iplt20.com/ipl/MI/Logos/Logo-MI.png',
  'mumbai indians': 'https://documents.iplt20.com/ipl/MI/Logos/Logo-MI.png',
  'rcb': 'https://documents.iplt20.com/ipl/RCB/Logos/Logo-RCB.png',
  'royal challengers bengaluru': 'https://documents.iplt20.com/ipl/RCB/Logos/Logo-RCB.png',
  'kkr': 'https://documents.iplt20.com/ipl/KKR/Logos/Logo-KKR.png',
  'kolkata knight riders': 'https://documents.iplt20.com/ipl/KKR/Logos/Logo-KKR.png',
  'gt': 'https://documents.iplt20.com/ipl/GT/Logos/Logo-GT.png',
  'gujarat titans': 'https://documents.iplt20.com/ipl/GT/Logos/Logo-GT.png',
  'rr': 'https://documents.iplt20.com/ipl/RR/Logos/Logo-RR.png',
  'rajasthan royals': 'https://documents.iplt20.com/ipl/RR/Logos/Logo-RR.png',
  'srh': 'https://documents.iplt20.com/ipl/SRH/Logos/Logo-SRH.png',
  'sunrisers hyderabad': 'https://documents.iplt20.com/ipl/SRH/Logos/Logo-SRH.png',
  'dc': 'https://documents.iplt20.com/ipl/DC/Logos/Logo-DC.png',
  'delhi capitals': 'https://documents.iplt20.com/ipl/DC/Logos/Logo-DC.png',
  'pbks': 'https://documents.iplt20.com/ipl/PBKS/Logos/Logo-PBKS.png',
  'punjab kings': 'https://documents.iplt20.com/ipl/PBKS/Logos/Logo-PBKS.png',
  'lsg': 'https://documents.iplt20.com/ipl/LSG/Logos/Logo-LSG.png',
  'lucknow super giants': 'https://documents.iplt20.com/ipl/LSG/Logos/Logo-LSG.png'
};

/**
 * Dynamically resolves any team's flag or logo.
 * 1. If Cricbuzz imageId provided -> uses Cricbuzz CDN.
 * 2. If known country name or short code -> uses FlagCDN.
 * 3. If T20 franchise -> uses league CDN.
 * 4. Fallback -> Generates a crisp branded SVG badge with the team initials.
 */
export function getTeamLogo(teamName, imageId = null) {
  // If Cricbuzz imageId is present, use official Cricbuzz CDN
  if (imageId) {
    return `https://static.cricbuzz.com/a/img/v1/i1/c${imageId}/i.jpg`;
  }

  if (!teamName) {
    return 'https://flagcdn.com/w80/un.png';
  }

  const normalized = teamName.toLowerCase().trim();

  // Check league teams
  if (LEAGUE_TEAMS_MAP[normalized]) {
    return LEAGUE_TEAMS_MAP[normalized];
  }

  // Check country ISO map
  const iso = COUNTRY_ISO_MAP[normalized];
  if (iso) {
    return `https://flagcdn.com/w80/${iso}.png`;
  }

  // Dynamic Fallback: generates high-res team badge with team initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=0284c7&color=ffffff&bold=true&size=128`;
}

// Dynamic TEAM_LOGOS proxy so any TEAM_LOGOS[name] dynamically resolves
export const TEAM_LOGOS = new Proxy({}, {
  get: (_, team) => (typeof team === 'string' ? getTeamLogo(team) : null)
});

// ICC Official Rankings (Test, ODI, T20) - Official Top 10 per category
export const ICC_RANKINGS = {
  teams: {
    test: [
      { rank: 1, team: 'Australia', matches: 30, points: 3715, rating: 124, logo: getTeamLogo('Australia') },
      { rank: 2, team: 'India', matches: 32, points: 3840, rating: 120, logo: getTeamLogo('India') },
      { rank: 3, team: 'England', matches: 38, points: 4180, rating: 110, logo: getTeamLogo('England') },
      { rank: 4, team: 'South Africa', matches: 24, points: 2470, rating: 103, logo: getTeamLogo('South Africa') },
      { rank: 5, team: 'New Zealand', matches: 27, points: 2619, rating: 97, logo: getTeamLogo('New Zealand') },
      { rank: 6, team: 'Sri Lanka', matches: 22, points: 1980, rating: 90, logo: getTeamLogo('Sri Lanka') },
      { rank: 7, team: 'Pakistan', matches: 25, points: 2225, rating: 89, logo: getTeamLogo('Pakistan') },
      { rank: 8, team: 'West Indies', matches: 26, points: 1976, rating: 76, logo: getTeamLogo('West Indies') },
      { rank: 9, team: 'Bangladesh', matches: 23, points: 1518, rating: 66, logo: getTeamLogo('Bangladesh') },
      { rank: 10, team: 'Zimbabwe', matches: 12, points: 360, rating: 30, logo: getTeamLogo('Zimbabwe') }
    ],
    odi: [
      { rank: 1, team: 'India', matches: 42, points: 5040, rating: 120, logo: getTeamLogo('India') },
      { rank: 2, team: 'Australia', matches: 36, points: 4176, rating: 116, logo: getTeamLogo('Australia') },
      { rank: 3, team: 'South Africa', matches: 31, points: 3410, rating: 110, logo: getTeamLogo('South Africa') },
      { rank: 4, team: 'Pakistan', matches: 30, points: 3210, rating: 107, logo: getTeamLogo('Pakistan') },
      { rank: 5, team: 'New Zealand', matches: 32, points: 3328, rating: 104, logo: getTeamLogo('New Zealand') },
      { rank: 6, team: 'England', matches: 34, points: 3332, rating: 98, logo: getTeamLogo('England') },
      { rank: 7, team: 'Sri Lanka', matches: 38, points: 3534, rating: 93, logo: getTeamLogo('Sri Lanka') },
      { rank: 8, team: 'Bangladesh', matches: 35, points: 3045, rating: 87, logo: getTeamLogo('Bangladesh') },
      { rank: 9, team: 'Afghanistan', matches: 28, points: 2240, rating: 80, logo: getTeamLogo('Afghanistan') },
      { rank: 10, team: 'West Indies', matches: 33, points: 2277, rating: 69, logo: getTeamLogo('West Indies') }
    ],
    t20: [
      { rank: 1, team: 'India', matches: 62, points: 16740, rating: 270, logo: getTeamLogo('India') },
      { rank: 2, team: 'Australia', matches: 45, points: 11700, rating: 260, logo: getTeamLogo('Australia') },
      { rank: 3, team: 'England', matches: 44, points: 11132, rating: 253, logo: getTeamLogo('England') },
      { rank: 4, team: 'West Indies', matches: 48, points: 11952, rating: 249, logo: getTeamLogo('West Indies') },
      { rank: 5, team: 'South Africa', matches: 40, points: 9800, rating: 245, logo: getTeamLogo('South Africa') },
      { rank: 6, team: 'New Zealand', matches: 46, points: 11086, rating: 241, logo: getTeamLogo('New Zealand') },
      { rank: 7, team: 'Pakistan', matches: 50, points: 11850, rating: 237, logo: getTeamLogo('Pakistan') },
      { rank: 8, team: 'Sri Lanka', matches: 39, points: 9009, rating: 231, logo: getTeamLogo('Sri Lanka') },
      { rank: 9, team: 'Bangladesh', matches: 42, points: 9408, rating: 224, logo: getTeamLogo('Bangladesh') },
      { rank: 10, team: 'Afghanistan', matches: 35, points: 7735, rating: 221, logo: getTeamLogo('Afghanistan') }
    ]
  },
  batting: {
    test: [
      { rank: 1, player: 'Joe Root', country: 'England', rating: 903, flag: getTeamLogo('England') },
      { rank: 2, player: 'Kane Williamson', country: 'New Zealand', rating: 819, flag: getTeamLogo('New Zealand') },
      { rank: 3, player: 'Harry Brook', country: 'England', rating: 798, flag: getTeamLogo('England') },
      { rank: 4, player: 'Yashasvi Jaiswal', country: 'India', rating: 792, flag: getTeamLogo('India') },
      { rank: 5, player: 'Steven Smith', country: 'Australia', rating: 757, flag: getTeamLogo('Australia') },
      { rank: 6, player: 'Rishabh Pant', country: 'India', rating: 745, flag: getTeamLogo('India') },
      { rank: 7, player: 'Usman Khawaja', country: 'Australia', rating: 738, flag: getTeamLogo('Australia') },
      { rank: 8, player: 'Rohit Sharma', country: 'India', rating: 729, flag: getTeamLogo('India') },
      { rank: 9, player: 'Virat Kohli', country: 'India', rating: 724, flag: getTeamLogo('India') },
      { rank: 10, player: 'Marnus Labuschagne', country: 'Australia', rating: 718, flag: getTeamLogo('Australia') }
    ],
    odi: [
      { rank: 1, player: 'Babar Azam', country: 'Pakistan', rating: 824, flag: getTeamLogo('Pakistan') },
      { rank: 2, player: 'Rohit Sharma', country: 'India', rating: 765, flag: getTeamLogo('India') },
      { rank: 3, player: 'Shubman Gill', country: 'India', rating: 763, flag: getTeamLogo('India') },
      { rank: 4, player: 'Virat Kohli', country: 'India', rating: 746, flag: getTeamLogo('India') },
      { rank: 5, player: 'Harry Tector', country: 'Ireland', rating: 737, flag: getTeamLogo('Ireland') },
      { rank: 6, player: 'Daryl Mitchell', country: 'New Zealand', rating: 715, flag: getTeamLogo('New Zealand') },
      { rank: 7, player: 'David Warner', country: 'Australia', rating: 708, flag: getTeamLogo('Australia') },
      { rank: 8, player: 'Pathum Nissanka', country: 'Sri Lanka', rating: 702, flag: getTeamLogo('Sri Lanka') },
      { rank: 9, player: 'Shreyas Iyer', country: 'India', rating: 696, flag: getTeamLogo('India') },
      { rank: 10, player: 'Charith Asalanka', country: 'Sri Lanka', rating: 688, flag: getTeamLogo('Sri Lanka') }
    ],
    t20: [
      { rank: 1, player: 'Travis Head', country: 'Australia', rating: 855, flag: getTeamLogo('Australia') },
      { rank: 2, player: 'Suryakumar Yadav', country: 'India', rating: 838, flag: getTeamLogo('India') },
      { rank: 3, player: 'Phil Salt', country: 'England', rating: 816, flag: getTeamLogo('England') },
      { rank: 4, player: 'Babar Azam', country: 'Pakistan', rating: 755, flag: getTeamLogo('Pakistan') },
      { rank: 5, player: 'Mohammad Rizwan', country: 'Pakistan', rating: 746, flag: getTeamLogo('Pakistan') },
      { rank: 6, player: 'Yashasvi Jaiswal', country: 'India', rating: 720, flag: getTeamLogo('India') },
      { rank: 7, player: 'Jos Buttler', country: 'England', rating: 712, flag: getTeamLogo('England') },
      { rank: 8, player: 'Nicholas Pooran', country: 'West Indies', rating: 704, flag: getTeamLogo('West Indies') },
      { rank: 9, player: 'Rinku Singh', country: 'India', rating: 682, flag: getTeamLogo('India') },
      { rank: 10, player: 'Glenn Maxwell', country: 'Australia', rating: 671, flag: getTeamLogo('Australia') }
    ]
  },
  bowling: {
    test: [
      { rank: 1, player: 'Jasprit Bumrah', country: 'India', rating: 870, flag: getTeamLogo('India') },
      { rank: 2, player: 'Ravichandran Ashwin', country: 'India', rating: 859, flag: getTeamLogo('India') },
      { rank: 3, player: 'Josh Hazlewood', country: 'Australia', rating: 847, flag: getTeamLogo('Australia') },
      { rank: 4, player: 'Pat Cummins', country: 'Australia', rating: 820, flag: getTeamLogo('Australia') },
      { rank: 5, player: 'Kagiso Rabada', country: 'South Africa', rating: 815, flag: getTeamLogo('South Africa') },
      { rank: 6, player: 'Nathan Lyon', country: 'Australia', rating: 802, flag: getTeamLogo('Australia') },
      { rank: 7, player: 'Ravindra Jadeja', country: 'India', rating: 794, flag: getTeamLogo('India') },
      { rank: 8, player: 'Prabath Jayasuriya', country: 'Sri Lanka', rating: 781, flag: getTeamLogo('Sri Lanka') },
      { rank: 9, player: 'Shaheen Afridi', country: 'Pakistan', rating: 748, flag: getTeamLogo('Pakistan') },
      { rank: 10, player: 'Marco Jansen', country: 'South Africa', rating: 722, flag: getTeamLogo('South Africa') }
    ],
    odi: [
      { rank: 1, player: 'Keshav Maharaj', country: 'South Africa', rating: 695, flag: getTeamLogo('South Africa') },
      { rank: 2, player: 'Josh Hazlewood', country: 'Australia', rating: 668, flag: getTeamLogo('Australia') },
      { rank: 3, player: 'Adam Zampa', country: 'Australia', rating: 663, flag: getTeamLogo('Australia') },
      { rank: 4, player: 'Mohammed Siraj', country: 'India', rating: 657, flag: getTeamLogo('India') },
      { rank: 5, player: 'Jasprit Bumrah', country: 'India', rating: 645, flag: getTeamLogo('India') },
      { rank: 6, player: 'Kuldeep Yadav', country: 'India', rating: 639, flag: getTeamLogo('India') },
      { rank: 7, player: 'Shaheen Afridi', country: 'Pakistan', rating: 630, flag: getTeamLogo('Pakistan') },
      { rank: 8, player: 'Trent Boult', country: 'New Zealand', rating: 624, flag: getTeamLogo('New Zealand') },
      { rank: 9, player: 'Mitchell Starc', country: 'Australia', rating: 618, flag: getTeamLogo('Australia') },
      { rank: 10, player: 'Bernard Scholtz', country: 'Namibia', rating: 610, flag: getTeamLogo('Namibia') }
    ],
    t20: [
      { rank: 1, player: 'Adil Rashid', country: 'England', rating: 721, flag: getTeamLogo('England') },
      { rank: 2, player: 'Akeal Hosein', country: 'West Indies', rating: 695, flag: getTeamLogo('West Indies') },
      { rank: 3, player: 'Rashid Khan', country: 'Afghanistan', rating: 678, flag: getTeamLogo('Afghanistan') },
      { rank: 4, player: 'Wanindu Hasaranga', country: 'Sri Lanka', rating: 672, flag: getTeamLogo('Sri Lanka') },
      { rank: 5, player: 'Axar Patel', country: 'India', rating: 660, flag: getTeamLogo('India') },
      { rank: 6, player: 'Arshdeep Singh', country: 'India', rating: 652, flag: getTeamLogo('India') },
      { rank: 7, player: 'Anrich Nortje', country: 'South Africa', rating: 648, flag: getTeamLogo('South Africa') },
      { rank: 8, player: 'Adam Zampa', country: 'Australia', rating: 640, flag: getTeamLogo('Australia') },
      { rank: 9, player: 'Fazalhaq Farooqi', country: 'Afghanistan', rating: 636, flag: getTeamLogo('Afghanistan') },
      { rank: 10, player: 'Josh Hazlewood', country: 'Australia', rating: 631, flag: getTeamLogo('Australia') }
    ]
  },
  allRounder: {
    test: [
      { rank: 1, player: 'Ravindra Jadeja', country: 'India', rating: 469, flag: getTeamLogo('India') },
      { rank: 2, player: 'Ravichandran Ashwin', country: 'India', rating: 308, flag: getTeamLogo('India') },
      { rank: 3, player: 'Shakib Al Hasan', country: 'Bangladesh', rating: 280, flag: getTeamLogo('Bangladesh') },
      { rank: 4, player: 'Jason Holder', country: 'West Indies', rating: 270, flag: getTeamLogo('West Indies') },
      { rank: 5, player: 'Axar Patel', country: 'India', rating: 262, flag: getTeamLogo('India') },
      { rank: 6, player: 'Joe Root', country: 'England', rating: 248, flag: getTeamLogo('England') },
      { rank: 7, player: 'Ben Stokes', country: 'England', rating: 240, flag: getTeamLogo('England') },
      { rank: 8, player: 'Marco Jansen', country: 'South Africa', rating: 235, flag: getTeamLogo('South Africa') },
      { rank: 9, player: 'Pat Cummins', country: 'Australia', rating: 228, flag: getTeamLogo('Australia') },
      { rank: 10, player: 'Mitchell Starc', country: 'Australia', rating: 215, flag: getTeamLogo('Australia') }
    ],
    odi: [
      { rank: 1, player: 'Mohammad Nabi', country: 'Afghanistan', rating: 320, flag: getTeamLogo('Afghanistan') },
      { rank: 2, player: 'Shakib Al Hasan', country: 'Bangladesh', rating: 292, flag: getTeamLogo('Bangladesh') },
      { rank: 3, player: 'Sikandar Raza', country: 'Zimbabwe', rating: 288, flag: getTeamLogo('Zimbabwe') },
      { rank: 4, player: 'Ravindra Jadeja', country: 'India', rating: 245, flag: getTeamLogo('India') },
      { rank: 5, player: 'Rashid Khan', country: 'Afghanistan', rating: 238, flag: getTeamLogo('Afghanistan') },
      { rank: 6, player: 'Mitchell Santner', country: 'New Zealand', rating: 231, flag: getTeamLogo('New Zealand') },
      { rank: 7, player: 'Glenn Maxwell', country: 'Australia', rating: 225, flag: getTeamLogo('Australia') },
      { rank: 8, player: 'Hardik Pandya', country: 'India', rating: 219, flag: getTeamLogo('India') },
      { rank: 9, player: 'Mehidy Hasan Miraz', country: 'Bangladesh', rating: 212, flag: getTeamLogo('Bangladesh') },
      { rank: 10, player: 'Chris Woakes', country: 'England', rating: 205, flag: getTeamLogo('England') }
    ],
    t20: [
      { rank: 1, player: 'Liam Livingstone', country: 'England', rating: 253, flag: getTeamLogo('England') },
      { rank: 2, player: 'Hardik Pandya', country: 'India', rating: 244, flag: getTeamLogo('India') },
      { rank: 3, player: 'Marcus Stoinis', country: 'Australia', rating: 211, flag: getTeamLogo('Australia') },
      { rank: 4, player: 'Wanindu Hasaranga', country: 'Sri Lanka', rating: 209, flag: getTeamLogo('Sri Lanka') },
      { rank: 5, player: 'Mohammad Nabi', country: 'Afghanistan', rating: 205, flag: getTeamLogo('Afghanistan') },
      { rank: 6, player: 'Sikandar Raza', country: 'Zimbabwe', rating: 200, flag: getTeamLogo('Zimbabwe') },
      { rank: 7, player: 'Shakib Al Hasan', country: 'Bangladesh', rating: 195, flag: getTeamLogo('Bangladesh') },
      { rank: 8, player: 'Moeen Ali', country: 'England', rating: 188, flag: getTeamLogo('England') },
      { rank: 9, player: 'Axar Patel', country: 'India', rating: 182, flag: getTeamLogo('India') },
      { rank: 10, player: 'Glenn Maxwell', country: 'Australia', rating: 179, flag: getTeamLogo('Australia') }
    ]
  }
};

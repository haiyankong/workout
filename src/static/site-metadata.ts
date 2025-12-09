interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  keywords: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: 'Workout',
  siteUrl: '/',
  logo: '',
  description: 'Workout',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: 'Strava',
      url: 'https://www.strava.com/athletes/149557983',
    },
    {
      name: 'Note',
      url: 'https://haiyankong.github.io/workout-note/',
    },
    {
      name: 'Repo',
      url: 'https://github.com/haiyankong/workout',
    },
  ],
};

export default data;

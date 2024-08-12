class Stats {
  constructor(sampleUrl, callback = null) {

    this.artists = {}; // {artists: msplayed}
    this.tracks = {}; // {track: msplayed}

    this.dailyTracksArray = [];
    this.topForDay = { "tracks": {}, "artists": {} };
    this.allTopForDay = {};

    this.loadData(sampleUrl, callback);
  }

  async loadData(url, callback) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      this.data = JSON.parse(text);

      this.processData();
      this.computeTop5();
      this.calculateDailyStats();
      this.sortByDate();
      this.getAllTopForDay();

      if (callback) callback();
    } catch (error) {
      console.error('Error loading data: ', error);
    }
  }

  processData() {
    this.data.forEach(play => {
      if (play.msPlayed > 20000) {
        this.artists[play.artistName] = (this.artists[play.artistName] || 0) + play.msPlayed;

        if (!this.tracks[play.trackName]) {
          this.tracks[play.trackName] = [0, play.endTime, play.msPlayed];
        }
        this.tracks[play.trackName][0] += 1;
        this.tracks[play.trackName][2] += play.msPlayed;
      }
    });
  }

  /* get top 5 tracks and artists */
  computeTop5() {
    this.top5 = Object.entries(this.tracks)
      .sort((a, b) => b[1][0] - a[1][0])
      .slice(0, 5);

    this.top5a = Object.entries(this.artists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Compute total playtime for the top artist
    if (this.top5a.length > 0) {
      const topArtist = this.top5a[0];
      this.totalPlaytimeTopArtist = topArtist[1];
    } else {
      this.totalPlaytimeTopArtist = 0;
    }

    // Compute total playtime for the top track
    if (this.top5.length > 0) {
      const topTrack = this.top5[0];
      this.totalPlaytimeTopTrack = topTrack[1][2];
    } else {
      this.totalPlaytimeTopTrack = 0;
    }
  }

  calculateDailyStats() {
    const dailyArtists = this.aggregateDailyStats('artistName', 'artists');
    const dailyTracks = this.aggregateDailyStats('trackName', 'tracks');

    this.dailyArtistsArray = this.convertToSortedArray(dailyArtists);
    this.dailyTracksArray = this.convertToSortedArray(dailyTracks);

    this.getTopForDay();
    this.getTopTracksForDay();
  }

  aggregateDailyStats(playKey, type) {
    return this.data.reduce((acc, play) => {
      const date = play.endTime.split(' ')[0];
      const key = play[playKey];

      if (!acc[date]) acc[date] = {};
      if (!acc[date][key]) acc[date][key] = 0;

      acc[date][key] += play.msPlayed;
      return acc;
    }, {});
  }

  convertToSortedArray(dailyStats) {
    return Object.entries(dailyStats).map(([date, stats]) => ({ date, stats }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  getTopForDay() {
    this.topForDay.artists = this.getTopItemsForDay(this.dailyArtistsArray, 'artists');
  }

  getTopTracksForDay() {
    this.topForDay.tracks = this.getTopItemsForDay(this.dailyTracksArray, 'tracks');
  }

  getTopItemsForDay(dailyArray, type) {
    return dailyArray.reduce((acc, day) => {
      const topItems = Object.entries(day.stats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, msPlayed]) => ({ [type === 'tracks' ? 'trackName' : 'artistName']: name, msPlayed }));

      acc[day.date] = topItems;
      return acc;
    }, {});
  }

  sortByDate() {
    this.daily = this.data.reduce((acc, play) => {
      const date = play.endTime.split(' ')[0];
      if (!acc[date]) acc[date] = { "artists": {}, "tracks": {} };

      this.updateStats(acc[date].artists, play.artistName, play.msPlayed);
      this.updateStats(acc[date].tracks, `${play.trackName}_${play.artistName}`, play.msPlayed);

      return acc;
    }, {});

    this.dailyArray = this.convertToSortedArray(this.daily);
  }

  updateStats(statsObj, key, msPlayed) {
    if (!statsObj[key]) {
      statsObj[key] = { ms: 0, rep: 0 };
    }
    statsObj[key].ms += msPlayed;
    statsObj[key].rep += 1;
  }

  getAllTopForDay() {
    this.allTopForDay = this.dailyArray.reduce((acc, day) => {
      acc[day.date] = {
        artists: this.getTopItemsForDay([day], 'artists')[day.date],
        tracks: this.getTopItemsForDay([day], 'tracks')[day.date]
      };
      return acc;
    }, {});
  }
}

export { Stats };
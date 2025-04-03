class Stats {
  /**
   * Build stats for user's streaming history
   * @param {*} sampleUrl streaming history file path
   * @param {*} callback called after data is loaded and stats are computed
   */
  constructor(sampleUrl, callback = null) {

    this._artists = null; // {artist name: total msplayed}
    this._tracks = null; // {track name: [replays,  endtime, total msplayed]}

    this.totalPlaytimeTopTrack = 0;
    this.totalPlaytimeTopArtist = 0;

    this.dailyTotal = { "tracks": [], "artists": [] }; //for everyday, the top
    this.topForDay = { "tracks": {}, "artists": {} };

    this.loadData(sampleUrl, callback);
  }

  get artists() {
    if (this._artists === null) {
      this._artists = new Map();
    }
    return this._artists;
  }

  get tracks() {
    if (this._tracks === null) {
      this._tracks = new Map();
    }
    return this._tracks;
  }
  
  async loadData(url, callback) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      this.data = JSON.parse(text);

      this.processData(); // fills artists and tracks data objects summary
      this.computeTopX(5);
      this.calculateDailyStats();
      this.sortByDate();
      // this.getAllTopForDay();

      // Compute total playtime (ms played) for the top artist and track
      if (this.topArtists.length > 0) { this.totalPlaytimeTopArtist = this.topArtists[0][1]; }
      if (this.topTracks.length > 0) { this.totalPlaytimeTopTrack = this.topTracks[0][1][2]; }
      
      if (callback) callback();
    } catch (error) {
      console.error('Error loading data: ', error);
    }
  }

  /**
   *  computes total ms played and views for all tracks and artists
   * */
  processData() {
    this.data.forEach(play => {
      if (play.msPlayed > 20000) {
        // cumulative ms played for each artist
        this.artists.set(play.artistName, (this.artists.get(play.artistName) || 0) + play.msPlayed);

        const trackKey = `${play.trackName}_${play.artistName}`;
        if (!this.tracks.has(trackKey)) {
          // [num replays, last listen, cumulative ms played]
          this.tracks.set(trackKey, [0, play.endTime, 0]);
        }
        const trackData = this.tracks.get(trackKey);
        trackData[0] += 1; // replays
        trackData[2] += play.msPlayed;
      }
    });
  }

  /**
   get final top # tracks and artists
   *  */ 
  computeTopX(number) {
    this.topTracks = Array.from(this.tracks.entries())
      .sort((a, b) => b[1][0] - a[1][0]) // this is by replays
      .slice(0, number);

    this.topArtists = Array.from(this.artists.entries())
      .sort((a, b) => b[1] - a[1]) // sort by total ms played
      .slice(0, number);
  }

  calculateDailyStats() {
    const dailyArtists = this.aggregateDailyStats('artistName', 'artists');
    const dailyTracks = this.aggregateDailyStats('trackName', 'tracks');

    this.dailyTotal['artists'] = this.convertToSortedArray(dailyArtists);
    this.dailyTotal['tracks'] = this.convertToSortedArray(dailyTracks);

    this.getTopForDay('artists');
    this.getTopForDay('tracks');
  }

  /**
   * for each date gets the ms played for all artists / tracks that day
   */
  aggregateDailyStats(playKey, type) {
    return this.data.reduce((acc, play) => {
      const date = play.endTime.split(' ')[0];
      const key = play[playKey];

      if (!acc.has(date)) acc.set(date,  new Map());
      if (!acc.get(date).has(key)) acc.get(date).set(key, 0);

      acc.get(date).set(key, acc.get(date).get(key) + play.msPlayed);
      return acc;
    }, new  Map());
  }

  // Converts the Map to a sorted array
  convertToSortedArray(dailyStats) {
    return Array.from(dailyStats.entries()).map(([date, statsMap]) => {
      // Ensure statsMap is a Map or convert it if necessary
      if (!(statsMap instanceof Map)) {
        statsMap = new Map(Object.entries(statsMap)); // Convert to Map if it is an object
      }
  
      return {
        date,
        stats: Object.fromEntries(statsMap) // This should now always work
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  
  getTopForDay(type) {
    this.topForDay[type] = this.getTopItemsForDay(this.dailyTotal[type], type);
  }


  getTopItemsForDay(dailyArray, type) {
    return dailyArray.reduce((acc, { date, stats }) => {
      const topItems = Object.entries(stats)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, msPlayed]) => ({
          name,
          msPlayed,
          type: type === 'tracks' ? 'trackName' : 'artistName'
         }));

      acc[date] = topItems;
      return acc;
    }, {});
  }

  sortByDate() {
    this.daily = this.data.reduce((acc, play) => {
      const date = play.endTime.split(' ')[0];
      if (!acc.has(date)) acc.set(date, { "artists": new Map(), "tracks": new Map() } );

      this.updateStats(acc.get(date).artists, play.artistName, play.msPlayed);
      this.updateStats(acc.get(date).tracks, `${play.trackName}_${play.artistName}`, play.msPlayed);

      return acc;
    }, new Map());

    this.dailyArray = this.convertToSortedArray(this.daily);
  }

  updateStats(statsMap, key, msPlayed) {
    if (!statsMap.has(key)) {
      statsMap.set(key, { ms: 0, rep: 0 });
    }
    const stat = statsMap.get(key);
    stat.ms += msPlayed;
    stat.rep += 1;
  }

  // getAllTopForDay() {
  //   this.allTopForDay = this.dailyArray.reduce((acc, day) => {
  //     acc[day.date] = {
  //       artists: this.getTopItemsForDay([day], 'artists')[day.date],
  //       tracks: this.getTopItemsForDay([day], 'tracks')[day.date]
  //     };
  //     return acc;
  //   }, {});
  // }
}

export { Stats };
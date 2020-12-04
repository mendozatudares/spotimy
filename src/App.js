import React, { Component } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import './App.css';

const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    const token = params.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    
    this.state = {
      loggedIn: token ? true : false,
      header: "Recently Played",
      view: "",
      currentAlbum: null,
      currentAritst: null,
      currentPlaylist: null,
      currentSearchTerm: "",
      currentTop: "medium_term",
      currentTopTime: "6 Months",
      currentUser: null,
    };

    this.getCurrentUser();
    this.handleHeaderChange = this.handleHeaderChange.bind(this);
    this.handlePlaylistChange = this.handlePlaylistChange.bind(this);
    this.handleArtistChange = this.handleArtistChange.bind(this);
    this.handleTopChange = this.handleTopChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
       e = r.exec(q);
    }
    return hashParams;
  }

  getCurrentUser() {
    spotifyApi.getMe().then(data => {
      this.setState({
        currentUser: data,
      });
    });
  }

  handleHeaderChange(title) {
    this.setState({ 
      header: title,
      view: "",
      currentPlaylist: null
    });
  }

  handlePlaylistChange(playlist) {
    this.setState({ 
      header: playlist.name,
      view: "playlist",
      currentPlaylist: playlist, 
    });
  }

  handleArtistChange(artist) {
    this.setState({
      header: artist.name,
      view: "Artist",
      currentAritst: artist,
    });
  }

  handleTopChange(top) {
    const time = {
     'short_term' : '4 Weeks',
     'medium_term' : '6 Months',
     'long_term' : 'All Time',
    }

    this.setState({
      currentTop: top,
      view: "top",
      currentTopTime: time[top],
    });
  }

  handleSearchChange(term) {
    this.setState({
      header: 'Search Results',
      view: "results",
      currentSearchTerm: term,
    })
  }

  render() {
    return (
      <div className="App">
        <div className="app-container">
          { !this.state.loggedIn && <LoginButton/> }
          { this.state.loggedIn && this.state.currentUser !== null && (
            <div>
              <div className="left-side-section">
                <SideMenu header={this.state.header} onHeaderChange={this.handleHeaderChange}/>
                <UserPlaylists user={this.state.currentUser} onPlaylistChange={this.handlePlaylistChange}/>
              </div>
              <div className="main-section">
                <div className="header">
                  <TrackSearch onSearchChange={this.handleSearchChange}/>
                  <UserDetails currentUser={this.state.currentUser}/>
                </div>
                <div className="main-section-container">
                  <MainHeader appState={this.state} onTopChange={this.handleTopChange}/>
                  <MainView appState={this.state}/>
                </div>
              </div>
            </div> )}
        </div>
      </div>
    );
  }
}

class LoginButton extends Component {
  generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  render() {
    const client_id = 'e9a2306dd16a41838ce9cd3eb8cd72c5';
    const redirect_uri = 'https://mendozatudares.github.io/spotimy/';
    const state = this.generateRandomString(16);
    const scope = 'user-read-private playlist-read-private playlist-read-collaborative user-library-read user-top-read user-read-recently-played user-follow-read';

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);

    return (
      <a className="centered login-btn" href={url}>
        Login to Spotify
      </a>
    )
  }
}

class SideMenu extends Component {
  renderSideMenu() {
    const menu = ["Recently Played", "Songs", "Albums", "Artists", "Top"];
    return menu.map(item => {
      return (
        <li key={item} className={this.props.header === item ? "active side-menu-item" : "side-menu-item"} onClick={() => this.props.onHeaderChange(item)}>
            {item}
        </li> 
      );
    })
  }

  render() {
    return (
      <ul className="side-menu-container">
        <h3 className="user-library-header">Your Library</h3>
        {this.renderSideMenu()}
      </ul>
    );
  }
}

class UserPlaylists extends Component {  
  constructor(props) {
    super(props);
    this.state = {
      userPlaylists: []
    }
  }

  componentDidMount() {
    this.renderPlaylists().then(data =>
      this.setState({
        userPlaylists: data
      })
    );
  }

  async renderPlaylists() {
    const onPlaylistChange = (playlist) => this.props.onPlaylistChange(playlist);
    
    return spotifyApi.getUserPlaylists(this.props.user.id, { limit: 50 })
      .then(function(playlists) {
        return playlists.items.map(playlist => {
          return (
            <li key={playlist.name} className="side-menu-item" onClick={() => onPlaylistChange(playlist)}>
              {playlist.name}
            </li>
          );
        });
      })
      .catch(function(err) {
        console.error(err);
      });
  }

  render() {
    return (
      <div className="user-playlist-container">
        <h3 className="user-playlist-header">Playlists</h3>
        {this.state.userPlaylists}
      </div>
    )
  }
}

class TrackSearch extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchTerm: '',
    };

    this.updateSearchTerm = this.updateSearchTerm.bind(this);
  }

  updateSearchTerm(term) {
    this.setState({
      searchTerm: term.target.value,
    })
  }

  render() {
    return (
      <div className="track-search-container">
        <form onSubmit={() => {this.props.onSearchChange(this.state.searchTerm)}}>
          <input onChange={this.updateSearchTerm} type="text" placeholder="Search"/>
        </form>
      </div>
    )
  }
}

class UserDetails extends Component {
  render() {
    return (
      <div className="user-details-container">
        <img className="user-image" src={this.props.currentUser.images[0].url} alt={this.props.currentUser.display_name}/>
        <p className="user-name">{this.props.currentUser.display_name}</p>
      </div>
    )
  }
}

class MainHeader extends Component {
  render() {
    const header = this.props.appState.header;
    const view = this.props.appState.view;
    const currentArtist = this.props.appState.currentAritst;
    const currentPlaylist = this.props.appState.currentPlaylist;
    const currentTop = this.props.appState.currentTop;
    const currentTopTime = this.props.appState.currentTopTime;

    return (
      <div className='section-title'>
        {view === "playlist" && (
          <div className='playlist-title-container'>
            <div className='playlist-image-container'>
              <img className='playlist-image' src={currentPlaylist.images[0] ? currentPlaylist.images[0].url : null} alt={currentPlaylist.name}/>
            </div>
            <div className='playlist-info-container'>
              <p className='playlist-text'>PLAYLIST</p>
              <h3 className='header-title'>{header}</h3>
              <p className='created-by'>Created by <span className='lighter-text'>
                {currentPlaylist.owner.display_name}</span> - {currentPlaylist.tracks.total} songs
              </p>
            </div>
          </div>
        )}

        {view === "artist" && currentArtist && (
          <div>
            <div className='current-artist-header-container'>
              <img className='current-artist-image' src={currentArtist.images[0].url} alt={currentArtist.name}/>
              <div className='current-artist-info'>
                <p>Artist</p>
                <h3>{currentArtist.name}</h3>
              </div>
            </div>
          </div>
        )}

        {(
          header === 'Top'||
          header === 'Songs'||
          header === 'Recently Played' ||
          header === 'Albums' ||
          header === 'Artists' ||
          header === 'Search Results' ) && (
          <div style={{display: 'flex'}}>
            <h3 className='header-title'>{header}</h3>
            {header === 'Top' && <TopSelect currentTop={currentTop} currentTopTime={currentTopTime} onTopChange={this.props.onTopChange}/>}
          </div>
        )}
      </div>
    );
  }
}

class MainView extends Component {
  render() {
    return (
      <React.Fragment>
        {this.props.appState.header === "Top" && <TopList appState={this.props.appState}/>}
        {this.props.appState.header === "Artists" && <ArtistList appState={this.props.appState}/>}
        {this.props.appState.header === "Albums" && <AlbumList/>}
        {(
          this.props.appState.header === "Recently Played" ||
          this.props.appState.header === "Songs" ||
          this.props.appState.header === "Search Results" ||
          this.props.appState.view === "playlist" )
          && <SongList appState={this.props.appState}/>}
      </React.Fragment>
    );
  }
}

class TopSelect extends Component {
  render() {
    const currentTop = this.props.currentTop;
    return (
      <div>
        <select onChange={(value) => this.props.onTopChange(value.target.value)}>
          <option hidden >{this.props.currentTopTime}</option>
          {currentTop !== 'short_term' && <option value='short_term'>4 Weeks</option>}
          {currentTop !== 'medium_term' && <option value='medium_term'>6 Months</option>}
          {currentTop !== 'long_term' && <option value='long_term'>All Time</option>}
        </select>
      </div>
    )
  }
}

class TopList extends Component {
  render() {
    return (
      <React.Fragment>
        <ArtistList appState={this.props.appState}/>
        <SongList appState={this.props.appState}/>
      </React.Fragment>
    )
  }
}

class AlbumList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userAlbums: [],
    }
  }

  componentDidMount() {
    this.renderAlbums().then(data =>
      this.setState({
        userAlbums: data,
      })
    );
  }

  async renderAlbums() {
    return spotifyApi.getMySavedAlbums({ limit: 50 })
      .then(function(data) {
        return data.items.map(item => {
          const getAlbum = () => {
            // noop
          }

          return (
            <li key={item.album.id} className="album-item" onClick={getAlbum}>
              <div className="album-image">
                <img src={item.album.images[0].url} alt={item.album.name}/>
              </div>
              <div className="album-details">
                <p className="album-name">{item.album.name}</p>
                <p className="artist-name">{item.album.artists[0].name}</p>
              </div>
            </li>
          );
        });
      })
      .catch(function(err) {
        console.error(err);
      });
  }


  render() {
    return <ul className="album-view-container">{this.state.userAlbums}</ul>;
  }
}

class ArtistList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      artists: [],
    }
    this.visible = false
  }

  componentDidMount() {
    this.renderArtists().then(data =>
      this.setState({
        artists: data,
      })
    );
    this.visible = true
  }

  componentDidUpdate() {
    if (this.visible && 
      ((this.props.appState.header === 'Top' && this.state.currentTop !== this.props.appState.currentTop) ||
        this.props.appState.header !== this.state.header))
      this.renderArtists().then(data => {
        this.setState({
          header: this.props.appState.header,
          currentTop: this.props.appState.currentTop,
          artists: data,
        })
      });
  }

  componentWillUnmount() {
    this.visible = false
  }

  async renderArtists() {
    const artistList = this.artistList;

    switch (this.props.appState.header) {
      case ("Top"):
        return spotifyApi.getMyTopArtists({ limit: 50, time_range: this.props.appState.currentTop })
          .then(function(data) {
            return artistList(data.items);
          })
          .catch(function(err) {
            console.error(err);
            return [];
          });
      case ("Artists"):
        return spotifyApi.getFollowedArtists({ limit: 50})
          .then(function(data) {
            return artistList(data.artists.items)
          })
          .catch(function(err) {
            console.error(err);
            return [];
          });
      default:
        return spotifyApi.getArtistRelatedArtists(this.props.appState.currentAritst.id, { limit: 5 })
          .then(function(data) {
            return artistList(data.artists)
          })
          .catch(function(err) {
            console.error(err);
            return [];
          });
    }
  }

  artistList(artists) {
    return artists.map(artist => {
      const getArtist = () => {
        //noop
      }
      return (
        <li key={artist.id} className="artist-item" onClick={getArtist}>
            <div className="artist-image">
              <img src={artist.images[0] ? artist.images[0].url : ""} alt={artist.name}/>
            </div>
            <div className="artist-details">
              <p>{artist.name}</p>
            </div>
        </li>
      );
    });
  }

  render() {
    return (
      <ul className="artist-view-container">
        {this.state.artists}
      </ul>
    );
  }
}

class SongList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
    }
    this.visible = false
  }

  componentDidMount() {
    this.renderSongs().then(data => {
      this.setState({
        header: this.props.appState.header,
        currentTop: '',
        currentSearchTerm: '',
        songs: data,
        visible: true,
      })
    });
    this.visible = true
  }

  componentDidUpdate() {
    if (this.visible && 
        ((this.props.appState.header === 'Top' && this.state.currentTop !== this.props.appState.currentTop) ||
         (this.props.appState.header === 'Search Results' && this.state.currentSearchTerm !== this.props.appState.currentSearchTerm) ||
          this.props.appState.header !== this.state.header))
      this.renderSongs().then(data => {
        this.setState({
          header: this.props.appState.header,
          currentTop: this.props.appState.currentTop,
          currentSearchTerm: this.props.appState.currentSearchTerm,
          songs: data,
        })
      });
  }

  componentWillUnmount() {
    this.visible = false
  }

  async renderSongs() {
    const currentUser = this.props.appState.currentUser;
    const currentPlaylist = this.props.appState.currentPlaylist;
    const currentSearchTerm = this.props.appState.currentSearchTerm;
    const songList = (items) => this.songList(items);

    switch (this.props.appState.header) {
      case ("Top"):
        return spotifyApi.getMyTopTracks({ limit: 50, time_range: this.props.appState.currentTop })
          .then(function(data) {
            return songList(data.items);
          })
          .catch(function(err) {
            console.error(err);
            return [];
          })
      case ("Recently Played"):
        return spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 })
          .then(function(data) {
            return songList(data.items);
          })
          .catch(function(err) {
            console.error(err);
            return [];
          })
      case ("Songs"):
        return spotifyApi.getMySavedTracks({ limit: 50 })
          .then(function (data) {
            return songList(data.items);
          })
          .catch(function(err) {
            console.error(err);
            return [];
          })
      case ("Search Results"):
        return spotifyApi.searchTracks(currentSearchTerm, { limit: 25 })
          .then(function(data) {
            return songList(data.tracks.items);
          })
      default: {
        if (this.props.appState.view === "playlist") {
          return spotifyApi.getPlaylistTracks(currentUser.id, currentPlaylist.id)
            .then(function(data) {
              return songList(data.items);
            })
            .catch(function(err) {
              console.error(err);
              return [];
            })
          }
      }
    }
  }

  songList(items) {
    const getTrack = (this.props.appState.header === "Top" || this.props.appState.header === "Search Results") ? 
      (song) => { return song; } : (song) => { return song.track; };

    return items.map((song, i) => {
      const msToMinutesAndSeconds = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
      }

      return (
      <li key={i} className="user-song-item">
        <div className="song-title">
          <p>{getTrack(song).name}</p>
        </div>
        <div className="song-artist">
          <p>{getTrack(song).artists[0].name}</p>
        </div>
        <div className="song-album">
          <p>{getTrack(song).album.name}</p>
        </div>
        <div className="song-length">
          <p>{msToMinutesAndSeconds(getTrack(song).duration_ms)}</p>
        </div>
      </li>
      );
    });
  }

  render() {
    return (
      <div>
        <div className="song-header-container">
          <div className="song-title-header">
            <p>Title</p>
          </div>
          <div className="song-artist-header">
            <p>Aritst</p>
          </div>
          <div className="song-album-header">
            <p>Album</p>
          </div>
          <div className="song-length-header">
            <p>Length</p>
          </div>
        </div>
        {this.state.songs}
      </div>
    );
  }
}

export default App;

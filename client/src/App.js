import React, {Component} from 'react';
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
      currentTop: "4 Weeks",
    };

    this.handleHeaderChange = this.handleHeaderChange.bind(this);
    this.handlePlaylistChange = this.handlePlaylistChange.bind(this);
    this.handleArtistChange = this.handleArtistChange.bind(this);
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

  render() {
    return (
      <div className="App">
        
        <div className="app-container">
          { !this.state.loggedIn && <a href='http://localhost:8888'> Login to Spotify </a> }
          { this.state.loggedIn && (
            <div>
              <div className="left-side-section">
                <SideMenu header={this.state.header} onHeaderChange={this.handleHeaderChange}/>
                <UserPlaylists header={this.header} onPlaylistChange={this.handlePlaylistChange}/>
              </div>
              <div className="main-section">
                <MainHeader appState={this.state}/>
                <div className="main-section-container">
                  <MainView appState={this.state}/>
                </div>
              </div>
            </div>)
          }
        </div>
      </div>
    );
  }
}

class SideMenu extends Component {
  renderSideMenu() {
    const menu = ["Top", "Recently Played", "Songs", "Albums", "Artists"];
    return menu.map(item => {
      return (
        <li key={item} className={this.props.header === item ? "active side-menu-item" : "side-menu-item"}
          onClick={() => this.props.onHeaderChange(item)}>
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
    const header =  this.props.header;
    const onPlaylistChange = (playlist) => this.props.onPlaylistChange(playlist);
    
    return spotifyApi.getMe()
      .then(function(user) {
        return spotifyApi.getUserPlaylists(user.id, { limit: 50 });
      })
      .then(function(playlists) {
        return playlists.items.map(playlist => {
          return (
            <li key={playlist.id} className={header === playlist.name ? "active side-menu-item" : "side-menu-item"}
              onClick={() => onPlaylistChange(playlist)}>
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

class MainHeader extends Component {
  render() {
    const header = this.props.appState.header;
    const view = this.props.appState.view;
    const currentAlbum = this.props.appState.currentAlbum;
    const currentArtist = this.props.appState.currentAritst;
    const currentPlaylist = this.props.appState.currentPlaylist;

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

        {view === "Artist" && currentArtist && (
          <div>
            <div className='current-artist-header-container'>
              <img className='current-artist-image' src={currentArtist.images[0].url} alt={currentArtist.name}/>
              <div className='current-artist-info'>
                <p>Artist from your library</p>
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
          header === 'Artists') && (
            <div>
              <h3 className='header-title'>{header}</h3>
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
        {this.props.appState.header === "Top" && <TopList/>}
        {this.props.appState.header === "Artists" && <ArtistList/>}
        {(
          this.props.appState.header === "Recently Played" ||
          this.props.appState.header === "Songs" ||
          this.props.appState.view === "playlist" )
          && <SongList appState={this.props.appState}/>}
      </React.Fragment>
    );
  }
}

class TopList extends Component {
  render() {
    return <div></div>
  }
}

class AlbumList extends Component {
  render() {
    return <div></div>
  }
}

class ArtistList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userArtists: []
    }
  }

  componentDidMount() {
    this.renderArtists().then(data =>
      this.setState({
        userArtists: data
      })
    );
  }

  async renderArtists() {
    return spotifyApi.getFollowedArtists({ limit: 50 })
      .then(function(data) {
        return data.artists.items.map(artist => {
          const getArtist = () => {
            //noop
          }
          return (
            <li key={artist.id} className="artist-item"
              onClick={getArtist}>
              <a>
                <div claasName="artist-image">
                  <img src={artist.images[0] ? artist.images[0].url : ""}/>
                </div>
                <div className="artist-details">
                  <p>{artist.name}</p>
                </div>
              </a>
            </li>
          );
        });
      })
      .catch(function(err) {
        console.error(err);
      });
  }

  render() {
    return <div></div>;
  }
}

class SongList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
      visible: true,
    }
  }

  componentDidMount() {
    this.renderSongs().then(data => {
      this.setState({
        header: this.props.appState.header,
        songs: data,
        visible: true,
      })
    });
  }

  componentDidUpdate() {
    if (this.state.visible && this.props.appState.header != this.state.header)
      this.renderSongs().then(data => {
        this.setState({
          header: this.props.appState.header,
          songs: data,
        })
      });
  }

  componentWillUnmount() {
    this.setState({
      visible: false,
    })
  }

  async renderSongs() {
    const currentPlaylist = this.props.appState.currentPlaylist;
    const songList = (items) => this.songList(items);

    switch (this.props.appState.header) {
      case ("Recently Played"):
        return spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 })
          .then(function(data) {
            return songList(data.items);
          })
      case ("Songs"):
        return spotifyApi.getMySavedTracks({ limit: 50 })
          .then(function (data) {
            return songList(data.items);
          })
      default: {
        if (this.props.appState.view === "playlist") {
          return spotifyApi.getMe()
            .then(function(user) {
              return spotifyApi.getPlaylistTracks(user.id, currentPlaylist.id);
            })
            .then(function(data) {
              return songList(data.items);
            })
          }
          
      }
    }
  }

  songList(items) {
    return items.map((song, i) => {
      const msToMinutesAndSeconds = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
      }

      return (
      <li key={i} className="user-song-item">
        <div className="song-title">
          <p>{song.track.name}</p>
        </div>
        <div className="song-artist">
          <p>{song.track.artists[0].name}</p>
        </div>
        <div className="song-album">
          <p>{song.track.album.name}</p>
        </div>
        <div className="song-length">
          <p>{msToMinutesAndSeconds(song.track.duration_ms)}</p>
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

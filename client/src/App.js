import React, {Component, useCallback} from 'react';
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
      headerTitle: "Recently Played",
      viewType: '',
      currentAritst: null,
      currentPlaylist: null
    };
    this.updateHeader = this.updateHeader.bind(this);
    this.updatePlaylist = this.updatePlaylist.bind(this);
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

  updateHeader(title) {
    this.setState({ headerTitle: title });
  }

  updatePlaylist(playlist) {
    this.setState({ 
      headerTitle: playlist.name,
      currentPlaylist: playlist, 
      viewType: 'playlist' 
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
                <SideMenu state={this.state} action={this.updateHeader}/>
                { this.state.loggedIn && <UserPlaylists state={this.state} action={this.updatePlaylist}/> }
              </div>
              <div className="main-section">
                <MainHeader state={this.state}/>
                <div className="main-section-container">
                  
                </div>
              </div>
            </div>)}
        </div>
      </div>
    );
  }
}

class SideMenu extends Component {
  renderSideMenu() {
    const menu = ["Recently Played", "Songs", "Albums", "Artists"];

    return menu.map(item => {
      return (
        <li key={item} className={this.props.state.headerTitle === item ? "active side-menu-item" : "side-menu-item"}
          onClick={() => {this.props.action(item)}}>
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
  state = {
    userPlaylists: []
  }

  componentDidMount() {
    this.renderPlaylists().then(data =>
      this.setState({
        userPlaylists: data
      })
    );
  }

  async renderPlaylists() {
    var headerTitle = this.props.state.headerTitle;
    var updatePlaylist = this.props.action;

    return spotifyApi.getMe()
      .then(function(user) {
        return spotifyApi.getUserPlaylists(user.id, { limit: 50 });
      })
      .then(function(playlists) {
        return playlists.items.map(playlist => {
          const getPlaylistSongs = () => {
            updatePlaylist(playlist);
          }
          return (
            <li onClick={getPlaylistSongs} className={headerTitle === playlist.name ? "active side-menu-item" : "side-menu-item"} key={playlist.id}>
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
    var headerTitle = this.props.state.headerTitle;
    var viewType = this.props.state.viewType;
    var currentArtist = this.props.state.currentAritst;
    var currentPlaylist = this.props.state.currentPlaylist;

    return (
      <div className='section-title'>
        {viewType === "playlist" && (
          <div className='playlist-title-container'>
            <div className='playlist-image-container'>
              <img className='playlist-image' src={currentPlaylist.images[0] ? currentPlaylist.images[0].url : null}/>
            </div>
            <div className='playlist-info-container'>
              <p className='playlist-text'>PLAYLIST</p>
              <h3 className='header-title'>{headerTitle}</h3>
              <p className='created-by'>Created by <span className='lighter-text'>
                {currentPlaylist.owner.display_name}</span> - {currentPlaylist.tracks.total} songs
              </p>
            </div>
          </div>
        )}

        {viewType === "Artist" && currentArtist && (
          <div>
            <div className='current-artist-header-container'>
              <img className='current-artist-image' src={currentArtist.images[0].url}/>
              <div className='current-artist-info'>
                <p>Artist from your library</p>
                <h3>{currentArtist.name}</h3>
              </div>
            </div>
          </div>
        )}

        {(
          headerTitle === 'Songs'||
          headerTitle === 'Recently Played' ||
          headerTitle === 'Albums' ||
          headerTitle === 'Artists') && (
            <div>
              <h3 className='header-title'>{headerTitle}</h3>
            </div>
          )}
      </div>
    );
  }
}


class AlbumList extends Component {
  renderAlbum(albumId) {
    const songs = spotifyApi.getAlbumTracks(albumId);
    return songs.map((song, i) => {
      return (
          <li className="album-item" key={i}>
              <div>
                  <div className="album-image">
                      <img src={song.track.album.images[0].url}/>
                  </div>

                  <div className="album-details">
                      <p className="album-name">{song.track.album.name}</p>
                      <p className="artist-name">{song.track.album.artists[0].name}</p>
                  </div>
              </div>
          </li>
      );
  });
  }

  render() {
    return <ul className="album-view-container">{this.renderAlbum(spotifyApi.getAlbum(this.props.albumId))}</ul>
  }
}

export default App;

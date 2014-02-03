var WEB_URL = "http://queueup.herokuapp.com";
// var WEB_URL = "http://localhost:3000";
var WEB_USER_AUTH_PATH = "/user/auth";
var WEB_PLAYLIST_CREATE_PATH = "/playlist/create.json";
var WEB_PLAYLIST_SHOW_PATH = "/playlist"

require([
    '$api/models',
    '$views/list#List',
    '$api/toplists#Toplist',
    '$views/image#Image'
], function(models, List, Toplist, Image) {
    var spotify_user; //Spotify's user model
    var user; // User object retrieved from server
    var spotifyPlaylist;
    var playlistList;
    var playlistRecord;
    var current_code;
    var current_track;

    load_data();

    function PlaylistRecord(code) {
        this.code = code;
        this.tracks = new Array();
        this.playing = 0;
        this.currentTrack = null;
        this.nextTrack = null;
        this.getTracks();
    }

    PlaylistRecord.prototype.getTracks = function(callback) {
        var trackArr = new Array();
        $.get(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + this.code + ".json")
            .success(function(data) {
                // console.log(data["tracks"]);
                $.each(data["tracks"], function(i, val) {
                    trackArr[i] = models.Track.fromURI(val["url"]);
                });
                this.tracks = trackArr;
                if (this.tracks.length > 0) {
                    console.log("Current: " + this.tracks[0]);
                    this.currentTrack = this.tracks[0];
                    if (callback) {
                        callback(trackArr);                
                    }    
                }
                console.log(trackArr);
                
        });
    }

    PlaylistRecord.prototype.playNext = function() {
        if (this.currentTrack) {
            console.log("PlayNext");
            this.dequeue(this.currentTrack);
            models.player.playTrack(this.currentTrack);
            this.getTracks();
        }
        // models.player.playContext(playlist);
        // tracks = playlist.load("tracks").done(function(loadedPlaylist) {
        //     loadedPlaylist.tracks.snapshot().done(function(snapshot) {
        //         if (snapshot.length > 0) {
        //             var firstTrack = snapshot.get(0);
        //             console.log(firstTrack);

        //             // image = Image.forTrack(firstTrack, {player: true});
        //             // $("#single-track-player").html(image.node);
        //             models.player.playTrack(firstTrack);
        //             remove_last(firstTrack.uri);
        //         }

        //     });
        // });
    }

    PlaylistRecord.prototype.dequeue = function() {
        url = this.currentTrack.uri;
        $.post(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + current_code+ "/remove",
            {track_url: url}).done(function(data) {
            console.log(data);
            // load_playlist(current_code);
            // window.location.href="spotify:app:queueup:playlist:" + current_code;
        });
    }

    function load_user_data(u, callback) {
        u.load('username', 'identifier').done(function(u) {
            $.post(WEB_URL + WEB_USER_AUTH_PATH, {identifier: u.identifier})
                .success(function(json, status) {
                    callback(json);
            });
        });
    }  

    function load_data(){
        spotify_user = models.User.fromURI("spotify:user:@");

        // models.player.addEventListener("change", function(player) {
        //     update_playlist(player);
        // });

        $("#user_playlists").html("Loading...");
        load_user_data(spotify_user, function(user_data){
            user = user_data;

            console.log(user);

            list_html = "<div id='playlist_list'>";
            $.each(user.playlists, function(i, pl) {
                list_html += "<h2><pre class='code'><a href='"
                    + "spotify:app:queueup:playlist:"
                    + pl.code + "'>" + pl.code.toUpperCase() + "</a>"
                    + "<button class='delete_playlist' onclick='delete_playlist(\"" + pl.code + "\")'>X</button></pre>"
                    + "</h2>";
            });
            list_html += "</div>";
            $("#user_playlists").html(list_html);
        });
    }

    function refresh_list(tracks) {
        playlistList.refresh();
    }

    function show_playlist_tracks(trackArr) {
        models.Playlist.createTemporary(new Date().getTime())
            .done(function (playlist) {
            playlist.load('tracks').done(function(loadedPlaylist) {
                loadedPlaylist.tracks.clear().done(function() {
                    loadedPlaylist.tracks.add(trackArr).done(function() {
                        console.log(trackArr);
                        playlistList = List.forPlaylist(playlist);
                        $('#playlist-player').html(playlistList.node);
                        playlistList.init();
                        console.log(playlistList);
                    });
                });
            });
        }).done(function(p) {
            spotifyPlaylist = p;
            console.log(p)
        });

    }

    function load_playlist(code, callback) {
        // current_code = code;
        playlistRecord = new PlaylistRecord(code);
        playlistRecord.getTracks(function (tracks) {
            console.log(tracks);
            show_playlist_tracks(tracks);
            callback(playlistRecord);
        });

        $('#playlist-player').html();

        $("#playlist-url").html("<a class='app-url' href='http://queueup.herokuapp.com/playlist/"
            + code + "''> queueup.herokuapp.com/playlist/" + code.toUpperCase()  + "</a><br><p>to add tracks</p>");
    }


    function update_playlist(player) {
        console.log(player);
        if (current_code) {
            load_playlist(current_code);
        }

    }

    function arguments() {
        var args = models.application.arguments;
        var code;
        if (args) {
            var lastArg = args[args.length - 1];
            if (lastArg == 'index') {
                return;
            }
        }

        if (args[0] == "playlist") {
            var code = args[1];
            load_playlist(code, function(playlist) {
                playlist.playNext();
            });

        }
        load_data();
    }

    function get_code() {
        return current_code;
    }

    models.application.load('arguments').done(arguments);

    models.application.addEventListener('arguments', arguments);

    $("#track_search").keyup(function(e) {
        query = $("#track_search").val();
        if (query.length > 0) {
            search = search.Search.suggest(query);
            alert(search.tracks);
        }
    });    

});

function create_playlist(code) {
    $.post(WEB_URL + WEB_PLAYLIST_CREATE_PATH, {code: code}).done(function(data) {
        console.log(data);
        window.location.href="spotify:app:queueup:playlist:" + code;
    });
}

function delete_playlist(code) {
    $.post(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + code + "/delete")
    .done(function(data) {
        console.log(data);
        window.location.href="spotify:app:queueup:index";
    });

}


function join_playlist(code) {
    window.location.href="spotify:app:queueup:playlist:" + code;
}

function search(input) {
    query = $(input).val();
    if (query.length > 0) {
        $.getJSON("http://ws.spotify.com/search/1/track.json", {q: query}, function(json) {
            $("#search_results").html("");
            $.each(json["tracks"], function(i, track) {
                if (i < 5) {
                    $("#search_results").append(result_track_format(track));
                } else {
                    return false;
                }
            })
        });
    }
}

function result_track_format(track) {
    html = "<div class='search_result_item'>";
    html += "<button class='QupButton' name='track_url' value='" + track["href"] + "'>";
    html += track["artists"][0]["name"] + " - " + track["name"] + " (" + track["album"]["name"] + ")";
    html += "</button></div>";
    return html;
}
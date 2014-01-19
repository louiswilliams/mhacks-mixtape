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
    var playlist;
    var current_code;
    var current_track;

    load_data();

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

    function load_playlist(code, callback) {
        current_code = code;
        var trackArr = new Array();
        var list;

        $.get(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + code + ".json")
                .success(function(data) {
                    // console.log(data["tracks"]);
                    $.each(data["tracks"], function(i, val) {
                        trackArr[i] = models.Track.fromURI(val["url"]);
                    });
                    console.log(trackArr);

                    playlist = models.Playlist.createTemporary(code + new Date().getTime())
                        .done(function (playlist) {
                        playlist.load('tracks').done(function(loadedPlaylist) {
                            loadedPlaylist.tracks.add(trackArr).done(function() {
                                var list = List.forPlaylist(playlist);
                                $('#playlist-player').html(list.node);

                                list.init();
                                models.player.addEventListener("change", function(player) {
                                    update_playlist(player);
                                });
                                if (callback) {
                                    callback(playlist);
                                    
                                }
                            });
                        });
                    });

            });
        $("#playlist-url").html("<a class='app-url' href='http://queueup.herokuapp.com/playlist/"
            + code + "''> queueup.herokuapp.com/playlist/" + code.toUpperCase()  + "</a><br><p>to add tracks</p>");
    }


    function load_next(playlist) {
        models.player.playContext(playlist);
        // tracks = playlist.load("tracks").done(function(loadedPlaylist) {
        //     loadedPlaylist.tracks.snapshot().done(function(snapshot) {
        //         if (snapshot.length > 0) {
        //             var firstTrack = snapshot.get(0);
        //             console.log(firstTrack);
        //             // image = Image.forTrack(firstTrack, {player: true});
        //             // $("#single-track-player").html(image.node);
        //             // models.player.playTrack(firstTrack);
        //             // remove_last(firstTrack.uri);
        //         }

        //     });
        // });

        // remove_last();
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
                load_next(playlist);
            });

        }
        load_data();
    }

    function get_code() {
        return current_code;
    }

    function remove_last(url) {
        console.log(url);
        $.post(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + current_code+ "/remove",
            {track_url: url}).done(function(data) {
            // console.log(data);
            console.log(data);
            load_playlist(current_code);
            // window.location.href="spotify:app:queueup:playlist:" + current_code;
        });   
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
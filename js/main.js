var WEB_URL = "http://queueup.herokuapp.com";
// var WEB_URL = "http://localhost:3000";
var WEB_USER_AUTH_PATH = "/user/auth";
var WEB_PLAYLIST_CREATE_PATH = "/playlist/create.json";
var WEB_PLAYLIST_SHOW_PATH = "/playlist"

require([
    '$api/models',
    '$views/list#List',
    '$api/toplists#Toplist'
], function(models, List, Toplist) {
    var spotify_user; //Spotify's user model
    var user; // User object retrieved from server
    var playlist;

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
                    + pl.code + "'>" + pl.code.toUpperCase() + "</a></pre></h2>";
            });
            list_html += "</div>"
            $("#user_playlists").html(list_html);
        });
    }

    function load_playlist(code) {
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
                        start_playlist(playlist);
                    });
                });
            });
        });
    }


    function start_playlist(p) {
        tracks = p.load("tracks").done(function(loadedPlaylist) {
            loadedPlaylist.tracks.snapshot().done(function(snapshot) {
                if (snapshot.length > 0) {
                    var firstTrack = snapshot.get(0);
                    var image = Image.forTrack(firstTrack, {player: true});
                    $("#single-track-player").html(image.node);

                }

            });
        });
    }        




        // var arr = [models.Track.fromURI("spotify:track:64uuKDv6dm6PuUOA3PBQaS")];
        // models.Playlist.createTemporary(code + "_" + new Date().getTime())
        //   .done(function (playlist) {
        //     playlist.tracks.add.apply(playlist.tracks, arr).done(function () {
        //         // Create list
        //         alert();

        //         var list = List.forCollection(playlist, {
        //           style: 'rounded'
        //         });

        //         $('#playlist-player').appendChild(list.node);
        //         list.init();
        //     });
        // });
        // var list = List.forPlaylist(playlistPromise.setDone());

        // document.getElementById('playlist-player').appendChild(list.node);
        // list.init();




        // $("#playlist_view").html(view_html);

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
            load_playlist(code);
        }
    }

    models.application.load('arguments').done(arguments);

    models.application.addEventListener('arguments', arguments);

});

function create_playlist(code) {
    $.post(WEB_URL + WEB_PLAYLIST_CREATE_PATH, {code: code}).done(function(data) {
        console.log(data);
        window.location.href="spotify:app:queueup:playlist:" + code;
    });
}

function join_playlist(code) {
    window.location.href="spotify:app:queueup:playlist:" + code;
}

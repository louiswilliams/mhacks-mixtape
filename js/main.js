 var WEB_URL = "http://queueup.herokuapp.com";
// var WEB_URL = "http://127.0.0.1:3000";
var WEB_USER_AUTH_PATH = "/user/auth";
var WEB_PLAYLIST_CREATE_PATH = "/playlist/create.json";
var WEB_PLAYLIST_SHOW_PATH = "/playlist"

require([
    '$api/models'
], function(models) {
    var spotify_user; //Spotify's user model
    var user; // User object retrieved from server
    var playlists;

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
                playlist = models.Playlist.createTemporary(pl.code);
                if (pl.tracks){
                    $.each(pl.tracks, function(j, tr) {
                        track = models.Track.fromURI(tr.uri);
                    });   
                }

                // playlists.add(value);
                list_html += "<h2><pre class='code'><a href='"
                    + "spotify:app:queueup:playlist:show:"
                    + pl.code + "'>" + pl.code.toUpperCase() + "</a></pre></h2>";
            });
            list_html += "</div>"
            $("#user_playlists").html(list_html);
        });
    }

    function load_playlist(code) {
        $("#playlist_view").slideDown(1000);
        view_html = "<h1 class='center'>Playlist Code: <pre class='code'>";
        view_html += code.toUpperCase() + "</pre></h1>";

        $.get(WEB_URL + WEB_PLAYLIST_SHOW_PATH + "/" + code + ".json")
            .success(function(data) {
                view_html += data;
        });

        $("#playlist_view").html(view_html);

    }

    function arguments() {
        var args = models.application.arguments;
        if (args) {
            var lastArg = args[args.length - 1];
            if (lastArg == 'index') {
                return;
            }
        }

        if (args[0] == "playlist") {
            var action = args[1];
            if (action == "show") {
                var code = args[2];
                load_playlist(code);
            }
            else if (action == "create"){
                create_playlist(function(data) {
                    load_playlist(data.code);
                });
            }
        }
    }

    models.application.load('arguments').done(arguments);

    models.application.addEventListener('arguments', arguments);

});

function create_playlist(code) {
    $.post(WEB_URL + WEB_PLAYLIST_CREATE_PATH, {code: code}).done(function(data) {
        console.log(data);
        alert(data);
    });
}


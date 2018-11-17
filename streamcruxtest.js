const FADE_DELAY = 200;

var state = {
	step: 0,
    game: -1,
    gamename: "",
	type: "",
	popularity: "",
	variety: false
};

var suggestionLoadedCount = 0;
var suggestionLoadedCountBound = 8;
var suggestionData = [];
var userData = {};
var streamData = {};
var gameData = {};

$( "#Logo").css("cursor","pointer").click(function() {
    location.reload()
});

//Hide Streamers and CTA -  and disable clicks on type and popularity
$( document ).ready( function() {
    $("#CTA").css("display","none")
    $("#Streamer-heading").css("display","none")
    $(".type").addClass("non-active").click(function(event){
        event.preventDefault();        
    }).css( {"cursor" : "default" , "pointer-events" : "none"});
    $("#type-heading").addClass("not-active");
    $(".popularity").addClass("non-active").click(function(event){
        event.preventDefault();
    }).css( {"cursor" : "default" , "pointer-events" : "none"});
    $("#popularity-heading").addClass("not-active");
})

//Step 1

//Creates the dropdown by pulling game data and assembling an HTML
$( document ).ready( function() {
    var html = "<div data-delay=\"0\" class=\"w-dropdown\" style><div class=\"game-dropdown w-dropdown-toggle\"><div class=\"w-icon-dropdown-toggle\"></div><div class=\"text-block\" id=\"menu\"><strong>Choose Game</strong></div></div><nav class=\"w-dropdown-list\">"
    requestData( "get_selected_games", null, function( games ) {
        for( var i=0; i<games.length; i++ ) {
            html += "<a href=\"#\" class=\"w-dropdown-link\" id=\"" + games[i]["MasterGameID"] + "\"" + ">" + games[i]["name"] + "</a>";
        };
        html += "</nav>"
        $("#game-dropdown").html( html ); 
        //Resets the webflow.js for dropdown to work
        $( document ).ajaxComplete( function() {
            window.Webflow && window.Webflow.destroy();
            window.Webflow && window.Webflow.ready();
            document.dispatchEvent( new Event( 'readystatechange' ) );
        })
        //Saves the game on click and enables Step 2
        $(".w-dropdown-link").click (function( event ){
            event.preventDefault();
            state["game"] = $( this ).attr( "id" );
            state["gamename"] =  $( this ).text();
            state["variety"] = false;
            $( "#menu" ).text(state["gamename"]).css({"color":"#f1b91e","font-weight":"700"});
            $( ".game-dropdown" ).css( {"background-color":"#080b2e","border":"2px solid #fff"});
            $( ".w-dropdown-list").slideUp("slow");
            //Activates Step 2 - but only for streamers with active streams
            requestData( "get_streamer_types", {s0: state["game"]}, function(streamerTypes){
                for( i=0; i<streamerTypes.length; i++ ) {
                    if( streamerTypes[i]["stream_count"] > 0 ) {
                        $("#" + streamerTypes[i]["streamer_type"]).removeClass("non-active").css( {"cursor" : "pointer" , "pointer-events" : "auto"});
                    }
                }
            })
            $(".game-dropdown").css("pointer-events","none");
            $("#type-heading").removeClass("not-active");
        })        
    })
});

//Step 2

$(".type").click (function( event ){
    event.preventDefault();
    state["type"] = $( this ).attr( "id" );
    $(".type").addClass("non-active").css({"color":"#fff","pointer-events":"none"});
    $( "#" + state["type"]).removeClass("non-active");
    $( this ).css({"color":"#f1b91e"});
    //Activates Step 3 - but only for streamers with active streams
    requestData( "get_popular_streamers", {s0: state["game"], s1: state["type"]}, function(streamerPop){
        for( i=0; i<streamerPop.length; i++ ) {
            if( streamerPop[i]["stream_counts"] > 0 ) {
                $("#" + streamerPop[i]["popularity"]).removeClass("non-active").css( {"cursor" : "pointer" , "pointer-events" : "auto"});
            }
        }
    })
    $("#popularity-heading").removeClass("not-active");
})

//Step 3

$(".popularity").click (function( event ){
    event.preventDefault();
    state["popularity"] = $( this ).attr( "id" );
    $(".popularity").addClass("non-active").css({"color":"#fff","pointer-events:":"none"});
    $( "#" + state["popularity"]).removeClass("non-active");
    $( this ).css({"color":"#f1b91e"});
    if(state["game"] != "-1" && state["type"] != "" && state["popularity"] != "") {
        $("#CTA").css("display","block") 
    }
})


//Results click
$("#CTA").click(function(event){
    event.preventDefault();
    $("#game-section,#type-section,#popularity-section,#cta-section").css("display","none");
    requestData( "get_suggestions" ,  
        {s0: state["game"], 
         s1: state["type"], 
         s2: state["popularity"]},
        function( result ) {
            suggestionLoadedCount = 0;
            suggestionLoadedCountBound = result.length * 3;
            suggestionData = result;
            for( var i=0; i<result.length; i++ ) {
                requestData( "get_user", {s0: result[i]["MasterUserID"]}, function( user ) {
                    userData[user["MasterUserID"]] = user;
                    suggestionLoadedCount++;
                });
                requestData( "get_stream", {s0: result[i]["MasterStreamID"]}, function( stream ) {
                    streamData[stream["MasterStreamID"]] = stream;
                    suggestionLoadedCount++;
                });
                requestData( "get_game", {s0: result[i]["MasterGameID"]}, function( game ) {
                    gameData[game["MasterGameID"]] = game;
                    suggestionLoadedCount++;
                    if( suggestionLoadedCount == suggestionLoadedCountBound ) loadSuggestions();
                });
            };
        })
    })


function loadSuggestions () {
$( document ).ready ( function (){    
    var suggestionhtml = ""
    for( var i=0; i<suggestionData.length; i++){
        // thumbnail
		var src = streamData[suggestionData[i]["MasterStreamID"]]["thumbnail_url"];
		src = src.replace( "{width}", "140");
		src = src.replace( "{height}", "100");
		// Twitch link
        var url = "https://twitch.tv/" + userData[suggestionData[i]["MasterUserID"]]["login"] + " target=\"_blank\"";
        // HTML
        suggestionhtml +="<div class=\"results-box\"><img src=" + src + " alt=\"\"> "
        + "<div class=\"text-block-2\"><strong class=\"streamer-name\">" + userData[suggestionData[i]["MasterUserID"]]["login"] + "</strong></div>"
        + "<div class=\"game-name\">" + gameData[suggestionData[i]["MasterGameID"]]["name"]+ "</div>"
        + "<div class=\"discription-text\">" + userData[suggestionData[i]["MasterUserID"]]["description"] + "</div>"
        + "<a href=" + url + " class=\"watch-on-twitch-button w-button\">Watch on Twitch</a></div>"
        }
        $( document ).ajaxComplete( function() {
            window.Webflow && window.Webflow.destroy();
            window.Webflow && window.Webflow.ready();
            document.dispatchEvent( new Event( 'readystatechange' ) );
        })
    console.log( suggestionhtml )
        $("#streamer-container").html( suggestionhtml );
    $("#Streamer-heading").css("display","block");
})
}


function requestData( cmd, params, callback )
{
    let data = { 
        password: "5Errarehumanumest!",
        command: cmd,
        ...params
    };
    $.ajax({
    url: "https://streamcruxbe1.azurewebsites.net/api/Query2",
    method: "GET",
    data: data,
    dataType: 'json',
    success: callback,
    error: function( jqXHR, txt, ex ) {
        alert( "A connection related error has occured. Please check your internet connection and reload the page." );
        console.log( jqXHR );
        console.log( txt );
        console.log( ex );
        }
    })}

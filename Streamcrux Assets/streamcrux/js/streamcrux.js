const FADE_DELAY = 200;
/*
steps:
	0	start
	1	pick game
	2	pick type
	3	pick popularity
	4	show streams
*/
var state = {
	step: 0,
	game: -1,
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

function displayStep( stepId, keepContent = false )
{
	if( !keepContent ) {
		$( "#content" ).fadeOut( FADE_DELAY, function() {
			$( "#content" ).html( $( "#step"+stepId+" .content-wrapper" ).html() )
				.fadeIn( FADE_DELAY );
		});
	}
	state["step"] = stepId;
	$( "#games" ).fadeOut( FADE_DELAY, function() {
		$( "#games" ).html( $( "#step"+stepId+" .games-wrapper" ).html() );
		fillContent( stepId );
	});
}
function fillContent( stepNr )
{
	switch( stepNr ) {
		case 0:
			document.title = "StreamCrux | Find your favorite streamer!";
			$( "#start-button" ).click( function( event ) {
				event.preventDefault();
				displayStep( 1 );
				window.history.pushState( state, "", "step1" );
			});
			break;
		case 1:
			document.title = "StreamCrux | Choose game";
			var html = '<div class="games-list"><div class="game-card-wrapper">';
			requestData( "get_selected_games", null, function( games ) {
				// check wether step has been updated
				if( state["step"] != 1 ) return;
				for( var i=0; i<games.length; i++ ) {
					var src = games[i]["box_art_url"].replace( "{width}", "285" );
					src = src.replace( "{height}", "380" );
					if( i == games.length-1 ) html += '<div class="game-card" style="width: 144px;">';
					else html += '<div class="game-card">';

					html += '<a href="" class="w-inline-block pick-game-button" data-id="' + games[i]["MasterGameID"] + '">' +
					'<img src="' + src + '" alt="" class="game"></a>' +
          			'<p class="game-name">' + games[i]["name"] + '</p>' +
          			'<p class="active-streams">' + + games[i]["stream_count"] +' Streamers</p></div>';
          			if( (i+1) % 2 == 0 ) {
          				if( (i+1) % 4 == 0 ) {
	          				html += '</div></div><div class="games-list"><div class="game-card-wrapper">';
	          			} else {
	          				html += '</div><div class="game-card-wrapper">';
	          			}
          			}
				}
				html += '</div></div>';
				$( "#games" ).prepend( html );
				// get game names for tracking
				for( i=0; i<games.length; i++ ) {
					requestData( "get_game", {s0: games[i]["MasterGameID"]}, function( game ) {
						$( ".pick-game-button[data-id=" + game["MasterGameID"]+"] .game" ).attr( "id", "game-"+game["name"].replace( / /g, "" ) );
					});
				}
				$( ".pick-game-button" ).click( function( event ) {
					event.preventDefault();
					state["game"] = $( this ).attr( "data-id" );
					state["variety"] = false;
					displayStep( 2 );
					window.history.pushState( state, "", "step2" );
				});
				$( "#variety-button" ).click( function( event ) {
					event.preventDefault();
					state["game"] = 0;
					state["variety"] = true;
					displayStep( 3 );
					window.history.pushState( state, "", "step3" );
				});
				$( "#games" ).fadeIn( FADE_DELAY );
			});
			break;
		case 2:
			document.title = "StreamCrux | Choose type";
			// get stream type
			requestData( "get_streamer_types", {s0: state["game"]}, function( streamerTypes ) {
				// check wether step has been updated
				if( state["step"] != 2 ) return;
				for( i=0; i<streamerTypes.length; i++ ) {
					if( streamerTypes[i]["stream_count"] > 0 ) {
						$( "#streamer-type-"+streamerTypes[i]["streamer_type"] ).click( function( event ) {
							event.preventDefault();
							state["type"] = $( this ).attr( "id" ).substr( 14 );
							if( state["type"] == "tournament" ) {
								state["popularity"] = "all";
								displayStep( 4 );
								window.history.pushState( state, "", "step4" );
							}
							else {
								displayStep( 3 );
								window.history.pushState( state, "", "step3" );
							}
						}).parent().removeClass( "no-options" );
					}
				}
				$( "#games .no-options a" ).click( function( event ) {
					event.preventDefault();
				}).css( "cursor", "default" );
				$( "#help-types" ).click( function() {
					if( $( "#help-types-text" ).css( "display" ) == "none" )
						$( "#help-types-text" ).fadeIn( FADE_DELAY );
					else $( "#help-types-text" ).fadeOut( FADE_DELAY );
				});
				$( "#games" ).fadeIn( FADE_DELAY );
			});
			break;
		case 3:
			document.title = "StreamCrux | Choose popularity";
			var method = "get_popular_streamers";
			if( state["variety"] ) method += "_variety";
			requestData( method, {s0: state["game"], s1: state["type"]}, function( popularities ) {
				// check wether step has been updated
				if( state["step"] != 3 ) return;
				for( i=0; i<popularities.length; i++ ) {
					if( popularities[i]["stream_counts"] > 0 ) {
						$( "#streamer-popularity-"+popularities[i]["popularity"] ).click( function( event ) {
							event.preventDefault();
							state["popularity"] = $( this ).attr( "id" ).substr( 20 );
							displayStep( 4 );
							window.history.pushState( state, "", "step4" );
						}).parent().removeClass( "no-options" );
					}
				}
				$( "#games .no-options a" ).click( function( event ) {
					event.preventDefault();
				}).css( "cursor", "default" );
				$( "#help-popularity" ).click( function() {
					if( $( "#help-popularity-text" ).css( "display" ) == "none" )
						$( "#help-popularity-text" ).fadeIn( FADE_DELAY );
					else $( "#help-popularity-text" ).fadeOut( FADE_DELAY );
				});
				$( "#games" ).fadeIn( FADE_DELAY );
			});
			break;
		case 4:
			document.title = "StreamCrux | Here are some streamer suggestions!";
			var method = "get_suggestions";
			if( state["variety"] ) method += "_variety";
			requestData( method, 
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
							if( suggestionLoadedCount == suggestionLoadedCountBound ) loadSuggestions();
						});
						requestData( "get_stream", {s0: result[i]["MasterStreamID"]}, function( stream ) {
							streamData[stream["MasterStreamID"]] = stream;
							suggestionLoadedCount++;
							if( suggestionLoadedCount == suggestionLoadedCountBound ) loadSuggestions();
						});
						requestData( "get_game", {s0: result[i]["MasterGameID"]}, function( game ) {
							gameData[game["MasterGameID"]] = game;
							suggestionLoadedCount++;
							if( suggestionLoadedCount == suggestionLoadedCountBound ) loadSuggestions();
						});
					}
					$( "#reroll-button" ).click( function( event ) {
						event.preventDefault();
						displayStep( 4, true );
						window.history.pushState( state, "", "step4" );
					});	
					$( "#startover-button" ).click( function( event ) {
						event.preventDefault();
						displayStep( 1 );
						window.history.pushState( state, "", "step1" );
					});
				});
			break;
	}
}
function loadSuggestions()
{
	// check wether step has been updated
	if( state["step"] != 4 ) return;
	var html = '';
	for( i=0; i<suggestionData.length; i++ ) {
		// thumbnail
		var src = streamData[suggestionData[i]["MasterStreamID"]]["thumbnail_url"];
		src = src.replace( "{width}", "280");
		src = src.replace( "{height}", "200");
		// Twitch link
		var url = "https://twitch.tv/" + userData[suggestionData[i]["MasterUserID"]]["login"];
		// User attributes
		var noTags = true;
		var attrCount = 0;
		var tags = '';
		for( var j=1; j<30 && attrCount<5; j++ ) {
			if( userData[suggestionData[i]["MasterUserID"]]["Attribute"+j] ) {
				noTags = false;
				tags += '<div class="tag results-tags"><div>' + userData[suggestionData[i]["MasterUserID"]]["Attribute"+j] + '</div></div>';
				attrCount++;
			}
		}

		html += '<div class="games-list results"><div class="streamer-live">'+
			'<img src="' + src + '" alt="">' + 
			'</div><div class="streamer-info"><div class="twitch-title">' + userData[suggestionData[i]["MasterUserID"]]["description"] + 
			'</div><div class="streamer-name">' + userData[suggestionData[i]["MasterUserID"]]["display_name"] + 
			'</div><div class="twitch-game">' + gameData[suggestionData[i]["MasterGameID"]]["name"] +
			'</div>';
		if( !noTags ) {
			html += '<div class="tag-list results-tags">' + tags + '</div>';
		}

		html += '<a target="_blank" href="' + url + '" class="button twitch-link w-button">Watch on Twitch</a></div></div>';
	}
	$( "#games" ).prepend( html ).fadeIn( FADE_DELAY );
}
function requestData( cmd, params, callback )
{
	let data = { 
		password: 5+ropeDat,
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
	});
}

$( document ).ready( function() {
	window.history.pushState( state, "", "" );
	$( "#start-button" ).click( function( event ) {
		event.preventDefault();
		displayStep( 1 );
		window.history.pushState( state, "", "step1" );
	});
});

window.addEventListener( 'popstate', event => {
	state = window.history.state;
	if( state == null ) {
		state = {
			step: 0,
			game: -1,
			type: "",
			popularity: "",
			variety: false
		};
	}
	displayStep( state["step"] );
}, false );
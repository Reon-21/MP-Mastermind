(function () {
  "use strict";
  const addSound = new Audio("source/addGuess.mp3");
  const removeSound = new Audio("source/removeGuess1.mp3");
  const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';
  let guessCount = 0; // Counter for the number of guesses
  let alertTimeout; // Variable to store the timeout for the alert
  // Create a custom alert element
const alertElement = document.createElement('div');
alertElement.style.position = 'fixed';
alertElement.style.top = '0';
alertElement.style.left = '0';
alertElement.style.width = '100%';
alertElement.style.backgroundColor = '#ff0000';
alertElement.style.color = '#ffffff';
alertElement.style.padding = '10px';
alertElement.style.textAlign = 'center';
alertElement.style.display = 'none';
document.body.appendChild(alertElement);
  var code = [], // Color sequence the player needs to guess
    guess = [], // Color sequence of player's guesses
    options = document.getElementsByClassName("option"), //The colored balls players can choose
    inputRows = document.getElementsByClassName("guess"), //The guess input of the player
    pegContainer = document.getElementsByClassName("peg"), //The black and white pegs to hint the player
    hiddenSockets = document.getElementsByClassName("hidden socket"), //The sequence player has to guess
    modalOverlay = document.getElementById("modalOverlay"),
    modalMessage = document.getElementById("modalMessage"),
    // used in analytics part
    analyticsBoardRadar = document.getElementById('analyticsBoardRadar'),
    analyticsBoardGuess = document.getElementById('analyticsBoardGuess'),
    analyticsNavRadar = document.getElementById("analyticsNavRadar"),
    analyticsNavGuess = document.getElementById("analyticsNavGuess"),
    analyticsBoardExplaination = document.getElementById("analyticsBoardExplaination"),

    // stores data of user guesses and peg results
    analytics_data = {"guesses":[],"results":[]},
    chart_percentages = [50,50,50,50,50,50],
    rowIncrement = 1,
    hintIncrement = 1,
    pegs = {
      1: "orange",
      2: "purple",
      3: "red",
      4: "blue",
      5: "green",
      6: "yellow",
    };

    const speechButton = document.getElementById("speechButton");
            if (speechButton) {
                speechButton.addEventListener("click", startSpeechRecognition);
            }


  function startSpeechRecognition() {
      recognition.start();
  }  

  recognition.onresult = function (event) {
    const last = event.results.length - 1;
    const colorSpoken = event.results[last][0].transcript.toLowerCase().trim();

    // Map spoken color to its corresponding index
    const colorIndex = {
        'orange': 1,
        'purple': 2,
        'red': 3,
        'blue': 4,
        'green': 5,
        'yellow': 6,
        'tangerine': 1, // Additional synonym
        'magenta': 2,
        'crimson': 3, 
        'navy': 4,
        'emerald': 5,
        'gold': 6
    }[colorSpoken];

    // If a valid color is recognized, add it to the ongoing guess
    if (colorIndex && colorIndex >= 1 && colorIndex <= 6) {
      const colorButton = options[colorIndex - 1];
      if (colorButton) {
          insertGuess.call(colorButton);
          guessCount++;
          // Check if the user has made four guesses, and stop recognition if true
          if (guessCount === 4) {
              recognition.stop();
          }
      }
  } else {
      console.log('Invalid color spoken.');
      // Display error message with custom alert
      alertElement.textContent = 'Invalid color spoken. Please try a synonym.';
      alertElement.style.display = 'block';

      // Set timeout to remove the alert after 5 seconds
      alertTimeout = setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
  }
};

// Event handler for speech recognition end
recognition.onend = function () {
  // Reset guess count for the next round
  guessCount = 0;

  if (alertTimeout) {
    clearTimeout(alertTimeout);
    alertTimeout = null;
}
};

  function gameSetup() {
    //Generates the sequence player has to guess
    generateSecretCode(1, 7);

    // Add event listener to every code option button
    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener("click", insertGuess, false);
    };

    // adds event listeners to analytics board
    analyticsNavRadar.addEventListener('click', event =>switch_analytics("radar"))
    analyticsNavGuess.addEventListener('click', event =>switch_analytics("guess"))
    update_analytics(analytics_data)

    // Add event listener to restartGame to restart the game
    document.getElementById("restartGame").onclick = newGame;

    // Add event listener to delete the last guess from the player
    document.getElementById("delete").onclick = deleteLast;
  }

  // Function to handle the insertion of the player guess
  function insertGuess() {
    // Preserve the reference to the current button clicked
    var self = this;

    // Get the slots in the current input row
    var slots =
      inputRows[inputRows.length - rowIncrement].getElementsByClassName(
        "socket"
      );

    // Insert the peg to the corresponding slot on the page
    slots[guess.length].className =
      slots[guess.length].className + " peg " + self.id;

    addSound.currentTime = 0;
    addSound.volume = 0.2;
    addSound.play();

    // Add the guess value by the player to the guess array
    guess.push(+self.value);

    // Check to see if player has inserted all 4 pegs in the row
    if (guess.length === 4) {
      // add guess to analytics_data
      analytics_data["guesses"][analytics_data["guesses"].length] = guess.slice(0)
      // If guess is correct, update the game state to 'won'
      if (compare()) gameState("won");
      // If guess is wrong, increment the row by 1 and continue the game
      else rowIncrement += 1;
    }
    // Check to see if player has used all guesses and not getting a correct guess
    if (rowIncrement === inputRows.length + 1 && !compare()) gameState("lost");
  }

  // Function to compare the player's guess with the generated secret code
  function compare() {
    // Initialize a flag to track if the entire guess matches the secret code
    let isMatch = true;

    // Create a shallow copy of the 'code' array using the spread syntax ('...').
    // This copy will be used for tracking matched pegs without modifying the original 'code' array.
    const codeCopy = [...code];

    // used in analytics
    const analytics_result = []

    // Iterate through each position in the guess
    for (let i = 0; i < code.length; i++) {
      // Get the current peg value in the guess
      const currentGuess = guess[i];

      // Check if the current peg in the guess is in the correct position and has the correct color
      if (currentGuess === code[i]) {
        // If so, insert a 'hit' peg and update arrays accordingly
        insertPeg("hit");
        codeCopy[i] = 0; // Mark the corresponding position in the codeCopy as matched
        guess[i] = -1; // Mark the corresponding position in the guess as used
        // add result to analytics_data
        analytics_result.push("hit")
      } else {
        // If not, set the isMatch flag to false
        isMatch = false;
      }
    }

    // Iterate through the guess again to check for pegs with correct color but in the wrong position
    for (let i = 0; i < code.length; i++) {
      const currentGuess = guess[i];

      // Find the index of the current guess in the codeCopy array
      const matchingIndex = codeCopy.indexOf(currentGuess);

      // Check if the peg with correct color but in the wrong position is found
      if (matchingIndex !== -1) {
        // If so, insert an 'almost' peg and mark the corresponding position in codeCopy as matched
        insertPeg("almost");
        codeCopy[matchingIndex] = 0;

         // add result to analytics_data
         analytics_result.push("almost")
      }
    }

    // add final result to analytics data, then update analytics board
    analytics_data["results"].push(analytics_result)
    update_analytics(analytics_data)

    // Increment the row for hints, reset the guess array, and return the result of the comparison
    hintIncrement += 1;
    guess = [];
    return isMatch;
  }

  // Function to insert peg of a specified type ('almost' or 'hit') into the hint container
  function insertPeg(type) {
    // Get the hint row sockets
    const hintRow = pegContainer[pegContainer.length - hintIncrement];
    const sockets = hintRow.getElementsByClassName("js-hint-socket");

    // Set the class name of the socket in the hint row based on the peg type ('almost' or 'hit')
    sockets[0].className = `socket ${type}`;
  }

  // Function to delete the last peg in the current guess
  function deleteLast() {
    // Check if there are any pegs to delete in the current guess
    if (guess.length !== 0) {
      // Get the slots in the current input row
      const currentRow = inputRows[inputRows.length - rowIncrement];
      const slots = currentRow.getElementsByClassName("socket");

      // Remove the last peg from the current input row
      slots[guess.length - 1].className = "socket";

      removeSound.currentTime = 0;
      removeSound.volume = 0.05;
      removeSound.play();

      // Remove the last peg in the guess array
      guess.pop();
    }
  }

  // Function to start a new game
  function newGame() {
    guess = []; // Reset guess array
    clearBoard(); // Clear the board, removing all guesses and hints
    rowIncrement = 1; // Set the first row of sockets as available for guesses
    hintIncrement = 1; // Set the first row of sockets as available for hints
    hideModal(); // Hide modal
    gameSetup(); // Prepare the game
    document.body.classList.add("body"); // Add class name 'body' to the body element
    console.log("new game started");
  }

  // Function to hide modal
  function hideModal() {
    modalOverlay.className = "";
    document.body.classList.add("body");
    document.body.classList.remove("lost");
    console.log("modal hidden");
  }

  // Function to clear the game board
  function clearBoard() {
    // Clear the guess sockets
    Array.from(inputRows).forEach((row) => {
      // Remove all pegs from the current input rows
      row.innerHTML = "";
      // Add 4 empty sockets to the input rows for the next set of guesses
      Array.from({ length: 4 }, (_, index) => {
        const socket = document.createElement("div");
        socket.className = "socket";
        row.appendChild(socket);
      });
    });

    // Clear the hint sockets
    Array.from(pegContainer).forEach((container) => {
      // Resets all the class names of the hint sockets in each row
      const socketCollection = container.getElementsByClassName("socket");
      Array.from(socketCollection).forEach((socket) => {
        socket.className = "js-hint-socket socket";
      });
    });

    // Reset secret code sockets
    Array.from(hiddenSockets).forEach((socket) => {
      // Hide and reset class names and content of the secret code
      socket.className = "hidden socket";
      socket.innerHTML = "?";
    });

    // reset analytics data
    analytics_data = {"guesses":[],"results":[]}

    document.body.className = ""; // Reset background
  }

  // Creates a color sequence that the player needs to guess
  function generateSecretCode(min, max) {
    for (var i = 0; i < 4; i++)
      // Generates a random number within the specified range (min to max)
      // and assign it to the corresponding position in the code array
      code[i] = Math.floor(Math.random() * (max - min)) + min;

    console.log(code);
  }

  // Once the player runs out of guesses or crack the code - the sequence is revealed
  function revealCode() {
    for (var i = 0; i < hiddenSockets.length; i++) {
      hiddenSockets[i].className += " " + pegs[code[i]];
      hiddenSockets[i].innerHTML = ""; // Remove "?" from the socket
    }
  }

  // Function to handle at the end of the game
  function gameOver() {
    // Disable color options by removing event 'click' listener
    for (var i = 0; i < options.length; i++)
      options[i].removeEventListener("click", insertGuess, false);
    // Calls the revealCOde function to show the secret code
    revealCode();
  }

  function resumeAudio(audioElement) {
    if (audioElement.paused) {
        audioElement.play();
    }
}

  // Function to handle the game state (win or lose)
  function gameState(state) {
    var myaudio = document.getElementById("audioID");
    // Calls gameOver function which disables the color options
    gameOver();
    // Set the class name of the body element to the state (win or lose)
    document.getElementsByTagName("body")[0].className = state;
    // Set the class name of the modal overlay to the specified state
    modalOverlay.className = state;

    // Modal message based on the game state
    if (state === "won") {
      myaudio.pause();
      modalMessage.innerHTML = `
      <h2>You cracked the code!</h2>
      <p>Congratulations! You are awesome!</p>
      <div id="confettiContainer">
        <video class="gifPlayer" "width="100%" height="100%" frameborder="0" allowfullscreen loop autoplay>
          <source src="source/toothless-toothless-dragon.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div style="display: flex">
          <button class="large" style="margin-right:3px;" id="hideModal">OK</button>
          <button class="large1" style="margin-left:3px;" id="restartGame1">Restart</button>
        </div>
      </div>
      <style>
        #modalMessage {
          width: unset;
          height: unset;
        }
      </style>`;
      var audioWon = new Audio(
        "source/toothless-dance-made-with-Voicemod-technology.mp3"
      );
      audioWon.volume = 0.2;
      audioWon.play();
      document.getElementById("restartGame1").onclick = function () {
        audioWon.pause();
        resumeAudio(myaudio);
        newGame();
      };
      document.getElementById("hideModal").onclick = function () {
        audioWon.pause();
        resumeAudio(myaudio);
        hideModal();
      };
      var element1 = document.getElementsByClassName('back-row-toggle splat-toggle');
      var element2 = document.getElementsByClassName('rain front-row');
      var element3 = document.getElementsByClassName('brain back-row');
      for (var i = 0; i < element1.length; i++) {
        element1[i].style.display = 'none';
      }
      for (var i = 0; i < element2.length; i++) {
        element2[i].style.display = 'none';
      }
      for (var i = 0; i < element3.length; i++) {
        element3[i].style.display = 'none';
      }
      showConfetti();
    } else {
      myaudio.pause();
      modalMessage.innerHTML =
        '<img src="https://cdn-cf-east.streamable.com/image/tdsdj9_1.jpg" class="stimpy"><h2>You failed...</h2> <p>You got this! We believe in you!</p> <button class="large" id="hideModal">OK</button> <button class="large1" id="restartGame1">Try again</button><audio autoplay id="myAudio" height="0" width="0"><source src="audio/SAD - SOUND EFFECT.mp3" type="audio/mpeg"</audio>';
      document.getElementById("restartGame1").onclick = function () {
        // Pause the audio when the restartGame1 button is clicked
        let vid = document.getElementById("myAudio");
        vid.pause();
        resumeAudio(myaudio);
        // Call the newGame function or perform any other actions needed for restarting the game
        newGame();
      };
      document.getElementById("hideModal").onclick = function () {
        // Pause the audio when the restartGame1 button is clicked
        let vid = document.getElementById("myAudio");
        vid.pause();
        resumeAudio(myaudio);
        // Call the newGame function or perform any other actions needed for restarting the game
        hideModal();
      };
      makeItRain();
      let vid = document.getElementById("myAudio");
      vid.volume = 0.1;
    }
  }

  // Function to switch between analytics boards
  function switch_analytics (analytics_board_type) {

    // guesses, pegs = analytics_update()
    if (analytics_board_type == "guess") {
      analyticsBoardGuess.style.display = "Block";
      analyticsBoardRadar.style.display = "None";
      analyticsBoardExplaination.innerHTML = "\
      <button class=\"button\">Legend</button>\
          <p>Each square in the guess board represent the possible positions of each colour, with there being 3 possible states for each position</p>\
          <div class=\"analytics_legend\">\
            <div class=\"analytics_container\">\
              <div class=\"analyticsBoardGuess_pegtut\" style=\"font-size: 30px;\">?</div>\
              <p>- Position is still unknown</p>\
            </div>\
            <div class=\"analytics_container\">\
              <div class=\"analyticsBoardGuess_pegtut\" style=\"font-size: 90px;\">X</div>\
              <p>- Position has been eliminated</p>\
            </div>\
            <div class=\"analytics_container\">\
              <div class=\"analyticsBoardGuess_pegtut\" style=\"background-color: gray;\"><span></span></div>\
              <p>- Position can possibly be in pattern</p>\
            </div>\
          </div>"
    } else if (analytics_board_type == "radar") {
      analyticsBoardGuess.style.display = "None"
      analyticsBoardRadar.style.display = "Block"
      analyticsBoardExplaination.innerHTML = "\
      <button class=\"button\">Legend</button>\
      <div class=\"analytics_legend\">\
        <p>The values of the points correspond to the likely percentage that a colour is in the final pattern.</p>\
        <p>e.g. If the Orange axis has a value of 100, it means it will appear within the pattern.</p>\
        <p>Conversely, if the Green Axis has a value of 0, it would not appear within the pattern.</p>\
      </div>"
    }
  }

  // Function to update analytics board after player guess
  function update_analytics (analytics_data) {
    
    const guesses = analytics_data["guesses"]
    const results = analytics_data["results"]

    // at start of game
    if (analytics_data["results"].length === 0) {
      
      // setting radar chart
      const chart_data = [{
        type: 'scatterpolar',
        r: [0,0,0,0,0,0],
        theta: ['Orange','Purple','Red', 'Blue', 'Green', 'Yellow'],
        fill: 'toself'
      }];
      const chart_layout = {
        polar: {radialaxis: {visible: true, range: [0, 100]}},
        showlegend: false,
        width: 400,
        height: 400,
        plot_bgcolor: "rgba(0,0,0,0)",
        paper_bgcolor: "rgba(0,0,0,0)"
      };
      Plotly.newPlot("analyticsBoardRadar", chart_data, chart_layout);

      const guess_row_pegs = document.getElementsByClassName("analyticsBoardGuess_peg")
      for (let i = 0; i < guess_row_pegs.length; i++) {
        guess_row_pegs[i].style.fontSize = "30px"
        guess_row_pegs[i].style.backgroundColor = "transparent"
        guess_row_pegs[i].innerHTML = "?"
      };

      chart_percentages = [50,50,50,50,50,50];

    // after player guess
    } else { 
      // setting radar chart, this is very jank
      const guess = guesses[guesses.length-1] // gets the most recent guess
      const result = results[guesses.length -1] // gets most recent result

      // returns array of unique values
      function onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
      }
      // usage example:
      var unique = guess.filter(onlyUnique); // unqiue is the unique colours within the guess

      // based of each colour being able to appear 671 out of the 1296 possible combiantions
      for (let i = 0; i < guess.length; i++) {
        if (result.length == 0){ // if there are no black/white pegs (all guessed colours confirmed wrong)
          chart_percentages[guess[i] - 1] = 0 // set wrong colour/s to 0

        } else if (result.length <= 2){ // if there are less or equal to 2 black/white pegs
          if (unique.length == 1) { //check if only 1 unique colour 
            chart_percentages[unique[0] - 1] = 100
            
          } else { // if mulitple colours in guess
            for (let j = 0; j < chart_percentages.length; j++) {
              if (unique.includes(j+1)){ // select colour in guess, add 10% chance to it
                if (chart_percentages[j] < 89 && chart_percentages[j] > 10){ // prevents colour from going above 90%
                  chart_percentages[j] += 10
                }
              } else { // select colour in guess, minus 10% chance to it
                if (chart_percentages[j] > 11 && chart_percentages[j] < 90){ // prevents colour from going under 10%
                  chart_percentages[j] -= 10
                }
              }
            }
            break;
          }
        } else if (result.length < 4){ // if there are 3 coloured pegs
            if (unique.length == 1) { //check if only 1 unique colour 
              chart_percentages[unique[0] - 1] = 100
            } else { // if mulitple colours in guess
              for (let j = 0; j < chart_percentages.length; j++) {
                if (unique.includes(j+1)){ // select colour in guess, add 10% chance to it
                  if (chart_percentages[j] < 89 && chart_percentages[j] > 10){ // prevents colour from going above 90%
                    chart_percentages[j] += 10
                  }
                } else { // select colour in guess, minus 10% chance to it
                  if (chart_percentages[j] > 11 && chart_percentages[j] < 90){ // prevents colour from going under 10%
                    chart_percentages[j] -= 10
                  }
                }
              }
              break;
            }
        } else { // if there are 4 black/white pegs (all guessed colours confirmed correct)
          chart_percentages[guess[i] - 1] = 100
          // turn rest of colour percentages into 0
          for (let j = 0; j < chart_percentages.length; j++) {
            if (chart_percentages[j] != 100){
              chart_percentages[j] = 0
            }
          }
        }
      } 

      const chart_data = [{
        type: 'scatterpolar',
        r: chart_percentages,
        theta: ['<b>Orange</b>','Purple','Red', 'Blue', 'Green', 'Yellow'],
        fill: 'toself',
        marker: {
          color:"gray"
        },
      }];
      // add bolded letters to categories
      const chart_layout = {
        polar: {radialaxis: {visible: true, range: [0, 100]}},
        showlegend: false,
        width: 400,
        height: 400,
        plot_bgcolor: "rgba(0,0,0,0)",
        paper_bgcolor: "rgba(0,0,0,0)",
        font:{
          family: "Times New Roman",
          size: 18,
        }
      };
      Plotly.newPlot("analyticsBoardRadar", chart_data, chart_layout);

      // setting guess chart
      // loops through the latest guess made within the analytics data
      for (let i = 0; i < guess.length; i++) {
        //console.log(i)
        if (result.includes("hit")){
          // get analytics peg colour by 
          const colour = get_colour(guess[i])

          const guess_row_colour = document.getElementsByClassName(colour)
          if (guess_row_colour[i].innerHTML != "X"){
            guess_row_colour[i].innerHTML = "<span></span>"
            guess_row_colour[i].style.backgroundColor = "gray"
          }

        } else if (result.includes("almost")){
          // get analytics peg colour by 
          const colour = get_colour(guess[i])

          const guess_row_colour = document.getElementsByClassName(colour)
          guess_row_colour[i].innerHTML = "X"
          guess_row_colour[i].style.fontSize = "90px"

        } else {
          // get analytics peg colour by 
          const colour = get_colour(guess[i])

          const guess_row_colour = document.getElementsByClassName(colour)
          for (let i = 0; i < guess_row_colour.length; i++) {
            guess_row_colour[i].innerHTML = "X"
            guess_row_colour[i].style.fontSize = "90px"
          }
        }
      }
    }
  }

  function get_colour (colour) {
    let analytics_peg_colour = ""
    switch (colour) {
      case 1:
        analytics_peg_colour = "analytics_peg_orange"
        break;
      case 2:
        analytics_peg_colour = "analytics_peg_purple"
        break;
      case 3:
        analytics_peg_colour = "analytics_peg_red"
        break;
      case 4:
        analytics_peg_colour = "analytics_peg_blue"
        break;
      case 5:
        analytics_peg_colour = "analytics_peg_green"
        break;
      case 6:
        analytics_peg_colour = "analytics_peg_yellow"
        break;
      default:
        console.log(colour)
        throw new Error('get_colour did not get a number from 1-6');
    } 
    //console.log(analytics_peg_colour)
    return analytics_peg_colour
  }

  gameSetup(); // Run the game

  function showConfetti() {
    var duration = 5 * 1000;
    var animationEnd = Date.now() + duration;

    var interval = setInterval(function () {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);

      // Adjust origin to bottom left
      confetti({
        particleCount: particleCount,
        spread: 120,
        origin: { x: 0, y: 1 }, // Bottom left corner
        colors: ["#8FBE00", "#ff0000", "#ffffff"],
      });

      // Adjust origin to bottom right
      confetti({
        particleCount: particleCount,
        spread: 120,
        origin: { x: 1, y: 1 }, // Bottom right corner
        colors: ["#8FBE00", "#ff0000", "#ffffff"],
      });

      confetti({
        particleCount: particleCount,
        spread: 120,
        origin: { x: 0.5, y: 0.2 },
        colors: ["#8FBE00", "#ff0000", "#ffffff"],
      });
    }, 250);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var myaudio = document.getElementById("audioID");
    var playButton = document.getElementById("buttonMusic");
    var volumeSlider = document.getElementById("volumeSlider");

    // Set the initial volume based on the default value of the volume slider
    myaudio.volume = parseFloat(volumeSlider.value) / 100;

    playButton.addEventListener("click", function () {
        myaudio.paused
            ? (myaudio.play(), (myaudio.volume = parseFloat(volumeSlider.value) / 100))
            : myaudio.pause();
    });

    volumeSlider.addEventListener("input", function () {
        // Calculate volume based on slider value (ranging from 0 to 100)
        var calculatedVolume = parseFloat(volumeSlider.value) / 100;
        myaudio.volume = calculatedVolume;
    });
});

})();

/* Rain effect */
var makeItRain = function () {
  //clear out everything
  $(".rain").empty();

  var increment = 0;
  var drops = "";
  var backDrops = "";

  while (increment < 100) {
    //couple random numbers to use for various randomizations
    //random number between 98 and 1
    var randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
    //random number between 5 and 2
    var randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);
    //increment
    increment += randoFiver;
    //add in a new raindrop with various randomizations to certain CSS properties
    drops +=
      '<div class="drop" style="left: ' +
      increment +
      "%; bottom: " +
      (randoFiver + randoFiver - 1 + 100) +
      "%; animation-delay: 0." +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"><div class="stem" style="animation-delay: 0.' +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"></div><div class="splat" style="animation-delay: 0.' +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"></div></div>';
    backDrops +=
      '<div class="drop" style="right: ' +
      increment +
      "%; bottom: " +
      (randoFiver + randoFiver - 1 + 100) +
      "%; animation-delay: 0." +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"><div class="stem" style="animation-delay: 0.' +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"></div><div class="splat" style="animation-delay: 0.' +
      randoHundo +
      "s; animation-duration: 0.5" +
      randoHundo +
      's;"></div></div>';
  }

  $(".rain.front-row").append(drops);
  $(".rain.back-row").append(backDrops);
};

$(".splat-toggle.toggle").on("click", function () {
  $("body").toggleClass("splat-toggle");
  $(".splat-toggle.toggle").toggleClass("active");
  makeItRain();
});

$(".back-row-toggle.toggle").on("click", function () {
  $("body").toggleClass("back-row-toggle");
  $(".back-row-toggle.toggle").toggleClass("active");
  makeItRain();
});

$(".single-toggle.toggle").on("click", function () {
  $("body").toggleClass("single-toggle");
  $(".single-toggle.toggle").toggleClass("active");
  makeItRain();
});

makeItRain();

var isMuted = false;
function toggleMute() {
  isMuted = !isMuted;
  var musicIcon = document.getElementById("musicIcon");

  if (isMuted) {
    musicIcon.classList.remove("fa-volume-up");
    musicIcon.classList.add("fa-volume-mute");
  } else {
    musicIcon.classList.remove("fa-volume-mute");
    musicIcon.classList.add("fa-volume-up");
  }
}

/* Internet Connection Detection */
//To detect online/offline status

const checkOnlineStatus = () => {
  return new Promise(async (resolve) => {
    let resolved = false;
    // requests longer than 15 seconds are considered "offline"
    const timer = setTimeout(() => {
      resolved = true;
      resolve(false);
    }, 15000);

    try {
      const online = await fetch("index.html");
      clearTimeout(timer);
      if (!resolved) {
        resolve(online.status >= 200 && online.status < 300); // either true or false
      }
    } catch (err) {
      if (!resolved) {
        resolve(false); // definitely offline
      }
    }
  });
};

(function pollOnlineStatus() {
  setTimeout(async () => {
    const result = await checkOnlineStatus();
    const statusDisplay = document.getElementById("status");
    statusDisplay.textContent = result ? "Online" : "OFFline";
    pollOnlineStatus(); // self-calling timeout is better than setInterval for this
  }, 3000);
})()

window.addEventListener("load", async (event) => {
  const statusDisplay = document.getElementById("status");
  statusDisplay.textContent = (await checkOnlineStatus())
    ? "Online"
    : "OFFline";
});

//Dark-light mode
document.addEventListener("DOMContentLoaded", function () {
  const themeToggleButton = document.getElementById("themeToggleButton");
  
  if (themeToggleButton) {
      themeToggleButton.addEventListener("click", toggleTheme);
  }

  function toggleTheme() {
      document.body.classList.toggle("dark-theme");
  }
});
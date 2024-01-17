(function () {
    'use strict';
  
    var code = [], // Color sequence the player needs to guess
        guess = [], // Color sequence of player's guesses
        options = document.getElementsByClassName('option'), //The colored balls players can choose
        inputRows = document.getElementsByClassName('guess'), //The guess input of the player
        pegContainer = document.getElementsByClassName('peg'), //The black and white pegs to hint the player
        hiddenSockets = document.getElementsByClassName('hidden socket'), //The sequence player has to guess
        modalOverlay = document.getElementById('modalOverlay'),
        modalMessage = document.getElementById('modalMessage'),
        // used in analytics part
        analyticsBoardRadar = document.getElementById('analyticsBoardRadar'),
        analyticsBoardGuess = document.getElementById('analyticsBoardGuess'),
        analyticsNavRadar = document.getElementById("analyticsNavRadar"),
        analyticsNavGuess = document.getElementById("analyticsNavGuess"),

        analytics_peg_orange = document.getElementsByClassName("analytics_peg_orange"),
        // stores data of user guesses and peg results
        analytics_data = {"guesses":[],"results":[]},

        rowIncrement = 1, 
        hintIncrement = 1,
        pegs = {
          1: 'orange',
          2: 'purple',
          3: 'red',
          4: 'blue',
          5: 'green',
          6: 'yellow'
        };
  
    function gameSetup () {
      //Generates the sequence player has to guess
      generateSecretCode(1, 7);
  
      // Add event listener to every code option button
      for (var i = 0; i < options.length; i++){
        options[i].addEventListener('click', insertGuess, false);
      };
      
      // adds event listeners to analytics board
      analyticsNavRadar.addEventListener('click', event =>switch_analytics("radar"))
      analyticsNavGuess.addEventListener('click', event =>switch_analytics("guess"))
      update_analytics(analytics_data)

      // Add event listener to restartGame to restart the game
      document.getElementById('restartGame').onclick = newGame;
  
      // Add event listener to delete the last guess from the player
      document.getElementById('delete').onclick = deleteLast;
    }
  
    // Function to handle the insertion of the player guess 
    function insertGuess () {
      // Preserve the reference to the current button clicked
      var self = this;
  
      // Get the slots in the current input row
      var slots = inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');
  
      // Insert the peg to the corresponding slot on the page
      slots[guess.length].className = slots[guess.length].className + ' peg ' + self.id;
  
      // Add the guess value by the player to the guess array
      guess.push(+(self.value));
  
      // Check to see if player has inserted all 4 pegs in the row
      if (guess.length === 4) {
        // add guess to analytics_data
        analytics_data["guesses"][analytics_data["guesses"].length] = guess.slice(0)

        // If guess is correct, update the game state to 'won'
        if (compare())
          gameState('won');
        else
        // If guess is wrong, increment the row by 1 and continue the game 
          rowIncrement += 1;
      }
      // Check to see if player has used all guesses and not getting a correct guess
      if ( rowIncrement === inputRows.length + 1 && !compare() )
        gameState('lost');
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
          insertPeg('hit');
          codeCopy[i] = 0;  // Mark the corresponding position in the codeCopy as matched
          guess[i] = -1;    // Mark the corresponding position in the guess as used

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
          insertPeg('almost');
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
      const sockets = hintRow.getElementsByClassName('js-hint-socket');
    
      // Set the class name of the socket in the hint row based on the peg type ('almost' or 'hit')
      sockets[0].className = `socket ${type}`;
    }
  
    // Function to delete the last peg in the current guess
    function deleteLast() {
      // Check if there are any pegs to delete in the current guess
      if (guess.length !== 0) {
        // Get the slots in the current input row
        const currentRow = inputRows[inputRows.length - rowIncrement];
        const slots = currentRow.getElementsByClassName('socket');
    
        // Remove the last peg from the current input row
        slots[guess.length - 1].className = 'socket';
    
        // Remove the last peg in the guess array
        guess.pop();
      }
    }
  
    // Function to start a new game
    function newGame () {
      guess = [];        // Reset guess array
      clearBoard();      // Clear the board, removing all guesses and hints
      rowIncrement = 1;  // Set the first row of sockets as available for guesses
      hintIncrement = 1; // Set the first row of sockets as available for hints
      hideModal();       // Hide modal
      gameSetup();       // Prepare the game
      document.body.classList.add('body'); // Add class name 'body' to the body element
      console.log('new game started')
    }
  
    // Function to hide modal
    function hideModal () {
      modalOverlay.className = '';
      console.log('modal hidden')
    }
  
    // Function to clear the game board
    function clearBoard() {
      // Clear the guess sockets
      Array.from(inputRows).forEach(row => {
        // Remove all pegs from the current input rows
        row.innerHTML = '';
        // Add 4 empty sockets to the input rows for the next set of guesses
        Array.from({ length: 4 }, (_, index) => {
          const socket = document.createElement('div');
          socket.className = 'socket';
          row.appendChild(socket);
        });
      });
    
      // Clear the hint sockets
      Array.from(pegContainer).forEach(container => {
        // Resets all the class names of the hint sockets in each row
        const socketCollection = container.getElementsByClassName('socket');
        Array.from(socketCollection).forEach(socket => {
          socket.className = 'js-hint-socket socket';
        });
      });
    
      // Reset secret code sockets
      Array.from(hiddenSockets).forEach(socket => {
        // Hide and reset class names and content of the secret code
        socket.className = 'hidden socket';
        socket.innerHTML = '?';
      });
      
      // reset analytics data
      analytics_data = {"guesses":[],"results":[]}

      document.body.className = ''; // Reset background
    }
  
    // Creates a color sequence that the player needs to guess
    function generateSecretCode (min, max) {
      for (var i = 0; i < 4; i++)
        // Generates a random number within the specified range (min to max)
        // and assign it to the corresponding position in the code array
        code[i] = Math.floor(Math.random() * (max - min)) + min;
    }
  
    // Once the player runs out of guesses or crack the code - the sequence is revealed
    function revealCode () {
      for (var i = 0; i < hiddenSockets.length; i++) {
        hiddenSockets[i].className += ' ' + pegs[code[i]];
        hiddenSockets[i].innerHTML = ''; // Remove "?" from the socket
      }
    }
  
    // Function to handle at the end of the game
    function gameOver () {
      // Disable color options by removing event 'click' listener
      for (var i = 0; i < options.length; i++)
        options[i].removeEventListener('click', insertGuess, false);
      // Calls the revealCOde function to show the secret code
      revealCode();
    }
  
    // Function to handle the game state (win or lose)
    function gameState (state) {
      // Calls gameOver function which disables the color options
      gameOver();
      // Set the class name of the body element to the state (win or lose)
      document.getElementsByTagName('body')[0].className = state;
      // Set the class name of the modal overlay to the specified state
      modalOverlay.className = state;
  
      // Modal message based on the game state
      if (state === 'won') {
        modalMessage.innerHTML = '<h2>You cracked the code!</h2> <p>Congratulations! You are awesome!</p> <button class="large" id="hideModal">OK</button> <button class="button" id="restartGame1">Restart</button>';
        document.getElementById('restartGame1').onclick = newGame;
        document.getElementById('hideModal').onclick = hideModal;
      } else{
        modalMessage.innerHTML = '<h2>You failed...</h2> <p>You got this! We believe in you!</p> <button class="large" id="hideModal">OK</button> <button class="button" id="restartGame1">Try again</button>';
        document.getElementById('restartGame1').onclick = newGame;
        document.getElementById('hideModal').onclick = hideModal;
      }
    }

    // Function to switch between analytics boards
    function switch_analytics (analytics_board_type) {

      // guesses, pegs = analytics_update()
      if (analytics_board_type == "guess") {
        analyticsBoardGuess.style.display = "Block";
        analyticsBoardRadar.style.display = "None";
      } else if (analytics_board_type == "radar") {
        analyticsBoardGuess.style.display = "None"
        analyticsBoardRadar.style.display = "Block"
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
          theta: ['orange','purple','red', 'blue', 'green', 'yellow'],
          fill: 'toself'
        }];
        const chart_layout = {
          polar: {radialaxis: {visible: true, range: [0, 100]}},
          showlegend: false,
          width: 400,
          height: 400,
          plot_bgcolor: "rgba(255,248,220,255)",
          paper_bgcolor: "rgba(255,248,220,255)"
        };
        Plotly.newPlot("analyticsBoardRadar", chart_data, chart_layout);

        const guess_row_pegs = document.getElementsByClassName("analyticsBoardGuess_peg")
        for (let i = 0; i < guess_row_pegs.length; i++) {
          guess_row_pegs[i].innerHTML = "?"
        };

      // after player guess
      } else { 
        // setting radar chart
        const chart_data = [{
          type: 'scatterpolar',
          r: [100,100,100,100,100,100],
          theta: ['orange','purple','red', 'blue', 'green', 'yellow'],
          fill: 'toself'
        }];
        const chart_layout = {
          polar: {radialaxis: {visible: true, range: [0, 100]}},
          showlegend: false,
          width: 400,
          height: 400,
          plot_bgcolor: "rgba(255,248,220,255)",
          paper_bgcolor: "rgba(255,248,220,255)"
        };
        Plotly.newPlot("analyticsBoardRadar", chart_data, chart_layout);

        // setting guess chart
        // loops through the latest guess made within the analytics data
        const guess = guesses[guesses.length-1] // gets the most recent guessz
        for (let i = 0; i < guess.length; i++) {
          //console.log(i)
          if (results[guesses.length -1].includes("hit")){
            // get analytics peg colour by 
            const colour = get_colour(guess[i])

            const guess_row_colour = document.getElementsByClassName(colour)
            if (guess_row_colour[i].innerHTML != "X"){
              guess_row_colour[i].innerHTML = "black"
            }

          } else if (results[guesses.length -1].includes("almost")){
            // get analytics peg colour by 
            const colour = get_colour(guess[i])

            const guess_row_colour = document.getElementsByClassName(colour)
            guess_row_colour[i].innerHTML = "X"

          } else {
            // get analytics peg colour by 
            const colour = get_colour(guess[i])

            const guess_row_colour = document.getElementsByClassName(colour)
            for (let i = 0; i < guess_row_colour.length; i++) {
              guess_row_colour[i].innerHTML = "X"
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
  }());

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
    }
    
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
  function compare () {
    // To track if the guess matches with the secret code
    var isMatch = true;

    // To create a copy of the secret code to track the matched pegs
    var codeCopy = code.slice(0);

    // First check if there are any pegs that are the right color in the right place
    for (var i = 0; i < code.length; i++) {
      // If peg is the right color and right place it will insert a 'hit' peg in the hint rows
      if (guess[i] === code[i]) {
        insertPeg('hit');

        // To mark the corresponding positions in the codeCopy and guess arrays
        codeCopy[i] = 0;
        guess[i] = -1;
      } else
        // If any peg is not in the right place, set isMatch as false.
        isMatch = false;
    }

    // Then check if there are any pegs that are the right color but NOT in the right place
    for (var y = 0; y < code.length; y++) {
      if (codeCopy.indexOf(guess[y]) !== -1) {
        // If peg is the right color but in the wrong place, insert an 'almost' in the hint rows
        insertPeg('almost');

        //mark the corresponding position in the codeCopy array
        codeCopy[codeCopy.indexOf(guess[y])] = 0;
      }
    }

    hintIncrement += 1; // Set the next row of hints as available
    guess = [];         // Reset guess sequence
    
    // Return whether the guess matches with the secret code
    return isMatch;
  }

  // Function to insert peg of a specified type ('almost' or 'hit') into the hint container
  function insertPeg (type) {

    // Get the hint row sockets
    var sockets = pegContainer[pegContainer.length - hintIncrement].getElementsByClassName('js-hint-socket');

    // Set the class name of the socket in the hint row based on the peg type ('almost' or 'hit')
    sockets[0].className = 'socket ' + type;
  }

  // Function to delete the last peg in the current guess
  function deleteLast () {
    // Check if there are any pegs to delete in the current guess
    if (guess.length !== 0) {
      // Get the slots in the current input row
      var slots = inputRows[inputRows.length - rowIncrement].getElementsByClassName('socket');

      // Remove the last peg from the current input row
      slots[guess.length - 1].className = 'socket'; // Insert node into page

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
    console.log('new game started')
  }

  // Function to hide modal
  function hideModal () {
    modalOverlay.className = '';
    console.log('modal hidden')
  }

  // Function to clear the game board
  function clearBoard () {
    // Clear the guess sockets
    for (var i = 0; i < inputRows.length; i++) {
      // Remove all pegs from the current input rows
      inputRows[i].innerHTML = '';
      // Add 4 empty sockets to the input rows for the next set of guesses
      for (var y = 0; y < 4; y++) {
        var socket = document.createElement('div');
        socket.className = 'socket';
        inputRows[i].appendChild(socket);
      }
    }

    // Clear the hint sockets
    for (var i = 0; i < pegContainer.length; i++) {
      // Resets all the class names of the hint sockets in each row
      var socketCollection = pegContainer[i].getElementsByClassName('socket');
      for (var y = 0; y < 4; y++) {
        socketCollection[y].className = 'js-hint-socket socket';
      }
    }

    // Reset secret code sockets
    for (var i = 0; i < hiddenSockets.length; i++) {
      // Hide and reset class names and content of the secret code
      hiddenSockets[i].className = 'hidden socket';
      hiddenSockets[i].innerHTML = '?';
    }

    document.getElementsByTagName('body')[0].className = ''; // Reset background
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

  gameSetup(); // Run the game
}());

/* Collapsible */
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}
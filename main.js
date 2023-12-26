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
  function compare() {
    // Initialize a flag to track if the entire guess matches the secret code
    let isMatch = true;
  
    // Create a shallow copy of the 'code' array using the spread syntax ('...').
    // This copy will be used for tracking matched pegs without modifying the original 'code' array.
    const codeCopy = [...code];
  
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
      }
    }
  
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
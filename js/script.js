const game = document.querySelector("#game-container");
game.style.display = "none";
const gameOverInfo = document.querySelector("#gameover-info");
const playerButtons = document.querySelector("#player-buttons");
const allButtons = document.querySelectorAll(".button");
const computerButtons = document.querySelectorAll(".computer-button");
const highscoreDiv = document.querySelector("#highscore");
let username;
const baseUrl = `https://minprojekt1-js2-default-rtdb.europe-west1.firebasedatabase.app/`;

let playerPoints = 0;
let computerPoints = 0;

document.querySelector("#name-button").addEventListener("click", displayGame);

// tar bort gamla introt och visar själva spelet
function displayGame() {
  username = document.querySelector("#name-input").value;
  const newIntro = document.querySelector("#new-intro");
  newIntro.innerText = `Välkommen, ${username}! Universums öde ligger i dina händer. Välj sten, sax eller påse till vänster. Ondskan gör sedan sitt val till höger. Ditt äventyr är över när Ondskan fått ett poäng.`;
  game.style.display = "block";
  printHighscore();
  document.querySelector("#first-intro").remove();
  gameOverInfo.style.display = "none";

  playerButtons.addEventListener("click", getChoicesAndCompare);
}

// funktion som hämtar ens val, gör datorns val, visar detta med färger, och sedan jämför för att se vem som vann tills datorn fått sitt första poäng
function getChoicesAndCompare(event) {
  if (event.target.tagName == "IMG") {
    let playerChoice = event.target.id;
    let computerChoice = Math.floor(Math.random() * 3);

    // loop som tar bort den klass som visar vad användaren + datorn valde, dvs nollställer sedan förra valet
    for (let i = 0; i < allButtons.length; i++) {
      allButtons[i].classList.remove("choice-marker");
      allButtons[i].classList.remove("random-marker");
    }

    // lägger till klass för att visa valen
    event.target.classList.add("choice-marker");
    computerButtons[computerChoice].classList.add("random-marker");

    // kollar vem som vann
    if (
      (playerChoice == 0 && computerChoice == 1) ||
      (playerChoice == 1 && computerChoice == 2) ||
      (playerChoice == 2 && computerChoice == 0)
    ) {
      playerPoints++;
    } else if (
      (computerChoice == 0 && playerChoice == 1) ||
      (computerChoice == 1 && playerChoice == 2) ||
      (computerChoice == 2 && playerChoice == 0)
    ) {
      computerPoints++;
    }
    displayPoints();

    // när datorn fått sitt första poäng förlorar man. jämför användarens poäng med databasen
    if (computerPoints == 1) {
      const playerObj = {
        user: username,
        score: playerPoints,
      };
      compareWithDatabase(playerObj).then(setTimeout(printHighscore, 200));
    }
  }
}

// skriver ut poäng
function displayPoints() {
  document.querySelector(
    "#player-score"
  ).innerText = `Dina poäng: ${playerPoints}`;
  document.querySelector(
    "#computer-score"
  ).innerText = `Ondskans poäng: ${computerPoints}/1`;
}

//funktion som skriver ut game over-info och visar "spela igen"-knappen, som resettar spelet
function gameOver(text, highscoreColor) {
  gameOverInfo.style.display = "block";
  document.querySelector("#gameover-text").innerText = `${text}`;
  document.body.style.backgroundColor = "indianred";
  highscoreDiv.style.backgroundColor = `${highscoreColor}`;
  playerButtons.removeEventListener("click", getChoicesAndCompare);

  document.querySelector("#restart").addEventListener("click", function () {
    playerPoints = 0;
    computerPoints = 0;
    displayPoints();
    gameOverInfo.style.display = "none";
    document.body.style.backgroundColor = "azure";
    highscoreDiv.style.backgroundColor = "azure";
    for (let i = 0; i < allButtons.length; i++) {
      allButtons[i].classList.remove("choice-marker");
      allButtons[i].classList.remove("random-marker");
    }
    playerButtons.addEventListener("click", getChoicesAndCompare);
  });
}

// funktion som jämför highscore i databasen med spelarobjektet
async function compareWithDatabase(playerObj) {
  const data = await getData();
  const highscoreArray = Object.values(data);

  // variabel (index) som innehåller indexet för första poängen som är mindre än den nya. dvs nya poängens placering i databasen. (OBS: -1 om ej hittad)
  const index = highscoreArray.findIndex(firstSmallerScore);

  function firstSmallerScore(obj) {
    return obj.score < playerObj.score;
  }

  // kollar om man kom med på topplistan (index -1 = mindre poäng hittades inte => ej med på topplistan och ej in i databasen)
  if (index >= 0) {
    gameOver(
      "Ondskan vann, men du kom i alla fall med på topplistan!",
      "lightgreen"
    );
    highscoreArray.splice(index, 0, playerObj); // lägger in spelarobjektet på indexet vi nyss letat fram
    let popped = highscoreArray.pop(); // tar bort det sista objektet i arrayen

    // skickar in varje objekt till databasen
    for (let i = 0; i < highscoreArray.length; i++) {
      put(highscoreArray[i], i);
    }
  } else {
    gameOver(
      "Ondskan vann, och du kom inte ens med på topplistan...",
      "firebrick"
    );
  }
}

// hämtar data från databasen
async function getData() {
  const url = baseUrl + ".json";

  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// skickar in objekt till databasen på bestämt index
async function put(obj, index) {
  const url = `${baseUrl}${index}.json`;

  const init = {
    method: "PUT",
    body: JSON.stringify(obj),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  };
  const response = await fetch(url, init);
  const data = await response.json();
  return data;
}

// skriver ut topplista
async function printHighscore() {
  const info = await getData();
  highscoreDiv.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const p = document.createElement("p");
    highscoreDiv.append(p);
    p.innerText = `${1 + i}. ${info[i].user}: Score: ${info[i].score}`;
  }
}

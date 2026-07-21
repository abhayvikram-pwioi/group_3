// =========================================================
// TASKFLOW LOGIN - login.js
// Beginner friendly vanilla JavaScript
// =========================================================

// If someone is already logged in, skip straight to the board.
var existingUser = sessionStorage.getItem("loggedInUser");
if (existingUser) {
  window.location.href = "index.html";
}

var loginForm = document.getElementById("loginForm");
var usernameField = document.getElementById("username");
var passwordField = document.getElementById("password");
var loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  loginError.textContent = "";

  var usernameValue = usernameField.value.trim();
  var passwordValue = passwordField.value;

  if (usernameValue === "" || passwordValue === "") {
    loginError.textContent = "Please enter both username and password.";
    return;
  }

  // users.json holds the fixed list of accounts for this demo app.
  fetch("users.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (users) {
      var matchedUser = null;

      for (var i = 0; i < users.length; i++) {
        if (users[i].username === usernameValue && users[i].password === passwordValue) {
          matchedUser = users[i];
          break;
        }
      }

      if (matchedUser) {
        // Store the logged-in user for the rest of this browser tab session.
        sessionStorage.setItem("loggedInUser", JSON.stringify(matchedUser));
        window.location.href = "index.html";
      } else {
        loginError.textContent = "Invalid username or password.";
      }
    })
    .catch(function () {
      loginError.textContent = "Could not load user data. Please try again.";
    });
});

// This single file handles:
// - Admin login
// - Attendee login
// - Admin dashboard (add, edit, delete events, dynamic summary counts)
// - Attendee dashboard (search, category filter, view details, register, cancel, My Events)

var adminLoginBtn = document.getElementById("adminLoginBtn");
var attendeeLoginBtn = document.getElementById("attendeeLoginBtn");

// Admin login page
if (adminLoginBtn) {

  adminLoginBtn.addEventListener("click", function () {

    var enteredUsername = document.getElementById("username").value;
    var enteredPassword = document.getElementById("password").value;

    if (enteredUsername === "" || enteredPassword === "") {
      alert("Please enter both username and password.");
      return;
    }

    fetch("users.json")
      .then(function (response) {
        return response.json();
      })
      .then(function (userData) {

        if (enteredUsername === userData.admin.username && enteredPassword === userData.admin.password) {
          window.location.href = "admin.html";
        } else {
          alert("Invalid Username or Password");
        }

      })
      .catch(function (error) {
        console.log("Error loading user data:", error);
      });

  });

}

// Attendee login page
if (attendeeLoginBtn) {

  attendeeLoginBtn.addEventListener("click", function () {

    var enteredUsername = document.getElementById("username").value;
    var enteredPassword = document.getElementById("password").value;

    if (enteredUsername === "" || enteredPassword === "") {
      alert("Please enter both username and password.");
      return;
    }

    fetch("users.json")
      .then(function (response) {
        return response.json();
      })
      .then(function (userData) {

        var attendeeList = userData.attendees;
        var found = false;

        for (var i = 0; i < attendeeList.length; i++) {
          if (attendeeList[i].username === enteredUsername && attendeeList[i].password === enteredPassword) {
            found = true;
            break;
          }
        }

        if (found) {
          window.location.href = "attendee.html";
        } else {
          alert("Invalid Username or Password");
        }

      })
      .catch(function (error) {
        console.log("Error loading user data:", error);
      });

  });

}

/* =========================================================
   SHARED EVENT DATA (used by admin summary calculations
   and by the attendee dashboard). Declared here, near the
   top of the file, so it exists before anything below
   tries to read it.
========================================================= */

var attendeeEvents = [
  { name: "Frontend Bootcamp", category: "Technology", date: "2026-06-20", time: "10:00 AM", venue: "Community Hall", description: "Hands-on session on building responsive websites using HTML and CSS.", maxSeats: 60, availableSeats: 15 },
  { name: "Web Dev Workshop", category: "Workshop", date: "2026-06-22", time: "11:00 AM", venue: "Lab 3", description: "A beginner friendly workshop covering HTML, CSS and JavaScript basics.", maxSeats: 40, availableSeats: 3 },
  { name: "Cultural Night", category: "Cultural", date: "2026-06-25", time: "6:00 PM", venue: "Main Auditorium", description: "An evening of music, dance and drama performances by students.", maxSeats: 300, availableSeats: 120 },
  { name: "Inter-College Football", category: "Sports", date: "2026-06-27", time: "4:00 PM", venue: "Sports Ground", description: "Football match between teams from nearby colleges.", maxSeats: 200, availableSeats: 80 },
  { name: "Code Sprint 24hr", category: "Hackathon", date: "2026-07-01", time: "9:00 AM", venue: "Innovation Lab", description: "A 24 hour hackathon where teams build projects on given problem statements.", maxSeats: 80, availableSeats: 4 },
  { name: "AI in Real World", category: "Seminar", date: "2026-07-03", time: "2:00 PM", venue: "Seminar Hall", description: "Guest lecture on real world applications of artificial intelligence.", maxSeats: 150, availableSeats: 60 },
  { name: "Campus Placement Drive", category: "Placement", date: "2026-07-06", time: "9:30 AM", venue: "Placement Cell", description: "On-campus placement drive for final year students.", maxSeats: 100, availableSeats: 0 },
  { name: "Code Wars", category: "Coding Contest", date: "2026-07-09", time: "1:00 PM", venue: "Computer Lab 1", description: "Competitive programming contest with problems of varying difficulty.", maxSeats: 90, availableSeats: 40 },
  { name: "Photography Workshop", category: "Workshop", date: "2026-07-12", time: "10:00 AM", venue: "Seminar Hall", description: "Learn the basics of photography including composition and lighting.", maxSeats: 50, availableSeats: 20 }
];

/* =========================================================
   ADMIN DASHBOARD
   Events are stored in a simple array. Add, Edit and Delete
   all work on this array, then the table and summary numbers
   are re-drawn. This data is not saved anywhere, so it
   resets on refresh.
========================================================= */

var adminEvents = [
  { name: "Frontend Bootcamp", category: "Technology", date: "2026-06-20", venue: "Community Hall" },
  { name: "Web Dev Workshop", category: "Workshop", date: "2026-06-22", venue: "Lab 3" },
  { name: "Cultural Night", category: "Cultural", date: "2026-06-25", venue: "Main Auditorium" },
  { name: "Inter-College Football", category: "Sports", date: "2026-06-27", venue: "Sports Ground" },
  { name: "Code Sprint 24hr", category: "Hackathon", date: "2026-07-01", venue: "Innovation Lab" },
  { name: "AI in Real World", category: "Seminar", date: "2026-07-03", venue: "Seminar Hall" },
  { name: "Campus Placement Drive", category: "Placement", date: "2026-07-06", venue: "Placement Cell" },
  { name: "Code Wars", category: "Coding Contest", date: "2026-07-09", venue: "Computer Lab 1" },
  { name: "Photography Workshop", category: "Workshop", date: "2026-07-12", venue: "Seminar Hall" }
];

// -1 means we are adding a new event, otherwise it holds the index being edited
var editIndex = -1;

var eventTableBody = document.getElementById("eventTableBody");
var saveEventBtn = document.getElementById("saveEventBtn");
var resetEventBtn = document.getElementById("resetEventBtn");
var totalEventsCount = document.getElementById("totalEventsCount");
var totalRegistrationsCount = document.getElementById("totalRegistrationsCount");
var totalSeatsCount = document.getElementById("totalSeatsCount");

function renderAdminEvents() {

  eventTableBody.innerHTML = "";

  for (var i = 0; i < adminEvents.length; i++) {

    var ev = adminEvents[i];
    var row = document.createElement("tr");

    row.innerHTML =
      "<td>" + ev.name + "</td>" +
      "<td>" + ev.category + "</td>" +
      "<td>" + ev.date + "</td>" +
      "<td>" + ev.venue + "</td>" +
      "<td>" +
      "<button class='edit-btn' data-index='" + i + "'>Edit</button> " +
      "<button class='delete-btn' data-index='" + i + "'>Delete</button>" +
      "</td>";

    eventTableBody.appendChild(row);

  }

}

// Reads the number of events and the seat/registration numbers
// (from the attendee event list declared above) and updates
// the summary cards on the admin dashboard.
function renderAdminSummary() {

  totalEventsCount.textContent = adminEvents.length;

  var registrations = 0;
  var seatsLeft = 0;

  for (var i = 0; i < attendeeEvents.length; i++) {
    registrations = registrations + (attendeeEvents[i].maxSeats - attendeeEvents[i].availableSeats);
    seatsLeft = seatsLeft + attendeeEvents[i].availableSeats;
  }

  totalRegistrationsCount.textContent = registrations;
  totalSeatsCount.textContent = seatsLeft;

}

function clearEventForm() {
  document.getElementById("eventName").value = "";
  document.getElementById("eventCategory").value = "";
  document.getElementById("eventDescription").value = "";
  document.getElementById("eventVenue").value = "";
  document.getElementById("eventDate").value = "";
  document.getElementById("eventTime").value = "";
  document.getElementById("eventSeats").value = "";
  document.getElementById("eventBanner").value = "";
}

if (eventTableBody) {

  renderAdminEvents();
  renderAdminSummary();

  // One click listener on the table body handles both Edit and Delete
  eventTableBody.addEventListener("click", function (e) {

    if (e.target.classList.contains("edit-btn")) {

      var editAt = parseInt(e.target.getAttribute("data-index"));
      var ev = adminEvents[editAt];

      document.getElementById("eventName").value = ev.name;
      document.getElementById("eventCategory").value = ev.category;
      document.getElementById("eventVenue").value = ev.venue;
      document.getElementById("eventDate").value = ev.date;

      editIndex = editAt;
      saveEventBtn.textContent = "Update Event";

    }

    if (e.target.classList.contains("delete-btn")) {

      var deleteAt = parseInt(e.target.getAttribute("data-index"));
      adminEvents.splice(deleteAt, 1);
      renderAdminEvents();
      renderAdminSummary();

      // if the deleted row was being edited, cancel the edit
      editIndex = -1;
      saveEventBtn.textContent = "Save Event";
      clearEventForm();

    }

  });

}

if (saveEventBtn) {

  saveEventBtn.addEventListener("click", function () {

    var name = document.getElementById("eventName").value;
    var category = document.getElementById("eventCategory").value;
    var venue = document.getElementById("eventVenue").value;
    var date = document.getElementById("eventDate").value;

    if (name === "" || category === "" || venue === "" || date === "") {
      alert("Please fill all required fields.");
      return;
    }

    if (editIndex === -1) {
      adminEvents.push({ name: name, category: category, date: date, venue: venue });
    } else {
      adminEvents[editIndex] = { name: name, category: category, date: date, venue: venue };
      editIndex = -1;
      saveEventBtn.textContent = "Save Event";
    }

    renderAdminEvents();
    renderAdminSummary();
    clearEventForm();

  });

}

if (resetEventBtn) {

  resetEventBtn.addEventListener("click", function () {
    clearEventForm();
    editIndex = -1;
    saveEventBtn.textContent = "Save Event";
  });

}

/* =========================================================
   ATTENDEE DASHBOARD
   Registering reduces seats, cancelling restores them.
   Registered events (for this session only) are tracked in
   a separate array and shown in the My Events section.
   Search and category filter both work on attendeeEvents.
========================================================= */

// Holds the index numbers of events the attendee has registered for in this session
var registeredIndexes = [];

var eventCardsContainer = document.getElementById("eventCardsContainer");
var myEventsContainer = document.getElementById("myEventsContainer");
var searchBox = document.getElementById("searchBox");
var categoryDropdown = document.getElementById("categoryDropdown");

function getStatusText(ev) {
  if (ev.availableSeats <= 0) {
    return "Closed";
  } else if (ev.availableSeats <= 5) {
    return "Almost Full";
  } else {
    return "Open";
  }
}

function getStatusClass(ev) {
  if (ev.availableSeats <= 0) {
    return "status-closed";
  } else if (ev.availableSeats <= 5) {
    return "status-almost";
  } else {
    return "status-open";
  }
}

// Turns "Coding Contest" into "coding-contest" so it can be compared
// with the dropdown's option values.
function categoryToValue(category) {
  return category.toLowerCase().replace(/ /g, "-");
}

function renderAttendeeEvents() {

  eventCardsContainer.innerHTML = "";

  var searchTerm = searchBox ? searchBox.value.toLowerCase() : "";
  var selectedCategory = categoryDropdown ? categoryDropdown.value : "all";

  var matchCount = 0;

  for (var i = 0; i < attendeeEvents.length; i++) {

    var ev = attendeeEvents[i];

    var matchesSearch = ev.name.toLowerCase().indexOf(searchTerm) !== -1;
    var matchesCategory = (selectedCategory === "all") || (categoryToValue(ev.category) === selectedCategory);

    if (!matchesSearch || !matchesCategory) {
      continue;
    }

    matchCount = matchCount + 1;

    var isRegistered = registeredIndexes.indexOf(i) !== -1;
    var buttonLabel = isRegistered ? "Registered" : "Register";

    var card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML =
      "<h3>" + ev.name + "</h3>" +
      "<p class='category-tag'>" + ev.category + "</p>" +
      "<p>Date: " + ev.date + " | Time: " + ev.time + "</p>" +
      "<p>Venue: " + ev.venue + "</p>" +
      "<p class='event-desc'>" + ev.description + "</p>" +
      "<p>Max Seats: " + ev.maxSeats + "</p>" +
      "<p>Available Seats: " + ev.availableSeats + "</p>" +
      "<p class='" + getStatusClass(ev) + "'>Status: " + getStatusText(ev) + "</p>" +
      "<button class='view-btn' data-index='" + i + "'>View Details</button>" +
      "<button class='register-btn' data-index='" + i + "'>" + buttonLabel + "</button>";

    eventCardsContainer.appendChild(card);

  }

  if (matchCount === 0) {
    eventCardsContainer.innerHTML = "<p>No events found.</p>";
  }

}

function renderMyEvents() {

  myEventsContainer.innerHTML = "";

  if (registeredIndexes.length === 0) {
    myEventsContainer.innerHTML = "<p>You have not registered for any events yet.</p>";
    return;
  }

  for (var i = 0; i < registeredIndexes.length; i++) {

    var idx = registeredIndexes[i];
    var ev = attendeeEvents[idx];

    var card = document.createElement("div");
    card.className = "event-card";

    card.innerHTML =
      "<h3>" + ev.name + "</h3>" +
      "<p class='category-tag'>" + ev.category + "</p>" +
      "<p>Date: " + ev.date + " | Time: " + ev.time + "</p>" +
      "<p>Venue: " + ev.venue + "</p>" +
      "<button class='delete-btn' data-index='" + idx + "'>Cancel Registration</button>";

    myEventsContainer.appendChild(card);

  }

}

if (eventCardsContainer) {

  renderAttendeeEvents();
  renderMyEvents();

  if (searchBox) {
    searchBox.addEventListener("input", function () {
      renderAttendeeEvents();
    });
  }

  if (categoryDropdown) {
    categoryDropdown.addEventListener("change", function () {
      renderAttendeeEvents();
    });
  }

  eventCardsContainer.addEventListener("click", function (e) {

    if (e.target.classList.contains("view-btn")) {

      var idx = parseInt(e.target.getAttribute("data-index"));
      var ev = attendeeEvents[idx];

      alert(
        "Event Name: " + ev.name + "\n" +
        "Category: " + ev.category + "\n" +
        "Date: " + ev.date + "\n" +
        "Time: " + ev.time + "\n" +
        "Venue: " + ev.venue + "\n" +
        "Description: " + ev.description + "\n" +
        "Available Seats: " + ev.availableSeats
      );

    }

    if (e.target.classList.contains("register-btn")) {

      var idx = parseInt(e.target.getAttribute("data-index"));
      var ev = attendeeEvents[idx];

      if (registeredIndexes.indexOf(idx) !== -1) {
        alert("You are already registered for this event.");
        return;
      }

      if (ev.availableSeats <= 0) {
        alert("Seats Full");
        return;
      }

      ev.availableSeats = ev.availableSeats - 1;
      registeredIndexes.push(idx);

      renderAttendeeEvents();
      renderMyEvents();

    }

  });

}

if (myEventsContainer) {

  myEventsContainer.addEventListener("click", function (e) {

    if (e.target.classList.contains("delete-btn")) {

      var idx = parseInt(e.target.getAttribute("data-index"));
      var pos = registeredIndexes.indexOf(idx);

      if (pos !== -1) {
        registeredIndexes.splice(pos, 1);
        attendeeEvents[idx].availableSeats = attendeeEvents[idx].availableSeats + 1;
        renderAttendeeEvents();
        renderMyEvents();
      }

    }

  });

}

/* =========================================================
   HOMEPAGE CHAT PANEL
   A simple keyword-matching assistant. No AI, no backend.
   Messages are kept only in memory and reset on refresh.
========================================================= */

var chatToggleBtn = document.getElementById("chatToggleBtn");
var chatPanel = document.getElementById("chatPanel");
var chatCloseBtn = document.getElementById("chatCloseBtn");
var chatMessages = document.getElementById("chatMessages");
var chatInput = document.getElementById("chatInput");
var chatSendBtn = document.getElementById("chatSendBtn");

if (chatToggleBtn) {

  function getCurrentTime() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
  }

  function addChatBubble(text, sender) {

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble chat-bubble-" + sender;
    bubble.innerHTML = text + "<span class='chat-time'>" + getCurrentTime() + "</span>";

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

  }

  // Looks at the user's message and returns a matching reply.
  function getBotReply(message) {

    var msg = message.toLowerCase();

    if (msg.indexOf("how to register") !== -1 || msg.indexOf("register") !== -1 || msg.indexOf("event registration") !== -1 || msg.indexOf("join event") !== -1 || msg.indexOf("attend event") !== -1) {
      return "Login as an attendee, open the event and click the Register button.";
    }

    if (msg.indexOf("login") !== -1 || msg.indexOf("sign in") !== -1) {
      return "Use your assigned username and password to log in. If login fails, contact the administrator.";
    }

    if (msg.indexOf("forgot password") !== -1 || msg.indexOf("password") !== -1 || msg.indexOf("reset password") !== -1) {
      return "Please contact the administrator to reset your password.";
    }

    if (msg.indexOf("admin") !== -1 || msg.indexOf("add event") !== -1 || msg.indexOf("edit event") !== -1 || msg.indexOf("delete event") !== -1) {
      return "Only the administrator can add, edit or delete events after logging in.";
    }

    if (msg.indexOf("search") !== -1 || msg.indexOf("find event") !== -1 || msg.indexOf("category") !== -1) {
      return "Use the search box or category filter on the attendee dashboard to find events.";
    }

    if (msg.indexOf("seats") !== -1 || msg.indexOf("full") !== -1 || msg.indexOf("available seats") !== -1) {
      return "If seats are available you can register. If all seats are filled, registration is not possible.";
    }

    if (msg.indexOf("cancel") !== -1 || msg.indexOf("unregister") !== -1 || msg.indexOf("remove registration") !== -1) {
      return "You can cancel your registration from the My Events section.";
    }

    if (msg.indexOf("my events") !== -1 || msg.indexOf("registered events") !== -1) {
      return "The My Events section displays all events you have registered for.";
    }

    if (msg.indexOf("contact") !== -1 || msg.indexOf("help") !== -1 || msg.indexOf("support") !== -1) {
      return "For additional help, please contact the EventHub administrator.";
    }

    if (msg.indexOf("hi") !== -1 || msg.indexOf("hello") !== -1 || msg.indexOf("hey") !== -1) {
      return "Hello! Welcome to EventHub. How can I help you today?";
    }

    if (msg.indexOf("bye") !== -1 || msg.indexOf("thank you") !== -1 || msg.indexOf("thanks") !== -1) {
      return "You're welcome! Have a great day.";
    }

    return "Sorry, I don't have an answer for that. Please contact the administrator.";

  }

  function sendChatMessage() {

    var message = chatInput.value;

    if (message === "") {
      return;
    }

    addChatBubble(message, "user");

    var reply = getBotReply(message);
    addChatBubble(reply, "bot");

    chatInput.value = "";

  }

  // Show the welcome message once the panel is opened for the first time
  var chatStarted = false;

  chatToggleBtn.addEventListener("click", function () {

    chatPanel.classList.toggle("chat-open");

    if (!chatStarted) {
      addChatBubble("Hi! I'm the EventHub Assistant. Ask me anything about registrations, events, login or using the portal.", "bot");
      chatStarted = true;
    }

  });

  chatCloseBtn.addEventListener("click", function () {
    chatPanel.classList.remove("chat-open");
  });

  chatSendBtn.addEventListener("click", function () {
    sendChatMessage();
  });

  chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });

}
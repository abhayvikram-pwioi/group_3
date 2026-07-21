// =========================================================
// TASKFLOW BOARD - script.js
// Beginner friendly vanilla JavaScript
// Uses var, function(), no classes, no arrow functions
// =========================================================

// -----------------------------------------------------
// AUTHENTICATION GUARD
// -----------------------------------------------------
// The board is only reachable once someone has logged in on login.html.
// The logged-in user is stored in sessionStorage by login.js.
var loggedInUserRaw = sessionStorage.getItem("loggedInUser");
var loggedInUser = loggedInUserRaw ? JSON.parse(loggedInUserRaw) : null;

if (!loggedInUser) {
  window.location.href = "login.html";
}

// -----------------------------------------------------
// APPLICATION DATA
// -----------------------------------------------------
// This array holds every column and every task.
// Each column has: id, title, tasks (array of task objects)
// Each task has: id, title, description, assignee, dueDate, priority

var boardData = [
  {
    id: "col-1",
    title: "Backlog",
    tasks: [
      {
        id: "task-1",
        title: "User Authentication UI",
        description: "Design and build the sign-up and login screens, including form validation and error states.",
        assignee: "Varsha Biswal",
        dueDate: "2026-08-05",
        priority: "high"
      },
      {
        id: "task-2",
        title: "Payment Gateway Integration",
        description: "Integrate Stripe checkout for subscription billing, including webhook handling for failed payments.",
        assignee: "Ayan",
        dueDate: "2026-08-20",
        priority: "high"
      },
      {
        id: "task-3",
        title: "Landing Page Redesign",
        description: "Refresh the marketing landing page with the new brand guidelines and updated hero section.",
        assignee: "Krishna Sahu",
        dueDate: "2026-09-10",
        priority: "low"
      }
    ]
  },
  {
    id: "col-2",
    title: "To Do",
    tasks: [
      {
        id: "task-4",
        title: "API Integration",
        description: "Connect the frontend task board to the REST API endpoints for tasks, columns, and users.",
        assignee: "Varsha Biswal",
        dueDate: "2026-07-25",
        priority: "high"
      },
      {
        id: "task-5",
        title: "Forgot Password Flow",
        description: "Implement the password reset flow with email verification and a secure token expiry.",
        assignee: "Ayan",
        dueDate: "2026-07-22",
        priority: "medium"
      }
    ]
  },
  {
    id: "col-3",
    title: "In Progress",
    tasks: [
      {
        id: "task-6",
        title: "Dashboard Analytics",
        description: "Build charts for task completion rate, team workload, and sprint velocity on the dashboard.",
        assignee: "Krishna Sahu",
        dueDate: "2026-07-18",
        priority: "high"
      },
      {
        id: "task-7",
        title: "Responsive Navbar",
        description: "Rework the top navigation so it collapses cleanly into a mobile menu below 768px.",
        assignee: "Varsha Biswal",
        dueDate: "2026-07-17",
        priority: "medium"
      }
    ]
  },
  {
    id: "col-4",
    title: "Review",
    tasks: [
      {
        id: "task-8",
        title: "User Profile Module",
        description: "Code review for the profile editing page, avatar upload, and account settings form.",
        assignee: "Ayan",
        dueDate: "2026-07-15",
        priority: "medium"
      },
      {
        id: "task-9",
        title: "Sprint Demo Preparation",
        description: "Prepare the staging environment and walkthrough script for Friday's sprint demo.",
        assignee: "Krishna Sahu",
        dueDate: "2026-07-19",
        priority: "high"
      }
    ]
  },
  {
    id: "col-5",
    title: "Done",
    tasks: [
      {
        id: "task-10",
        title: "Project Setup",
        description: "Initialized the repository, folder structure, linting, and base Vite build configuration.",
        assignee: "Varsha Biswal",
        dueDate: "2026-06-01",
        priority: "low"
      },
      {
        id: "task-11",
        title: "Login Screen Completed",
        description: "Finished the login screen UI, including validation states and the split-panel layout.",
        assignee: "Ayan",
        dueDate: "2026-06-15",
        priority: "medium"
      }
    ]
  }
];

// Keeps track of how many columns/tasks have been created so far
// so every new id is unique.
var columnIdCounter = 6;
var taskIdCounter = 12;

// -----------------------------------------------------
// TEAM MEMBERS (fixed list, used for assignee dropdown + avatars)
// -----------------------------------------------------
var teamMembers = [
  { id: "VB", name: "Varsha Biswal", color: "#4F46E5" },
  { id: "AY", name: "Ayan", color: "#0EA5E9" },
  { id: "KS", name: "Krishna Sahu", color: "#16A34A" }
];

// The person currently using the board. Every activity log entry is
// attributed to this user. Falls back to the first team member only
// for the brief moment before an unauthenticated visitor is redirected.
var currentUser = loggedInUser
  ? findTeamMemberById(loggedInUser.initials) || teamMembers[0]
  : teamMembers[0];

// -----------------------------------------------------
// ACTIVITY LOG
// -----------------------------------------------------
// Simple array of { user, message, time }. Newest entries live at
// the front of the array. Only the latest 25 are kept.
var activityLogs = [];

// Holds the task being dragged, plus which column it started in.
// Set on dragstart, read on drop, cleared on dragend.
// Example: { task: taskObject, sourceColumnId: "col-1" }
var draggedTask = null;

// -----------------------------------------------------
// GRAB REUSABLE ELEMENTS FROM THE PAGE
// -----------------------------------------------------
var boardElement = document.getElementById("board");

var profileName = document.getElementById("profileName");
var profileAvatar = document.getElementById("profileAvatar");
var logoutBtn = document.getElementById("logoutBtn");

var taskModalOverlay = document.getElementById("taskModalOverlay");
var taskForm = document.getElementById("taskForm");
var modalTitle = document.getElementById("modalTitle");

var taskIdField = document.getElementById("taskId");
var taskColumnIdField = document.getElementById("taskColumnId");
var taskTitleField = document.getElementById("taskTitle");
var taskDescriptionField = document.getElementById("taskDescription");
var taskAssigneeField = document.getElementById("taskAssignee");
var taskDueDateField = document.getElementById("taskDueDate");
var taskPriorityField = document.getElementById("taskPriority");

var titleError = document.getElementById("titleError");
var dateError = document.getElementById("dateError");

var columnModalOverlay = document.getElementById("columnModalOverlay");
var columnForm = document.getElementById("columnForm");
var columnNameField = document.getElementById("columnName");
var columnNameError = document.getElementById("columnNameError");

var searchInput = document.getElementById("searchInput");
var priorityFilter = document.getElementById("priorityFilter");

var statTotal = document.getElementById("statTotal");
var statCompleted = document.getElementById("statCompleted");
var statPending = document.getElementById("statPending");
var statPercent = document.getElementById("statPercent");
var progressBarFill = document.getElementById("progressBarFill");

var taskDetailsModalOverlay = document.getElementById("taskDetailsModalOverlay");
var detailTitle = document.getElementById("detailTitle");
var detailDescription = document.getElementById("detailDescription");
var detailAssignee = document.getElementById("detailAssignee");
var detailDueDate = document.getElementById("detailDueDate");
var detailPriority = document.getElementById("detailPriority");
var detailColumn = document.getElementById("detailColumn");
var closeDetailsModalBtn = document.getElementById("closeDetailsModalBtn");
var closeDetailsBtn = document.getElementById("closeDetailsBtn");
var editFromDetailsBtn = document.getElementById("editFromDetailsBtn");

// Tracks which task the details modal is currently showing, so the
// Edit button knows what to open.
var currentDetailsTaskId = null;
var currentDetailsColumnId = null;

var deleteConfirmModalOverlay = document.getElementById("deleteConfirmModalOverlay");
var closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
var cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
var confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// Tracks which task is pending deletion while the confirmation modal is open.
var pendingDeleteTaskId = null;

// -----------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------

// Turns "2026-10-12" into "Oct 12"
function formatDate(dateString) {
  if (!dateString) {
    return "";
  }
  var parts = dateString.split("-");
  var year = parts[0];
  var month = parseInt(parts[1], 10);
  var day = parseInt(parts[2], 10);

  var monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return monthNames[month - 1] + " " + day;
}

// Returns true if the given date string is before today
function isDateInThePast(dateString) {
  if (!dateString) {
    return false;
  }
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var chosenDate = new Date(dateString + "T00:00:00");

  return chosenDate < today;
}

// Works out whether a due date is overdue, due today, or upcoming.
// Nothing new is stored on the task - this is calculated on the fly.
function getDueDateStatus(dateString) {
  if (!dateString) {
    return "";
  }
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var chosenDate = new Date(dateString + "T00:00:00");

  if (chosenDate.getTime() < today.getTime()) {
    return "overdue";
  }
  if (chosenDate.getTime() === today.getTime()) {
    return "due-today";
  }
  return "upcoming";
}

// Turns a person's name into initials, e.g. "Emma Stone" -> "ES"
function getInitials(name) {
  if (!name) {
    return "?";
  }
  var words = name.trim().split(" ");
  var initials = "";
  for (var i = 0; i < words.length && i < 2; i++) {
    if (words[i].length > 0) {
      initials = initials + words[i].charAt(0).toUpperCase();
    }
  }
  return initials;
}

// Finds a column object in boardData by its id
function findColumnById(columnId) {
  for (var i = 0; i < boardData.length; i++) {
    if (boardData[i].id === columnId) {
      return boardData[i];
    }
  }
  return null;
}

// Finds a task object (and knows which column it lives in)
function findTaskById(taskId) {
  for (var i = 0; i < boardData.length; i++) {
    var column = boardData[i];
    for (var j = 0; j < column.tasks.length; j++) {
      if (column.tasks[j].id === taskId) {
        return { task: column.tasks[j], column: column, taskIndex: j };
      }
    }
  }
  return null;
}

// Finds a team member object by their initials ("VB", "AY", "KS")
function findTeamMemberById(id) {
  for (var i = 0; i < teamMembers.length; i++) {
    if (teamMembers[i].id === id) {
      return teamMembers[i];
    }
  }
  return null;
}

// Finds a team member object by their full name
function findTeamMemberByName(name) {
  for (var i = 0; i < teamMembers.length; i++) {
    if (teamMembers[i].name === name) {
      return teamMembers[i];
    }
  }
  return null;
}

// -----------------------------------------------------
// ACTIVITY LOG HELPERS
// -----------------------------------------------------

// Adds a new entry to the top of the activity log, trims it to the
// latest 25 entries, and re-renders the log panel.
function addActivity(message) {
  activityLogs.unshift({
    user: currentUser.id,
    message: message,
    time: new Date()
  });

  if (activityLogs.length > 25) {
    activityLogs = activityLogs.slice(0, 25);
  }

  renderActivityLog();
}

// Turns a Date into a short relative label like "Just now" / "2 mins ago"
function formatRelativeTime(date) {
  var now = new Date();
  var diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes === 1) {
    return "1 min ago";
  }
  if (diffMinutes < 60) {
    return diffMinutes + " mins ago";
  }

  var diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : diffHours + " hours ago";
  }

  return "Today";
}

// Rebuilds the activity log panel from the activityLogs array
function renderActivityLog() {
  var list = document.getElementById("activityLogList");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (activityLogs.length === 0) {
    var empty = document.createElement("div");
    empty.className = "activity-empty";
    empty.textContent = "No recent activity yet.";
    list.appendChild(empty);
    return;
  }

  for (var i = 0; i < activityLogs.length; i++) {
    var entry = activityLogs[i];
    var member = findTeamMemberById(entry.user);

    var item = document.createElement("div");
    item.className = "activity-item";

    var avatar = document.createElement("div");
    avatar.className = "avatar small activity-avatar";
    avatar.textContent = entry.user;
    avatar.style.backgroundColor = member ? member.color : "#9CA3AF";

    var textWrap = document.createElement("div");
    textWrap.className = "activity-text";

    var messageEl = document.createElement("div");
    messageEl.className = "activity-message";
    messageEl.innerHTML = "<strong>" + entry.user + "</strong> " + entry.message;

    var timeEl = document.createElement("div");
    timeEl.className = "activity-time";
    timeEl.textContent = formatRelativeTime(entry.time);

    textWrap.appendChild(messageEl);
    textWrap.appendChild(timeEl);

    item.appendChild(avatar);
    item.appendChild(textWrap);
    list.appendChild(item);
  }
}

// Returns the tasks in a column that match the current search text
// (title, description, or assignee) and the selected priority filter.
// Does not modify boardData - filtering is purely a rendering concern.
function getFilteredTasks(column) {
  var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  var priority = priorityFilter ? priorityFilter.value : "all";

  var filtered = [];
  for (var i = 0; i < column.tasks.length; i++) {
    var task = column.tasks[i];

    var matchesQuery =
      query === "" ||
      task.title.toLowerCase().indexOf(query) !== -1 ||
      task.description.toLowerCase().indexOf(query) !== -1 ||
      task.assignee.toLowerCase().indexOf(query) !== -1;

    var matchesPriority = priority === "all" || task.priority === priority;

    if (matchesQuery && matchesPriority) {
      filtered.push(task);
    }
  }
  return filtered;
}

// Recalculates and displays Total / Completed / Pending / Completion %.
// "Completed" is any task sitting in a column titled "Done" (case-insensitive).
function updateProgressOverview() {
  var total = 0;
  var completed = 0;

  for (var i = 0; i < boardData.length; i++) {
    var column = boardData[i];
    total = total + column.tasks.length;
    if (column.title.trim().toLowerCase() === "done") {
      completed = completed + column.tasks.length;
    }
  }

  var pending = total - completed;
  var percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = pending;
  statPercent.textContent = percent + "%";
  progressBarFill.style.width = percent + "%";
}

// -----------------------------------------------------
// RENDERING THE BOARD
// -----------------------------------------------------

// Rebuilds the entire board from boardData.
// This is the simplest approach for a beginner project:
// clear everything and redraw it whenever something changes.
function renderBoard() {
  // Remove everything currently inside the board
  boardElement.innerHTML = "";

  // Create one column element per entry in boardData
  for (var i = 0; i < boardData.length; i++) {
    var columnElement = createColumnElement(boardData[i]);
    boardElement.appendChild(columnElement);
  }

  // Add the "Add Column" button at the very end
  var addColumnWrapper = document.createElement("div");
  addColumnWrapper.className = "add-column-wrapper";

  var addColumnBtn = document.createElement("button");
  addColumnBtn.className = "add-column-btn";
  addColumnBtn.innerHTML = "+ Add Column";
  addColumnBtn.addEventListener("click", function () {
    openColumnModal();
  });

  addColumnWrapper.appendChild(addColumnBtn);
  boardElement.appendChild(addColumnWrapper);

  updateProgressOverview();
}

// Builds the DOM for a single column, including its tasks
function createColumnElement(column) {
  var columnDiv = document.createElement("div");
  columnDiv.className = "column";
  columnDiv.dataset.columnId = column.id;

  // ----- Drag and drop: this column is a drop zone for task cards -----
  columnDiv.addEventListener("dragover", function (event) {
    // Required so the browser allows a drop here
    event.preventDefault();
    columnDiv.classList.add("drag-over");
  });

  columnDiv.addEventListener("dragleave", function (event) {
    // Only clear the highlight once the pointer actually leaves the
    // column (not when moving between child elements inside it).
    if (!columnDiv.contains(event.relatedTarget)) {
      columnDiv.classList.remove("drag-over");
    }
  });

  columnDiv.addEventListener("drop", function (event) {
    event.preventDefault();
    columnDiv.classList.remove("drag-over");

    if (draggedTask && draggedTask.sourceColumnId !== column.id) {
      var sourceColumn = findColumnById(draggedTask.sourceColumnId);
      var taskIndex = sourceColumn.tasks.indexOf(draggedTask.task);
      sourceColumn.tasks.splice(taskIndex, 1);
      column.tasks.push(draggedTask.task);

      addActivity(
        'moved "' + draggedTask.task.title + '" from "' + sourceColumn.title +
        '" to "' + column.title + '"'
      );

      renderBoard();
    }

    draggedTask = null;
  });

  // ----- Column header -----
  var header = document.createElement("div");
  header.className = "column-header";

  var headerLeft = document.createElement("div");
  headerLeft.className = "column-header-left";

  var titleSpan = document.createElement("span");
  titleSpan.className = "column-title";
  titleSpan.textContent = column.title;

  var countBadge = document.createElement("span");
  countBadge.className = "task-count-badge";
  countBadge.textContent = column.tasks.length;

  headerLeft.appendChild(titleSpan);
  headerLeft.appendChild(countBadge);

  // Three dot menu button
  var menuBtn = document.createElement("button");
  menuBtn.className = "column-menu-btn";
  menuBtn.innerHTML = "&#8942;"; // vertical ellipsis
  menuBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleColumnDropdown(column.id);
  });

  // Dropdown with Rename / Delete
  var dropdown = document.createElement("div");
  dropdown.className = "column-dropdown";
  dropdown.id = "dropdown-" + column.id;

  var renameBtn = document.createElement("button");
  renameBtn.textContent = "Rename";
  renameBtn.addEventListener("click", function () {
    dropdown.classList.remove("open");
    startColumnRename(column.id);
  });

  var deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-option";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", function () {
    deleteColumn(column.id);
  });

  dropdown.appendChild(renameBtn);
  dropdown.appendChild(deleteBtn);

  header.appendChild(headerLeft);
  header.appendChild(menuBtn);
  header.appendChild(dropdown);

  // ----- Task list -----
  var taskList = document.createElement("div");
  taskList.className = "task-list";

  var visibleTasks = getFilteredTasks(column);

  if (column.tasks.length === 0) {
    var emptyState = document.createElement("div");
    emptyState.className = "column-empty-state";
    emptyState.innerHTML =
      '<div class="column-empty-icon">&#128203;</div>' +
      '<div class="column-empty-title">No tasks yet</div>' +
      '<div class="column-empty-subtitle">Create your first task</div>';
    taskList.appendChild(emptyState);
  } else if (visibleTasks.length === 0) {
    var noMatchState = document.createElement("div");
    noMatchState.className = "column-empty-state";
    noMatchState.innerHTML =
      '<div class="column-empty-icon">&#128269;</div>' +
      '<div class="column-empty-title">No matching tasks</div>' +
      '<div class="column-empty-subtitle">Try a different search or filter</div>';
    taskList.appendChild(noMatchState);
  }

  for (var i = 0; i < visibleTasks.length; i++) {
    var taskCard = createTaskCard(visibleTasks[i], column.id);
    taskList.appendChild(taskCard);
  }

  // ----- Add task button -----
  var addTaskBtn = document.createElement("button");
  addTaskBtn.className = "add-task-btn";
  addTaskBtn.innerHTML = "+ Add Task";
  addTaskBtn.addEventListener("click", function () {
    openTaskModal("add", column.id, null);
  });

  columnDiv.appendChild(header);
  columnDiv.appendChild(taskList);
  columnDiv.appendChild(addTaskBtn);

  return columnDiv;
}

// Builds the DOM for a single task card
function createTaskCard(task, columnId) {
  var card = document.createElement("div");
  card.className = "task-card";
  card.dataset.taskId = task.id;
  card.draggable = true;

  // ----- Drag and drop: this card can be dragged into another column -----
  card.addEventListener("dragstart", function (event) {
    draggedTask = { task: task, sourceColumnId: columnId };
    event.dataTransfer.setData("text/plain", task.id);
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", function () {
    card.classList.remove("dragging");
    draggedTask = null;

    // Safety net: clear any highlight left behind if the drop
    // happened outside a valid column.
    var allColumns = document.querySelectorAll(".column");
    for (var i = 0; i < allColumns.length; i++) {
      allColumns[i].classList.remove("drag-over");
    }
  });

  // Clicking anywhere on the card (except the action buttons) opens the
  // read-only details modal.
  card.addEventListener("click", function () {
    openTaskDetailsModal(columnId, task.id);
  });

  // Top row: priority badge
  var topRow = document.createElement("div");
  topRow.className = "task-card-top";

  var priorityBadge = document.createElement("span");
  priorityBadge.className = "priority-badge priority-" + task.priority;
  priorityBadge.textContent = task.priority;

  topRow.appendChild(priorityBadge);

  // Title
  var title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  // Description
  var description = document.createElement("div");
  description.className = "task-description";
  description.textContent = task.description;

  // Bottom row: due date + assignee avatar
  var bottomRow = document.createElement("div");
  bottomRow.className = "task-card-bottom";

  var dueDate = document.createElement("div");
  dueDate.className = "task-due-date";
  var dueStatus = getDueDateStatus(task.dueDate);
  if (dueStatus) {
    dueDate.classList.add(dueStatus);
  }
  dueDate.innerHTML = "&#128197; " + formatDate(task.dueDate);

  var assigneeAvatar = document.createElement("div");
  assigneeAvatar.className = "avatar task-assignee-avatar";
  var assigneeMember = findTeamMemberByName(task.assignee);
  assigneeAvatar.textContent = assigneeMember ? assigneeMember.id : getInitials(task.assignee);
  assigneeAvatar.title = task.assignee;
  if (assigneeMember) {
    assigneeAvatar.style.backgroundColor = assigneeMember.color;
  }

  bottomRow.appendChild(dueDate);
  bottomRow.appendChild(assigneeAvatar);

  // Actions row: edit + delete
  var actionsRow = document.createElement("div");
  actionsRow.className = "task-card-actions";

  var editBtn = document.createElement("button");
  editBtn.className = "task-action-btn edit-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    openTaskModal("edit", columnId, task.id);
  });

  var deleteBtn = document.createElement("button");
  deleteBtn.className = "task-action-btn delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    deleteTask(task.id);
  });

  actionsRow.appendChild(editBtn);
  actionsRow.appendChild(deleteBtn);

  card.appendChild(topRow);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(bottomRow);
  card.appendChild(actionsRow);

  return card;
}

// -----------------------------------------------------
// COLUMN DROPDOWN MENU
// -----------------------------------------------------

function toggleColumnDropdown(columnId) {
  // Close every other open dropdown first
  var allDropdowns = document.querySelectorAll(".column-dropdown");
  for (var i = 0; i < allDropdowns.length; i++) {
    if (allDropdowns[i].id !== "dropdown-" + columnId) {
      allDropdowns[i].classList.remove("open");
    }
  }

  var dropdown = document.getElementById("dropdown-" + columnId);
  dropdown.classList.toggle("open");
}

// Close any open dropdown or avatar popover when the user clicks
// anywhere else on the page
document.addEventListener("click", function () {
  var allDropdowns = document.querySelectorAll(".column-dropdown");
  for (var i = 0; i < allDropdowns.length; i++) {
    allDropdowns[i].classList.remove("open");
  }
  closeAllAvatarPopovers();
});

// -----------------------------------------------------
// COLUMN OPERATIONS: ADD / RENAME / DELETE
// -----------------------------------------------------

function openColumnModal() {
  columnNameField.value = "";
  columnNameError.textContent = "";
  columnNameField.classList.remove("input-error");
  columnModalOverlay.classList.add("open");
  columnNameField.focus();
}

function closeColumnModal() {
  columnModalOverlay.classList.remove("open");
}

columnForm.addEventListener("submit", function (event) {
  event.preventDefault();

  var name = columnNameField.value.trim();

  if (name === "") {
    columnNameError.textContent = "Column name cannot be empty.";
    columnNameField.classList.add("input-error");
    return;
  }

  var newColumn = {
    id: "col-" + columnIdCounter,
    title: name,
    tasks: []
  };
  columnIdCounter = columnIdCounter + 1;

  boardData.push(newColumn);

  addActivity('created column "' + name + '"');

  renderBoard();
  closeColumnModal();
});

document.getElementById("closeColumnModalBtn").addEventListener("click", closeColumnModal);
document.getElementById("cancelColumnBtn").addEventListener("click", closeColumnModal);

function renameColumn(columnId, newName) {
  var column = findColumnById(columnId);
  if (!column) {
    return;
  }

  var oldName = column.title;
  column.title = newName;
  addActivity('renamed column "' + oldName + '" to "' + newName + '"');
  renderBoard();
}

// Swaps a column's title for an inline input with Save/Cancel controls.
// Replaces the old window.prompt() based rename.
function startColumnRename(columnId) {
  var columnDiv = document.querySelector('.column[data-column-id="' + columnId + '"]');
  if (!columnDiv) {
    return;
  }

  var headerLeft = columnDiv.querySelector(".column-header-left");
  var titleSpan = headerLeft.querySelector(".column-title");
  var countBadge = headerLeft.querySelector(".task-count-badge");
  var originalTitle = titleSpan.textContent;

  var input = document.createElement("input");
  input.type = "text";
  input.className = "column-title-input";
  input.value = originalTitle;

  var saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "rename-action-btn rename-save-btn";
  saveBtn.innerHTML = "&#10003;";
  saveBtn.title = "Save";

  var cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "rename-action-btn rename-cancel-btn";
  cancelBtn.innerHTML = "&#10005;";
  cancelBtn.title = "Cancel";

  titleSpan.style.display = "none";
  countBadge.style.display = "none";
  headerLeft.insertBefore(input, titleSpan);
  headerLeft.insertBefore(saveBtn, titleSpan);
  headerLeft.insertBefore(cancelBtn, titleSpan);

  input.focus();
  input.select();

  function commitRename() {
    var newName = input.value.trim();
    if (newName === "") {
      // Empty title should not save; restore the original instead.
      renderBoard();
      return;
    }
    renameColumn(columnId, newName);
  }

  function cancelRename() {
    // Restores the previous title by simply re-rendering from boardData,
    // which was never modified.
    renderBoard();
  }

  input.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelRename();
    }
  });

  saveBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    commitRename();
  });

  cancelBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    cancelRename();
  });
}

function deleteColumn(columnId) {
  var column = findColumnById(columnId);
  if (!column) {
    return;
  }

  var confirmed = window.confirm(
    "Delete the \"" + column.title + "\" column and all of its tasks?"
  );

  if (confirmed) {
    for (var i = 0; i < boardData.length; i++) {
      if (boardData[i].id === columnId) {
        boardData.splice(i, 1);
        break;
      }
    }
    addActivity('deleted column "' + column.title + '"');
    renderBoard();
  }
}

// -----------------------------------------------------
// TASK MODAL: OPEN / CLOSE
// -----------------------------------------------------

// mode is either "add" or "edit"
function openTaskModal(mode, columnId, taskId) {
  // Reset any previous error messages
  titleError.textContent = "";
  dateError.textContent = "";
  taskTitleField.classList.remove("input-error");
  taskDueDateField.classList.remove("input-error");

  taskColumnIdField.value = columnId;

  if (mode === "add") {
    modalTitle.textContent = "Add Task";
    taskIdField.value = "";
    taskTitleField.value = "";
    taskDescriptionField.value = "";
    taskAssigneeField.value = teamMembers[0].name;
    taskDueDateField.value = "";
    taskPriorityField.value = "low";
  } else {
    var result = findTaskById(taskId);
    if (!result) {
      return;
    }
    modalTitle.textContent = "Edit Task";
    taskIdField.value = result.task.id;
    taskTitleField.value = result.task.title;
    taskDescriptionField.value = result.task.description;
    taskAssigneeField.value = result.task.assignee;
    taskDueDateField.value = result.task.dueDate;
    taskPriorityField.value = result.task.priority;
  }

  taskModalOverlay.classList.add("open");
  taskTitleField.focus();
}

function closeTaskModal() {
  taskModalOverlay.classList.remove("open");
}

document.getElementById("closeModalBtn").addEventListener("click", closeTaskModal);
document.getElementById("cancelBtn").addEventListener("click", closeTaskModal);

document.getElementById("newTaskBtn").addEventListener("click", function () {
  // "New Task" in the project header adds to the first column by default
  var firstColumnId = boardData.length > 0 ? boardData[0].id : null;
  if (firstColumnId) {
    openTaskModal("add", firstColumnId, null);
  }
});

// Clicking outside the modal box (on the dark overlay) closes it
taskModalOverlay.addEventListener("click", function (event) {
  if (event.target === taskModalOverlay) {
    closeTaskModal();
  }
});

columnModalOverlay.addEventListener("click", function (event) {
  if (event.target === columnModalOverlay) {
    closeColumnModal();
  }
});

// -----------------------------------------------------
// TASK DETAILS MODAL (read-only view, reuses the edit modal)
// -----------------------------------------------------

function openTaskDetailsModal(columnId, taskId) {
  var result = findTaskById(taskId);
  if (!result) {
    return;
  }

  var column = findColumnById(columnId) || result.column;
  var priorityLabel =
    result.task.priority.charAt(0).toUpperCase() + result.task.priority.slice(1);

  detailTitle.textContent = result.task.title;
  detailDescription.textContent = result.task.description || "No description provided.";

  var assigneeMember = findTeamMemberByName(result.task.assignee);
  if (assigneeMember) {
    detailAssignee.innerHTML =
      '<span class="avatar small detail-avatar" style="background-color:' +
      assigneeMember.color +
      ';">' +
      assigneeMember.id +
      "</span>" +
      assigneeMember.name;
  } else {
    detailAssignee.textContent = result.task.assignee || "Unassigned";
  }

  detailDueDate.textContent = result.task.dueDate ? formatDate(result.task.dueDate) : "No due date";
  detailPriority.textContent = priorityLabel;
  detailColumn.textContent = column.title;

  currentDetailsTaskId = taskId;
  currentDetailsColumnId = column.id;

  taskDetailsModalOverlay.classList.add("open");
}

function closeTaskDetailsModal() {
  taskDetailsModalOverlay.classList.remove("open");
  currentDetailsTaskId = null;
  currentDetailsColumnId = null;
}

closeDetailsModalBtn.addEventListener("click", closeTaskDetailsModal);
closeDetailsBtn.addEventListener("click", closeTaskDetailsModal);

editFromDetailsBtn.addEventListener("click", function () {
  var taskId = currentDetailsTaskId;
  var columnId = currentDetailsColumnId;
  closeTaskDetailsModal();
  if (taskId && columnId) {
    openTaskModal("edit", columnId, taskId);
  }
});

taskDetailsModalOverlay.addEventListener("click", function (event) {
  if (event.target === taskDetailsModalOverlay) {
    closeTaskDetailsModal();
  }
});

// -----------------------------------------------------
// LIVE SEARCH + PRIORITY FILTER
// -----------------------------------------------------

searchInput.addEventListener("input", function () {
  renderBoard();
});

priorityFilter.addEventListener("change", function () {
  renderBoard();
});

// -----------------------------------------------------
// TASK FORM: VALIDATE + SAVE
// -----------------------------------------------------

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  var isValid = true;

  var titleValue = taskTitleField.value.trim();
  var dueDateValue = taskDueDateField.value;

  // Validation rule: title cannot be empty
  if (titleValue === "") {
    titleError.textContent = "Title cannot be empty.";
    taskTitleField.classList.add("input-error");
    isValid = false;
  } else {
    titleError.textContent = "";
    taskTitleField.classList.remove("input-error");
  }

  // Validation rule: due date cannot be in the past
  if (dueDateValue !== "" && isDateInThePast(dueDateValue)) {
    dateError.textContent = "Due date cannot be in the past.";
    taskDueDateField.classList.add("input-error");
    isValid = false;
  } else {
    dateError.textContent = "";
    taskDueDateField.classList.remove("input-error");
  }

  if (!isValid) {
    return;
  }

  var columnId = taskColumnIdField.value;
  var existingTaskId = taskIdField.value;

  if (existingTaskId === "") {
    // Adding a brand new task
    var column = findColumnById(columnId);
    if (column) {
      var newTask = {
        id: "task-" + taskIdCounter,
        title: titleValue,
        description: taskDescriptionField.value.trim(),
        assignee: taskAssigneeField.value.trim() || "Unassigned",
        dueDate: dueDateValue,
        priority: taskPriorityField.value
      };
      taskIdCounter = taskIdCounter + 1;
      column.tasks.push(newTask);
      addActivity('created task "' + titleValue + '"');
    }
  } else {
    // Editing an existing task
    var result = findTaskById(existingTaskId);
    if (result) {
      result.task.title = titleValue;
      result.task.description = taskDescriptionField.value.trim();
      result.task.assignee = taskAssigneeField.value.trim() || "Unassigned";
      result.task.dueDate = dueDateValue;
      result.task.priority = taskPriorityField.value;
      addActivity('updated task "' + titleValue + '"');
    }
  }

  renderBoard();
  closeTaskModal();
});

// -----------------------------------------------------
// DELETE TASK
// -----------------------------------------------------

function deleteTask(taskId) {
  var result = findTaskById(taskId);
  if (!result) {
    return;
  }

  pendingDeleteTaskId = taskId;
  deleteConfirmModalOverlay.classList.add("open");
}

function closeDeleteConfirmModal() {
  deleteConfirmModalOverlay.classList.remove("open");
  pendingDeleteTaskId = null;
}

confirmDeleteBtn.addEventListener("click", function () {
  if (pendingDeleteTaskId) {
    var result = findTaskById(pendingDeleteTaskId);
    if (result) {
      var deletedTitle = result.task.title;
      result.column.tasks.splice(result.taskIndex, 1);
      addActivity('deleted task "' + deletedTitle + '"');
      renderBoard();
    }
  }
  closeDeleteConfirmModal();
});

cancelDeleteBtn.addEventListener("click", closeDeleteConfirmModal);
closeDeleteModalBtn.addEventListener("click", closeDeleteConfirmModal);

deleteConfirmModalOverlay.addEventListener("click", function (event) {
  if (event.target === deleteConfirmModalOverlay) {
    closeDeleteConfirmModal();
  }
});

// -----------------------------------------------------
// SHARE BUTTON (visual only, as per current scope)
// -----------------------------------------------------

document.getElementById("shareBtn").addEventListener("click", function () {
  window.alert("Sharing is not available in this version of TaskFlow.");
});

// -----------------------------------------------------
// HEADER PROFILE (logged-in user)
// -----------------------------------------------------

profileName.textContent = currentUser.name;
profileAvatar.textContent = currentUser.id;
profileAvatar.title = currentUser.name;
profileAvatar.style.backgroundColor = currentUser.color;

logoutBtn.addEventListener("click", function () {
  sessionStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
});

// -----------------------------------------------------
// TEAM AVATAR POPOVERS
// -----------------------------------------------------
// Clicking an avatar beside the Share button opens a small card with
// that member's name, role, and status. Only one popover stays open.

var teamAvatarButtons = [
  { avatarId: "avatarVB", popoverId: "popoverVB" },
  { avatarId: "avatarAY", popoverId: "popoverAY" },
  { avatarId: "avatarKS", popoverId: "popoverKS" }
];

function closeAllAvatarPopovers() {
  var allPopovers = document.querySelectorAll(".avatar-popover");
  for (var i = 0; i < allPopovers.length; i++) {
    allPopovers[i].classList.remove("open");
  }
}

for (var t = 0; t < teamAvatarButtons.length; t++) {
  var avatarEl = document.getElementById(teamAvatarButtons[t].avatarId);
  var popoverEl = document.getElementById(teamAvatarButtons[t].popoverId);

  // A small closure so each button remembers its own popover.
  (function (avatarEl, popoverEl) {
    avatarEl.addEventListener("click", function (event) {
      event.stopPropagation();
      var wasOpen = popoverEl.classList.contains("open");
      closeAllAvatarPopovers();
      if (!wasOpen) {
        popoverEl.classList.add("open");
      }
    });
  })(avatarEl, popoverEl);
}

// -----------------------------------------------------
// INITIAL RENDER
// -----------------------------------------------------

renderBoard();
renderActivityLog();

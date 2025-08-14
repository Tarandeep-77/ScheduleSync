let schedule_form_div = document.getElementById("schedule-form");
let schedule_div = document.getElementById("schedule");
let inbox_menu_btn =document.getElementById("inbox-menu-btn");
let dashboard_menu_btn = document.getElementById("dashboard-menu-btn")
let summary_sections = document.getElementById("summary-sections");
let inboxSection = document.getElementById("inbox-section")

const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

if (!loggedUser|| loggedUser.role !== "teacher") {
  alert("Access denied!");
  window.location.href = "/login";
}

const currentUser = loggedUser;
console.log(currentUser);
console.log(currentUser.email)
console.log(currentUser.name);
console.log(currentUser.role)

function fillLectureInTimetable(lecture){
  const rows = document.querySelectorAll("tbody tr");

  const timeSlot = {
    "09": 1, "10": 2, "11": 3, "12": 4,
    "13": 5, "14": 6, "15": 7, "16": 8
  };

  let lectureDay = lecture.day;
  if (!lectureDay && lecture.date) {
    const dateObj = new Date(lecture.date);
    lectureDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (!lectureDay) return;

  const row = Array.from(rows).find(r => 
    r.cells[0] && r.cells[0].innerText.trim().toLowerCase() === lectureDay.trim().toLowerCase()
  );
  if (!row) return;

  let hour = lecture.startTime.slice(0,2);
  if (hour.length === 1) hour = "0" + hour;
  const colIndex = timeSlot[hour];
  if (!colIndex) return;

  row.cells[colIndex].innerHTML = `
    <strong>${lecture.subject}</strong><br>
    Room: ${lecture.room}
  `;
}


function renderTimetable(teacherEmail) {
  console.log("Rendering timetable for:", teacherEmail);

  const rows = document.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    for (let i = 1; i <= 8; i++) {
      row.cells[i].innerHTML = "";
    }
  });

  fetch(`/api/lectures/${teacherEmail}`)
    .then(res => res.json())
    .then(lectures => {
      console.log("Lectures received:", lectures);
      lectures.forEach(lec => fillLectureInTimetable(lec));
    })
    .catch(err => {
      console.error("Failed to load timetable:", err);
    });
}

function updateLectureSummary(currentUserEmail) {
  fetch(`/api/lectures/${currentUserEmail}`)
    .then(res => res.json())
    .then(userLectures => {
      let now = new Date();
      console.log(now)
      let done = 0;
      let left = 0;

      userLectures.forEach(lec => {
        let lectureDateTime = new Date(`${lec.date}T${lec.startTime}`);
        if (lectureDateTime < now) {
          done++;
        } else {
          left++;
        }
      });

      document.getElementById("total-lectures").innerText = userLectures.length;
      document.getElementById("total-left").innerText = left;
      document.getElementById("total-done").innerText = done;
    })
    .catch(err => {
      console.error("Failed to fetch lectures for summary:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {

  // console.log("Fetching lectures for:", currentUser.email); 

  renderTimetable(currentUser.email);
  updateLectureSummary(currentUser.email);

  setInterval(() => {
    updateLectureSummary(currentUser.email);
  }, 60000);
});


document.getElementById("show-teacher-timetable").addEventListener("click", () => {
  summary_sections.style.display = "none";
  document.getElementById("schedule").style.display = "block";
});

let calendarMenuBtn = document.getElementById("calendar-menu-btn");
let calendarBox = document.getElementById("calendar-box");
let backToTimetableBtn = document.getElementById("back-to-timetable-btn");
let calendarInitialized = false;

calendarMenuBtn.addEventListener("click", () => {
  schedule_div.style.display = "none";
  inboxSection.style.display = "none";
  request_leave_form.style.display="none";
  calendarBox.style.display = "block";
  summary_sections.style.display = "none";

  if (!calendarInitialized) {
    const calendarEle = document.getElementById("calendar");

    const calendar = new FullCalendar.Calendar(calendarEle, {
      initialView: 'dayGridMonth',
      events: function (fetchInfo, successCallback, failureCallback) {
        fetch(`/api/lectures/${currentUser.email}`)
          .then(res => res.json())
          .then(lectures => {
            const events = lectures.map(lec => ({
              title: `${lec.subject} (${lec.room})`,
              start: `${lec.date}T${lec.startTime}`,
              end: `${lec.date}T${lec.endTime}`,
              backgroundColor: "#1d2951",
              borderColor: "#1d2951"
            }));
            successCallback(events);
          })
          .catch(err => {
            console.error("Failed to load calendar events:", err);
            failureCallback(err);
          });
      }
    });

    calendar.render();
    calendarInitialized = true;
  }
});


backToTimetableBtn.addEventListener("click", () => {
  calendarBox.style.display = "none";
    summary_sections.style.display="none";
     document.getElementById("schedule").style.display = "block";
});

function getAllLecturesAsEvents() {
  return fetch("/api/lectures/all")
    .then(res => res.json())
    .then(lectures => {
      return lectures.map(lec => ({
        title: `${lec.subject} (${lec.room})`,
        start: `${lec.date}T${lec.startTime}`,
        end: `${lec.date}T${lec.endTime}`,
        backgroundColor: "#1d2951",
        borderColor: "#1d2951"
      }));
    })
    .catch(err => {
      console.error("Failed to load calendar events:", err);
      return [];
    });
}

setInterval(() => {
  fetch("/check-session",{credentials : 'include'})
    .then(res => res.json())
    .then(data => {
      if (!data.active) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      }
    })
    .catch(err => {
      console.error("Session check failed:", err);
    });
}, 60000); //10 seconds

function updateDateTime() {
  const today = new Date();

  const dateStr = today.toLocaleDateString(undefined, {
    // weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = today.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  document.getElementById("date").textContent = dateStr;
  document.getElementById("time").textContent = timeStr;
}

updateDateTime();

setInterval(updateDateTime, 1000);
let apply_leave_btn = document.getElementById("apply-leave-menu-btn")
let request_leave_form = document.getElementById("apply-leave-form");
apply_leave_btn.addEventListener("click",()=>{
  request_leave_form.style.display="block"
   schedule_div.style.display = "none";
     summary_sections.style.display = "none";
     calendarBox.style.display = "none";
     inboxSection.style.display = "none";
})

document.getElementById("req-leave-btn").addEventListener("click", (e) => {
  e.preventDefault();
  const date = document.getElementById("date-input").value;
  const reason = document.getElementById("reason-input").value;

  fetch("/api/lectures/leave-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: currentUser.email,
      date,
      reason
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      document.getElementById("apply-leave-form").reset();
      // document.getElementById("apply-leave-form").style.display = "none";
    })
    .catch(err => console.error("Leave submission faile d:", err));
});
inbox_menu_btn.addEventListener("click",()=>{
  schedule_div.style.display = "none";
  calendarBox.style.display = "none";
  request_leave_form.style.display = "none";
  summary_sections.style.display = "none";
  const inboxSection = document.getElementById("inbox-section");
  inboxSection.style.display = "block";
  const requestsContainer = document.getElementById("my-requests");
  requestsContainer.innerHTML = "";

  fetch("/api/lectures/adjustments/assigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        requestsContainer.innerHTML = "<p>No adjustment requests.</p>";
        return;
      }

      data.forEach(req => {
        const card = document.createElement("div");
        card.className = "adjustment-card";
  

        card.innerHTML = `
          <p><strong>Replacement for:</strong> ${req.teacherName}</p>
          <p><strong>Subject:</strong> ${req.subject}</p>
          <p><strong>Date:</strong> ${req.date}</p>
          <p><strong>Time:</strong> ${req.startTime} - ${req.endTime}</p>
          <button class="accept-btn" data-id="${req._id}">Accept</button>
          <button class="reject-btn" data-id="${req._id}">Reject</button>
          <textarea class="rejection-reason"></textarea
        `;

        const acceptBtn = card.querySelector(".accept-btn");
        const rejectBtn = card.querySelector(".reject-btn");
        const reasonInput = card.querySelector(".rejection-reason");

  acceptBtn.onclick = () => {
  fetch("/api/lectures/adjustments/respond", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: req._id,
      action: "accept",
      teacherEmail: currentUser.email
    })
  })
  .then(res => res.json())
  .then(response => {
    alert("Lecture accepted and added to your calendar.");
    renderTimetable(currentUser.email);
    if (calendarInitialized) {
      const calendar = FullCalendar.getCalendar(document.getElementById("calendar"));
      calendar.refetchEvents();
    }
  });
};

rejectBtn.onclick = () => {
    const reason = reasonInput.value;
    if (!reason) {
      alert("Please provide a reason before rejecting.");
      return;
    }

    fetch("/api/lectures/adjustments/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: req._id,
        action: "reject",
        reason,
        teacherEmail: currentUser.email,
      }),
    })
      .then(res => res.json())
      .then(response => {
        alert("Lecture rejected. Reason sent to admin.");
        // card.remove();
      });
  };
        requestsContainer.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Failed to load adjustment requests:", err);
      requestsContainer.innerHTML = "<p>Error loading requests.</p>";
    });
})
dashboard_menu_btn.addEventListener("click",()=>{
  summary_sections.style.display="block"
  document.getElementById("schedule").style.display = "none";
  request_leave_form.style.display="none";
  calendarBox.style.display="none"
  inboxSection.style.display="none"
})
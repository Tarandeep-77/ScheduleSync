let timetable_form_btn = document.getElementById("timetable-form-btn");
let schedule_form_div = document.getElementById("schedule-form");
let schedule_div = document.getElementById("schedule");
let save_btn = document.getElementById("save-btn");
let calendarMenuBtn = document.getElementById("calendar-menu-btn");
let calendarBox = document.getElementById("calendar-box");
let backToTimetableBtn = document.getElementById("back-to-timetable-btn");
const approveLeaveBtn = document.getElementById("approve-leave-btn");
const adjustmentSection = document.getElementById("adjustment-section");
let dashboard_menu_btn = document.getElementById("dashboard-menu-btn")

document.addEventListener("DOMContentLoaded", () => {

fetch("/auth/teachers")
    .then(res => res.json())
    .then(emails => {
      const select = document.getElementById("teacher-email");
      select.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.textContent = "-- Select Teacher --";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      select.appendChild(defaultOption);

      emails.forEach(email => {
        const option = document.createElement("option");
        option.value = email;
        option.textContent = email;
        select.appendChild(option);
      });

      if (emails.length > 0) {
        const savedEmail = sessionStorage.getItem("selectedTeacherEmail") || emails[0];
        renderTimetable(savedEmail);
        select.value = savedEmail;
      }
    })
    .catch(err => {
      console.error("Failed to load teacher emails:", err);
    });
});

save_btn.addEventListener("click", (e) => {
  e.preventDefault();

  const day = document.getElementById("input-days").value;
  const date = document.getElementById("input-date").value;
  const subject = document.getElementById("subject-name").value;
  const startTime = document.getElementById("start-time").value;
  const endTime = document.getElementById("end-time").value;
  const room = document.getElementById("room-no").value;
  const teacherEmail = document.getElementById("teacher-email").value;

  if (!subject || !date || !startTime || !endTime || !room || !teacherEmail) {
    alert("Please fill all required fields!");
    return;
  }

  const lecture = {
    teacherEmail,
    day,
    date,
    subject,
    startTime,
    endTime,
    room,
  };

  fetch("/api/lectures/add-lecture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(lecture)
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Lecture saved!");
      fillLectureInTimetable(lecture);
      schedule_form_div.style.display = "none";
      schedule_div.style.display = "block";
      timetable_form_btn.style.display = "block";
      document.getElementById("timetable-form").reset();
    })
    .catch(err => {
      console.error("Failed to save lecture:", err);
      alert("Something went wrong.");
    });
});
function fillLectureInTimetable(lecture) {
  const rows = document.querySelectorAll("tbody tr");

  const timeSlot = {
    "09": 1, "10": 2, "11": 3, "12": 4,
    "13": 5, "14": 6, "15": 7, "16": 8
  };

  const row = Array.from(rows).find(r => r.cells[0].innerText === lecture.day);
  if (!row) return;

  const hour = lecture.startTime.slice(0, 2);
  const colIndex = timeSlot[hour];

  if (colIndex) {
    row.cells[colIndex].innerHTML = `
      <strong>${lecture.subject}</strong><br>
      Room: ${lecture.room}
    `;
  }
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

let calendarInitialized = false;

calendarMenuBtn.addEventListener("click", () => {
  schedule_div.style.display = "none";
  document.getElementById("adjustment-section").style.display="none";
  schedule_form_div.style.display = "none";
  timetable_form_btn.style.display = "none";
  calendarBox.style.display = "block";

  if (!calendarInitialized) {
    const calendarEle = document.getElementById("calendar");

    const calendar = new FullCalendar.Calendar(calendarEle, {
      initialView: 'dayGridMonth',
      events: function (fetchInfo, successCallback, failureCallback) {
  fetch("/api/lectures/all")
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


function loadPendingAdjustments() {
  fetch("/api/lectures/adjustments/pending")
    .then(res => res.json())
    .then(requests => {
      const list = document.getElementById("requests-list");
      list.innerHTML = "";

      requests.forEach(req => {
        const card = document.createElement("div");
        card.classList.add("adjustment-card");

        card.innerHTML = `
          <p><strong>Date:</strong> ${req.date}</p>
          <p><strong>Reason:</strong> ${req.reason}</p>
          <p><strong>Teacher:</strong> ${req.teacherName} | 
          <strong>Subject:</strong> ${req.subject} |
          <strong>Room:</strong> ${req.room} |
          <strong>Time:</strong> ${req.startTime} - ${req.endTime}</p>
        `;

        const buttonDiv = document.createElement("div");
        buttonDiv.className = "req-div-btns";

        const assignBtn = document.createElement("button");
        assignBtn.textContent = "Assign teacher";
        assignBtn.className = "assign-btn";

        const resolveBtn = document.createElement("button");
        resolveBtn.textContent = "Resolve";
        resolveBtn.className = "resolve-btn";

        buttonDiv.append(assignBtn, resolveBtn);
        card.appendChild(buttonDiv);
        list.appendChild(card);
        
        assignBtn.addEventListener("click", () => {
  fetch("/api/lectures/available-teachers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id: req._id })
  })
    .then(res => res.json())
    .then(teachers => {
      if (!teachers.length) {
        alert("No available teachers found for this time.");
        return;
      }

      const modalOverlay = document.createElement("div");
      modalOverlay.className = "modal-overlay";

  
      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";


      const heading = document.createElement("h2");
      heading.textContent = "Available Teachers";
      heading.style.marginBottom = "10px";
      modalContent.appendChild(heading);

     
      teachers.forEach(t => {
        const teacherRow = document.createElement("div");
        teacherRow.className = "teacher-row";

        const info = document.createElement("span");
        info.textContent = `${t.email} | Lectures: ${t.lectureCount}`;

        const sendBtn = document.createElement("button");
        sendBtn.textContent = "Send Request";
        sendBtn.className = "send-btn";

        sendBtn.addEventListener("click", () => {
  fetch("/api/lectures/adjustments/send-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adjustmentId: req._id,
      assignedTeacherEmail: t.email
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    document.body.removeChild(modalOverlay);
  })
  .catch(err => {
    console.error("Failed to send adjustment request:", err);
    alert("Failed to send request.");
  });
});

        teacherRow.append(info, sendBtn);
        modalContent.appendChild(teacherRow);
      });
     
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.className = "close-modal-btn";
      closeBtn.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
      });
      modalContent.appendChild(closeBtn);

      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
    })
    .catch(err => {
      console.error("Error fetching available teachers:", err);
      alert("Something went wrong.");
    });
});

      });
    });
}


// fetch("/check-session", { credentials: "include" })
//   .then(res => res.json())
//   .then(data => {
//     if (!data.active || data.user.role !== "admin") {
//       alert("Session expired or unauthorized access.");
//       window.location.href = "/login";
//     } else {
//       sessionStorage.setItem("loggedInUser", JSON.stringify(data.user)); // to keep it available
//     }
//   })
//   .catch(err => {
//     console.error("Session check failed:", err);
//     window.location.href = "/login";
//   })

timetable_form_btn.addEventListener("click", () => {  
  schedule_form_div.style.display = "block";
  schedule_div.style.display = "none";
  timetable_form_btn.style.display = "none";
});
document.getElementById("teacher-email").addEventListener("change", () => {
  const selectedEmail = document.getElementById("teacher-email").value;
  sessionStorage.setItem("selectedTeacherEmail", selectedEmail);
  renderTimetable(selectedEmail);
});
backToTimetableBtn.addEventListener("click", () => {
  calendarBox.style.display = "none";
  schedule_div.style.display = "block";
  timetable_form_btn.style.display = "block";
});

approveLeaveBtn.addEventListener("click", () => {
  schedule_div.style.display = "none";
  schedule_form_div.style.display = "none";
  calendarBox.style.display = "none";
  timetable_form_btn.style.display = "none";
  adjustmentSection.style.display = "block";

  loadPendingAdjustments();
});

dashboard_menu_btn.addEventListener("click",()=>{
  schedule_div.style.display = "block";
  timetable_form_btn.style.display = "block";
  calendarBox.style.display="none";
   adjustmentSection.style.display = "none";
})
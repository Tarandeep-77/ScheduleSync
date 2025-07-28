let timetable_form_btn = document.getElementById("timetable-form-btn");
let schedule_form_div = document.getElementById("schedule-form");
let schedule_div = document.getElementById("schedule");
let save_btn = document.getElementById("save-btn");

timetable_form_btn.addEventListener("click", () => {
  schedule_form_div.style.display = "block";
  schedule_div.style.display = "none";
  timetable_form_btn.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  // const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
  // if (user) {
  //   document.getElementById("admin-name-role").textContent = `${user.name} (${user.role})`;
  // }


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

  fetch("/api/lectures", {
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


document.getElementById("teacher-email").addEventListener("change", () => {
  const selectedEmail = document.getElementById("teacher-email").value;
  sessionStorage.setItem("selectedTeacherEmail", selectedEmail);
  renderTimetable(selectedEmail);
});


let calendarMenuBtn = document.getElementById("calendar-menu-btn");
let calendarBox = document.getElementById("calendar-box");
let backToTimetableBtn = document.getElementById("back-to-timetable-btn");
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

backToTimetableBtn.addEventListener("click", () => {
  calendarBox.style.display = "none";
  schedule_div.style.display = "block";
  timetable_form_btn.style.display = "block";
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

// setInterval(() => {
//   fetch("/check-session",{ credentials : 'include'})
//     .then(res => res.json())
//     .then(data => {
//       if (!data.active) {
//         alert("Session expired. Please login again.");
//         window.location.href = "/login";
//       }
//     })
//     .catch(err => {
//       console.error("Session check failed:", err);
//     });
// }, 60000); //10 seconds

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

const approveLeaveBtn = document.getElementById("approve-leave-btn");
const adjustmentSection = document.getElementById("adjustment-section");

approveLeaveBtn.addEventListener("click", () => {
  schedule_div.style.display = "none";
  schedule_form_div.style.display = "none";
  calendarBox.style.display = "none";
  timetable_form_btn.style.display = "none";

  adjustmentSection.style.display = "block";

  loadPendingAdjustments();
});

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
          <p><strong>Teacher:</strong> ${req.teacherName}</p>
          <p><strong>Date:</strong> ${req.date}</p>
          <p><strong>Subject:</strong> ${req.subject}</p>
          <p><strong>Room:</strong> ${req.room}</p>
          <p><strong>Time:</strong> ${req.startTime} - ${req.endTime}</p>
          <p><strong>Reason:</strong> ${req.reason}</p>
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
          fetch("/api/lectures/available-teachers")
            .then(res => res.json())
            .then(freeTeachers => {
               console.log("Free teachers:", freeTeachers);
              if (freeTeachers.length === 0) {
                alert("No available teachers found for this time slot.");
                return;
              }

         
              if (card.querySelector(".teacher-container")) return;

              const container = document.createElement("div");
              container.className = "teacher-container";

              const title = document.createElement("h3");
              title.textContent = "Available Teachers";
              container.appendChild(title);

              freeTeachers.forEach(t => {
                const teacherCard = document.createElement("div");
                teacherCard.className = "teacher-card";

                const email = document.createElement("span");
                email.textContent = t.email;
                email.className = "teacher-email";

                const sendBtn = document.createElement("button");
                sendBtn.textContent = "Send Request";
                sendBtn.className = "send-request-btn";

                sendBtn.addEventListener("click", () => {
                  alert(`Request sent to ${t.email}`);
                });

                teacherCard.appendChild(email);
                teacherCard.appendChild(sendBtn);
                container.appendChild(teacherCard);
              });

              card.appendChild(container);
            })
            .catch(err => {
              console.error("Failed to fetch available teachers:", err);
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

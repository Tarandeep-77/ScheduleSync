let forgot_password = document.getElementById("forgot-password");
let formContainer = document.getElementById("form-container");

let step1 = document.getElementById("forgot-step1");
let step2 = document.getElementById("forgot-step2");
let step3 = document.getElementById("forgot-step3");

formContainer.addEventListener("submit", (e) => {
  e.preventDefault();

  let emailInput = document.getElementById("email");
  let passwordInput = document.getElementById("password");
  let roleInput = document.getElementById("input-role");

  let email = emailInput.value;
  let password = passwordInput.value;
  let role = roleInput.value;

  fetch("/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.user.role !== role) {
          alert("Role mismatch. Please select the correct role.");
          return;
        }

        alert("Login successful!");

        sessionStorage.setItem("loggedInUser", JSON.stringify({
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          profilePic: data.user.profilePic
        }));

        if (role === "teacher") {
          window.location.href = "/teacher";
        } else {
          window.location.href = "/admin";
        }
      } else {
        alert("Invalid email or password.");
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Something went wrong.");
    });

  emailInput.value = "";
  passwordInput.value = "";
});

forgot_password.addEventListener("click", () => {
  formContainer.style.display = "none";
  step1.style.display = "block";
});

step1.addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("fp-email").value;

  fetch("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if (data.message.includes("OTP sent")) {
        step1.style.display = "none";
        step2.style.display = "block";
      }
    })
    .catch(err => console.error(err));
});

step2.addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("fp-email-verify").value;
  let otp = document.getElementById("fp-otp").value;

  fetch("/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if (data.message.includes("verified")) {
        step2.style.display = "none";
        step3.style.display = "block";
      }
    })
    .catch(err => console.error(err));
});

step3.addEventListener("submit", function(e) {
  e.preventDefault();
  let email = document.getElementById("fp-email-reset").value;
  let otp = document.getElementById("fp-otp-reset").value;
  let newPassword = document.getElementById("fp-newpass").value;
  let confirmPassword = document.getElementById("fp-confirmpass").value;

  fetch("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword, confirmPassword })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if (data.message.includes("successful")) {
        step3.style.display = "none";
        formContainer.style.display = "block";
      }
    })
    .catch(err => console.error(err));
});

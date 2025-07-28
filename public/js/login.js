document.getElementById("form-container").addEventListener("submit", (e) => {
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

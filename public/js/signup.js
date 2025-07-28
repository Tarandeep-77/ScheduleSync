document.getElementById("form-container").addEventListener("submit", (e) => {
  e.preventDefault();

  let name = document.getElementById("fullname").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let role = document.getElementById("input-role").value;
  const file = document.getElementById("image-input").files[0];
  if (name === "" || email === "" || password === "" || role === "" || file == "") {
    alert("Please fill all the fields.");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    alert("Please enter a valid email");
    return;
  }

  let uppercase = /[A-Z]/;
  let lowercase = /[a-z]/;
  let number = /[0-9]/;
  let special = /[!@#$%^&*(),.?":{}|<>]/;

  if (
    password.length < 8 ||
    !uppercase.test(password) ||
    !lowercase.test(password) ||
    !number.test(password) ||
    !special.test(password)
  ) {
    alert("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
    return;
  }

  // let user = {
  //   name: name,
  //   email: email,
  //   password: password,
  //   role: role,
  //   profilePic:file
  // };
const formData = new FormData();
formData.append("name", name);
formData.append("email", email);
formData.append("password", password);
formData.append("role", role);
formData.append("profilePic", file);
  fetch("/auth/signup", {
    method: "POST",
    // headers: {
    //   "Content-Type": "application/json"
    // },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if (data.message === "User registered successfully") {
        window.location.href = "/login";
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
    });

  document.getElementById("fullname").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
});

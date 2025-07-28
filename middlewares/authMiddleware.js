export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.render("login");
  }
};

export const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.render("login");
  }
};

export const isTeacher = (req, res, next) => {
  if (req.session.user && req.session.user.role === "teacher") {
    next();
  } else {
    res.render("login");
  }
};
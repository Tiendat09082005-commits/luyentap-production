module.exports = (req, res, next) => {
  const csrfToken = req.csrfToken ? req.csrfToken() : ''
  res.locals.csrfToken = csrfToken
  res.locals.csrf = csrfToken
  next()
}

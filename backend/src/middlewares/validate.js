export const validate = (schema) => (req, res, next) => {
  
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path.join('.')] ??= issue.message;
    });
    return res.status(400).json({
      status: 'error',
      message: result.error.issues[0].message,
      errors,
    });
  }
  req.body = result.data;
  next();
};

export default validate;
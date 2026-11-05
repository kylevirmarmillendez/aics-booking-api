export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(({ message, path, type }) => ({
        field: path.join('.') || property,
        message: message.replace(/\"/g, "'"),
        type
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details
      });
    }

    req[property] = value;
    return next();
  };
}

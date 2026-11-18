import { runPreprocessing } from '../services/preprocessService.js';

export function preprocessHandler(req, res, next) {
  try {
    const { text, options } = req.body || {};
    const result = runPreprocessing(text, options);
    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode === 422) {
      return res.status(422).json({
        detail: err.message,
      });
    }
    next(err);
  }
}


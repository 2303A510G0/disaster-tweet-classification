import { getDatasetSummary } from '../services/datasetService.js';

export async function getSummaryHandler(req, res, next) {
  try {
    const summary = await getDatasetSummary();
    res.status(200).json(summary);
  } catch (err) {
    if (err.statusCode === 503 || err.code === 'DATASET_MISSING') {
      return res.status(503).json({
        status: 'unavailable',
        detail: err.message,
      });
    }

    if (err.statusCode === 422) {
      return res.status(422).json({
        status: 'invalid',
        detail: err.message,
      });
    }

    next(err);
  }
}


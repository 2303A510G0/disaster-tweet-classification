# Model & Pipeline Artifacts

Persisted trained models, fitted vectorizers, feature selectors, and evaluation metrics:

- `models/`: Trained model binaries serialized via `joblib` (e.g., `baseline_majority.joblib`, `multinomial_nb.joblib`, `logistic_regression.joblib`, `linear_svm.joblib`).
- `vectorizers/`: Fitted vectorizers and selectors (e.g., `tfidf_unigram_bigram.joblib`, `chi2_selector.joblib`).
- `metrics/`: Structured JSON evaluation summaries, per-class metrics, and confusion matrix arrays (`evaluation_results.json`).


# Data Directory

Structured data storage following the data lifecycle:

- `raw/`: Untouched, immutable raw dataset files (e.g., `train.csv` from Kaggle Disaster Tweets). Never modified in place.
- `interim/`: Intermediate transformations or cleaned data before feature extraction.
- `processed/`: Deterministically generated train, validation, and test splits (`train_split.csv`, `val_split.csv`, `test_split.csv`) using fixed seed `42` and stratification.
- `synthetic/`: Benchmarks and synthetic test sets (never mixed with real evaluation).


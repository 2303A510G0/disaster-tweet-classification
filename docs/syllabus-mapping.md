# Syllabus Mapping Document

## Course Syllabus Alignment (JavaScript-First Implementation)

This project implements and tests Natural Language Processing concepts directly mapped to the curriculum using JavaScript:

| Topic Area | Specific Technique | Implementation Module | Evidence & Verification | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Data Ingestion & EDA** | RFC 4180 parsing, class distribution, missing values, duplicate detection | `nlp/ingestion/datasetLoader.js` | `backend/tests/unit/datasetLoader.test.js`, `backend/tests/integration/datasetSummary.test.js` | Core (Completed) |
| **Text Preprocessing** | Regex normalization (URLs, handles, HTML, casing, punctuation) | `nlp/preprocessing/textCleaner.js` | `backend/tests/unit/preprocessing.test.js` (A-F) | Core (Completed) |
| **Tokenization & Stopwords** | Word tokenization and stopword removal with semantic negation retention | `nlp/preprocessing/tokenizer.js`, `nlp/preprocessing/stopWords.js` | `backend/tests/unit/preprocessing.test.js` (G-H) | Core (Completed) |
| **Morphological Analysis** | Canonical Porter Stemmer (Martin Porter, 1980) | `nlp/preprocessing/stemmer.js` | `backend/tests/unit/preprocessing.test.js` (I) | Core (Completed) |
| **Pipeline Integration** | End-to-end pipeline returning structured intermediate transformation stages | `nlp/preprocessing/preprocessText.js`, `backend/src/services/preprocessService.js` | `backend/tests/integration/preprocessApi.test.js` (`POST /api/preprocess`) | Core (Completed) |
| **Data Splitting & Leakage Prevention** | 70/15/15 Stratified train/val/test splitting using Mulberry32 PRNG (seed 42) and Fisher-Yates | `nlp/features/dataSplitter.js` | `backend/tests/unit/dataSplitter.test.js` (13 tests) | Core (Completed) |
| **Text Representation (BoW & TF-IDF)** | Bag of Words (`CountVectorizer`), N-grams (1-gram & 2-gram), Smooth IDF, Sublinear TF, and L2 normalization | `nlp/features/countVectorizer.js`, `nlp/features/tfidfVectorizer.js` | `backend/tests/unit/vectorizers.test.js` (14 tests) | Core (Completed) |
| **Feature Selection** | Chi-Square (`chi2`) top-k term selection via binarized 2×2 contingency table | `nlp/features/featureSelector.js` | `backend/tests/unit/models.test.js` (Section A — 13 tests) | Extension (**Completed — T09**) |
| **Classical NLP Models** | Majority Baseline (`DummyClassifier`), Multinomial Naive Bayes with Laplace smoothing, Binary Logistic Regression with gradient descent and L2 regularisation | `nlp/models/baselineClassifier.js`, `nlp/models/naiveBayes.js`, `nlp/models/logisticRegression.js` | `backend/tests/unit/models.test.js` (Sections B–D — 32 tests) | Core (**Completed — T09**) |
| **Evaluation Metrics & Comparison** | Accuracy, Precision, Recall, Macro/Weighted F1, Confusion Matrix, Validation-Based Model Selection, Isolated Test Evaluation | `nlp/evaluation/metrics.js`, `nlp/evaluation/modelEvaluator.js`, `nlp/evaluation/modelComparison.js`, `nlp/pipeline/experimentPipeline.js` | `backend/tests/unit/evaluation.test.js` (59 tests) | Core (**Completed — T10**) |
| **Interactive Preprocessing Sandbox** | Real-time 6-stage transformation explorer (cleaning, tokens, stop-words, negations, stems) | `frontend/src/pages/PreprocessingSandbox.jsx` | `frontend/src/tests/PreprocessingSandbox.test.jsx` (6 tests) | Core (**Completed — T15**) |
| **Feature Extraction & Selection Explorer** | Interactive BoW, Smooth TF-IDF, and 2x2 Chi-Square contingency table demonstration | `frontend/src/pages/FeatureExtractionExplorer.jsx`, `backend/src/services/featuresService.js` | `frontend/src/tests/FeatureExtractionExplorer.test.jsx` (3 tests), `backend/tests/integration/featuresApi.test.js` (7 tests) | Core (**Completed — T15**) |
| **Model Training & Comparison UI** | Real-time experiment pipeline trigger, benchmark comparison table, and confusion matrix | `frontend/src/pages/ModelComparison.jsx`, `frontend/src/components/common/ConfusionMatrixTable.jsx` | `frontend/src/tests/ModelComparison.test.jsx` (4 tests) | Core (**Completed — T16**) |
| **Tweet Prediction Workbench** | Real-time classification inference, model badge, and confidence probability bar | `frontend/src/pages/Prediction.jsx` | `frontend/src/tests/Prediction.test.jsx` (8 tests) | Core (**Completed — T16**) |

## Documented Limitations & Technical Notes
- **Lemmatization vs. Stemming:** Full WordNet morphological lemmatization requires extensive lexical dictionary databases. The application implements canonical Porter Stemming (`stemmer.js`) which reliably standardizes word stems in pure JavaScript.
- **Strict Leakage Prevention:** `CountVectorizer` and `TfidfVectorizer` enforce strict separation between `fit()` and `transform()`. Only training documents contribute to vocabulary and IDF weights; validation and test sets are transformed with unseen tokens ignored.

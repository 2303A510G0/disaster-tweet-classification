# PROJECT_CONTEXT.md

## 1. Project Title and Summary
**Project Title:** Syllabus-Aligned Disaster Tweets NLP Classification Platform
**Summary:** An end-to-end full-stack Natural Language Processing web application that classifies disaster-related social media posts (binary classification: 0 = Not Disaster, 1 = Real Disaster). Built with a decoupled service-oriented architecture: a React.js (Vite) frontend for user interaction and linguistic exploration, a Node.js + Express.js backend serving as the public REST API gateway and orchestrator, a Python NLP engine for data preprocessing, BoW/TF-IDF vectorization, feature selection, model training, evaluation, and an internal inference service, containerized via Docker and orchestratable with Kubernetes.

---

## 2. Problem Statement and Target Users
- **Problem Statement:** During natural hazards and humanitarian emergencies, social media feeds are flooded with crisis-relevant reports mixed with metaphorical or non-critical language (e.g., "That concert was fire" vs "Wildfire spreading rapidly"). Students and practitioners need a transparent, verifiable tool to experiment with NLP pipelines—observing text cleaning, tokenization, stemming/lemmatization, feature extraction (BoW, TF-IDF, n-grams, Chi-square), model training (Naive Bayes, Logistic Regression / MaxEnt, Linear SVM), metric evaluation, and real-time prediction.
- **Target Users:** Academic evaluators, students, and NLP engineers requiring reproducible, test-driven implementations of syllabus concepts.

---

## 3. Confirmed NLP Task and Target Label
- **Status:** Confirmed by User (Option A — Disaster Tweets Binary Classification).
- **Task:** Classify an input tweet as either referring to a real disaster (`target = 1`) or not (`target = 0`).
- **Input Feature Column:** `text` (raw tweet string).
- **Target Label Column:** `target` (binary integer: `0` for Not Disaster, `1` for Disaster).
- **Evaluation Criteria:** Macro F1-score, Precision, Recall, Accuracy, and Confusion Matrix.
- **Dataset Policy:** Uses the real Kaggle Disaster Tweets dataset (`data/raw/train.csv`). No synthetic data will replace the real dataset.

---

## 4. Technology Architecture and Responsibilities

| Layer | Technology | Primary Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React.js + Vite + JavaScript (`.jsx`) | Responsive, restrained academic UI for prediction, preprocessing preview, EDA overview, and model metrics. |
| **Backend API** | Node.js + Express.js (`.js`) | Main REST API gateway, request validation, CORS, error handling, dataset metadata, and prediction orchestration. |
| **NLP Engine** | JavaScript (Node.js) | Text preprocessing (regex cleaning, tokenization, stop-words with negation retention, stemming), feature extraction (BoW, TF-IDF, n-grams), feature selection, and classification models (Naive Bayes, Logistic Regression / linear classifiers). Python is reserved strictly as an exception if a feature is provably impossible in JS. |
| **Data Ingestion** | Node.js (`csv-parser` / streaming parser) | Ingesting and validating `data/raw/train.csv`, computing EDA statistics, and splitting data without leakage. |
| **Containerization** | Docker | Container images for React Frontend and Express Backend (`docker/docker-compose.yml`). |
| **Orchestration** | Kubernetes | Declarative manifests in `k8s/` (Deployments, Services, ConfigMaps). |

---

## 5. Dataset Information
- **Dataset Name:** Kaggle Disaster Tweets Dataset ("Natural Language Processing with Disaster Tweets").
- **Source File Path:** `data/raw/train.csv` (and `data/raw/test.csv`).
- **File Format:** CSV.
- **Expected Columns:** `id` (int), `keyword` (optional string), `location` (optional string), `text` (tweet text string), `target` (binary integer: 0 or 1).
- **Primary Input Column:** `text`.
- **Target Label Column:** `target` (0 = Not Disaster, 1 = Real Disaster).
- **Data Policy:** Original raw data preserved in `data/raw/` untouched; split sets saved deterministically to `data/processed/`.

---

## 6. Syllabus Mapping

| Syllabus Topic | Planned Implementation Location | Verification / Test Evidence | Priority |
| :--- | :--- | :--- | :--- |
| **Data Ingestion & EDA** | `nlp/dataset.py` | `nlp/tests/unit/test_dataset.py` (shape, class balance, column integrity) | Core |
| **Text Preprocessing** (URL/mention/hashtag handling, regex normalization, stop-words with negation retention, stemming & lemmatization) | `nlp/preprocessing/` | `nlp/tests/unit/test_cleaner.py`, `test_tokenizer.py`, `test_stemmer.py` | Core |
| **Linguistic Analysis** (POS tagging preview, lexical diversity) | `nlp/preprocessing/linguistics.py` | `nlp/tests/unit/test_linguistics.py` (sample tweet POS tags) | Core |
| **Text Representation** (BoW `CountVectorizer`, TF-IDF unigram + bigram `TfidfVectorizer`) | `nlp/features/vectorizers.py` | `nlp/tests/unit/test_features.py` (vocabulary shape, sparsity) | Core |
| **Feature Selection** (Top-K Chi-square `chi2` & Mutual Information `mutual_info_classif`) | `nlp/features/selectors.py` | `nlp/tests/unit/test_selectors.py` (top-k disaster features) | Extension |
| **Classical & Statistical Models** (Majority Baseline, Multinomial Naive Bayes, Logistic Regression / MaxEnt, Linear SVM) | `nlp/models/` | `nlp/tests/unit/test_models.py` (convergence, deterministic seed 42) | Core Comparison |
| **Advanced Neural Comparison** (Bi-LSTM / DistilBERT benchmark evaluation) | `nlp/models/advanced/` | `nlp/tests/unit/test_advanced_models.py` | Extension |
| **Model Evaluation** (Accuracy, Precision, Recall, Macro/Weighted F1, Confusion Matrix) | `nlp/evaluation/` | `nlp/tests/unit/test_evaluation.py` (ground truth validation) | Core |
| **Artifact Persistence** (Joblib artifact loading, inference pipeline) | `nlp/predict.py` | `nlp/tests/integration/test_inference.py` | Core |
| **Out-of-Scope Topics** | HMM sequence tagging, BLEU / Perplexity for generative tasks, CFG parsing | Documented as out of scope for document text classification | Documented |

---

## 7. Repository Tree

```text
lostandfounditems/
|-- frontend/                         # React + Vite + JavaScript
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- tests/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |-- public/
|   |-- package.json
|   |-- Dockerfile
|
|-- backend/                          # Node.js + Express.js + JavaScript
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- validators/
|   |   |-- app.js
|   |   |-- server.js
|   |-- tests/
|   |   |-- unit/
|   |   |-- integration/
|   |-- package.json
|   |-- Dockerfile
|
|-- nlp/                               # Python training & inference service
|   |-- preprocessing/
|   |-- features/
|   |-- models/
|   |-- evaluation/
|   |-- tests/
|   |   |-- unit/
|   |   |-- integration/
|   |-- requirements.txt
|   |-- Dockerfile
|
|-- contracts/
|   |-- openapi.yaml
|   |-- examples/
|   |-- README.md
|
|-- data/
|   |-- raw/
|   |-- interim/
|   |-- processed/
|   |-- synthetic/
|   |-- README.md
|
|-- artifacts/
|   |-- models/
|   |-- vectorizers/
|   |-- metrics/
|   |-- README.md
|
|-- docker/
|   |-- docker-compose.yml
|
|-- k8s/
|   |-- namespace.yaml
|   |-- frontend-deployment.yaml
|   |-- frontend-service.yaml
|   |-- backend-deployment.yaml
|   |-- backend-service.yaml
|   |-- nlp-deployment.yaml
|   |-- nlp-service.yaml
|   |-- configmap.yaml
|
|-- docs/
|   |-- syllabus-mapping.md
|   |-- architecture.md
|   |-- experiments.md
|
|-- PROJECT_CONTEXT.md
|-- .gitignore
```

---

## 8. API Contracts and Endpoint Status

| Method | Endpoint | Express Responsibility | NLP Engine Responsibility | Status |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/health` | Returns Express gateway health | Returns NLP service health status | Specified |
| GET | `/api/dataset/summary` | Serves row counts, missing values, class distributions | Reads from `data/` metadata | Specified |
| POST | `/api/preprocessing/preview` | Validates request payload | Executes tokenization, stemming, POS | Specified |
| GET | `/api/models` | Returns available models & configurations | Reads from `artifacts/` | Specified |
| GET | `/api/metrics` | Serves evaluation metrics & confusion matrices | Reads `artifacts/metrics/evaluation_results.json` | Specified |
| POST | `/api/predict` | Validates input text length | Performs vectorized inference & scoring | Specified |

---

## 9. Split Strategy and Random Seed
- **Random Seed:** `42` (pinned across all splits and models for reproducibility).
- **Split Ratios:** 70% Train, 15% Validation, 15% Test.
- **Stratification:** Stratified splitting based on `target` to preserve class proportions.
- **Leakage Prevention:** Vectorizers and selectors fit strictly on Train split; Validation and Test splits transformed only.

---

## 10. Models and Hyperparameters
1. **Majority Baseline:** `DummyClassifier(strategy='most_frequent')`
2. **Multinomial Naive Bayes:** `MultinomialNB(alpha=0.5)` with TF-IDF (1-gram + 2-gram).
3. **Logistic Regression (MaxEnt):** `LogisticRegression(C=1.0, max_iter=1000, random_state=42)`.
4. **Linear Support Vector Classifier:** `LinearSVC(C=1.0, random_state=42)` with Chi-Square Selection.

---

## 11. Artifact Paths
- Models: `artifacts/models/<model_name>.joblib`
- Vectorizers: `artifacts/vectorizers/<vectorizer_name>.joblib`
- Metrics: `artifacts/metrics/evaluation_results.json`

---

## 12. Environment Setup and Commands
- **Python:** 3.15.2 (installed packages: scikit-learn, pandas, numpy, nltk, joblib, pytest, fastapi, uvicorn, httpx).
- **Node.js:** v26.13.0, npm.cmd 11.20.0.
- **Windows Command Rule:** Run `npm.cmd` directly.

---

## 13. Task Checklist and Status

- [x] **T00** — Inspect current workspace and existing project files. (COMPLETED)
- [x] **T01** — Confirm Disaster Tweets dataset and verify schema. (COMPLETED)
- [x] **T02** — Reconcile/create skeleton for React, Express, NLP, contracts, data, artifacts, Docker, Kubernetes, and docs. (COMPLETED)
- [x] **T03** — Define and validate REST API contracts (`contracts/openapi.yaml`). (COMPLETED)
- [x] **T04** — Implement Express foundation and `/api/health` endpoint. (COMPLETED)
- [x] **T05** — Implement dataset ingestion and dataset summary API (`/api/dataset/summary`). (COMPLETED)
- [x] **T06** — Implement and test JavaScript NLP preprocessing (cleaning, tokenization, stemming, POS). (COMPLETED)
- [x] **T07** — Implement leakage-safe dataset splitting (stratified train/val/test). (COMPLETED)
- [x] **T08** — Implement BoW and TF-IDF feature extraction. (COMPLETED)
- [x] **T09** — Implement Chi-Square selection, Baseline, Naive Bayes, and Logistic Regression classifiers. (COMPLETED)
- [x] **T10** — Implement JavaScript Model Evaluation, Metrics, and Comparison. (COMPLETED)
- [x] **T11** — Integrate the JavaScript NLP pipeline into Express backend. (COMPLETED)
- [x] **T12** — Backend API Audit, Validation and Finalization. (COMPLETED)
- [x] **T13** — Build React application foundation and navigation. (COMPLETED)
- [x] **T14** — Build Dashboard and Dataset Explorer views. (COMPLETED)
- [x] **T15** — Build Preprocessing Sandbox and Feature Extraction views. (COMPLETED)
- [x] **T16** — Build Model Training, Evaluation, and Tweet Predictor views. (COMPLETED)
- [x] **T17** — Docker, Kubernetes and Full-Stack Deployment Integration. (COMPLETED)
- [x] **T18** — Final Runtime Verification, Dataset Integration and Project Acceptance. (COMPLETED)

---

## Progress Log

### Task: T18 (Part B) — Fix Dataset Ingestion Bridge and Verify Real Training Readiness
- **Status:** Complete (Ingestion Bridge Fixed & Verified; Ready for User-Triggered Training)
- **Date:** 2026-11-16
- **Summary:** Fixed the dataset loader contract and verified real dataset training readiness without modifying raw data or triggering automatic training:
  - **Dataset Loader Contract Bridge (`nlp/ingestion/datasetLoader.js`):**
    - Updated `loadAndAnalyzeDataset()` to include `records: validRecords` in the return object while preserving all existing metadata fields (`total_records`, `valid_records`, `class_distribution`, `sample_records`).
    - Excludes invalid records according to strict validation rules (non-empty text and binary target 0 or 1).
    - Preserved existing error handling for missing (503) or malformed (422) dataset files.
  - **Model & Dataset Service Paths:**
    - Integrated `getDefaultDatasetPath()` into `backend/src/services/modelService.js`, ensuring `modelService` and `ExperimentPipeline` reliably locate `data/raw/train.csv` regardless of execution cwd.
  - **Comprehensive Dataset Integrity & Leakage Audit:**
    - Confirmed `data/raw/train.csv` is present, valid, and unmodified (7,613 records, SHA256: `61111c6dc31eaffa34d1e1fa62e2395325c9bc3b38bba1941a5f1ed9b3fa60df`).
    - Disambiguated `duplicate_records: 92`: represents identical `(text, target)` rows. Documented that 110 raw text duplicate rows exist (7,503 unique texts), including 18 texts with contradictory human annotations.
    - Documented cross-partition overlap under row-level stratified split (1.23% in Validation, 2.54% in Test).
  - **TDD Integration Testing (`backend/tests/integration/realDatasetIngestion.test.js`):**
    - Added 5 integration tests verifying:
      1. `loadAndAnalyzeDataset()` returns a `records` array.
      2. Records contain parsed text and binary target.
      3. Total records count is exactly 7,613.
      4. Class distribution matches 3,271 disaster and 4,342 non-disaster.
      5. `ExperimentPipeline` receives actual records instead of undefined.
      6. Missing dataset paths return documented 503 error.
      7. Existing dataset summary API response fields remain backward-compatible.
  - **Full Regression Verification:**
    - Backend: 17 test files passed, 236 tests passed (`npm.cmd test`).
    - Frontend: 9 test files passed, 45 tests passed (`npm.cmd test -- --run`).
    - Contracts: 4 passed (`pytest nlp/tests/unit/test_contracts.py -v`).
    - Original CSV file verified 100% unchanged.
- **Files created/modified:**
  - `nlp/ingestion/datasetLoader.js`
  - `backend/src/services/modelService.js`
  - `backend/tests/integration/realDatasetIngestion.test.js`
  - `backend/tests/integration/modelApi.test.js`
  - `backend/tests/integration/apiAudit.test.js`
  - `docs/experiments.md`
  - `docs/architecture.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 5 real-dataset integration tests
- **Final test results:** 45 frontend tests passed | 236 backend tests passed | 4 contract tests passed
- **Next step:** Ready for user to trigger real model training via `/models` UI or `POST /api/model/train`.

### Task: T18 — Final Runtime Verification, Dataset Integration and Project Acceptance
- **Status:** Complete (Functionality Verified; Live Container & Genuine Training Pending External Prerequisites)
- **Date:** 2026-11-16
- **Summary:** Conducted final runtime readiness verification, dataset status inspection, regression testing, and operations documentation:
  - **Docker Readiness & Configuration Validation:**
    - Verified Docker CLI v29.9.2 and `docker-compose` CLI v5.6.1 available on host.
    - Successfully validated `docker-compose.yml` with `docker-compose config`, verifying service definitions, network bridge, port mappings (`5000:5000`, `3000:80`), volume binds, and health checks.
    - Verified Docker Desktop daemon engine is currently stopped on Windows host; accurately recorded that live container deployment remains pending manual Docker Desktop launch.
  - **Kubernetes Deployment Readiness:**
    - Verified `kubectl` client v1.36.1 available on host.
    - Validated all 6 Kubernetes manifests (`configmap.yaml`, `pvc.yaml`, `backend-deployment.yaml`, `backend-service.yaml`, `frontend-deployment.yaml`, `frontend-service.yaml`).
    - Verified local Kubernetes cluster is currently offline; accurately recorded that live cluster rollout remains pending.
  - **Dataset Status & Anti-Fabrication Adherence:**
    - Inspected `data/raw/train.csv` (confirmed absent from local workspace).
    - Preserved strict anti-fabrication policy: zero synthetic data generated, zero imaginary metrics created, model training kept in transparent 503 unavailable state.
    - Documented exact expected Kaggle dataset name ("Natural Language Processing with Disaster Tweets") and target path `data/raw/train.csv`.
  - **Full-Stack End-to-End Workflow Verification:**
    - Verified Dashboard KPI cards and live backend health connectivity.
    - Verified Dataset Explorer transparent 503 missing state and schema specification table.
    - Verified Preprocessing Sandbox with 6-stage transformation pipeline, negation retention, and Porter stemming.
    - Verified Feature Extraction Explorer with BoW, Smooth TF-IDF, and Chi-Square $2 \times 2$ contingency tables.
    - Verified Model Comparison empty state and candidate model profile cards.
    - Verified Tweet Prediction workbench with character bounds, sample chips, and 503 `NO_MODEL_LOADED` alert handling.
  - **Comprehensive Regression Verification:**
    - Frontend: 9 test files passed, 45 tests passed (`npm.cmd test -- --run`).
    - Frontend production build: completed cleanly in 826ms (`npm.cmd run build`).
    - Backend: 16 test files passed, 228 tests passed (`npm.cmd test`).
    - Python contracts: 4 passed (`pytest nlp/tests/unit/test_contracts.py -v`).
  - **Final Documentation:**
    - Created `docs/deployment-guide.md` with complete prerequisites, local dev steps, Docker Desktop startup, Compose orchestration, K8s rollout, dataset placement, model training, and troubleshooting.
    - Updated `docs/architecture.md` and `docs/experiments.md`.
- **Files created/modified:**
  - `docs/deployment-guide.md`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Final test results:** 45 frontend tests passed | 228 backend tests passed | 4 contract tests passed
- **Next step:** Await user review and acceptance.

### Task: T17 — Docker, Kubernetes and Full-Stack Deployment Integration
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Containerized and integrated the complete NLP Disaster Tweets application for production-ready deployment with Docker, Docker Compose, and Kubernetes:
  - **Backend Containerization (`backend/Dockerfile` & `.dockerignore`):**
    - Built production-ready `node:20-alpine` image copying `backend/` and shared pure-JavaScript NLP engine (`nlp/`).
    - Configured non-root execution with user `node` (UID 1000).
    - Pre-created `/app/data/raw` and `/app/artifacts/models` directories with user ownership.
    - Added Docker healthcheck probing `GET /api/health` via `curl`.
    - Exposed port 5000.
  - **Frontend Multi-Stage Containerization (`frontend/Dockerfile`, `nginx.conf`, & `.dockerignore`):**
    - Stage 1 (`builder`): Compiles static React 19 production distribution with Vite using `node:20-alpine`.
    - Stage 2 (`runner`): Serves static bundle with `nginx:1.25-alpine`.
    - Configured `nginx.conf` with SPA fallback routing (`try_files $uri $uri/ /index.html`) and reverse proxy routing `/api/` traffic to `http://backend:5000/api/` with proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
    - Added healthcheck probing `http://localhost:80/` via `wget`.
    - Exposed port 80.
  - **Docker Compose Orchestrator (`docker-compose.yml` & root `.dockerignore`):**
    - Defines `backend` and `frontend` services connected via custom bridge network `disaster-nlp-net`.
    - Mapped host ports `5000:5000` (backend) and `3000:80` (frontend).
    - Mounted host volumes `./data:/app/data` (raw dataset) and `./artifacts:/app/artifacts` (persisted model checkpoints).
    - Configured runtime environment variables and service dependency with `condition: service_healthy`.
  - **Kubernetes Manifests (`k8s/`):**
    - `k8s/configmap.yaml`: Application configuration (`PORT=5000`, `NODE_ENV=production`, `CORS_ORIGINS`).
    - `k8s/pvc.yaml`: 1Gi `PersistentVolumeClaim` (`nlp-artifacts-pvc`) for model artifact persistence.
    - `k8s/backend-deployment.yaml`: Backend deployment with resource constraints (100m–500m CPU, 128Mi–512Mi Memory), liveness/readiness probes targeting `/api/health`, and volume mount to `/app/artifacts`.
    - `k8s/backend-service.yaml`: ClusterIP service on port 5000.
    - `k8s/frontend-deployment.yaml`: Frontend deployment with resource constraints (50m–250m CPU, 64Mi–128Mi Memory) and HTTP health probes.
    - `k8s/frontend-service.yaml`: NodePort service exposing port 80 on node port 30080.
  - **Automated Validation Suite (`backend/tests/unit/deploymentValidation.test.js`):**
    - Followed strict TDD (RED-GREEN-REFACTOR) to validate all Dockerfiles, Compose specs, and K8s manifests (11 automated tests passed).
  - **Model Comparison Integrity Audit:**
    - Verified that because `data/raw/train.csv` is absent, the UI shows the dataset unavailable state, never displays fabricated metrics, and has zero winner designation on missing data.
  - **Regression & Build Verification:**
    - Frontend: 45 passed (9 test files)
    - Frontend production build: completed cleanly in 836ms
    - Backend: 228 passed (16 test files)
    - Python contract tests: 4 passed
- **Files created/modified:**
  - `backend/Dockerfile`
  - `backend/.dockerignore`
  - `frontend/Dockerfile`
  - `frontend/nginx.conf`
  - `frontend/.dockerignore`
  - `docker-compose.yml`
  - `.dockerignore`
  - `k8s/configmap.yaml`
  - `k8s/pvc.yaml`
  - `k8s/backend-deployment.yaml`
  - `k8s/backend-service.yaml`
  - `k8s/frontend-deployment.yaml`
  - `k8s/frontend-service.yaml`
  - `backend/package.json`
  - `backend/tests/unit/deploymentValidation.test.js`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 11 deployment validation unit tests
- **Final test results:** 45 frontend tests passed | 228 backend tests passed | 4 contract tests passed
- **Next task:** Await user review before starting next task.

### Task: T16 — Build Model Training, Evaluation, Comparison and Tweet Prediction Views
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Built and verified the interactive Model Training & Comparison view (`/models`) and Tweet Prediction view (`/predict`) in the React frontend, fully connected to the existing Express backend and JavaScript NLP pipeline:
  - **Component & UI Implementation:**
    - `frontend/src/components/common/ConfusionMatrixTable.jsx`: Reusable $2 \times 2$ visual confusion matrix component rendering True Negatives (TN), False Positives (FP), False Negatives (FN), and True Positives (TP) with sample totals.
    - `frontend/src/pages/ModelComparison.jsx`:
      - Training control card with live status indicators (dataset presence, loaded model, training state, disk artifact).
      - "Train Models" action button with active spinner, disabling duplicate submissions during training runs.
      - Displays clear error recovery instructions if `train.csv` is missing (HTTP 503) without fabricating fake metrics.
      - When trained: renders winning model announcement badge, full benchmark comparison table (Validation Accuracy, Macro F1, Weighted F1, Precision, Recall, Log-Loss, Brier score), and detailed per-model classification reports and confusion matrices.
      - When not trained: displays informative empty state and candidate model profile cards for `DummyClassifier`, `MultinomialNaiveBayes`, and `LogisticRegression`.
      - Syllabus methodology section explaining why validation Macro F1 is used for model selection and why the test partition is isolated.
    - `frontend/src/pages/Prediction.jsx`:
      - Live inference sequence breakdown.
      - Model status indicator alerting users if no model is loaded.
      - Input textarea with live character counter (`0 / 5,000 characters`) matching backend length boundaries.
      - 4 illustrative example chips (disaster report, metaphorical non-disaster, earthquake alert, negation).
      - Live prediction result card: Class 1 Disaster (`🚨 Real Disaster Report`) in red vs. Class 0 Non-Disaster (`🟢 Not a Disaster Report`) in blue.
      - Proportional confidence probability bar rendering model-estimated probabilities for both classes.
      - Mandatory academic disclaimer ("Predictions are model estimates, not verified facts...").
      - Clear / Reset action and robust error handling for 503 `NO_MODEL_LOADED` and 422 validation errors.
  - **Testing & Verification (Strict TDD):**
    - Created `frontend/src/tests/ModelComparison.test.jsx` (4 tests) covering status display, missing dataset guidance, training button behavior, comparison table, confusion matrix, and winning model badge.
    - Created `frontend/src/tests/Prediction.test.jsx` (8 tests) covering input validation, example chips, Class 1 and Class 0 prediction outcomes, probabilities, model-not-loaded alerts, and reset action.
    - Updated `frontend/src/tests/App.test.jsx` covering all 7 route integration tests.
    - Verified all 45 frontend tests passing (`npm.cmd test`).
    - Verified clean production bundle build (`npm.cmd run build` in 848ms).
    - Verified full backend regression (217 tests passing across 15 test files).
    - Verified contract tests (4/4 passing via pytest).
- **Files created/modified:**
  - `frontend/src/components/common/ConfusionMatrixTable.jsx`
  - `frontend/src/pages/ModelComparison.jsx`
  - `frontend/src/pages/Prediction.jsx`
  - `frontend/src/tests/ModelComparison.test.jsx`
  - `frontend/src/tests/Prediction.test.jsx`
  - `frontend/src/tests/App.test.jsx`
  - `docs/architecture.md`
  - `docs/syllabus-mapping.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 12 frontend component and integration tests
- **Final test results:** 45 frontend tests passed | 217 backend tests passed | 4 contract tests passed
- **Production build:** `vite build` completed in 848ms (HTML 0.75 kB, CSS 4.44 kB, JS 355.7 kB)
- **Next task:** T17 — Run frontend unit and integration tests.

### Task: T15 — Build Interactive Preprocessing Sandbox and Feature Extraction Views
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Built and verified the interactive Preprocessing Sandbox and Feature Extraction Explorer views in the React frontend, connected to pure JavaScript NLP modules and Node.js/Express APIs:
  - **Backend Features Service & REST APIs (`backend/src/`):**
    - `backend/src/services/featuresService.js`: Reuses pure JS `CountVectorizer`, `TfidfVectorizer`, and `ChiSquareSelector`. Implements `extractFeatures`, `getDatasetFeaturesInfo`, and `getEducationalDemo`.
    - `backend/src/controllers/featuresController.js` & `backend/src/routes/features.js`: Mounts `POST /api/features/extract`, `GET /api/features/dataset-info`, and `GET /api/features/educational-demo`.
    - Strict TDD (RED-GREEN-REFACTOR): Added 7 integration tests in `backend/tests/integration/featuresApi.test.js` covering input validation (empty, non-string, > 2000 chars), feature extraction, bigram support, dataset-trained status, and educational contingency tables.
  - **Frontend Preprocessing Sandbox (`/preprocess`):**
    - Built `frontend/src/pages/PreprocessingSandbox.jsx`: Textarea with live character counter (`0 / 2,000 characters`) and client-side boundary checks.
    - 3 illustrative example chips (disaster report, metaphorical negation, web noise).
    - Transformation option toggles (lowercase, URL removal, HTML stripping, mentions, hashtags, stop-words, negation retention, Porter stemming).
    - Comprehensive educational callout explaining the difference between heuristic suffix-stripping (Porter Stemmer) vs. morphological dictionary lookup (WordNet Lemmatization), and why negation retention is critical for disaster sentiment.
    - 6-stage sequential pipeline cards (Original, Cleaned, Tokens, Filtered tokens with highlighted negation stars, Stemmed tokens, Final processed text with copy button).
  - **Frontend Feature Extraction Explorer (`/features`):**
    - Built `frontend/src/pages/FeatureExtractionExplorer.jsx`:
    - Dataset-trained status card clearly indicating whether real dataset vocabulary is trained or unavailable without fabricating fake numbers.
    - Interactive Playground: allows testing arbitrary tweets with unigram or unigram+bigram ranges and sublinear TF scaling.
    - Section A (Bag of Words): Explains vocabulary creation, indexing, token counting, and zero-leakage test transformation.
    - Section B (TF-IDF Vectorizer): Explains Smooth IDF ($\ln((1+N)/(1+DF)) + 1$), Sublinear TF, and L2 normalization formulas.
    - Section C (Chi-Square Feature Selection): Explains feature selection theory, train-split-only fitting to prevent data leakage, $2 \times 2$ contingency table structure ($A, B, C, D$), expected frequencies, and $\chi^2$ scoring.
  - **Navigation & Routing Updates:**
    - Updated `frontend/src/components/layout/Sidebar.jsx` with links to `/preprocess` and `/features`.
    - Updated `frontend/src/App.jsx` with routes for `<PreprocessingSandbox />` and `<FeatureExtractionExplorer />`.
    - Updated `frontend/src/pages/Dashboard.jsx` with quick action buttons.
  - **Testing & Verification:**
    - Created unit & integration tests:
      - `frontend/src/tests/PreprocessingSandbox.test.jsx` (6 tests)
      - `frontend/src/tests/FeatureExtractionExplorer.test.jsx` (3 tests)
    - Updated `frontend/src/tests/navigation.test.jsx` (6 tests) and `frontend/src/tests/App.test.jsx` (7 tests).
    - Verified all 33 frontend tests passing (`npm.cmd test`).
    - Verified clean production bundle build (`npm.cmd run build` in 847ms).
    - Verified full backend regression (217 tests passing across 15 test files).
    - Verified contract tests (4/4 passing via pytest).
- **Files created/modified:**
  - `backend/src/services/featuresService.js`
  - `backend/src/controllers/featuresController.js`
  - `backend/src/routes/features.js`
  - `backend/src/app.js`
  - `backend/tests/integration/featuresApi.test.js`
  - `contracts/openapi.yaml`
  - `frontend/src/api/featuresApi.js`
  - `frontend/src/pages/PreprocessingSandbox.jsx`
  - `frontend/src/pages/FeatureExtractionExplorer.jsx`
  - `frontend/src/components/layout/Sidebar.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/tests/PreprocessingSandbox.test.jsx`
  - `frontend/src/tests/FeatureExtractionExplorer.test.jsx`
  - `frontend/src/tests/navigation.test.jsx`
  - `frontend/src/tests/App.test.jsx`
  - `docs/architecture.md`
  - `docs/syllabus-mapping.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 16 tests (7 backend integration tests, 9 frontend component and route tests)
- **Final test results:** 33 frontend tests passed | 217 backend tests passed | 4 contract tests passed
- **Production build:** `vite build` completed in 847ms (HTML 0.75 kB, CSS 4.44 kB, JS 332.8 kB)
- **Next task:** T16 — Build Model Training, Evaluation, and Tweet Predictor views.

### Task: T14 — Build Interactive Dashboard and Dataset Explorer
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Built and verified the interactive Dashboard and Dataset Explorer pages in the React frontend:
  - **Reusable State Hooks:**
    - `frontend/src/hooks/useDatasetSummary.js`: Encapsulates data fetching from `GET /api/dataset/summary`. Handles loading state, error reporting, 503 unavailable status, and exposes manual `refresh()`.
    - `frontend/src/hooks/useModelStatus.js`: Encapsulates model and training status polling from `GET /api/model/status`. Exposes loading, error, model status, and `refresh()`.
  - **Data Visualization & UI Components:**
    - `frontend/src/components/common/ClassDistributionChart.jsx`: Proportional SVG/CSS stacked horizontal bar and color-coded card metrics displaying disaster vs non-disaster counts, percentages, and total sample counts.
    - `frontend/src/components/common/PipelineFlow.jsx`: Visual 7-step connected pipeline component (Dataset Ingestion → Text Preprocessing → Feature Extraction → Feature Selection → Classification Models → Metric Evaluation → Tweet Inference) detailing technologies, status, and syllabus alignment.
  - **Dashboard (`/`):**
    - High-level KPI overview cards: API Gateway status (live probe), Dataset Availability, Total Records, and Active ML Model.
    - System health cards, class distribution visualization when dataset is available, visual pipeline flow, and quick-action navigation cards.
  - **Dataset Explorer (`/dataset`):**
    - High-level EDA cards: Total records, Valid records, Duplicate records, and Columns verified.
    - Class distribution visualization (when dataset is present).
    - Data quality and missing values diagnostic table inspecting `id`, `keyword`, `location`, `text`, and `target`.
    - Sample records table displaying preview records from backend.
    - Unconditional Kaggle Dataset Schema Specification table documenting column names, types, descriptions, and roles.
    - Professional HTTP 503 empty state when `train.csv` is missing with an interactive retry/refresh button and clear user instructions.
  - **Testing & Verification:**
    - Created unit & integration tests in `frontend/src/tests/Dashboard.test.jsx` (3 tests) and `frontend/src/tests/DatasetExplorer.test.jsx` (4 tests).
    - Verified all 22 frontend tests passing across 5 test files (`npm.cmd test`).
    - Verified clean production bundle build (`npm.cmd run build` in 879ms).
    - Verified full backend regression (210 tests passing across 14 test files).
    - Verified contract tests (4/4 passing via pytest).
- **Files created/modified:**
  - `frontend/src/hooks/useDatasetSummary.js`
  - `frontend/src/hooks/useModelStatus.js`
  - `frontend/src/components/common/ClassDistributionChart.jsx`
  - `frontend/src/components/common/PipelineFlow.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/DatasetExplorer.jsx`
  - `frontend/src/tests/Dashboard.test.jsx`
  - `frontend/src/tests/DatasetExplorer.test.jsx`
  - `frontend/src/tests/App.test.jsx`
  - `docs/architecture.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 7 frontend tests across `Dashboard.test.jsx` and `DatasetExplorer.test.jsx`
- **Final test results:** 22 frontend tests passed | 210 backend tests passed | 4 contract tests passed
- **Production build:** `vite build` completed cleanly (HTML 0.75 kB, CSS 4.44 kB, JS 300.5 kB)
- **Next task:** T15 — Build Preprocessing Sandbox and Feature Extraction views.

### Task: T13 — Build React Application Foundation and Navigation
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Built the foundation of the React 19 + Vite 6 frontend application in `frontend/`:
  - **Component & Layout Architecture:** Implemented `AppLayout`, `Header`, and `Sidebar` featuring responsive desktop sidebar, collapsible mobile navigation with backdrop, and active route highlighting via React Router 7.
  - **Visual Design:** Applied a clean, restrained academic data-science aesthetic in `styles/variables.css`, `styles/global.css`, and `styles/layout.css` (neutral light palette, dark readable text, restrained blue accent, zero neon/glassmorphism effects).
  - **Centralized API Client:** Implemented `frontend/src/api/apiClient.js` with configurable `VITE_API_BASE_URL` (defaulting to `/api`), robust network failure handling, and typed `ApiError` instances. Created specific modules: `healthApi.js`, `datasetApi.js`, `modelApi.js`, and `preprocessApi.js`.
  - **Backend Health Connectivity:** Implemented `useBackendHealth` hook with background polling (30s) and manual refresh, displaying an online/offline/checking status badge in the top header.
  - **Foundational Pages:** Created placeholder views for `Dashboard`, `DatasetExplorer`, `ModelComparison`, `Prediction`, and `NotFound` (404), clearly indicating missing dataset/model state without fabricated data.
  - **Common Reusable Components:** Created `StatusBadge`, `LoadingIndicator`, `ErrorMessage`, and `EmptyState`.
  - **Testing & Build Verification:** Created 15 frontend unit and route tests with Vitest + Testing Library (all passing), verified production Vite build (747ms), and confirmed full backend regression (210 tests passed).
- **Files created/modified:**
  - `frontend/package.json`
  - `frontend/vite.config.js`
  - `frontend/index.html`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/styles/variables.css`
  - `frontend/src/styles/global.css`
  - `frontend/src/styles/layout.css`
  - `frontend/src/api/apiClient.js`
  - `frontend/src/api/healthApi.js`
  - `frontend/src/api/datasetApi.js`
  - `frontend/src/api/modelApi.js`
  - `frontend/src/api/preprocessApi.js`
  - `frontend/src/hooks/useBackendHealth.js`
  - `frontend/src/components/common/StatusBadge.jsx`
  - `frontend/src/components/common/LoadingIndicator.jsx`
  - `frontend/src/components/common/ErrorMessage.jsx`
  - `frontend/src/components/common/EmptyState.jsx`
  - `frontend/src/components/layout/Header.jsx`
  - `frontend/src/components/layout/Sidebar.jsx`
  - `frontend/src/components/layout/AppLayout.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/DatasetExplorer.jsx`
  - `frontend/src/pages/ModelComparison.jsx`
  - `frontend/src/pages/Prediction.jsx`
  - `frontend/src/pages/NotFound.jsx`
  - `frontend/src/tests/setup.js`
  - `frontend/src/tests/apiClient.test.js`
  - `frontend/src/tests/navigation.test.jsx`
  - `frontend/src/tests/App.test.jsx`
  - `docs/architecture.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 15 frontend tests in `apiClient.test.js`, `navigation.test.jsx`, `App.test.jsx`
- **Final test results:** 15 frontend tests passed | 210 backend tests passed | 4 contract tests passed
- **Production build:** `vite build` completed in 747ms (HTML 0.75 kB, CSS 4.44 kB, JS 284 kB)
- **Next task:** T14 — Build Dashboard and Dataset Explorer views.

### Task: T12 — Backend API Audit, Validation and Finalization
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Conducted a comprehensive audit, validation hardening, and finalization pass across the Express REST API layer:
  - **Route & Alias Verification:** Audited all 8 primary endpoints (`/api/health`, `/api/dataset/summary`, `/api/preprocess`, `/api/preprocessing/preview`, `/api/model/status`, `/api/model/train`, `/api/model/comparison`, `/api/model/predict`) and verified working backwards-compatibility aliases (`/api/predict`, `/api/models`, `/api/metrics`).
  - **Validation & Error Handling Hardening:** Standardized structured error responses with `status`, `code`, `message`, and `detail`. Added centralized body-parser error handling for malformed JSON (HTTP 400 `INVALID_JSON`) and unknown routes (HTTP 404 `NOT_FOUND`). Protected against stack trace leakage.
  - **Security & Path Traversal Guards:** Enforced strict parameter validation in `POST /api/model/train`, prohibiting directory traversal (`..`) or invalid file extensions. Bounded input text lengths for predictions (1–5000 characters).
  - **Model Artifact Integrity:** Enhanced `ModelPersistenceService` with deep integrity checks verifying array schemas, non-finite number rejections (`NaN`, `null`, `Infinity`), and feature dimension matching before deserializing model instances.
  - **Training Lifecycle Resilience:** Verified `modelService.train()` safely resets state (`isTraining = false`) upon failure without corrupting or deleting valid previously saved disk artifacts.
  - **Probability Nomenclature:** Updated API documentation and code comments to strictly use "model-estimated probabilities" rather than claiming unverified calibration.
  - **Comprehensive Vitest Suite:** Added 26 integration tests in `backend/tests/integration/apiAudit.test.js` following RED-GREEN-REFACTOR.
- **Files created/modified:**
  - `backend/src/middleware/errorHandler.js`
  - `backend/src/controllers/modelController.js`
  - `backend/src/services/modelPersistenceService.js`
  - `backend/tests/integration/apiAudit.test.js`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `contracts/openapi.yaml`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 26 integration tests in `backend/tests/integration/apiAudit.test.js`
- **Final test results:** 14 test files, 210 tests passed | 4 contract tests passed
- **Next task:** T13 — Build React application foundation and navigation.

### Task: T11 — Integrate JavaScript NLP Pipeline into Express Backend
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Integrated the NLP and ML components into the Express backend architecture via reusable service and persistence layers:
  - `backend/src/services/modelPersistenceService.js`: Implemented atomic artifact serialization (`save`) and deserialization (`load`) under `artifacts/models/`. Serializes vectorizer vocabulary, IDF weights, feature names, configuration options, ChiSquareSelector scores and selected indices, and model parameters (Naive Bayes log-priors/log-likelihoods, Logistic Regression weights/bias/history, DummyClassifier majority classes). Guarantees bit-exact predictions before and after reload without using `eval()`.
  - `backend/src/services/modelService.js`: Implemented central model management and inference service. Tracks status (`idle`, `training`, `trained`, `failed`), prevents concurrent training runs (HTTP 409), provides real-time single-tweet inference via active in-memory models (`predict`), and safely handles missing datasets without fabricating fake accuracy metrics.
  - `backend/src/controllers/modelController.js` & `backend/src/routes/model.js`: Built Express REST APIs:
    - `GET /api/model/status`: Status, dataset availability, and loaded model info.
    - `POST /api/model/train`: Triggers training via ExperimentPipeline (503 if dataset missing).
    - `GET /api/model/comparison`: Returns validation metrics and selected model.
    - `POST /api/model/predict` (and alias `POST /api/predict`): Classifies tweet text with probabilities.
  - Contracts & Examples: Updated `contracts/openapi.yaml` with `/api/model/*` paths and added example payloads in `contracts/examples/`.
  - Strict TDD (RED-GREEN-REFACTOR): 23 new tests written and passing across 3 test files (persistence unit tests, service unit tests, and API integration tests).
- **Files created/modified:**
  - `backend/src/services/modelPersistenceService.js`
  - `backend/src/services/modelService.js`
  - `backend/src/controllers/modelController.js`
  - `backend/src/routes/model.js`
  - `backend/src/app.js`
  - `backend/tests/unit/modelPersistence.test.js`
  - `backend/tests/unit/modelService.test.js`
  - `backend/tests/integration/modelApi.test.js`
  - `contracts/openapi.yaml`
  - `contracts/examples/model_status.json`
  - `contracts/examples/model_comparison.json`
  - `contracts/examples/model_train_response.json`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 23 tests across `modelPersistence.test.js`, `modelService.test.js`, and `modelApi.test.js`
- **Final test results:** 13 test files, 184 tests passed | 4 contract tests passed
- **Next task:** T12 — Finalize REST APIs and full backend integration verification.

### Task: T10 — JavaScript Model Evaluation, Metrics and Comparison
- **Status:** Complete
- **Date:** 2026-11-16
- **Summary:** Built modular JavaScript model evaluation and experiment pipeline modules:
  - `nlp/evaluation/metrics.js`: Implemented `accuracyScore`, `precisionScore`, `recallScore`, `f1Score`, `confusionMatrix`, and comprehensive `classificationReport`. Added per-class breakdown (classes 0 and 1 with precision, recall, F1, support), macro average, and weighted average. Zero-division situations safely return `0.0` (avoiding NaN). Strict validation for binary labels and mismatched lengths.
  - `nlp/evaluation/modelEvaluator.js`: Implemented `ModelEvaluator` supporting `evaluate(model, X, y)`, `evaluatePredictions(yTrue, yPred)`, and `evaluateProbabilities(yTrue, probabilities)`. Evaluates fitted models without mutating parameters or retraining. Computes binary cross-entropy log-loss and Brier score for probability calibrations.
  - `nlp/evaluation/modelComparison.js`: Implemented `ModelComparison` comparing `DummyClassifier`, `MultinomialNaiveBayes`, and `LogisticRegression` on the exact same validation partition. Clearly identifies baseline model, provides deterministic result ordering, and selects the winning model (`getBestModel`) using validation F1.
  - `nlp/pipeline/experimentPipeline.js`: Implemented leakage-safe `ExperimentPipeline` orchestrating data loading, 70/15/15 stratified partitioning, train-only vectorizer fitting, train-only feature selection, model training, validation-based model selection, and deferred final test evaluation. Flags `datasetMissing: true` when real dataset is missing.
  - Strict TDD (RED-GREEN-REFACTOR): 59 unit tests written and verified failing before implementation, and all passing GREEN afterwards.
- **Files created/modified:**
  - `nlp/evaluation/metrics.js`
  - `nlp/evaluation/modelEvaluator.js`
  - `nlp/evaluation/modelComparison.js`
  - `nlp/pipeline/experimentPipeline.js`
  - `backend/tests/unit/evaluation.test.js`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `docs/syllabus-mapping.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 59 unit tests in `backend/tests/unit/evaluation.test.js`
- **Final test results:** 10 test files, 161 tests passed | 4 contract tests passed
- **Dataset availability:** Real dataset `data/raw/train.csv` is absent on disk; pipeline and metrics verified on synthetic fixtures without fabricating real-world performance.
- **Next task:** T11 — Integrate JavaScript NLP pipeline into Express backend.

### Task: T09 — JavaScript Classification Models and Chi-Square Feature Selection
- **Status:** Complete
- **Date:** 2026-11-13
- **Summary:** Implemented three classification model modules and one feature selection module under `nlp/models/` and `nlp/features/`:
  - `nlp/features/featureSelector.js`: `ChiSquareSelector` — binarizes feature columns (presence/absence) and computes a 2×2 contingency table chi-square score per feature. Selects the top-k discriminative features. Zero-expectation cells are skipped. Ties broken by original feature index (stable sort). Guards: k > numFeatures throws, dimension mismatch throws, transform before fit throws.
  - `nlp/models/baselineClassifier.js`: `DummyClassifier` — predicts the majority training class for every document. Tie defaults to class 0. Provides the performance floor for all real models.
  - `nlp/models/naiveBayes.js`: `MultinomialNaiveBayes` — computes log class priors and Laplace-smoothed log likelihoods per feature per class. Prediction via argmax of log-joint. Probabilities via numerically stable softmax. Guards: alpha > 0 required, dimension mismatch throws, predict before fit throws.
  - `nlp/models/logisticRegression.js`: `LogisticRegression` — full-batch gradient descent with numerically stable sigmoid, L2 regularisation on weights (bias unregularised), binary cross-entropy loss with epsilon guard, deterministic zero-initialization. Exposes `lossHistory`, `weights`, `bias`, `decisionFunction()`. Guards: predict before fit throws, dimension mismatch throws.
  - Strict TDD: 45 RED tests written and verified failing before any implementation. All 45 passed GREEN after implementation.
- **Files created/modified:**
  - `nlp/features/featureSelector.js`
  - `nlp/models/baselineClassifier.js`
  - `nlp/models/naiveBayes.js`
  - `nlp/models/logisticRegression.js`
  - `backend/tests/unit/models.test.js`
  - `docs/experiments.md`
  - `docs/syllabus-mapping.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 45 unit tests in `backend/tests/unit/models.test.js`
- **Final test results:** 9 test files, 102 tests passed | 4 contract tests passed
- **Dataset availability:** Real dataset `data/raw/train.csv` is still absent; models verified on isolated synthetic fixtures only.
- **Next task:** T10 — Model Evaluation and Artifact Persistence.

### Task: T08 — JavaScript Bag of Words and TF-IDF Feature Extraction
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Built modular JavaScript feature extraction modules:
  - `nlp/features/countVectorizer.js`: Implemented `CountVectorizer` supporting configurable n-gram ranges (unigrams `[1, 1]`, bigrams `[2, 2]`, unigrams+bigrams `[1, 2]`), alphabetical vocabulary indexing, term occurrence counting, and unknown token handling.
  - `nlp/features/tfidfVectorizer.js`: Implemented `TfidfVectorizer` supporting smooth Inverse Document Frequency ($IDF(t) = \ln((1 + N)/(1 + DF(t))) + 1$), standard and sublinear Term Frequency ($TF(t, d) = 1 + \ln(count)$), and L2 vector normalization.
  - Strict leakage prevention enforced: vocabulary and IDF weights are learned strictly during `fit(trainingDocs)` and remain frozen; `transform(docs)` transforms validation/test documents ignoring unknown tokens without modifying learned parameters.
  - Strict TDD (Red-Green-Refactor) executed with 14 unit tests covering vocabulary building, bigram extraction, TF/IDF computations, L2 normalization, empty documents, unknown token handling, and partition isolation.
- **Files created/modified:**
  - `nlp/features/countVectorizer.js`
  - `nlp/features/tfidfVectorizer.js`
  - `backend/tests/unit/vectorizers.test.js`
  - `docs/experiments.md`
  - `docs/syllabus-mapping.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 14 unit tests in `backend/tests/unit/vectorizers.test.js`
- **Commands executed:**
  - `cd backend; npm.cmd test`
- **Test results:** 8 test files, 57 tests passed in 897ms
- **Dataset availability:** Real dataset `data/raw/train.csv` is absent on disk; vectorizer tests verified on isolated synthetic documents. Full training vocabulary size will be extracted when Kaggle dataset is provided.
- **Next task:** T09 — JavaScript Classification Models and Feature Selection.

### Task: T07 — Leakage-Safe Stratified Dataset Splitting
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Built deterministic stratified dataset splitter in `nlp/features/dataSplitter.js`.
  - Employs Mulberry32 32-bit PRNG initialized with seed `42` and Fisher-Yates shuffle for reproducible partitioning.
  - Groups records by `target` (binary 0 and 1) and partitions each group into 70% Train, 15% Validation, and 15% Test.
  - Combines class-specific slices and deterministically shuffles the resulting sets, ensuring exact class proportions are maintained.
  - Strictly guarantees zero overlap between partitions (`train ∩ val = ∅`, `train ∩ test = ∅`, `val ∩ test = ∅`) with no lost or duplicate records.
  - Computes detailed metadata including split sizes and per-class distributions.
  - Established strict leakage prevention rule: all learned feature representations (vocabulary, IDF weights, Chi-square rankings) must be fit solely on the training partition.
  - Strict TDD (Red-Green-Refactor) executed with 13 unit tests covering split ratios, stratification, reproducibility, different seeds, zero overlap, missing/invalid targets, empty datasets, and small datasets.
- **Files created/modified:**
  - `nlp/features/dataSplitter.js`
  - `backend/tests/unit/dataSplitter.test.js`
  - `docs/experiments.md`
  - `docs/syllabus-mapping.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 13 unit tests in `backend/tests/unit/dataSplitter.test.js`
- **Commands executed:**
  - `cd backend; npm.cmd test`
- **Test results:** 7 test files, 43 tests passed in 868ms
- **Dataset availability:** `data/raw/train.csv` remains unplaced in the local workspace; splitter verified against isolated synthetic test fixtures. Real dataset splitting will automatically run when the Kaggle CSV is placed.
- **Next task:** T08 — JavaScript Bag of Words and TF-IDF Feature Extraction.

### Task: T06 — JavaScript NLP Text Preprocessing and Preview API
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Built modular, reusable JavaScript NLP text preprocessing modules in `nlp/preprocessing/`:
  - `textCleaner.js`: Lowercasing, URL removal (http, https, www), HTML tag removal and entity decoding, mention stripping without accidental word concatenation, hashtag keyword preservation, and punctuation normalization.
  - `tokenizer.js`: Robust whitespace and boundary tokenization returning clean arrays of word tokens.
  - `stopWords.js`: English stop-word filtering with explicit preservation of negation modifiers (`not`, `no`, `never`, `neither`, `nor`, `without`, `cannot`, etc.).
  - `stemmer.js`: Canonical Martin Porter (1980) stemming algorithm implementation without external runtime dependencies.
  - `preprocessText.js`: Unified orchestrator returning structured intermediate transformation stages.
  - `backend/src/services/preprocessService.js`, `controllers/preprocessController.js`, `routes/preprocess.js`: Input validation and endpoint `POST /api/preprocess`.
  - Strict TDD (Red-Green-Refactor) executed with 17 unit tests and 4 integration tests (all 30 tests in the backend suite passing).
- **Files created/modified:**
  - `nlp/preprocessing/textCleaner.js`
  - `nlp/preprocessing/tokenizer.js`
  - `nlp/preprocessing/stopWords.js`
  - `nlp/preprocessing/stemmer.js`
  - `nlp/preprocessing/preprocessText.js`
  - `backend/src/services/preprocessService.js`
  - `backend/src/controllers/preprocessController.js`
  - `backend/src/routes/preprocess.js`
  - `backend/src/app.js`
  - `backend/tests/unit/preprocessing.test.js`
  - `backend/tests/integration/preprocessApi.test.js`
  - `contracts/openapi.yaml`
  - `contracts/examples/preprocess_request.json`
  - `contracts/examples/preprocess_response.json`
  - `docs/syllabus-mapping.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 21 tests across 2 test files
- **Commands executed:**
  - `cd backend; npm.cmd test`
- **Test results:** 6 test files, 30 tests passed in 820ms
- **Limitations:** WordNet lemmatization is not supported in pure JS without external Python databases; Porter stemming is implemented and clearly documented.
- **Next task:** T07 — Leakage-safe stratified dataset splitting.

### Task: T05 — JavaScript Dataset Ingestion and Dataset Summary API
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Built the JavaScript dataset loader (`nlp/ingestion/datasetLoader.js`) using `csv-parse` with support for multiline quoted text, header validation, missing values mapping, duplicate record detection, and target value validation. Created backend dataset service (`backend/src/services/datasetService.js`), dataset controller (`backend/src/controllers/datasetController.js`), and router (`backend/src/routes/dataset.js`) mounting `GET /api/dataset/summary`. Followed strict TDD (Red-Green-Refactor) with 4 unit tests and 2 integration tests. Confirmed that when `data/raw/train.csv` is absent, the API returns HTTP 503 with a structured error explanation.
- **Files created/modified:**
  - `nlp/ingestion/datasetLoader.js`
  - `backend/src/services/datasetService.js`
  - `backend/src/controllers/datasetController.js`
  - `backend/src/routes/dataset.js`
  - `backend/src/app.js`
  - `backend/package.json`
  - `backend/tests/unit/datasetLoader.test.js`
  - `backend/tests/integration/datasetSummary.test.js`
  - `contracts/openapi.yaml`
  - `contracts/examples/dataset_summary.json`
  - `contracts/examples/dataset_summary_unavailable.json`
  - `docs/architecture.md`
  - `docs/experiments.md`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 6 tests across 2 test files
- **Commands executed:**
  - `cd backend; npm.cmd install csv-parse`
  - `cd backend; npm.cmd test`
- **Test results:** 4 test files, 9 tests passed in 753ms
- **Dataset availability:** `data/raw/train.csv` is currently missing. API handles this with HTTP 503; real dataset analysis requires user file placement.
- **Next task:** T06 — JavaScript NLP Text Preprocessing.

### Task: T04 — Implement Express Foundation and Health Endpoint
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Adopted JavaScript-first architecture for the backend API using Node.js and Express.js. Followed strict TDD (Red-Green-Refactor):
  1. *Red:* Created Supertest integration test `backend/tests/integration/health.test.js` asserting `GET /api/health` returns status `200` with `{ status: "ok", app_name: "Syllabus NLP Disaster Tweets API", version: "1.0.0" }` and unknown routes return structured 404 error responses. Verified test failed with module missing error.
  2. *Green:* Configured `backend/package.json`, installed dependencies (`express`, `cors`, `dotenv`, `morgan`, `vitest`, `supertest`), and implemented `backend/src/config/index.js`, `backend/src/routes/health.js`, `backend/src/middleware/errorHandler.js`, `backend/src/app.js`, and `backend/src/server.js`.
  3. *Refactor:* Added unit test `backend/tests/unit/config.test.js`. Executed complete backend test suite: 2 test files, 3 tests passed in 610ms.
- **Files created/modified:**
  - `backend/package.json`
  - `backend/src/config/index.js`
  - `backend/src/routes/health.js`
  - `backend/src/middleware/errorHandler.js`
  - `backend/src/app.js`
  - `backend/src/server.js`
  - `backend/tests/integration/health.test.js`
  - `backend/tests/unit/config.test.js`
  - `PROJECT_CONTEXT.md`
- **Tests added:** 
  - `backend/tests/integration/health.test.js` (2 tests)
  - `backend/tests/unit/config.test.js` (1 test)
- **Commands executed:**
  - `cd backend; npm.cmd install`
  - `cd backend; npm.cmd test`
- **Test results:** 3 passed in 610ms
- **Next task:** T05 — Implement dataset ingestion and dataset summary API (`/api/dataset/summary`).

### Task: T02 — Reconcile Skeleton for Node.js Express, Python NLP, Docker & K8s
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Adapted repository skeleton to match revised instructor requirements. Segregated Python NLP code into `nlp/` (`preprocessing/`, `features/`, `models/`, `evaluation/`, `tests/`), created `backend/` for Node.js + Express (`src/config/`, `controllers/`, `routes/`, `middleware/`, `services/`, `validators/`, `package.json`), created `docker/` and `k8s/` directories. Retained existing contract specifications (`contracts/openapi.yaml`) and data directories. Created and ran `nlp/tests/unit/test_nlp_skeleton.py` and `test_contracts.py` (6/6 passed).
- **Files created/modified:**
  - `nlp/requirements.txt`
  - `nlp/tests/unit/test_nlp_skeleton.py`
  - `nlp/tests/unit/test_contracts.py`
  - `backend/package.json`
  - `docker/`, `k8s/`
  - `PROJECT_CONTEXT.md`
  - `nlp_project_plan.md`
- **Tests added:** `nlp/tests/unit/test_nlp_skeleton.py`, `nlp/tests/unit/test_contracts.py`
- **Commands executed:**
  - `python -m pytest nlp/tests/unit/ -v`
- **Test results:** 6 passed in 2.35s
- **Next task:** T04 — Implement Express foundation and health endpoint.

### Task: T03 — Define and Validate API Contracts
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Defined canonical OpenAPI 3.0.3 specification in `contracts/openapi.yaml` covering all 6 endpoints (`/api/health`, `/api/dataset/summary`, `/api/preprocessing/preview`, `/api/models`, `/api/metrics`, `/api/predict`). Added valid JSON example payloads for each endpoint in `contracts/examples/`.
- **Files created:** `contracts/openapi.yaml`, `contracts/examples/*.json`, contract unit tests.
- **Test results:** All 4 contract tests passed.
- **Next task:** T04.

### Task: T01 — Confirm NLP Task, Dataset, Target Label, and MVP
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** User confirmed Option A: Kaggle Disaster Tweets Binary Classification. Input feature is `text`, target label is `target` (0 = Not Disaster, 1 = Real Disaster). Primary dataset will be the real Kaggle Disaster Tweets dataset in `data/raw/train.csv` (no synthetic replacement).

### Task: T00 — Workspace Inspection & Requirements Discovery
- **Status:** Complete
- **Date:** 2026-11-10
- **Summary:** Inspected workspace `C:\Projects\lostandfounditems`. Found two documentation files from CampusConnect (preserved untouched). No dataset file present in raw folder yet. Environment verified.

# System Architecture

## Architecture Overview (JavaScript-First)

The application is implemented as an end-to-end JavaScript stack:

```text
[ React 19 Frontend (Vite) ]
          |
     HTTP / JSON (OpenAPI 3.0 Contract)
          v
[ Node.js + Express.js REST API Backend ]
  |-- /api/health (Gateway readiness & health check)
  |-- /api/dataset/summary (Exploratory Data Analysis & Statistics)
  |-- /api/preprocessing/preview (Interactive Preprocessing Workbench)
  |-- /api/models (Model metadata & hyperparameter configurations)
  |-- /api/metrics (Evaluation comparisons, metrics, confusion matrix)
  |-- /api/predict (Inference endpoint)
          |
[ JavaScript NLP Pipeline & Ingestion Engine ]
  |-- Ingestion: nlp/ingestion/datasetLoader.js (CSV parsing, validation, statistics)
  |-- Preprocessing: nlp/preprocessing/ (Cleaning, tokenization, stop-words, stemming)
  |-- Feature Extraction: nlp/features/ (Bag of Words, TF-IDF unigram+bigram, Chi-Square selection)
  |-- Supervised Models: nlp/models/ (Baseline, Multinomial Naive Bayes, Logistic Regression)
  |-- Evaluation: nlp/evaluation/ (Confusion matrix, macro/weighted F1, classification reports)
  |-- Persistence: artifacts/ (Serialized vectorizers, models, and evaluation_results.json)
```

## Key Architectural Principles
1. **JavaScript-First Implementation:** Built entirely in JavaScript with Node.js and React; Python is avoided in production runtime.
2. **Contract-First Design:** OpenAPI contract (`contracts/openapi.yaml`) defines all request/response schemas.
3. **Robust Dataset Ingestion:** Handles multiline quoted text, missing values, duplicate detection, and returns transparent 503 errors when the Kaggle raw dataset is missing.
4. **Zero Data Leakage:** Preprocessing and vectorizers are fitted strictly on the Training set; validation and test splits are strictly transform-only.
5. **Containerization & Orchestration:** Docker multi-container compose and Kubernetes deployment manifests in `docker/` and `k8s/`.


## Evaluation & Experiment Pipeline Architecture (T10)

```text
[ Raw Tweet Records (data/raw/train.csv) ]
                   │
                   ▼
  [ Stratified Splitter (70% Train, 15% Val, 15% Test) ]
                   │
      ┌────────────┼─────────────────────────┐
      │ (Train)    │ (Validation)            │ (Test - ISOLATED)
      ▼            │                         │
[ Fit TF-IDF ]     │                         │
      │            │                         │
      ▼            ▼                         │
[ Fit Chi2 ] ──► [ Transform Val ]           │
      │                  │                   │
      ▼                  ▼                   │
[ Train Models ] ──► [ Compare on Val ]      │
(Dummy, NB, LR)          │                   │
                         ▼                   │
                [ Select Best Model ]        │
                         │                   │
                         └───────────────┐   │
                                         ▼   ▼
                               [ Transform & Evaluate Test ]
                                         │
                                         ▼
                            [ Final Benchmark Metrics ]
```

### Components
1. **`nlp/evaluation/metrics.js`**: Core numerical calculation functions for binary classification (`accuracyScore`, `precisionScore`, `recallScore`, `f1Score`, `confusionMatrix`, `classificationReport`). Safely handles zero-division by returning `0.0`.
2. **`nlp/evaluation/modelEvaluator.js`**: Evaluates already-fitted models without mutating internal parameters or retraining. Computes discrete and probabilistic (log-loss, Brier score) metrics.
3. **`nlp/evaluation/modelComparison.js`**: Fits candidate models strictly on `(X_train, y_train)` and evaluates on `(X_val, y_val)` to select the optimal model using validation F1. Does not access test data.
4. **`nlp/pipeline/experimentPipeline.js`**: Orchestrates end-to-end training and evaluation lifecycle while preserving partition isolation.


## Backend Service Integration & Persistence Architecture (T11)

### 1. Model Service (`backend/src/services/modelService.js`)
Acts as the central orchestrator for ML operations in the Express backend:
- **Lifecycle Management:** Controls state (`idle`, `training`, `trained`, `failed`).
- **Concurrency Guard:** Rejects overlapping simultaneous training runs with HTTP 409 (`TRAINING_IN_PROGRESS`).
- **Real-Time Inference (`predict`):** Vectorizes raw input using the active frozen `TfidfVectorizer`, applies `ChiSquareSelector` column slicing, and infers class and probabilities using the active model instance.
- **Lazy Artifact Loading:** Automatically loads previously saved artifacts from disk when available without triggering re-training on startup.

### 2. Persistence Layer (`backend/src/services/modelPersistenceService.js`)
Provides safe, deterministic, atomic serialization and deserialization of the trained pipeline:
- **Serialized State:**
  - `TfidfVectorizer`: Vocabulary `[term, index]`, feature names, document frequencies, IDF weights, and configuration options.
  - `ChiSquareSelector`: $k$, feature scores, and selected column indices.
  - Classifiers (`DummyClassifier`, `MultinomialNaiveBayes`, `LogisticRegression`): Log-priors, log-likelihoods, weights, bias, class proportions.
  - Metadata: Validation metrics, comparison tables, timestamp.
- **Safety & Integrity:** Uses atomic file replacement (writing to a temporary file then renaming) and avoids `eval()` or executable serialization.
- **Exact Numerical Parity:** Reconstructs identical class instances ensuring bit-exact prediction match before and after disk reload.

### 3. REST API Routes
- `GET /api/model/status`: Returns training state, dataset availability, model load status, and artifact presence.
- `POST /api/model/train`: Runs the experiment pipeline; returns 503 if dataset is unavailable.
- `GET /api/model/comparison`: Returns validation metrics and the selected model.
- `POST /api/model/predict` (and alias `/api/predict`): Classifies single tweet texts with confidence probabilities.


## API Layer Audit, Validation, and Hardening (T12)

The Express API layer underwent a comprehensive audit and hardening pass prior to frontend integration:

### 1. Finalized Routing & Aliases Table
| Method | Route | Handled In | Purpose | Status |
|---|---|---|---|---|
| `GET` | `/api/health` | `healthRouter` | Health check and runtime information | Audited & Verified |
| `GET` | `/api/dataset/summary` | `datasetRouter` | Dataset exploratory summary (503 when CSV missing) | Audited & Verified |
| `POST` | `/api/preprocess` | `preprocessRouter` | Preprocessing pipeline breakdown | Audited & Verified |
| `POST` | `/api/preprocessing/preview` | `preprocessRouter` | Interactive linguistic preprocessing preview | Audited & Verified |
| `GET` | `/api/model/status` | `modelRouter` | Operational state, dataset presence, artifact status | Audited & Verified |
| `POST` | `/api/model/train` | `modelRouter` | Full experiment pipeline execution (409 guard) | Audited & Verified |
| `GET` | `/api/model/comparison` | `modelRouter` | Multi-model validation metrics table | Audited & Verified |
| `POST` | `/api/model/predict` | `modelRouter` | Single tweet classification with model-estimated probabilities | Audited & Verified |
| `POST` | `/api/predict` | Top-level alias | Direct prediction alias for contract backwards-compatibility | Audited & Verified |
| `GET` | `/api/models` | Top-level alias | Model metadata alias for contract backwards-compatibility | Audited & Verified |
| `GET` | `/api/metrics` | Top-level alias | Benchmark metrics alias for contract backwards-compatibility | Audited & Verified |

### 2. Request Validation & Security Guardrails
- **Malformed JSON:** Centralized middleware catches `SyntaxError` on malformed request bodies and returns structured HTTP 400 (`INVALID_JSON`) without stack trace disclosure.
- **Path Traversal Guard:** `POST /api/model/train` rejects any `filePath` with path traversal characters (`..`) or non-`.csv` extensions with HTTP 422.
- **Input Boundaries:** Prediction text input is strictly verified as a string with length bounded between 1 and 5000 characters.
- **Unknown Route Catch-All:** Unmatched routes return structured HTTP 404 (`NOT_FOUND`) with `{ status: 'error', code: 'NOT_FOUND', detail: '...' }`.
- **Artifact Protection:** If training throws an exception or fails, previously saved disk artifacts are protected and left intact; service state cleanly resets `isTraining = false`.
- **Integrity Validation:** Deserialization verifies non-finite numbers, vectorizer array existence, and feature dimension matching before restoring instances.


## Frontend Application Architecture (T13)

### 1. Technology & Foundation
- **Core Library:** React 19 (`react`, `react-dom`)
- **Bundler & Dev Server:** Vite 6 (`@vitejs/plugin-react`)
- **Routing:** React Router 7 (`react-router-dom`)
- **Language:** JavaScript (ES modules, `.jsx`)
- **Styling:** Modular native CSS design system with CSS custom properties (`styles/variables.css`, `styles/global.css`, `styles/layout.css`)
- **Testing:** Vitest 3 + `@testing-library/react` + `@testing-library/jest-dom` in `jsdom` environment

### 2. Frontend Directory Structure
```text
frontend/
  public/
  src/
    api/
      apiClient.js          # Centralized fetch wrapper with network & HTTP error mapping
      healthApi.js          # Backend health check (GET /api/health)
      datasetApi.js         # Dataset summary & stats (GET /api/dataset/summary)
      modelApi.js           # Model training, comparison, status, prediction
      preprocessApi.js      # Text preprocessing & linguistic preview
    components/
      common/
        EmptyState.jsx       # Neutral empty state placeholder with contextual icon/action
        ErrorMessage.jsx     # Accessible error alert box with retry callback
        LoadingIndicator.jsx # Accessible animated CSS spinner
        StatusBadge.jsx      # Colored status pill (connected/disconnected/checking)
      layout/
        AppLayout.jsx        # Root application frame with responsive navigation state
        Header.jsx           # Top bar displaying title, status badge, and manual health refresh
        Sidebar.jsx          # Fixed desktop & collapsible mobile sidebar with active NavLink routing
    hooks/
      useBackendHealth.js   # Background polling hook for backend connectivity
    pages/
      Dashboard.jsx         # System overview & syllabus pipeline capability matrix
      DatasetExplorer.jsx   # Dataset schema description & EDA placeholder
      ModelComparison.jsx   # Candidate classifier benchmark placeholder
      Prediction.jsx        # Inference sequence breakdown & predictor placeholder
      NotFound.jsx          # 404 handler with return home action
    styles/
      variables.css         # Academic neutral color palette, typography & layout constants
      global.css            # Base resets, typography, and card surface utilities
      layout.css            # Responsive sidebar, header, and content area layout
    tests/
      setup.js              # Jest-DOM environment configuration
      apiClient.test.js     # Unit tests for HTTP request parsing and ApiError
      navigation.test.jsx   # Component tests for layout, status pill, and sidebar
      App.test.jsx          # Route integration tests verifying each view
    App.jsx                 # Route declarations inside BrowserRouter
    main.jsx                # DOM mounting into #root
  index.html                # HTML5 entrypoint with project metadata
  package.json              # NPM dependencies and scripts (dev, build, preview, test)
  vite.config.js            # Vite configuration with proxy to port 5000 and Vitest setup
```

### 3. Navigation Routes
- `/`: **Dashboard** — System status and syllabus NLP capability matrix
- `/dataset`: **Dataset Explorer** — Kaggle schema breakdown and EDA state
- `/models`: **Model Comparison** — Baseline, Naive Bayes, and Logistic Regression evaluation view
- `/predict`: **Tweet Prediction** — Inference pipeline explanation and classification workbench
- `*`: **NotFound** — Clean 404 with navigation back to Dashboard

### 4. API Client & Environment Configuration
- Uses `VITE_API_BASE_URL` (default: `/api`, proxied to `http://localhost:5000` via `vite.config.js`).
- Wrapped in `ApiError` providing `.status`, `.code`, and `.details` properties.


## Interactive Dashboard and Dataset Explorer Architecture (T14)

### 1. Data Fetching and State Management Hooks
- **`useDatasetSummary.js` (`frontend/src/hooks/useDatasetSummary.js`):**
  - Fetches dataset summary metadata from `GET /api/dataset/summary`.
  - Manages `data`, `loading`, `error`, and `isUnavailable` states.
  - Transparently identifies HTTP 503 / `DATASET_MISSING` status without throwing unhandled exceptions.
  - Exposes `refresh()` callback enabling user-triggered data re-fetching.
- **`useModelStatus.js` (`frontend/src/hooks/useModelStatus.js`):**
  - Polls model lifecycle and artifact state from `GET /api/model/status`.
  - Exposes `modelStatus`, `loading`, `error`, and `refresh()` callback.

### 2. UI Components & Visualizations
- **`ClassDistributionChart.jsx` (`frontend/src/components/common/ClassDistributionChart.jsx`):**
  - Lightweight, dependency-free CSS/SVG proportional horizontal stacked bar.
  - Visually contrasts Class 1 (Disaster, Red `#dc2626`) vs Class 0 (Non-Disaster, Blue `#2563eb`).
  - Displays formatted counts (`.toLocaleString()`) and percentages (`dPct%`, `ndPct%`) in color-coded cards and hover tooltips.
  - Supports custom titles and accessible `role="region"` semantics.
- **`PipelineFlow.jsx` (`frontend/src/components/common/PipelineFlow.jsx`):**
  - Visual 7-step connected pipeline sequence representing the end-to-end architecture:
    1. Dataset Ingestion (`csv-parser`, schema validation, EDA)
    2. Text Preprocessing (cleaning, tokenization, stop-words, Porter stemmer)
    3. Feature Extraction (BoW, TF-IDF unigrams & bigrams)
    4. Feature Selection (Top-K Chi-Square discriminative features)
    5. Classification Models (Baseline, Naive Bayes, Logistic Regression)
    6. Metric Evaluation (Accuracy, Precision, Recall, Macro F1, Confusion Matrix)
    7. Real-Time Inference (Live prediction with confidence probabilities)

### 3. Page Implementations
- **Dashboard (`/`):**
  - **KPI Overview:** Real cards for API Gateway connectivity, Dataset Availability, Total Records, and Active Classification Model.
  - **System Status Card:** Live backend version, environment port, training status, and model loaded state.
  - **Class Distribution:** Live distribution chart when dataset is present.
  - **Pipeline Flow:** Architectural 7-step diagram with technology and syllabus breakdown.
  - **Quick Action Links:** Direct navigation to Dataset Explorer, Model Comparison, and Predictor.
- **Dataset Explorer (`/dataset`):**
  - **Summary Metrics:** Total records, valid records, duplicate records, verified columns.
  - **Data Quality & Missing Values:** Detailed table inspecting `id`, `keyword`, `location`, `text`, and `target` for missing counts and percentages.
  - **Sample Records:** Table displaying initial raw records from the backend.
  - **Permanent Schema Specification:** Complete table documenting Kaggle columns (`id`, `keyword`, `location`, `text`, `target`), data types, descriptions, and roles. Always visible regardless of dataset availability.
  - **Empty State:** HTTP 503 handling with clear guidance on placing `train.csv` in `data/raw/train.csv` and an interactive refresh button. Never fabricates data when absent.


## Preprocessing Sandbox and Feature Extraction Architecture (T15)

### 1. Preprocessing Sandbox (`/preprocess`)
- **Connected Endpoint:** `POST /api/preprocess`
- **Features:**
  - Interactive textarea with character count indicator (`0 / 2,000 characters`) and client-side boundary validation.
  - 3 pre-configured illustrative example chips demonstrating disaster reporting, metaphorical negation retention, and web noise (URLs, mentions, hashtags).
  - Configurable pipeline options toggling lowercasing, URL removal, HTML entity decoding, mention stripping, hashtag preservation, stop-word filtering, negation retention, and Porter stemming.
  - Educational callout detailing the algorithmic differences between heuristic suffix-stripping (Porter Stemmer) and morphological lexicon lookup (WordNet Lemmatization), alongside the importance of negation preservation for disaster sentiment.
  - Structured 6-stage sequential visualization:
    1. Stage 1: Original Raw Text
    2. Stage 2: Normalized & Cleaned Text
    3. Stage 3: Word Tokens (badge list with count)
    4. Stage 4: Stop-Word Filtered Tokens (with explicit negation badge highlighting)
    5. Stage 5: Porter Stemmed Tokens
    6. Stage 6: Final Processed String with single-click clipboard copy

### 2. Feature Extraction Explorer (`/features`)
- **Connected Endpoints:**
  - `POST /api/features/extract`: Real-time BoW and TF-IDF extraction for arbitrary input text.
  - `GET /api/features/dataset-info`: Status and sample vocabulary of the actively trained model.
  - `GET /api/features/educational-demo`: Pre-calculated pedagogical BoW, TF-IDF, and $2 \times 2$ Chi-Square contingency table metrics on a toy 4-document corpus.
- **Features:**
  - **Dataset-Trained Status Banner:** Transparently indicates if real dataset vocabulary is trained or unavailable, adhering to the anti-fabrication policy.
  - **Interactive Extractor:** Allows testing custom tweets with configurable n-gram ranges (unigrams `[1, 1]` or unigram+bigrams `[1, 2]`) and optional sublinear TF scaling.
  - **Section A (Bag of Words):** Explains alphabetical vocabulary indexing, token counting, and zero-leakage test document transformation.
  - **Section B (TF-IDF Vectorizer):** Explains Smooth Inverse Document Frequency ($\text{IDF}(t) = \ln((1 + N)/(1 + \text{DF})) + 1$), Sublinear TF, and Euclidean L2 vector normalization.
  - **Section C (Chi-Square Feature Selection):** Explains feature selection theory, train-split-only fitting to prevent data leakage, and provides complete $2 \times 2$ contingency table metrics ($A, B, C, D$, expected frequencies, and $\chi^2$ scores) for educational transparency.


## Model Training, Comparison, and Tweet Prediction Architecture (T16)

### 1. Model Training & Comparison View (`/models`)
- **Connected Endpoints:**
  - `GET /api/model/status`: Live training state, dataset presence, in-memory model, and persisted disk artifact status.
  - `POST /api/model/train`: Initiates the end-to-end `ExperimentPipeline` across stratified partitions. Guards against concurrent executions (HTTP 409) and missing raw dataset (HTTP 503).
  - `GET /api/model/comparison`: Returns validation benchmark metrics for all candidate models and the selected winner.
- **Components & Visualizations:**
  - `ModelComparison.jsx`: Central training control card with live status badges, "Train Models" action with spinner, and error alert handling.
  - `ConfusionMatrixTable.jsx`: Reusable $2 \times 2$ visual confusion matrix with True Negatives (TN), False Positives (FP), False Negatives (FN), and True Positives (TP).
  - Candidate model profiles for DummyClassifier (baseline), Multinomial Naive Bayes, and Logistic Regression.
  - Syllabus methodology section explaining why validation Macro F1 is used for model selection and why the 15% test set partition is kept strictly isolated until final testing.

### 2. Tweet Prediction View (`/predict`)
- **Connected Endpoint:** `POST /api/model/predict` (and alias `/api/predict`)
- **Components & Features:**
  - `Prediction.jsx`: Interactive live inference workbench.
  - Real-time status probe alerting if no trained model is loaded on the backend.
  - 4 illustrative example buttons covering real disaster reporting, metaphorical usage, earthquake alerts, and negation statements.
  - Textarea with character counter (`0 / 5,000 characters`) matching backend length boundaries.
  - Visual classification outcome badge (Class 1 Disaster in red `#dc2626` vs. Class 0 Non-Disaster in blue `#2563eb`).
  - Proportional confidence probability bar rendering model-estimated probabilities for both classes.
  - Mandatory academic disclaimer: *"Predictions are model estimates, not verified facts. Performance depends on the training dataset and model quality."*


## Docker, Kubernetes, and Full-Stack Deployment Architecture (T17)

```text
[ Browser Client ]
       │
       ▼
[ Docker / K8s Ingress or Port 3000 / 80 ]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[ Static Web Traffic ]             [ API Requests (/api/*) ]
       │                                 │
[ Frontend Nginx Container ] ──proxy───► [ Backend Express Container ]
(Port 80, SPA fallback)                  (Port 5000, non-root user `node`)
                                                 │
                                                 ├─► Shared Module: /app/nlp/
                                                 ├─► Volume: /app/data (Raw Dataset)
                                                 └─► Volume: /app/artifacts (Models)
```

### 1. Backend Containerization (`backend/Dockerfile`)
- **Base Image:** `node:20-alpine` for minimal attack surface and footprint.
- **Filesystem & Context:** Build context root (`.`) copies production `backend/` alongside the shared pure-JavaScript NLP engine (`nlp/`).
- **Security:** Executes as non-root user `node` (UID 1000). Standard write paths (`/app/data/raw`, `/app/artifacts/models`) are pre-created with user ownership.
- **Health Check:** Periodic `curl -f http://localhost:5000/api/health` probes readiness and liveness without external dependencies.
- **Environment:** `PORT=5000`, `NODE_ENV=production`.

### 2. Frontend Containerization (`frontend/Dockerfile` & `nginx.conf`)
- **Multi-Stage Build:**
  - Stage 1 (`builder`): Compiles static React 19 production distribution with Vite (`node:20-alpine`).
  - Stage 2 (`runner`): Lightweight `nginx:1.25-alpine` serving HTML/CSS/JS assets.
- **SPA Fallback Routing:** `try_files $uri $uri/ /index.html` preserves React Router client-side path handling.
- **Reverse Proxy:** Routes `/api/` traffic directly to `http://backend:5000/api/`, passing client headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) and preventing CORS friction.
- **Health Check:** Probes HTTP 200 response on `http://localhost:80/`.

### 3. Multi-Container Orchestration (`docker-compose.yml`)
- **Services:**
  - `backend`: Exposes port 5000, mounts host `./data` and `./artifacts` for persistent model checkpoints, defines health check.
  - `frontend`: Exposes port 3000, depends on `backend` with `condition: service_healthy`.
- **Networking:** Dedicated custom bridge network `disaster-nlp-net` for internal DNS resolution between frontend and backend.
- **Persistence:** Volume binds for `./data:/app/data` and `./artifacts:/app/artifacts`.

### 4. Kubernetes Manifests (`k8s/`)
- `k8s/configmap.yaml`: Centralizes application runtime configuration (`PORT`, `NODE_ENV`, `CORS_ORIGINS`).
- `k8s/pvc.yaml`: `PersistentVolumeClaim` requesting 1Gi storage (`nlp-artifacts-pvc`) for model artifact persistence.
- `k8s/backend-deployment.yaml`: Single replica backend deployment with resource constraints (100m–500m CPU, 128Mi–512Mi Memory), liveness/readiness probes targeting `/api/health`, and volume mount to `/app/artifacts`.
- `k8s/backend-service.yaml`: Internal `ClusterIP` service routing port 5000.
- `k8s/frontend-deployment.yaml`: Single replica Nginx deployment with resource constraints (50m–250m CPU, 64Mi–128Mi Memory) and HTTP health probes.
- `k8s/frontend-service.yaml`: `NodePort` service mapping port 80 to node port 30080 for external web traffic.

### 5. Deployment and Operations Guide
Detailed commands for local development, Docker Compose orchestration, Kubernetes cluster rollout, dataset placement, and troubleshooting are documented in [docs/deployment-guide.md](file:///C:/Projects/lostandfounditems/docs/deployment-guide.md).

### 6. Dataset Ingestion & Pipeline Bridge Contract
- `nlp/ingestion/datasetLoader.js` exports `loadAndAnalyzeDataset()`, returning both EDA summary statistics and the parsed, validated `records: validRecords` array.
- This contract feeds directly into `nlp/pipeline/experimentPipeline.js`, enabling end-to-end execution across the 7,613 authentic Kaggle records without redundant CSV re-parsing.







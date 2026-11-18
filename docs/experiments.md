# Experiment Tracking & Methodology

## Dataset Configuration
- **Dataset:** Kaggle Disaster Tweets ("Natural Language Processing with Disaster Tweets")
- **File Location:** `data/raw/train.csv`
- **Current Availability:** Installed and verified on disk (7,613 records, SHA256: `61111c6dc31eaffa34d1e1fa62e2395325c9bc3b38bba1941a5f1ed9b3fa60df`)
- **Split Ratio:** 70% Train (5,329), 15% Validation (1,142), 15% Test (1,142) (Stratified)
- **Random Seed:** 42 (Mulberry32 PRNG + Fisher-Yates shuffle)

## Feature Extraction Implementation (T08)
The application implements two primary vectorizer modules:

### 1. CountVectorizer (Bag of Words & N-grams)
- Tokenizes raw input using the preprocessing pipeline (cleaning, stop-word removal with negation retention, Porter stemming).
- Supports configurable n-gram ranges:
  - Unigram: `ngramRange = [1, 1]`
  - Bigram: `ngramRange = [2, 2]`
  - Unigram + Bigram: `ngramRange = [1, 2]`
- Builds vocabulary during `fit()` and sorts terms alphabetically for deterministic column mapping.
- Produces count vectors; unobserved words in `transform()` are ignored.

### 2. TfidfVectorizer (Smooth IDF & Sublinear TF)
Mathematical formulation:
- **Term Frequency (Sublinear option):**
  $$TF(t, d) = 1 + \ln(count(t, d)) \quad \text{if } count(t, d) > 0 \text{ else } 0$$
- **Smooth Inverse Document Frequency:**
  $$IDF(t) = \ln\left(\frac{1 + N}{1 + DF(t)}\right) + 1$$
  where $N$ is the number of training documents and $DF(t)$ is the document frequency of term $t$.
- **TF-IDF Weighting:**
  $$TFIDF(t, d) = TF(t, d) \times IDF(t)$$
- **L2 Vector Normalization:**
  $$\hat{v} = \frac{v}{\sqrt{\sum v_i^2}}$$

### Educational Example (3 Training Documents)
Given documents:
1. `"flood rescue needed"`
2. `"rescue teams arrived"`
3. `"flood warning issued"`

Preprocessing + Stemming yields vocabulary:
`['arriv', 'flood', 'issu', 'need', 'rescu', 'team', 'warn']`

- Term `'flood'` ($DF=2, N=3$):
  $$IDF = \ln(4/3) + 1 \approx 0.2877 + 1 = 1.2877$$
- Term `'need'` ($DF=1, N=3$):
  $$IDF = \ln(4/2) + 1 = \ln(2) + 1 \approx 0.6931 + 1 = 1.6931$$
- Transform on unseen test document `"tsunami flood warning"`:
  - Token `'tsunami'` is unseen in training vocabulary $\rightarrow$ ignored (assigned 0 weight).
  - Tokens `'flood'` and `'warn'` are assigned their respective frozen training IDF weights.
  - No new tokens enter the vocabulary and IDF weights are never modified.

## Leakage Prevention Protocol (Mandatory)
1. **Isolation of Partitions:** Partitioning into Train, Validation, and Test is executed **strictly before** any feature representation or extraction.
2. **Vocabulary & Weight Fitting:** Bag of Words (BoW) vocabulary, Document Frequencies (DF), Inverse Document Frequency (IDF) weights, and feature selection (Chi-Square) scores must be computed exclusively on the `train` partition.
3. **Transform Only:** The `validation` and `test` partitions are strictly transformed using the learned parameters from `train`. Unseen tokens in validation/test are ignored; they are never added to the vocabulary.
4. **Validation Usage:** Used solely for hyperparameter tuning and model selection.
5. **Test Set Isolation:** Test partition remains completely untouched until final benchmark evaluation.


---

## Classification Models Implementation (T09)

### Chi-Square Feature Selection

Binarizes each feature column (presence/absence) then computes the standard chi-square statistic
using a 2x2 contingency table per feature:

  chi2(j) = sum_cells [ (O - E)^2 / E ]

Cells where E = 0 are skipped to avoid division by zero.

| Cell | Count | Meaning |
|------|-------|---------|
| A | feature j present AND class = 1 | True Positive |
| B | feature j present AND class = 0 | False Positive |
| C | feature j absent  AND class = 1 | False Negative |
| D | feature j absent  AND class = 0 | True Negative |

Expected counts: E_A = (A+B)(A+C)/N, etc.

Top-k features are selected by descending score; ties broken by original feature index (stable).

### Majority-Class Baseline (DummyClassifier)

Predicts the majority class for every document. Ties default to class 0.

  y_hat = argmax_{c in {0,1}} count(c, train)

Provides a performance floor: any real model must exceed this.

### Multinomial Naive Bayes

Applies Bayes theorem with the conditional independence assumption and Laplace smoothing (alpha):

  log P(c) = log(|c| / N)

  log P(t_j | c) = log( (count(t_j, c) + alpha) / (sum_j count(t_j, c) + alpha * |V|) )

  c_hat = argmax_c [ log P(c) + sum_j x_j * log P(t_j | c) ]

Probabilities computed via numerically stable softmax over log-scores.
Default alpha = 1 (Laplace smoothing). Input values may be raw counts or TF-IDF floats (non-negative).

### Logistic Regression (Gradient Descent + L2 Regularisation)

Sigmoid:         sigma(z) = 1 / (1 + exp(-clamp(z, -500, 500)))
Forward pass:    z = X*w + b,  y_hat = sigma(z)

Binary cross-entropy loss:
  L = -(1/N) * sum [ y_i * log(y_hat_i + eps) + (1 - y_i) * log(1 - y_hat_i + eps) ]

Gradient with L2 regularisation (weights only; bias unregularised):
  dL/dw = (1/N) * X^T * (y_hat - y) + lambda * w
  dL/db = mean(y_hat - y)

Weights initialised to zero (deterministic). Prediction threshold: y_hat >= 0.5 => class 1.

Implementation files:
- `nlp/features/featureSelector.js`   — ChiSquareSelector
- `nlp/models/baselineClassifier.js`  — DummyClassifier
- `nlp/models/naiveBayes.js`          — MultinomialNaiveBayes
- `nlp/models/logisticRegression.js`  — LogisticRegression

Tests: `backend/tests/unit/models.test.js` (45 tests, all pass)


---

## Evaluation Metrics & Experiment Methodology (T10)

### 1. Classification Metrics Formulation

For binary disaster tweet classification ($y \in \{0, 1\}$ with $1 = \text{Disaster}$):

- **True Positives ($TP$):** Actual disaster, predicted disaster.
- **False Positives ($FP$):** Actual non-disaster, predicted disaster (False Alarm).
- **False Negatives ($FN$):** Actual disaster, predicted non-disaster (Missed Crisis).
- **True Negatives ($TN$):** Actual non-disaster, predicted non-disaster.

#### Mathematical Definitions

- **Accuracy:**
  $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

- **Precision (Positive Predictive Value for Class 1):**
  $$\text{Precision} = \frac{TP}{TP + FP}$$

- **Recall (Sensitivity / True Positive Rate for Class 1):**
  $$\text{Recall} = \frac{TP}{TP + FN}$$

- **F1 Score (Harmonic Mean of Precision and Recall):**
  $$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

- **Per-Class Metrics:**
  - Class 0 ($y=0$ treated as positive):
    $$\text{Precision}_0 = \frac{TN}{TN + FN}, \quad \text{Recall}_0 = \frac{TN}{TN + FP}, \quad F_{1,0} = \frac{2 \cdot P_0 \cdot R_0}{P_0 + R_0}$$
  - Class 1 ($y=1$ treated as positive):
    $$\text{Precision}_1 = \frac{TP}{TP + FP}, \quad \text{Recall}_1 = \frac{TP}{TP + FN}, \quad F_{1,1} = \frac{2 \cdot P_1 \cdot R_1}{P_1 + R_1}$$

- **Macro Average:**
  $$\text{Macro } M = \frac{M_0 + M_1}{2}$$

- **Weighted Average:**
  $$\text{Weighted } M = \frac{\text{support}_0 \cdot M_0 + \text{support}_1 \cdot M_1}{\text{support}_0 + \text{support}_1}$$

#### Zero-Division Handling
When a denominator equals 0 (e.g., $TP + FP = 0$ because a model predicted no positive instances), the corresponding metric is defined as `0.0` (following standard scikit-learn conventions) to avoid `NaN` or unhandled exceptions.

### 2. Confusion Matrix Layout

The confusion matrix is structured as:

$$\begin{bmatrix} TN & FP \\ FN & TP \end{bmatrix}$$

- **Row 0:** Actual Non-Disaster ($y=0$) $\rightarrow$ Columns: Predicted $0$ ($TN$), Predicted $1$ ($FP$)
- **Row 1:** Actual Disaster ($y=1$) $\rightarrow$ Columns: Predicted $0$ ($FN$), Predicted $1$ ($TP$)

### 3. Leakage-Safe Experiment Pipeline Workflow

The `ExperimentPipeline` enforces strict data isolation:

1. **Stratified Split (70/15/15):** The dataset is split using `seed=42` into Train, Validation, and Test subsets.
2. **Train-Only Fitting:**
   - Vocabulary and IDF weights (`TfidfVectorizer`) are computed strictly on the training partition.
   - Chi-Square feature selector (`ChiSquareSelector`) is fitted strictly on the training partition.
3. **Frozen Transformations:**
   - Validation and Test splits are transformed using the already-fitted vectorizer and selector. Unseen terms in validation or test are discarded and never alter learned weights.
4. **Validation-Based Model Selection:**
   - Candidate models (`DummyClassifier`, `MultinomialNaiveBayes`, `LogisticRegression`) are fitted on training data and evaluated on validation data.
   - The best model is selected based on Validation $F_1$ score.
5. **Deferred Test Evaluation:**
   - Test data labels are completely hidden during training, hyperparameter configuration, and model selection.
   - Test evaluation occurs only once on the selected winning model to produce unbiased final generalization metrics.

### 4. Missing Dataset Handling
When `data/raw/train.csv` is missing from the local workspace:
- The pipeline immediately halts and flags `datasetMissing: true`.
- Synthetic data is utilized solely for isolated unit tests to guarantee mathematical precision.
- No synthetic numbers are presented as authentic disaster classification metrics.


---

## Model Serving, Persistence, and API Lifecycle (T11)

### 1. API Lifecycle State Machine
```text
[ Server Start ] ──► [ Check Artifact on Disk ]
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         [ Artifact Found ]      [ No Artifact ]
               │                         │
               ▼                         ▼
        status: 'trained'          status: 'idle'
        modelLoaded: true          modelLoaded: false
               │                         │
               │                   [ POST /api/model/train ]
               │                         │
               │                   [ Dataset Missing? ]
               │                    ├── Yes ──► HTTP 503 (No Fake Data)
               │                    └── No  ──► status: 'training'
               │                                      │
               │                                      ▼
               │                            [ Train Pipeline ]
               │                                      │
               │                                      ▼
               │                            [ Save to Artifacts ]
               │                                      │
               └───────────────┬──────────────────────┘
                               ▼
                   [ POST /api/model/predict ]
                               │
                               ▼
                   [ Transform Frozen TF-IDF ]
                               │
                               ▼
                   [ Slice Frozen Chi2 Cols ]
                               │
                               ▼
                     [ Model.predict(X) ]
                               │
                               ▼
                   [ HTTP 200: { prediction, label, probabilities } ]
```

### 2. Artifact Schema (`artifacts/models/model_artifact.json`)
```json
{
  "version": "1.0.0",
  "savedAt": "2026-11-16T01:17:49.000Z",
  "modelName": "MultinomialNaiveBayes",
  "metadata": {
    "modelName": "MultinomialNaiveBayes",
    "validationF1": 0.7476,
    "validationAccuracy": 0.7986
  },
  "vectorizer": {
    "options": {
      "ngramRange": [1, 2],
      "minDf": 1,
      "sublinearTf": true,
      "norm": "l2"
    },
    "vocabulary": [["disast", 0], ["emerg", 1]],
    "featureNames": ["disast", "emerg"],
    "documentFrequencies": [120, 85],
    "idfWeights": [1.45, 1.72],
    "nTrainingDocs": 5329
  },
  "selector": {
    "k": 50,
    "scores": [42.1, 15.6],
    "selectedIndices": [0, 1]
  },
  "model": {
    "type": "MultinomialNaiveBayes",
    "params": {
      "alpha": 1.0,
      "_logPriors": [-0.56, -0.84],
      "_logLikelihoods": [[-3.1, -4.2], [-2.1, -2.4]],
      "_numFeatures": 2
    }
  },
  "comparisonResults": [...]
}
```

### 3. Missing Dataset Policy
- When `data/raw/train.csv` is absent, `POST /api/model/train` returns HTTP 503 (`DATASET_MISSING`).
- No synthetic numbers or random weights are ever written to disk or claimed as real disaster classifier metrics.
- The system remains responsive and informs users to provide the official Kaggle dataset.


---

## Model Probability Interpretation & Artifact Integrity (T12)

### 1. Probability Nomenclature Policy
- Probabilities emitted by `POST /api/model/predict` are strictly designated as **model-estimated probabilities** (from sigmoid outputs for Logistic Regression and softmax of log-joints for Multinomial Naive Bayes).
- The term **calibrated** is intentionally avoided unless empirical calibration curves (e.g. Platt scaling, isotonic regression) have been formally trained and validated against a held-out calibration partition.

### 2. Artifact Integrity Verification Rules
During deserialization (`ModelPersistenceService.load()`):
1. **Schema Integrity:** Root artifact must contain `vectorizer`, `model`, and valid `version`.
2. **Vectorizer Integrity:** `vocabulary`, `featureNames`, and `idfWeights` must be non-empty arrays with strictly finite numbers.
3. **Feature Selection Bounds:** Column indices in `selectedIndices` must be integers within $[0, |V| - 1]$.
4. **Parameter Dimension Alignment:**
   - Logistic Regression weight vector length must exactly match the number of active features ($k$ if feature selection is active, else $|V|$).
   - Multinomial Naive Bayes likelihood matrix columns must match active features.
5. **Numerical Stability:** Any artifact containing `NaN`, `null`, `undefined`, or `Infinity` in numeric weights or biases is rejected with a structured `Corrupted model artifact` error.


---

## Interactive Preprocessing Sandbox & Feature Extraction Experiments (T15)

### 1. Preprocessing Pipeline Verification
- **Input Character Limit:** Strictly enforced at 2,000 characters matching backend validation (`422 Unprocessable Entity`).
- **Negation Retention:** Words in the negation lexicon (`not`, `no`, `never`, `neither`, `nor`, `without`, `cannot`, etc.) are explicitly retained during stop-word filtering and highlighted with visual markers in the sandbox.
- **Stemming vs Lemmatization:** Porter stemming applies heuristic suffix stripping without lexical dictionary databases, preserving fast, zero-dependency pure JavaScript execution.

### 2. Live Feature Extraction (`/api/features/extract`)
- Given custom text and reference corpus:
  1. Tokenizes and stems text using pure JavaScript pipeline.
  2. Constructs alphabetical vocabulary with unique column indices.
  3. Computes document frequency $DF(t)$ across reference corpus + input.
  4. Computes smooth IDF: $IDF(t) = \ln((1 + N)/(1 + DF(t))) + 1$.
  5. Computes raw and L2 normalized TF-IDF weight vectors.

### 3. Chi-Square ($2 \times 2$ Contingency Table) Educational Simulation
- Evaluates feature independence on an educational 4-document balanced corpus ($N=4$, 2 Disaster, 2 Non-Disaster):
  - $A$: Term present & Disaster
  - $B$: Term present & Non-Disaster
  - $C$: Term absent & Disaster
  - $D$: Term absent & Non-Disaster
  - Expected counts: $E = (\text{row\_total} \times \text{col\_total}) / N$
  - Chi-square score: $\chi^2 = \sum \frac{(O - E)^2}{E}$
- Confirms zero data leakage: feature selectors are fitted strictly on training data ($X_{\text{train}}, y_{\text{train}}$) and frozen before transforming test partitions.


---

## Model Training, Validation Comparison, and Prediction Experiments (T16)

### 1. Training Workflow & Missing Dataset Policy
- When `data/raw/train.csv` is absent, `POST /api/model/train` returns HTTP 503 (`DATASET_MISSING`).
- The frontend UI displays an informative empty state and explicit recovery guidance to place `train.csv`, avoiding any fake metrics.
- Concurrency guard: Simultaneous training attempts trigger HTTP 409 (`TRAINING_IN_PROGRESS`), and the UI disables the train button.

### 2. Validation-Based Model Selection
- Candidate models (`DummyClassifier`, `MultinomialNaiveBayes`, `LogisticRegression`) are fitted on 70% Train and evaluated on 15% Validation.
- The winning model is selected based on **Validation Macro F1-score**, maximizing true positive disaster recall without succumbing to majority class bias.
- **Test Set Isolation:** The 15% Test partition remains isolated until final evaluation to prevent optimistic estimation bias.

### 3. Prediction & Probability Interpretation
- Text input is validated client-side and server-side (length 1–5,000 characters).
- Inference applies the active frozen `TfidfVectorizer` and `ChiSquareSelector` to project input into the fitted feature space.
- Probabilities are displayed as dual proportional bars and explicitly designated as **model-estimated probabilities**.


---

## Containerization, Environment & Persistence Protocol (T17)

### 1. Volume Mounts & Data Persistence
- **Host Dataset Directory (`./data`):** Mounted into the container at `/app/data`. Placing `train.csv` into `./data/raw/train.csv` on the host machine immediately makes it accessible to `/api/dataset/summary` and `/api/model/train` inside the container without requiring container rebuilds.
- **Model Checkpoint Persistence (`./artifacts`):** Mounted into `/app/artifacts`. When models are trained via `POST /api/model/train`, the serialized pipeline artifact (`artifacts/models/model_artifact.json`) is written atomically to the host volume. Subsequent container restarts automatically detect and reload the trained model on startup without retraining.

### 2. Multi-Container Orchestration (`docker-compose.yml`)
- **Backend Service:**
  - Build: Context `.`, Dockerfile `backend/Dockerfile`
  - Ports: Host `5000:5000`
  - Health check: HTTP GET `/api/health` via `curl`
  - User: Non-root (`node`, UID 1000)
- **Frontend Service:**
  - Build: Context `./frontend`, Dockerfile `frontend/Dockerfile`
  - Ports: Host `3000:80`
  - Depends On: `backend` (`condition: service_healthy`)
  - Health check: HTTP GET `/` via `wget`
- **Network:** Private bridge network `disaster-nlp-net` enabling internal DNS resolution (`http://backend:5000`).

### 3. Kubernetes Deployment & Probes (`k8s/`)
- **Storage:** `nlp-artifacts-pvc` (1Gi PersistentVolumeClaim) bound to `/app/artifacts`.
- **Configuration:** `nlp-disaster-tweets-config` ConfigMap injecting `PORT`, `NODE_ENV`, and `CORS_ORIGINS`.
- **Health Probes:**
  - Backend: Liveness probe `/api/health` (initial delay 15s, period 20s); Readiness probe `/api/health` (initial delay 5s, period 10s).
  - Frontend: Liveness probe `/` (initial delay 10s, period 20s); Readiness probe `/` (initial delay 5s, period 10s).
- **Service Exposure:** Frontend exposed via NodePort on port 30080; Backend exposed via ClusterIP on port 5000.


---

## Final Project Acceptance & Runtime Verification Protocol (T18)

### 1. Dataset Verification & Ingestion Contract Fix
- **Status:** Installed and verified authentic Kaggle dataset at `data/raw/train.csv` (7,613 valid records, 3,271 disaster, 4,342 non-disaster, zero missing text/target). Original CSV remains strictly untouched.
- **Ingestion Contract Bridge:** Enhanced `loadAndAnalyzeDataset()` in `nlp/ingestion/datasetLoader.js` to return `records: validRecords`, bridging dataset ingestion directly into `ExperimentPipeline.run()`.
- **Known Duplicate-Text Overlap & Conflicting Label Noise:**
  - `duplicate_records: 92` reflects identical `(text, target)` rows. There are 110 duplicate raw text rows (7,503 unique texts).
  - 18 unique texts possess contradictory labels (annotator disagreement across 55 rows).
  - Row-level stratified splitting causes 13 unique texts (14 records, 1.23%) to overlap between Train and Validation, and 25 unique texts (29 records, 2.54%) between Train and Test.
  - In accordance with standard benchmark protocols, row-level stratification is preserved for the baseline experiment; overlap is documented for transparency without altering the original dataset.

### 2. Runtime Daemon Status
- **Docker Compose:** Syntax and service configurations validated via `docker-compose config`. Full container spin-up remains pending on host Docker Desktop launch.
- **Kubernetes:** Manifests validated via unit tests and structural schema checks. Live deployment remains pending on local cluster initialization.






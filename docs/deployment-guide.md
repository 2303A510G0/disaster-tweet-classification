# Full-Stack Deployment and Operations Guide

This guide covers setup, operations, containerization, orchestration, and troubleshooting for the **Syllabus-Aligned NLP Disaster Tweets Classification Platform**.

---

## 1. Prerequisites & Environment

### Operating System & Core Tools
- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Node.js:** Node 20 LTS or higher (`node -v`)
- **Package Manager:** npm 10+ (`npm -v`) — on Windows PowerShell use `npm.cmd`
- **Python:** Python 3.10+ with `pytest` for OpenAPI contract verification
- **Containerization (Optional for local dev, Required for production):** Docker Desktop with WSL2 backend (`docker-compose` or `docker compose`)
- **Orchestration (Optional):** Local Kubernetes (Docker Desktop Kubernetes, Minikube, or kind) and `kubectl` CLI

---

## 2. Status of Capabilities (Verified vs. Pending)

| Component | Status | Verification Method |
| :--- | :--- | :--- |
| **Pure JavaScript NLP Engine** | ✅ **Verified** | 228 automated tests covering cleaning, tokenization, stemming, BoW, TF-IDF, Chi-Square, Naive Bayes, Logistic Regression |
| **Express Backend REST API** | ✅ **Verified** | Supertest integration test suite covering all primary routes, aliases, CORS, and error handling |
| **React 19 + Vite Frontend** | ✅ **Verified** | 45 Vitest/Testing-Library component & route tests; successful production build (`vite build` in 826ms) |
| **OpenAPI 3.0 Contract** | ✅ **Verified** | 4 pytest contract tests verifying schemas and examples (`openapi.yaml`) |
| **Docker Configuration & Manifests** | ✅ **Verified (Structural)** | Validated syntax via `docker-compose config` and 11 automated manifest tests |
| **Docker Daemon Runtime** | ⏳ **Pending External Setup** | Docker Desktop engine is currently offline on host; pending user launch |
| **Kubernetes Cluster Deployment** | ⏳ **Pending External Setup** | Kubernetes local cluster is currently offline; pending user cluster startup |
| **Genuine Dataset Training** | ⏳ **Pending User Placement** | `data/raw/train.csv` is absent; anti-fabrication policy keeps training in transparent 503 unavailable state |

---

## 3. Local Development (Without Containers)

### Backend Express Service
```powershell
cd C:\Projects\lostandfounditems\backend
npm.cmd install
npm.cmd test
npm.cmd start
# Express runs on http://localhost:5000
```

### Frontend React Application
```powershell
cd C:\Projects\lostandfounditems\frontend
npm.cmd install
npm.cmd test
npm.cmd run dev
# Vite runs on http://localhost:3000 (proxies /api to http://localhost:5000)
```

---

## 4. Dataset Placement Instructions

The application strictly forbids fabricating synthetic datasets or imaginary training benchmarks. Real model training requires the authentic Kaggle competition dataset.

1. **Dataset Source:** Download from Kaggle:
   - Competition: [Natural Language Processing with Disaster Tweets](https://www.kaggle.com/competitions/nlp-getting-started)
   - File: `train.csv`
2. **Target File Path:**
   ```text
   C:\Projects\lostandfounditems\data\raw\train.csv
   ```
3. **Required Schema:**
   - `id`: integer
   - `keyword`: string (nullable)
   - `location`: string (nullable)
   - `text`: string (tweet text content)
   - `target`: integer binary label (`0` = Not Disaster, `1` = Real Disaster)
4. **Verification:**
   Once placed, opening the Dataset Explorer view (`/dataset`) or calling `GET /api/dataset/summary` will instantly transition from HTTP 503 to HTTP 200 with complete exploratory data analysis statistics.

---

## 5. Docker Desktop Startup & Compose Deployment

### Step A: Starting Docker Desktop
1. Launch **Docker Desktop** from the Windows Start menu or shortcut.
2. Wait until the Docker Desktop icon in the system tray turns steady and displays **Docker Desktop is running**.
3. Verify daemon connectivity in PowerShell:
   ```powershell
   docker version
   ```
   Both `Client` and `Server` versions should be reported without connection errors.

### Step B: Validate & Build with Docker Compose
```powershell
cd C:\Projects\lostandfounditems

# 1. Validate configuration
docker-compose config

# 2. Build images (frontend multi-stage build + backend)
docker-compose build

# 3. Start containers in background
docker-compose up -d

# 4. Check container health status
docker-compose ps
```

### Step C: Inspect Runtime Logs
```powershell
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend
```

### Step D: Accessing the Application
- **Frontend Web UI:** `http://localhost:3000` (served via Nginx)
- **Backend API Direct:** `http://localhost:5000/api/health`
- **Reverse Proxy API:** `http://localhost:3000/api/health`

### Step E: Stopping the Application
```powershell
docker-compose down
```

---

## 6. Kubernetes Cluster Deployment

If running local Kubernetes (Docker Desktop Kubernetes enabled, Minikube, or kind):

### Step A: Verify Cluster Connectivity
```powershell
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

### Step B: Apply Manifests in Order
```powershell
cd C:\Projects\lostandfounditems

# 1. Configuration & Persistent Storage
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml

# 2. Backend Service & Deployment
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-deployment.yaml

# 3. Frontend Service & Deployment
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### Step C: Verify Pods, Services, and Probes
```powershell
# Check running pods and health probes
kubectl get pods -l app.kubernetes.io/name=nlp-disaster-tweets

# Check services
kubectl get svc -l app.kubernetes.io/name=nlp-disaster-tweets

# Tail backend logs
kubectl logs -l app=backend -f
```

### Step D: Accessing in Kubernetes
- **Frontend UI:** `http://localhost:30080` (NodePort service)
- **Backend Service:** Internal DNS `http://backend:5000` within cluster

---

## 7. Model Training & Prediction Workflow

### Triggering Model Training
Once `data/raw/train.csv` is in place:
- **Via Web UI:** Navigate to `/models` and click **Train Models**.
- **Via REST API:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/model/train"
  ```
- **Lifecycle:**
  1. Partitions data using stratified split (70% Train, 15% Validation, 15% Test) with seed 42.
  2. Fits TF-IDF vectorizer and Chi-Square selector strictly on training partition.
  3. Trains `DummyClassifier`, `MultinomialNaiveBayes`, and `LogisticRegression`.
  4. Evaluates candidate models on 15% Validation partition using Macro F1 to select the optimal model.
  5. Serializes winning pipeline to `artifacts/models/model_artifact.json`.

### Performing Real-Time Predictions
- **Via Web UI:** Navigate to `/predict`, input tweet text (e.g., `"Massive wildfire near highway, immediate evacuation ordered!"`), and click **Classify Tweet**.
- **Via REST API:**
  ```powershell
  Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/predict" `
    -ContentType "application/json" `
    -Body '{"text": "Earthquake tremors felt across the downtown area."}'
  ```

---

## 8. Troubleshooting & Common Issues

| Symptom | Probable Cause | Recommended Action |
| :--- | :--- | :--- |
| `HTTP 503 DATASET_MISSING` | `data/raw/train.csv` is absent | Place the Kaggle competition dataset at `data/raw/train.csv`. |
| `HTTP 503 NO_MODEL_LOADED` | No artifact in `artifacts/models/` | Trigger model training after placing the dataset. |
| `HTTP 409 TRAINING_IN_PROGRESS` | Concurrent training requests | Allow active training run to finish before issuing another request. |
| `failed to connect to docker API` | Docker Desktop daemon is stopped | Start Docker Desktop application from Windows Start menu. |
| `dial tcp [::1]:8080 refused` | Kubernetes cluster is offline | Enable Kubernetes in Docker Desktop Settings > Kubernetes, or start minikube. |
| `Port 5000 or 3000 in use` | Another local process binds the port | Free the conflicting port or update `PORT` in `.env` / `docker-compose.yml`. |

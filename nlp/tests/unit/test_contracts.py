"""
Unit tests for API Contracts (T03).
Validates openapi.yaml syntax, path coverage, and example JSON payloads.
"""
from pathlib import Path
import json
import pytest
import re


def get_contracts_dir() -> Path:
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    return base_dir / "contracts"


def test_openapi_file_exists():
    contracts_dir = get_contracts_dir()
    openapi_file = contracts_dir / "openapi.yaml"
    assert openapi_file.exists(), "contracts/openapi.yaml does not exist"
    content = openapi_file.read_text(encoding="utf-8")
    assert "openapi: 3.0.3" in content
    assert "title: Syllabus NLP Disaster Tweets API" in content


def test_openapi_paths_defined():
    contracts_dir = get_contracts_dir()
    content = (contracts_dir / "openapi.yaml").read_text(encoding="utf-8")
    required_paths = [
        "/api/health:",
        "/api/dataset/summary:",
        "/api/preprocessing/preview:",
        "/api/models:",
        "/api/metrics:",
        "/api/predict:",
    ]
    for path in required_paths:
        assert path in content, f"Path {path} missing in openapi.yaml"


def test_openapi_components_defined():
    contracts_dir = get_contracts_dir()
    content = (contracts_dir / "openapi.yaml").read_text(encoding="utf-8")
    required_schemas = [
        "HealthResponse:",
        "DatasetSummaryResponse:",
        "PreprocessingRequest:",
        "PreprocessingResponse:",
        "ModelListResponse:",
        "MetricsResponse:",
        "PredictionRequest:",
        "PredictionResponse:",
    ]
    for schema in required_schemas:
        assert schema in content, f"Schema {schema} missing in openapi.yaml"


def test_example_payloads_valid_json():
    examples_dir = get_contracts_dir() / "examples"
    assert examples_dir.exists(), "contracts/examples directory does not exist"
    
    expected_files = [
        "health.json",
        "dataset_summary.json",
        "preprocessing_request.json",
        "preprocessing_response.json",
        "models_response.json",
        "metrics_response.json",
        "prediction_request.json",
        "prediction_response.json",
    ]
    for filename in expected_files:
        example_path = examples_dir / filename
        assert example_path.exists(), f"Example file {filename} missing"
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data is not None, f"Failed to parse {filename}"


"""
Unit test for NLP Engine Skeleton.
Verifies directory existence and core NLP dependencies.
"""
from pathlib import Path


def test_nlp_directories_exist():
    nlp_dir = Path(__file__).resolve().parent.parent.parent
    expected = [
        nlp_dir / "preprocessing",
        nlp_dir / "features",
        nlp_dir / "models",
        nlp_dir / "evaluation",
        nlp_dir / "tests",
    ]
    for d in expected:
        assert d.exists(), f"Directory {d} missing"
        assert d.is_dir()


def test_nlp_dependencies_importable():
    import sklearn
    import pandas
    import numpy
    import nltk
    import joblib

    assert sklearn.__version__
    assert pandas.__version__
    assert numpy.__version__
    assert nltk.__version__
    assert joblib.__version__


import React, { useState, useEffect } from 'react';
import {
  extractFeatures,
  getDatasetFeaturesInfo,
  getEducationalDemo,
} from '../api/featuresApi.js';
import { LoadingIndicator } from '../components/common/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';

export function FeatureExtractionExplorer() {
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [eduDemo, setEduDemo] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState(null);

  // Interactive Extractor state
  const [customText, setCustomText] = useState('wildfire evacuation alert in the city');
  const [ngramMode, setNgramMode] = useState('1,1'); // '1,1' or '1,2'
  const [sublinearTf, setSublinearTf] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [customResult, setCustomResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoadingInitial(true);
      setInitialError(null);
      try {
        const [info, demo] = await Promise.all([
          getDatasetFeaturesInfo().catch(() => ({
            isTrained: false,
            datasetAvailable: false,
            message: 'Backend feature info endpoint unreachable.',
          })),
          getEducationalDemo().catch(() => null),
        ]);
        setDatasetInfo(info);
        setEduDemo(demo);
      } catch (err) {
        setInitialError(err.message || 'Failed to initialize feature explorer.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const handleExtract = async () => {
    if (!customText.trim()) return;
    setExtractLoading(true);
    setExtractError(null);

    const ngramRange = ngramMode === '1,2' ? [1, 2] : [1, 1];
    try {
      const res = await extractFeatures({
        text: customText.trim(),
        ngramRange,
        sublinearTf,
      });
      setCustomResult(res);
    } catch (err) {
      setExtractError(err.message || 'Feature extraction failed.');
    } finally {
      setExtractLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Feature Extraction & Selection Explorer</h1>
        <p className="page-subtitle">
          Theoretical and practical inspection of Bag of Words (CountVectorizer), Term Frequency-Inverse Document Frequency (TF-IDF), and Chi-Square (&chi;&sup2;) feature selection in pure JavaScript.
        </p>
      </div>

      {loadingInitial && <LoadingIndicator message="Loading feature extraction parameters and educational demo..." />}
      {initialError && <ErrorMessage title="Failed to Load Features Data" message={initialError} />}

      {/* Dataset-Trained Features Status Card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: datasetInfo?.isTrained ? '4px solid var(--color-success, #16a34a)' : '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Dataset-Trained Features Status
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Inspects whether real Kaggle dataset vocabulary and Chi-Square rankings are active in memory.
            </p>
          </div>
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.785rem',
              fontWeight: 600,
              backgroundColor: datasetInfo?.isTrained ? '#dcfce7' : '#fef3c7',
              color: datasetInfo?.isTrained ? '#15803d' : '#92400e',
              border: datasetInfo?.isTrained ? '1px solid #bbf7d0' : '1px solid #fde68a',
            }}
          >
            {datasetInfo?.isTrained ? `Trained: ${datasetInfo.selectedModel}` : 'Not Loaded / Unavailable'}
          </span>
        </div>

        {datasetInfo && !datasetInfo.isTrained && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <p>
              The real Kaggle dataset vocabulary and fitted Chi-Square rankings are currently unavailable because <code>data/raw/train.csv</code> has not yet been processed through model training.
            </p>
            <p style={{ marginTop: '0.3rem', color: 'var(--color-text-light)' }}>
              In accordance with academic integrity guidelines, zero dataset statistics or vocabulary items are fabricated. You can explore the exact JavaScript algorithms below using our verified educational examples.
            </p>
          </div>
        )}

        {datasetInfo && datasetInfo.isTrained && (
          <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vocabulary Size</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {datasetInfo.vocabularySize?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Top Selected Features</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a' }}>
                {datasetInfo.selectedFeaturesCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Feature Extractor Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
          Interactive Feature Extraction Playground
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Test the live JavaScript vectorization algorithms by submitting an arbitrary tweet string.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom tweet to extract features..."
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.9rem',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={ngramMode}
              onChange={(e) => setNgramMode(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border, #e2e8f0)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--color-surface, #ffffff)',
              }}
            >
              <option value="1,1">Unigrams [1, 1]</option>
              <option value="1,2">Unigrams + Bigrams [1, 2]</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sublinearTf}
                onChange={(e) => setSublinearTf(e.target.checked)}
              />
              Sublinear TF
            </label>
            <button
              type="button"
              onClick={handleExtract}
              disabled={extractLoading || !customText.trim()}
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: extractLoading || !customText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {extractLoading ? 'Extracting...' : 'Extract Features'}
            </button>
          </div>
        </div>

        {extractError && <ErrorMessage title="Extraction Error" message={extractError} onRetry={handleExtract} />}

        {/* Live Extracted Features Display */}
        {customResult && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border, #e2e8f0)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
              Extracted Weights for: &quot;{customResult.text}&quot;
            </h4>

            {customResult.tfidf?.activeTerms?.length > 0 ? (
              <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border, #e2e8f0)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Term</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Index</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Count (TF)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Doc Freq (DF)</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Smooth IDF</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>L2 Normalized TF-IDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customResult.tfidf.activeTerms.map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                          {t.term}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{t.index}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{t.tf}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{t.df}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{t.idf}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>{t.tfidf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                No active terms found for input string.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section A: Bag of Words (CountVectorizer) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
          Section A: Bag of Words (CountVectorizer)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
          In the <strong>Bag of Words (BoW)</strong> model, grammar and word order are disregarded while term multiplicity is preserved. The training corpus documents are parsed to establish an alphabetical vocabulary where each distinct token maps to a fixed column index.
        </p>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md, 6px)', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Vocabulary Mapping & Indexing
          </h4>
          <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '0.5rem' }}>
            During <code>fit()</code>, vocabulary terms are alphabetically sorted and assigned column indices:
          </p>
          {eduDemo?.bowDemo?.vocabulary ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {eduDemo.bowDemo.vocabulary.map((v, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                  }}
                >
                  <strong>{v.term}</strong> &rarr; index {v.index}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Loading educational vocabulary...</p>
          )}
        </div>

        <div style={{ fontSize: '0.825rem', color: '#334155' }}>
          <strong>Leakage-Safe Property:</strong> Notice that when transforming test or live user documents with <code>transform()</code>, tokens not present in the learned vocabulary are safely ignored without shifting existing indices or mutating the vectorizer.
        </div>
      </div>

      {/* Section B: TF-IDF Vectorizer (TfidfVectorizer) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
          Section B: TF-IDF Vectorizer (TfidfVectorizer)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
          <strong>Term Frequency-Inverse Document Frequency (TF-IDF)</strong> penalizes words that appear ubiquitously across all documents while elevating discriminative tokens that appear frequently in specific posts.
        </p>

        {/* Mathematical Formulas Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: 'var(--radius-sm, 4px)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              1. Smooth Inverse Document Frequency
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginTop: '0.3rem', color: '#0369a1' }}>
              IDF(t) = ln((1 + N) / (1 + DF(t))) + 1
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Adds 1 to numerator and denominator to prevent zero division.
            </p>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: 'var(--radius-sm, 4px)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              2. Sublinear Term Frequency (Optional)
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginTop: '0.3rem', color: '#0369a1' }}>
              TF(t, d) = 1 + ln(count(t, d))
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Dampens excessive repetitions within a single tweet.
            </p>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: 'var(--radius-sm, 4px)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              3. L2 Normalization (Euclidean Length)
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginTop: '0.3rem', color: '#0369a1' }}>
              v_norm = v / sqrt(&Sigma; v_i&sup2;)
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Ensures short and long tweets reside on the same unit hypersphere.
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Chi-Square Feature Selection */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
          Section C: Chi-Square Feature Selection (&chi;&sup2;)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
          In text classification, vocabulary size can scale to tens of thousands of terms. <strong>Chi-Square feature selection</strong> evaluates the statistical independence between the presence/absence of word feature j and the binary disaster target label y (0 or 1).
        </p>

        {/* 2x2 Contingency Table Explanation */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md, 6px)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-main)' }}>
            2&times;2 Contingency Table Structure
          </h4>
          <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '0.75rem' }}>
            For every vocabulary feature column $j$, document counts are binarized (present vs. absent) across both classes:
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', maxWidth: '600px', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.6rem' }}></th>
                  <th style={{ padding: '0.4rem 0.6rem' }}>Disaster (Class 1)</th>
                  <th style={{ padding: '0.4rem 0.6rem' }}>Non-Disaster (Class 0)</th>
                  <th style={{ padding: '0.4rem 0.6rem' }}>Row Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>Feature Present (x &gt; 0)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace' }}>A (Present &amp; Class 1)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace' }}>B (Present &amp; Class 0)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>r1 = A + B</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>Feature Absent (x = 0)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace' }}>C (Absent &amp; Class 1)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace' }}>D (Absent &amp; Class 0)</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>r2 = C + D</td>
                </tr>
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 600 }}>
                  <td style={{ padding: '0.4rem 0.6rem' }}>Column Total</td>
                  <td style={{ padding: '0.4rem 0.6rem' }}>c1 = A + C</td>
                  <td style={{ padding: '0.4rem 0.6rem' }}>c2 = B + D</td>
                  <td style={{ padding: '0.4rem 0.6rem' }}>N = A + B + C + D</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#0369a1' }}>
            &chi;&sup2; = &Sigma; [ (Observed - Expected)&sup2; / Expected ]
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            where Expected = (row_total &times; col_total) / N. Cells with Expected = 0 are safely skipped.
          </p>
        </div>

        {/* Educational Contingency Table Demo */}
        {eduDemo?.chi2Demo?.features && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                Educational Example: Contingency Tables &amp; &chi;&sup2; Rankings
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {eduDemo.disclaimer}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border, #e2e8f0)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Term</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>A (Pres &amp; 1)</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>B (Pres &amp; 0)</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>C (Abs &amp; 1)</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>D (Abs &amp; 0)</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>&chi;&sup2; Score</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Discriminative?</th>
                  </tr>
                </thead>
                <tbody>
                  {eduDemo.chi2Demo.features.slice(0, 10).map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                      <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', fontWeight: 600 }}>{f.term}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>{f.contingency.A}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>{f.contingency.B}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>{f.contingency.C}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>{f.contingency.D}</td>
                      <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700, color: f.chi2Score > 0 ? '#16a34a' : 'inherit' }}>
                        {f.chi2Score}
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>
                        {f.chi2Score > 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Yes (&chi;&sup2; &gt; 0)</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>No (Independent)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '4px', fontSize: '0.8rem', color: '#1e40af' }}>
          <strong>Strict Leakage Prevention Guarantee:</strong> In <code>ExperimentPipeline</code>, <code>ChiSquareSelector.fit(X_train, y_train)</code> is executed strictly on the Training split (70%). Validation and test partitions are never observed during feature ranking, preventing optimistic evaluation leakage.
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export function PipelineFlow() {
  const steps = [
    { num: '01', title: 'Dataset', desc: 'Raw CSV ingestion & 70/15/15 stratified split' },
    { num: '02', title: 'Preprocessing', desc: 'Regex cleaning, stop-words, & Porter stemming' },
    { num: '03', title: 'Feature Extraction', desc: 'CountVectorizer & TfidfVectorizer (unigram+bigram)' },
    { num: '04', title: 'Feature Selection', desc: 'Chi-Square (χ²) 2×2 contingency table ranking' },
    { num: '05', title: 'Classification', desc: 'Baseline, Multinomial Naive Bayes, Logistic Regression' },
    { num: '06', title: 'Evaluation', desc: 'Accuracy, Precision, Recall, Macro/Weighted F1, & CM' },
    { num: '07', title: 'Prediction', desc: 'Live single-tweet inference with probabilities' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
      {steps.map((step, idx) => (
        <div
          key={step.num}
          style={{
            backgroundColor: 'var(--color-bg, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '0.85rem',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-primary, #2563eb)',
              marginBottom: '0.2rem',
            }}
          >
            STEP {step.num}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main, #0f172a)', marginBottom: '0.25rem' }}>
            {step.title}
          </div>
          <div style={{ fontSize: '0.785rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.35 }}>
            {step.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

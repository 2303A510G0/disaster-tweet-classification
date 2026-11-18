import React from 'react';

/**
 * ConfusionMatrixTable — Visual representation of a 2x2 binary confusion matrix
 *
 * Matrix format:
 * [
 *   [TN, FP], // Actual Non-Disaster (0)
 *   [FN, TP]  // Actual Disaster (1)
 * ]
 */
export function ConfusionMatrixTable({ matrix, modelName = '' }) {
  if (!matrix || !Array.isArray(matrix) || matrix.length < 2) {
    return <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Matrix data unavailable</p>;
  }

  const tn = matrix[0]?.[0] ?? 0;
  const fp = matrix[0]?.[1] ?? 0;
  const fn = matrix[1]?.[0] ?? 0;
  const tp = matrix[1]?.[1] ?? 0;

  const total = tn + fp + fn + tp;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
          Confusion Matrix {modelName ? `(${modelName})` : ''}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Total Validation Samples: <strong>{total.toLocaleString()}</strong>
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', maxWidth: '450px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'center' }}>
              <th style={{ padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1' }}></th>
              <th style={{ padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1' }}>Predicted: Non-Disaster (0)</th>
              <th style={{ padding: '0.4rem 0.5rem', border: '1px solid #cbd5e1' }}>Predicted: Disaster (1)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ textAlign: 'center' }}>
              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', textAlign: 'left' }}>
                Actual: Non-Disaster (0)
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>
                {tn.toLocaleString()}
                <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#3b82f6' }}>True Negative (TN)</div>
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 600 }}>
                {fp.toLocaleString()}
                <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#ef4444' }}>False Positive (FP)</div>
              </td>
            </tr>
            <tr style={{ textAlign: 'center' }}>
              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', textAlign: 'left' }}>
                Actual: Disaster (1)
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 600 }}>
                {fn.toLocaleString()}
                <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#ef4444' }}>False Negative (FN)</div>
              </td>
              <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
                {tp.toLocaleString()}
                <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#22c55e' }}>True Positive (TP)</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * PreprocessingSandbox.test.jsx — Unit & Integration Tests for Preprocessing Sandbox Page (T15)
 *
 * Follows strict TDD (RED phase before component implementation).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreprocessingSandbox } from '../pages/PreprocessingSandbox.jsx';
import * as preprocessApi from '../api/preprocessApi.js';

describe('PreprocessingSandbox Page Component Tests (T15)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header, textarea, character counter, options, and process button', () => {
    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    expect(screen.getByText('NLP Preprocessing Sandbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter or paste a raw tweet to inspect/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2,000 characters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Tweet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear \/ Reset/i })).toBeInTheDocument();

    // Educational callout
    expect(screen.getByText(/Stemming vs\. Lemmatization/i)).toBeInTheDocument();
  });

  it('populates input and updates character count when clicking an example tweet', () => {
    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    const exampleChip = screen.getByText(/Example 1: Disaster Report/i);
    fireEvent.click(exampleChip);

    const textarea = screen.getByPlaceholderText(/Enter or paste a raw tweet to inspect/i);
    expect(textarea.value.length).toBeGreaterThan(0);
    expect(textarea.value).toContain('earthquake');
    expect(screen.getByText(new RegExp(`${textarea.value.length} \\/ 2,000 characters`, 'i'))).toBeInTheDocument();
  });

  it('shows validation warning and prevents API call when input is empty', async () => {
    const spy = vi.spyOn(preprocessApi, 'preprocessText');

    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    const processBtn = screen.getByRole('button', { name: /Process Tweet/i });
    fireEvent.click(processBtn);

    expect(screen.getByText(/Please enter tweet text to preprocess/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('successfully processes tweet and renders all 6 transformation stages', async () => {
    const mockResponse = {
      original_text: 'Our deeds are the reason of this #earthquake May ALLAH Forgive us all',
      cleaned_text: 'our deeds are the reason of this earthquake may allah forgive us all',
      tokens: ['our', 'deeds', 'are', 'the', 'reason', 'of', 'this', 'earthquake', 'may', 'allah', 'forgive', 'us', 'all'],
      filtered_tokens: ['deeds', 'reason', 'earthquake', 'may', 'allah', 'forgive', 'us'],
      stemmed_tokens: ['deed', 'reason', 'earthquak', 'may', 'allah', 'forgiv', 'us'],
      final_text: 'deed reason earthquak may allah forgiv us',
      options: {
        lowercase: true,
        removeStopWords: true,
        preserveNegation: true,
        stemming: true,
      },
    };

    vi.spyOn(preprocessApi, 'preprocessText').mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a raw tweet to inspect/i);
    fireEvent.change(textarea, { target: { value: 'Our deeds are the reason of this #earthquake May ALLAH Forgive us all' } });

    const processBtn = screen.getByRole('button', { name: /Process Tweet/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      // Stage headings
      expect(screen.getByText(/Stage 1: Original Raw Text/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 2: Normalized & Cleaned Text/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 3: Word Tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 4: Stop-Word Filtered Tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 5: Porter Stemmed Tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 6: Final Processed String/i)).toBeInTheDocument();
    });

    expect(screen.getByText('deed reason earthquak may allah forgiv us')).toBeInTheDocument();
  });

  it('resets input, options, and results when Clear / Reset button is clicked', async () => {
    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a raw tweet to inspect/i);
    fireEvent.change(textarea, { target: { value: 'Some test tweet' } });
    expect(textarea.value).toBe('Some test tweet');

    const clearBtn = screen.getByRole('button', { name: /Clear \/ Reset/i });
    fireEvent.click(clearBtn);

    expect(textarea.value).toBe('');
    expect(screen.getByText(/0 \/ 2,000 characters/i)).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    vi.spyOn(preprocessApi, 'preprocessText').mockRejectedValue(
      new Error('Failed to connect to preprocessing service')
    );

    render(
      <MemoryRouter>
        <PreprocessingSandbox />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a raw tweet to inspect/i);
    fireEvent.change(textarea, { target: { value: 'Test disaster tweet' } });

    const processBtn = screen.getByRole('button', { name: /Process Tweet/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to preprocessing service/i)).toBeInTheDocument();
    });
  });
});

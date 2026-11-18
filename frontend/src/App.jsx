import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { DatasetExplorer } from './pages/DatasetExplorer.jsx';
import { PreprocessingSandbox } from './pages/PreprocessingSandbox.jsx';
import { FeatureExtractionExplorer } from './pages/FeatureExtractionExplorer.jsx';
import { ModelComparison } from './pages/ModelComparison.jsx';
import { Prediction } from './pages/Prediction.jsx';
import { NotFound } from './pages/NotFound.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dataset" element={<DatasetExplorer />} />
          <Route path="preprocess" element={<PreprocessingSandbox />} />
          <Route path="features" element={<FeatureExtractionExplorer />} />
          <Route path="models" element={<ModelComparison />} />
          <Route path="predict" element={<Prediction />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


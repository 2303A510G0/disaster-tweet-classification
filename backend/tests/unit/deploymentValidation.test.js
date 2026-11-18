/**
 * deploymentValidation.test.js — Automated Validation Tests for Containerization & K8s Manifests (T17)
 *
 * Verifies:
 * - backend/Dockerfile: Node.js 20 base, copies nlp/ and backend/, non-root user, exposes 5000, healthcheck
 * - frontend/Dockerfile: Multi-stage build (Node builder + Nginx runner), exposes 80, healthcheck
 * - frontend/nginx.conf: SPA fallback routing and /api reverse proxying
 * - docker-compose.yml: backend & frontend services, ports, custom bridge network, volumes, health checks
 * - k8s manifests: ConfigMap, PVC, Backend Deployment/Service, Frontend Deployment/Service
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('T17 Deployment & Containerization Validation Tests', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const backendDockerfilePath = path.join(rootDir, 'backend/Dockerfile');
  const frontendDockerfilePath = path.join(rootDir, 'frontend/Dockerfile');
  const frontendNginxPath = path.join(rootDir, 'frontend/nginx.conf');
  const composePath = path.join(rootDir, 'docker-compose.yml');
  const k8sDir = path.join(rootDir, 'k8s');

  describe('Backend Dockerfile', () => {
    it('exists and adheres to production security and architecture guidelines', () => {
      expect(fs.existsSync(backendDockerfilePath)).toBe(true);
      const content = fs.readFileSync(backendDockerfilePath, 'utf-8');

      // Base image check
      expect(content).toMatch(/FROM\s+node:20-alpine/i);

      // Must copy shared nlp module and backend code
      expect(content).toMatch(/COPY\s+.*nlp/i);
      expect(content).toMatch(/COPY\s+.*backend/i);

      // Must expose port 5000
      expect(content).toMatch(/EXPOSE\s+5000/);

      // Non-root security
      expect(content).toMatch(/USER\s+(node|appuser)/i);

      // Docker healthcheck endpoint
      expect(content).toMatch(/HEALTHCHECK/i);
      expect(content).toMatch(/\/api\/health/);
    });
  });

  describe('Frontend Dockerfile & Nginx Configuration', () => {
    it('exists and implements multi-stage build with Nginx reverse proxy', () => {
      expect(fs.existsSync(frontendDockerfilePath)).toBe(true);
      const dockerContent = fs.readFileSync(frontendDockerfilePath, 'utf-8');

      // Multi-stage builder & runner
      expect(dockerContent).toMatch(/FROM\s+node:20-alpine\s+AS\s+builder/i);
      expect(dockerContent).toMatch(/FROM\s+nginx:.*-alpine/i);
      expect(dockerContent).toMatch(/COPY\s+--from=builder/i);
      expect(dockerContent).toMatch(/EXPOSE\s+80/);
      expect(dockerContent).toMatch(/HEALTHCHECK/i);

      // Nginx configuration check
      expect(fs.existsSync(frontendNginxPath)).toBe(true);
      const nginxContent = fs.readFileSync(frontendNginxPath, 'utf-8');

      // SPA routing & reverse proxy
      expect(nginxContent).toMatch(/try_files\s+\$uri\s+\$uri\/\s+\/index\.html/);
      expect(nginxContent).toMatch(/location\s+\/api\//);
      expect(nginxContent).toMatch(/proxy_pass\s+http:\/\/backend:5000/);
    });
  });

  describe('Docker Compose Orchestrator', () => {
    it('defines backend and frontend services with networking, volumes, and health checks', () => {
      expect(fs.existsSync(composePath)).toBe(true);
      const content = fs.readFileSync(composePath, 'utf-8');

      // Services defined
      expect(content).toMatch(/backend:/);
      expect(content).toMatch(/frontend:/);

      // Ports mapped
      expect(content).toMatch(/["']?5000:5000["']?/);
      expect(content).toMatch(/["']?3000:80["']?/);

      // Volume mounts for data and artifacts persistence
      expect(content).toMatch(/\.\/data:\/app\/data/);
      expect(content).toMatch(/\.\/artifacts:\/app\/artifacts/);

      // Custom bridge network
      expect(content).toMatch(/networks:/);
      expect(content).toMatch(/disaster-nlp-net/);

      // Service dependency & healthchecks
      expect(content).toMatch(/condition:\s+service_healthy/);
    });
  });

  describe('Kubernetes Manifests (k8s/)', () => {
    const requiredManifests = [
      'configmap.yaml',
      'pvc.yaml',
      'backend-deployment.yaml',
      'backend-service.yaml',
      'frontend-deployment.yaml',
      'frontend-service.yaml',
    ];

    it.each(requiredManifests)('manifest %s exists and contains valid k8s resource spec', (manifest) => {
      const filePath = path.join(k8sDir, manifest);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toMatch(/apiVersion:\s+[a-z0-9/]+/);
      expect(content).toMatch(/kind:\s+[A-Za-z]+/);
      expect(content).toMatch(/metadata:/);
    });

    it('verifies backend deployment has health probes and artifact volume mount', () => {
      const backendDeployPath = path.join(k8sDir, 'backend-deployment.yaml');
      const content = fs.readFileSync(backendDeployPath, 'utf-8');

      expect(content).toMatch(/livenessProbe:/);
      expect(content).toMatch(/readinessProbe:/);
      expect(content).toMatch(/\/api\/health/);
      expect(content).toMatch(/persistentVolumeClaim:/);
      expect(content).toMatch(/mountPath:\s+\/app\/artifacts/);
      expect(content).toMatch(/resources:/);
      expect(content).toMatch(/limits:/);
      expect(content).toMatch(/requests:/);
    });

    it('verifies frontend service exposes port and frontend deployment has probes', () => {
      const frontendDeployPath = path.join(k8sDir, 'frontend-deployment.yaml');
      const content = fs.readFileSync(frontendDeployPath, 'utf-8');

      expect(content).toMatch(/livenessProbe:/);
      expect(content).toMatch(/readinessProbe:/);
      expect(content).toMatch(/containerPort:\s+80/);
    });
  });
});

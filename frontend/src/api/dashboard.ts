import api from './client';
import type { DashboardStats, AuditLog, AiCategoryRecommendation, AiRiskAssessment, Page } from '../types';

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
};

export const auditApi = {
  getAll: (page = 0, size = 50) =>
    api.get<Page<AuditLog>>('/audit', { params: { page, size } }).then(r => r.data),
  getForEntity: (entityType: string, entityId: number, page = 0, size = 50) =>
    api.get<Page<AuditLog>>(`/audit/entity/${entityType}/${entityId}`, { params: { page, size } }).then(r => r.data),
  getByUser: (performedBy: string, page = 0, size = 50) =>
    api.get<Page<AuditLog>>(`/audit/user/${performedBy}`, { params: { page, size } }).then(r => r.data),
};

export const aiApi = {
  recommendCategory: (name: string, description?: string) =>
    api.get<AiCategoryRecommendation>('/ai/recommend-category', { params: { name, description } }).then(r => r.data),
  assessRisk: (assetId: number) =>
    api.get<AiRiskAssessment>(`/ai/risk/${assetId}`).then(r => r.data),
  assessAllRisks: () =>
    api.get<AiRiskAssessment[]>('/ai/risks').then(r => r.data),
  getHighRiskAssets: () =>
    api.get<AiRiskAssessment[]>('/ai/high-risk').then(r => r.data),
};

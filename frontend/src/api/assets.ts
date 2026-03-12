import api from './client';
import type {
  Asset, AssetCreateRequest, AssetUpdateRequest, StatusChangeRequest,
  AssignmentRequest, ReturnRequest, AssignmentHistory, StatusHistory,
  AssetCategory, Page
} from '../types';

export const assetApi = {
<<<<<<< Updated upstream
  getAll: (page = 0, size = 20, sort = 'createdAt,desc') =>
    api.get<Page<Asset>>('/assets', { params: { page, size, sort } }).then(r => r.data),
=======
  getAll: (page = 0, size = 20, sort = 'createdAt,desc', filters?: {
    status?: string;
    categoryId?: number;
    type?: string;
    departmentId?: number;
    branchId?: number;
  }) => {
    const params: Record<string, unknown> = { page, size, sort };
    if (filters?.status) params.status = filters.status;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.type) params.type = filters.type;
    if (filters?.departmentId) params.departmentId = filters.departmentId;
    if (filters?.branchId) params.branchId = filters.branchId;
    return api.get<Page<Asset>>('/assets', { params }).then(r => r.data);
  },
>>>>>>> Stashed changes

  getById: (id: number) =>
    api.get<Asset>(`/assets/${id}`).then(r => r.data),

  getBySerialNumber: (serialNumber: string) =>
    api.get<Asset>(`/assets/serial/${serialNumber}`).then(r => r.data),

  search: (query: string, page = 0, size = 20) =>
    api.get<Page<Asset>>('/assets/search', { params: { query, page, size } }).then(r => r.data),

  create: (data: AssetCreateRequest) =>
    api.post<Asset>('/assets', data).then(r => r.data),

  update: (id: number, data: AssetUpdateRequest) =>
    api.put<Asset>(`/assets/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/assets/${id}`),

  // Filtering
  getByStatus: (status: string) =>
    api.get<Asset[]>(`/assets/status/${status}`).then(r => r.data),

  getByCategory: (categoryId: number) =>
    api.get<Asset[]>(`/assets/category/${categoryId}`).then(r => r.data),

  getByEmployee: (employeeId: number) =>
    api.get<Asset[]>(`/assets/employee/${employeeId}`).then(r => r.data),

  getByDepartment: (departmentId: number) =>
    api.get<Asset[]>(`/assets/department/${departmentId}`).then(r => r.data),

  // Lifecycle
  changeStatus: (id: number, data: StatusChangeRequest) =>
    api.patch<Asset>(`/assets/${id}/status`, data).then(r => r.data),

  // Assignment
  assign: (id: number, data: AssignmentRequest) =>
    api.post<Asset>(`/assets/${id}/assign`, data).then(r => r.data),

  returnAsset: (id: number, data: ReturnRequest) =>
    api.post<Asset>(`/assets/${id}/return`, data).then(r => r.data),

  // History
  getAssignmentHistory: (id: number) =>
    api.get<AssignmentHistory[]>(`/assets/${id}/assignments`).then(r => r.data),

  getStatusHistory: (id: number) =>
    api.get<StatusHistory[]>(`/assets/${id}/status-history`).then(r => r.data),

  // QR Code
  getQrCodeUrl: (id: number, size = 300) =>
    `/api/assets/${id}/qr?size=${size}`,

  // Image upload
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Asset>(`/assets/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  // Image URL (supports S3 presigned URLs and local fallback)
  getImageUrl: (id: number) =>
    api.get<string>(`/assets/${id}/image-url`).then(r => r.data),

  // Categories
  getCategories: () =>
    api.get<AssetCategory[]>('/assets/categories').then(r => r.data),

  createCategory: (name: string, description?: string) =>
    api.post<AssetCategory>('/assets/categories', null, { params: { name, description } }).then(r => r.data),

  // Analytics
  getExpiredWarranty: () =>
    api.get<Asset[]>('/assets/analytics/expired-warranty').then(r => r.data),

  getAgingAssets: (years = 5) =>
    api.get<Asset[]>('/assets/analytics/aging', { params: { years } }).then(r => r.data),
};

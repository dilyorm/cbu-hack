export type AssetStatus = 'REGISTERED' | 'ASSIGNED' | 'IN_REPAIR' | 'LOST' | 'WRITTEN_OFF';

export interface Branch {
  id: number;
  name: string;
  code: string;
  address?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  branchName?: string;
  branchId?: number;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  employeeCode: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentName?: string;
  departmentId?: number;
  active: boolean;
}

export interface AssetCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Asset {
  id: number;
  name: string;
  description?: string;
  serialNumber: string;
  type: string;
  categoryName: string;
  categoryId: number;
  status: AssetStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  warrantyExpired: boolean;
  imagePath?: string;
  notes?: string;
  currentEmployee?: Employee;
  currentDepartment?: Department;
  currentBranch?: Branch;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCreateRequest {
  name: string;
  description?: string;
  serialNumber: string;
  type: string;
  categoryId: number;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  notes?: string;
}

export interface AssetUpdateRequest {
  name?: string;
  description?: string;
  type?: string;
  categoryId?: number;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  notes?: string;
}

export interface StatusChangeRequest {
  newStatus: AssetStatus;
  changedBy: string;
  reason?: string;
}

export interface AssignmentRequest {
  employeeId?: number;
  departmentId?: number;
  branchId?: number;
  assignedBy: string;
}

export interface ReturnRequest {
  returnedBy: string;
  returnNotes?: string;
}

export interface AssignmentHistory {
  id: number;
  assetId: number;
  assetName: string;
  assetSerialNumber: string;
  employeeName?: string;
  employeeId?: number;
  departmentName?: string;
  branchName?: string;
  assignedAt: string;
  returnedAt?: string;
  assignedBy: string;
  returnNotes?: string;
  active: boolean;
}

export interface StatusHistory {
  id: number;
  assetId: number;
  oldStatus?: AssetStatus;
  newStatus: AssetStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalAssets: number;
  registeredCount: number;
  assignedCount: number;
  inRepairCount: number;
  lostCount: number;
  writtenOffCount: number;
  totalAssetValue: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  expiredWarrantyCount: number;
  agingAssetsCount: number;
}

export interface AiCategoryRecommendation {
  recommendedCategory: string;
  recommendedType: string;
  confidence: number;
  alternativeCategories: string[];
  reasoning: string;
}

export interface AiRiskAssessment {
  assetId: number;
  assetName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  failureProbability: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface BranchRequest {
  name: string;
  code: string;
  address?: string;
}

export interface DepartmentRequest {
  name: string;
  code: string;
  branchId?: number;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  employeeCode: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentId?: number;
}

// Auth types
export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

import api from './client';
import type { Branch, BranchRequest, Department, DepartmentRequest, Employee, EmployeeRequest, AssignmentHistory } from '../types';

export const branchApi = {
  getAll: () => api.get<Branch[]>('/branches').then(r => r.data),
  getById: (id: number) => api.get<Branch>(`/branches/${id}`).then(r => r.data),
  create: (data: BranchRequest) => api.post<Branch>('/branches', data).then(r => r.data),
  update: (id: number, data: BranchRequest) => api.put<Branch>(`/branches/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/branches/${id}`),
};

export const departmentApi = {
  getAll: () => api.get<Department[]>('/departments').then(r => r.data),
  getById: (id: number) => api.get<Department>(`/departments/${id}`).then(r => r.data),
  getByBranch: (branchId: number) => api.get<Department[]>(`/departments/branch/${branchId}`).then(r => r.data),
  create: (data: DepartmentRequest) => api.post<Department>('/departments', data).then(r => r.data),
  update: (id: number, data: DepartmentRequest) => api.put<Department>(`/departments/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

export const employeeApi = {
  getAll: () => api.get<Employee[]>('/employees').then(r => r.data),
  getActive: () => api.get<Employee[]>('/employees/active').then(r => r.data),
  getById: (id: number) => api.get<Employee>(`/employees/${id}`).then(r => r.data),
  getByDepartment: (departmentId: number) => api.get<Employee[]>(`/employees/department/${departmentId}`).then(r => r.data),
  create: (data: EmployeeRequest) => api.post<Employee>('/employees', data).then(r => r.data),
  update: (id: number, data: EmployeeRequest) => api.put<Employee>(`/employees/${id}`, data).then(r => r.data),
  deactivate: (id: number) => api.patch(`/employees/${id}/deactivate`),
  getAssignmentHistory: (id: number) => api.get<AssignmentHistory[]>(`/employees/${id}/assignments`).then(r => r.data),
};

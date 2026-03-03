package com.bankasset.service;

import com.bankasset.dto.EmployeeRequest;
import com.bankasset.dto.EmployeeResponse;
import com.bankasset.enums.AuditAction;
import com.bankasset.exception.ResourceNotFoundException;
import com.bankasset.exception.DuplicateResourceException;
import com.bankasset.model.Department;
import com.bankasset.model.Employee;
import com.bankasset.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentService departmentService;
    private final AuditService auditService;

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        if (employeeRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new DuplicateResourceException("Employee with code " + request.getEmployeeCode() + " already exists");
        }

        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .employeeCode(request.getEmployeeCode())
                .email(request.getEmail())
                .phone(request.getPhone())
                .position(request.getPosition())
                .active(true)
                .build();

        if (request.getDepartmentId() != null) {
            Department department = departmentService.findById(request.getDepartmentId());
            employee.setDepartment(department);
        }

        employee = employeeRepository.save(employee);

        auditService.log("EMPLOYEE", employee.getId(), AuditAction.CREATE, "SYSTEM",
                Map.of("name", employee.getFullName(), "code", employee.getEmployeeCode()));

        return toResponse(employee);
    }

    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<EmployeeResponse> getActive() {
        return employeeRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public EmployeeResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<EmployeeResponse> getByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        Employee employee = findById(id);

        if (request.getFirstName() != null) employee.setFirstName(request.getFirstName());
        if (request.getLastName() != null) employee.setLastName(request.getLastName());
        if (request.getEmail() != null) employee.setEmail(request.getEmail());
        if (request.getPhone() != null) employee.setPhone(request.getPhone());
        if (request.getPosition() != null) employee.setPosition(request.getPosition());
        if (request.getDepartmentId() != null) {
            Department department = departmentService.findById(request.getDepartmentId());
            employee.setDepartment(department);
        }

        employee = employeeRepository.save(employee);

        auditService.log("EMPLOYEE", employee.getId(), AuditAction.UPDATE, "SYSTEM",
                Map.of("name", employee.getFullName()));

        return toResponse(employee);
    }

    @Transactional
    public void deactivate(Long id) {
        Employee employee = findById(id);
        employee.setActive(false);
        employeeRepository.save(employee);

        auditService.log("EMPLOYEE", employee.getId(), AuditAction.UPDATE, "SYSTEM",
                Map.of("action", "deactivated", "name", employee.getFullName()));
    }

    Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    EmployeeResponse toResponse(Employee employee) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .fullName(employee.getFullName())
                .employeeCode(employee.getEmployeeCode())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .position(employee.getPosition())
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .active(employee.getActive())
                .build();
    }
}

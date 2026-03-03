package com.bankasset.service;

import com.bankasset.dto.*;
import com.bankasset.enums.AssetStatus;
import com.bankasset.enums.AuditAction;
import com.bankasset.exception.BusinessRuleException;
import com.bankasset.exception.DuplicateResourceException;
import com.bankasset.exception.ResourceNotFoundException;
import com.bankasset.model.*;
import com.bankasset.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetCategoryRepository categoryRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final BranchService branchService;
    private final AuditService auditService;

    // ===== CRUD =====

    @Transactional
    public AssetResponse create(AssetCreateRequest request) {
        if (assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new DuplicateResourceException("Asset with serial number " + request.getSerialNumber() + " already exists");
        }

        AssetCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Asset asset = Asset.builder()
                .name(request.getName())
                .description(request.getDescription())
                .serialNumber(request.getSerialNumber())
                .type(request.getType())
                .category(category)
                .status(AssetStatus.REGISTERED)
                .purchaseDate(request.getPurchaseDate())
                .purchaseCost(request.getPurchaseCost())
                .warrantyExpiryDate(request.getWarrantyExpiryDate())
                .notes(request.getNotes())
                .build();

        asset = assetRepository.save(asset);

        // Record initial status
        recordStatusChange(asset, null, AssetStatus.REGISTERED, "SYSTEM", "Asset registered");

        auditService.log("ASSET", asset.getId(), AuditAction.CREATE, "SYSTEM",
                Map.of("name", asset.getName(), "serialNumber", asset.getSerialNumber(),
                        "type", asset.getType(), "category", category.getName()));

        return toResponse(asset);
    }

    public AssetResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public AssetResponse getBySerialNumber(String serialNumber) {
        Asset asset = assetRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with serial number: " + serialNumber));
        return toResponse(asset);
    }

    public Page<AssetResponse> getAll(Pageable pageable) {
        return assetRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<AssetResponse> search(String query, Pageable pageable) {
        return assetRepository.searchAssets(query, pageable).map(this::toResponse);
    }

    public List<AssetResponse> getByStatus(AssetStatus status) {
        return assetRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    public List<AssetResponse> getByCategory(Long categoryId) {
        return assetRepository.findByCategoryId(categoryId).stream().map(this::toResponse).toList();
    }

    public List<AssetResponse> getByEmployee(Long employeeId) {
        return assetRepository.findByCurrentEmployeeId(employeeId).stream().map(this::toResponse).toList();
    }

    public List<AssetResponse> getByDepartment(Long departmentId) {
        return assetRepository.findByCurrentDepartmentId(departmentId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AssetResponse update(Long id, AssetUpdateRequest request) {
        Asset asset = findById(id);

        if (request.getName() != null) asset.setName(request.getName());
        if (request.getDescription() != null) asset.setDescription(request.getDescription());
        if (request.getType() != null) asset.setType(request.getType());
        if (request.getCategoryId() != null) {
            AssetCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            asset.setCategory(category);
        }
        if (request.getPurchaseDate() != null) asset.setPurchaseDate(request.getPurchaseDate());
        if (request.getPurchaseCost() != null) asset.setPurchaseCost(request.getPurchaseCost());
        if (request.getWarrantyExpiryDate() != null) asset.setWarrantyExpiryDate(request.getWarrantyExpiryDate());
        if (request.getNotes() != null) asset.setNotes(request.getNotes());

        asset = assetRepository.save(asset);

        auditService.log("ASSET", asset.getId(), AuditAction.UPDATE, "SYSTEM",
                Map.of("name", asset.getName()));

        return toResponse(asset);
    }

    @Transactional
    public void delete(Long id) {
        Asset asset = findById(id);
        if (asset.getStatus() == AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("Cannot delete an asset that is currently assigned");
        }

        auditService.log("ASSET", asset.getId(), AuditAction.DELETE, "SYSTEM",
                Map.of("name", asset.getName(), "serialNumber", asset.getSerialNumber()));

        assetRepository.delete(asset);
    }

    // ===== LIFECYCLE MANAGEMENT =====

    @Transactional
    public AssetResponse changeStatus(Long id, StatusChangeRequest request) {
        Asset asset = findById(id);
        AssetStatus oldStatus = asset.getStatus();
        AssetStatus newStatus = request.getNewStatus();

        // Enforce business rules
        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new BusinessRuleException(
                    String.format("Cannot transition from %s to %s", oldStatus, newStatus));
        }

        // Additional rule: If moving to ASSIGNED, must have an active assignment
        if (newStatus == AssetStatus.ASSIGNED && asset.getCurrentEmployee() == null) {
            throw new BusinessRuleException("Cannot set status to ASSIGNED without an assigned employee. Use the assign endpoint first.");
        }

        // If moving away from ASSIGNED, clear the assignment
        if (oldStatus == AssetStatus.ASSIGNED && newStatus != AssetStatus.ASSIGNED) {
            deactivateCurrentAssignment(asset, request.getChangedBy(), "Status changed to " + newStatus);
            asset.setCurrentEmployee(null);
            asset.setCurrentDepartment(null);
            asset.setCurrentBranch(null);
        }

        asset.setStatus(newStatus);
        asset = assetRepository.save(asset);

        recordStatusChange(asset, oldStatus, newStatus, request.getChangedBy(), request.getReason());

        auditService.log("ASSET", asset.getId(), AuditAction.STATUS_CHANGE, request.getChangedBy(),
                Map.of("oldStatus", oldStatus.name(), "newStatus", newStatus.name(),
                        "reason", request.getReason() != null ? request.getReason() : ""));

        return toResponse(asset);
    }

    // ===== ASSIGNMENT MANAGEMENT =====

    @Transactional
    public AssetResponse assignAsset(Long assetId, AssignmentRequest request) {
        Asset asset = findById(assetId);

        // Business rule: only REGISTERED assets can be assigned
        if (asset.getStatus() != AssetStatus.REGISTERED) {
            throw new BusinessRuleException(
                    "Asset can only be assigned when in REGISTERED status. Current status: " + asset.getStatus());
        }

        // Business rule: LOST assets cannot be reassigned (enforced by status transition)
        if (asset.getStatus() == AssetStatus.LOST) {
            throw new BusinessRuleException("LOST assets cannot be reassigned");
        }

        // Ensure only one active owner
        if (assignmentRepository.existsByAssetIdAndActiveTrue(assetId)) {
            throw new BusinessRuleException("Asset already has an active assignment. Return it first.");
        }

        Employee employee = null;
        Department department = null;
        Branch branch = null;

        if (request.getEmployeeId() != null) {
            employee = employeeService.findById(request.getEmployeeId());
            if (!employee.getActive()) {
                throw new BusinessRuleException("Cannot assign asset to inactive employee");
            }
            department = employee.getDepartment();
            branch = department != null ? department.getBranch() : null;
        }

        if (request.getDepartmentId() != null) {
            department = departmentService.findById(request.getDepartmentId());
            branch = department.getBranch();
        }

        if (request.getBranchId() != null) {
            branch = branchService.findById(request.getBranchId());
        }

        // Create assignment record
        AssetAssignment assignment = AssetAssignment.builder()
                .asset(asset)
                .employee(employee)
                .department(department)
                .branch(branch)
                .assignedBy(request.getAssignedBy())
                .active(true)
                .build();

        assignmentRepository.save(assignment);

        // Update asset
        asset.setCurrentEmployee(employee);
        asset.setCurrentDepartment(department);
        asset.setCurrentBranch(branch);
        asset.setStatus(AssetStatus.ASSIGNED);
        asset = assetRepository.save(asset);

        recordStatusChange(asset, AssetStatus.REGISTERED, AssetStatus.ASSIGNED,
                request.getAssignedBy(), "Assigned to " + (employee != null ? employee.getFullName() : "department"));

        auditService.log("ASSET", asset.getId(), AuditAction.ASSIGN, request.getAssignedBy(),
                Map.of("employeeName", employee != null ? employee.getFullName() : "",
                        "departmentName", department != null ? department.getName() : ""));

        return toResponse(asset);
    }

    @Transactional
    public AssetResponse returnAsset(Long assetId, ReturnRequest request) {
        Asset asset = findById(assetId);

        if (asset.getStatus() != AssetStatus.ASSIGNED) {
            throw new BusinessRuleException("Asset is not currently assigned");
        }

        deactivateCurrentAssignment(asset, request.getReturnedBy(), request.getReturnNotes());

        String previousOwner = asset.getCurrentEmployee() != null ? asset.getCurrentEmployee().getFullName() : "N/A";

        asset.setCurrentEmployee(null);
        asset.setCurrentDepartment(null);
        asset.setCurrentBranch(null);
        asset.setStatus(AssetStatus.REGISTERED);
        asset = assetRepository.save(asset);

        recordStatusChange(asset, AssetStatus.ASSIGNED, AssetStatus.REGISTERED,
                request.getReturnedBy(), "Returned. " + (request.getReturnNotes() != null ? request.getReturnNotes() : ""));

        auditService.log("ASSET", asset.getId(), AuditAction.UNASSIGN, request.getReturnedBy(),
                Map.of("previousOwner", previousOwner, "notes", request.getReturnNotes() != null ? request.getReturnNotes() : ""));

        return toResponse(asset);
    }

    // ===== HISTORY =====

    public List<AssignmentHistoryResponse> getAssignmentHistory(Long assetId) {
        return assignmentRepository.findByAssetIdOrderByAssignedAtDesc(assetId)
                .stream().map(this::toAssignmentResponse).toList();
    }

    public List<StatusHistoryResponse> getStatusHistory(Long assetId) {
        return statusHistoryRepository.findByAssetIdOrderByChangedAtDesc(assetId)
                .stream().map(this::toStatusHistoryResponse).toList();
    }

    public List<AssignmentHistoryResponse> getEmployeeAssignmentHistory(Long employeeId) {
        return assignmentRepository.findByEmployeeIdOrderByAssignedAtDesc(employeeId)
                .stream().map(this::toAssignmentResponse).toList();
    }

    // ===== ANALYTICS =====

    public DashboardStats getDashboardStats() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByStatusGrouped()) {
            byStatus.put(((AssetStatus) row[0]).name(), (Long) row[1]);
        }

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByCategoryGrouped()) {
            byCategory.put((String) row[0], (Long) row[1]);
        }

        Map<String, Long> byDepartment = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByDepartmentGrouped()) {
            byDepartment.put((String) row[0], (Long) row[1]);
        }

        return DashboardStats.builder()
                .totalAssets(assetRepository.countTotal())
                .registeredCount(assetRepository.countByStatus(AssetStatus.REGISTERED))
                .assignedCount(assetRepository.countByStatus(AssetStatus.ASSIGNED))
                .inRepairCount(assetRepository.countByStatus(AssetStatus.IN_REPAIR))
                .lostCount(assetRepository.countByStatus(AssetStatus.LOST))
                .writtenOffCount(assetRepository.countByStatus(AssetStatus.WRITTEN_OFF))
                .totalAssetValue(assetRepository.totalActiveAssetValue())
                .byStatus(byStatus)
                .byCategory(byCategory)
                .byDepartment(byDepartment)
                .expiredWarrantyCount(assetRepository.findExpiredWarranty(LocalDate.now()).size())
                .agingAssetsCount(assetRepository.findAgingAssets(LocalDate.now().minusYears(5)).size())
                .build();
    }

    public List<AssetResponse> getExpiredWarrantyAssets() {
        return assetRepository.findExpiredWarranty(LocalDate.now())
                .stream().map(this::toResponse).toList();
    }

    public List<AssetResponse> getAgingAssets(int yearsOld) {
        return assetRepository.findAgingAssets(LocalDate.now().minusYears(yearsOld))
                .stream().map(this::toResponse).toList();
    }

    // ===== IMAGE =====

    @Transactional
    public AssetResponse updateImagePath(Long id, String imagePath) {
        Asset asset = findById(id);
        asset.setImagePath(imagePath);
        asset = assetRepository.save(asset);

        auditService.log("ASSET", asset.getId(), AuditAction.IMAGE_UPLOADED, "SYSTEM",
                Map.of("imagePath", imagePath));

        return toResponse(asset);
    }

    // ===== CATEGORIES =====

    public List<AssetCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public AssetCategory createCategory(String name, String description) {
        if (categoryRepository.existsByName(name)) {
            throw new DuplicateResourceException("Category with name " + name + " already exists");
        }
        AssetCategory category = AssetCategory.builder()
                .name(name)
                .description(description)
                .build();
        return categoryRepository.save(category);
    }

    // ===== HELPERS =====

    Asset findById(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
    }

    private void deactivateCurrentAssignment(Asset asset, String returnedBy, String notes) {
        assignmentRepository.findByAssetIdAndActiveTrue(asset.getId()).ifPresent(assignment -> {
            assignment.setActive(false);
            assignment.setReturnedAt(LocalDateTime.now());
            assignment.setReturnNotes(notes);
            assignmentRepository.save(assignment);
        });
    }

    private void recordStatusChange(Asset asset, AssetStatus oldStatus, AssetStatus newStatus,
                                     String changedBy, String reason) {
        AssetStatusHistory history = AssetStatusHistory.builder()
                .asset(asset)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .reason(reason)
                .build();
        statusHistoryRepository.save(history);
    }

    AssetResponse toResponse(Asset asset) {
        AssetResponse.AssetResponseBuilder builder = AssetResponse.builder()
                .id(asset.getId())
                .name(asset.getName())
                .description(asset.getDescription())
                .serialNumber(asset.getSerialNumber())
                .type(asset.getType())
                .categoryName(asset.getCategory().getName())
                .categoryId(asset.getCategory().getId())
                .status(asset.getStatus())
                .purchaseDate(asset.getPurchaseDate())
                .purchaseCost(asset.getPurchaseCost())
                .warrantyExpiryDate(asset.getWarrantyExpiryDate())
                .warrantyExpired(asset.isWarrantyExpired())
                .imagePath(asset.getImagePath())
                .notes(asset.getNotes())
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt());

        if (asset.getCurrentEmployee() != null) {
            Employee emp = asset.getCurrentEmployee();
            builder.currentEmployee(EmployeeResponse.builder()
                    .id(emp.getId())
                    .firstName(emp.getFirstName())
                    .lastName(emp.getLastName())
                    .fullName(emp.getFullName())
                    .employeeCode(emp.getEmployeeCode())
                    .build());
        }

        if (asset.getCurrentDepartment() != null) {
            Department dept = asset.getCurrentDepartment();
            builder.currentDepartment(DepartmentResponse.builder()
                    .id(dept.getId())
                    .name(dept.getName())
                    .code(dept.getCode())
                    .build());
        }

        if (asset.getCurrentBranch() != null) {
            Branch branch = asset.getCurrentBranch();
            builder.currentBranch(BranchResponse.builder()
                    .id(branch.getId())
                    .name(branch.getName())
                    .code(branch.getCode())
                    .build());
        }

        return builder.build();
    }

    private AssignmentHistoryResponse toAssignmentResponse(AssetAssignment assignment) {
        return AssignmentHistoryResponse.builder()
                .id(assignment.getId())
                .assetId(assignment.getAsset().getId())
                .assetName(assignment.getAsset().getName())
                .assetSerialNumber(assignment.getAsset().getSerialNumber())
                .employeeName(assignment.getEmployee() != null ? assignment.getEmployee().getFullName() : null)
                .employeeId(assignment.getEmployee() != null ? assignment.getEmployee().getId() : null)
                .departmentName(assignment.getDepartment() != null ? assignment.getDepartment().getName() : null)
                .branchName(assignment.getBranch() != null ? assignment.getBranch().getName() : null)
                .assignedAt(assignment.getAssignedAt())
                .returnedAt(assignment.getReturnedAt())
                .assignedBy(assignment.getAssignedBy())
                .returnNotes(assignment.getReturnNotes())
                .active(assignment.getActive())
                .build();
    }

    private StatusHistoryResponse toStatusHistoryResponse(AssetStatusHistory history) {
        return StatusHistoryResponse.builder()
                .id(history.getId())
                .assetId(history.getAsset().getId())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .changedBy(history.getChangedBy())
                .reason(history.getReason())
                .changedAt(history.getChangedAt())
                .build();
    }
}

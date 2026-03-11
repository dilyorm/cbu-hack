package com.bankasset.repository;

import com.bankasset.model.AssetStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {
    List<AssetStatusHistory> findByAssetIdOrderByChangedAtDesc(Long assetId);
}

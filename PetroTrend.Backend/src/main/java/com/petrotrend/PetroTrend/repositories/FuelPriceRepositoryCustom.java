package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FuelPriceRepositoryCustom {
    Page<FuelPrice> search(FuelPriceFilter filter, Pageable pageable);
}

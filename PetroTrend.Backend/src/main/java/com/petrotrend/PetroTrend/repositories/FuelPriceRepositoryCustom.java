package com.petrotrend.PetroTrend.repositories;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

public interface FuelPriceRepositoryCustom {
    Page<FuelPrice> search(FuelPriceFilter filter, Pageable pageable);

    List<FuelPrice> findLatestPerFuel(Set<FuelSymbol> fuelSymbols);
}

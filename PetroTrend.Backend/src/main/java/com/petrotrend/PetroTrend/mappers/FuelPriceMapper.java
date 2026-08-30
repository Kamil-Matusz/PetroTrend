package com.petrotrend.PetroTrend.mappers;

import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FuelPriceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    FuelPrice convertToDto(FuelPriceRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void convertToEntity(FuelPriceRequest request, @MappingTarget FuelPrice fuelPrice);

    FuelPriceResponse convertToResponse(FuelPrice fuelPrice);

    List<FuelPriceResponse> convertToResponses(List<FuelPrice> fuelPrices);
}

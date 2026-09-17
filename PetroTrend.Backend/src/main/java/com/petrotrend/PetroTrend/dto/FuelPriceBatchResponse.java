package com.petrotrend.PetroTrend.dto;

import java.util.List;

public record FuelPriceBatchResponse(List<FuelPriceResponse> created, List<FuelPriceResponse> updated) { }
package com.petrotrend.PetroTrend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FuelPriceBatchRequest(@NotEmpty @Size(max = 20) List<@NotNull @Valid FuelPriceRequest> prices) { }
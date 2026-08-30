package com.petrotrend.PetroTrend.dto;

import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FuelPriceRequest(@NotNull FuelSymbol fuelSymbol,
                               @NotNull Currency currency,
                               @NotNull @Positive @Digits(integer = 4, fraction = 2) BigDecimal price,
                               @NotNull @PastOrPresent LocalDate date,
                               @Size(max = 64) String source) { }

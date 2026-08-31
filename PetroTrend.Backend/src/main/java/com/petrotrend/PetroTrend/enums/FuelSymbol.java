package com.petrotrend.PetroTrend.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FuelSymbol {
    ON("Diesel"),
    PB95("Petrol 95"),
    PB98("Petrol 98"),
    LPG("Autogas");

    private final String displayName;
}

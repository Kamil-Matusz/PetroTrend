package com.petrotrend.PetroTrend.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FuelSymbol {
    ON("Olej napędowy"),
    PB95("Benzyna Pb 95"),
    PB98("Benzyna Pb 98"),
    LPG("Autogaz");

    private final String displayName;
}

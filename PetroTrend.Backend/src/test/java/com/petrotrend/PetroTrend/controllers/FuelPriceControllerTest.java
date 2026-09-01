package com.petrotrend.PetroTrend.controllers;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import com.petrotrend.PetroTrend.services.FuelPriceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = FuelPriceController.class)
class FuelPriceControllerTest {

    private static final String BASE_PATH = "/api/fuelPrices";
    private static final String SEARCH_PATH = BASE_PATH + "/search";
    private static final String CURRENT_MONTH_PATH = BASE_PATH + "/currentMonth";
    private static final String RANGE_PATH = BASE_PATH + "/range";
    private static final String LATEST_PATH = BASE_PATH + "/latest";

    private static final FuelPriceFilter EMPTY_FILTER = new FuelPriceFilter(null, null, null, null);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FuelPriceService fuelPriceService;

    @Test
    void searchBindsAllFiltersAndPagingFromQueryParams() throws Exception {
        //given
        final Pageable expectedPageable = PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "date"));
        when(fuelPriceService.search(any(), any())).thenReturn(new PageImpl<>(List.of(), expectedPageable, 0));

        //when
        mockMvc.perform(get(SEARCH_PATH)
                        .param("fuelSymbol", "ON")
                        .param("currency", "PLN")
                        .param("from", "2026-08-01")
                        .param("to", "2026-08-31")
                        .param("page", "1")
                        .param("size", "5")
                        .param("sort", "date,desc"))
                //then
                .andExpect(status().isOk());
        verify(fuelPriceService).search(
                eq(new FuelPriceFilter(FuelSymbol.ON, Currency.PLN, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31))),
                eq(expectedPageable));
    }

    @Test
    void searchDefaultsToDateDescendingPageSizeTwenty() throws Exception {
        //given
        when(fuelPriceService.search(any(), any())).thenReturn(new PageImpl<>(List.of()));

        //when
        mockMvc.perform(get(SEARCH_PATH))
                //then
                .andExpect(status().isOk());
        verify(fuelPriceService).search(
                eq(EMPTY_FILTER),
                eq(PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "date"))));
    }

    @Test
    void searchClampsOversizedPageToConfiguredMaximum() throws Exception {
        //given
        when(fuelPriceService.search(any(), any())).thenReturn(new PageImpl<>(List.of()));

        //when
        mockMvc.perform(get(SEARCH_PATH).param("size", "999999"))
                //then
                .andExpect(status().isOk());
        verify(fuelPriceService).search(
                eq(EMPTY_FILTER),
                eq(PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "date"))));
    }

    @Test
    void searchSerializesAsPagedModelWithStableShape() throws Exception {
        //given
        final FuelPriceResponse response = new FuelPriceResponse(
                "id-1", FuelSymbol.ON, Currency.PLN, new BigDecimal("6.49"),
                LocalDate.of(2026, 8, 15), "orlen", null);
        when(fuelPriceService.search(any(), any())).thenReturn(new PageImpl<>(List.of(response), PageRequest.of(1, 5), 42));

        //when
        final String body = mockMvc.perform(
                        get(SEARCH_PATH).param("page", "1").param("size", "5"))
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("id-1"))
                .andExpect(jsonPath("$.page.size").value(5))
                .andExpect(jsonPath("$.page.number").value(1))
                .andExpect(jsonPath("$.page.totalElements").value(42))
                .andExpect(jsonPath("$.page.totalPages").value(9))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("pageable").doesNotContain("numberOfElements");
    }

    @Test
    void searchRejectsUnknownEnumValue() throws Exception {
        //given
        //when
        mockMvc.perform(get(SEARCH_PATH).param("fuelSymbol", "NOPE"))
                //then
                .andExpect(status().isBadRequest());
    }

    @Test
    void searchReturnsBadRequestWithReasonCodeForInvertedRange() throws Exception {
        //given
        when(fuelPriceService.search(any(), any())).thenThrow(
                new InvalidDateRangeException(LocalDate.of(2026, 8, 31), LocalDate.of(2026, 8, 1)));

        //when
        mockMvc.perform(get(SEARCH_PATH).param("from", "2026-08-31").param("to", "2026-08-01"))
                //then
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reasonCode").value("INVALID_DATE_RANGE"));
    }

    @Test
    void searchReturnsBadRequestWithReasonCodeForUnsupportedSort() throws Exception {
        //given
        when(fuelPriceService.search(any(), any()))
                .thenThrow(new InvalidSortPropertyException("source", Set.of("date", "price")));

        //when
        mockMvc.perform(get(SEARCH_PATH).param("sort", "date"))
                //then
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.reasonCode").value("INVALID_SORT_PROPERTY"));
    }

    @Test
    void latestDefaultsToDieselAndPetrol95() throws Exception {
        //given
        when(fuelPriceService.findLatestPerFuel(any())).thenReturn(List.of(
                new FuelPriceResponse("1", FuelSymbol.ON, Currency.PLN, new BigDecimal("6.49"),
                        LocalDate.of(2026, 8, 31), "orlen", null)));

        //when
        mockMvc.perform(get(LATEST_PATH))
                //then
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].fuelSymbol").value("ON"))
                .andExpect(jsonPath("$[0].date").value("2026-08-31"));
        verify(fuelPriceService).findLatestPerFuel(Set.of(FuelSymbol.ON, FuelSymbol.PB95));
    }

    @Test
    void latestBindsExplicitlySelectedFuelSymbols() throws Exception {
        //given
        when(fuelPriceService.findLatestPerFuel(any())).thenReturn(List.of());

        //when
        mockMvc.perform(get(LATEST_PATH).param("fuelSymbols", "LPG,PB98"))
                //then
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        verify(fuelPriceService).findLatestPerFuel(Set.of(FuelSymbol.LPG, FuelSymbol.PB98));
    }

    @Test
    void latestRejectsUnknownFuelSymbol() throws Exception {
        //given
        //when
        mockMvc.perform(get(LATEST_PATH).param("fuelSymbols", "DIESEL"))
                //then
                .andExpect(status().isBadRequest());
        verify(fuelPriceService, never()).findLatestPerFuel(any());
    }

    @Test
    void currentMonthRouteIsNotSwallowedByIdPathVariable() throws Exception {
        //given
        when(fuelPriceService.findCurrentMonth()).thenReturn(List.of());

        //when
        mockMvc.perform(get(CURRENT_MONTH_PATH))
                //then
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        verify(fuelPriceService).findCurrentMonth();
    }

    @Test
    void searchRouteIsNotSwallowedByIdPathVariable() throws Exception {
        //given
        when(fuelPriceService.search(any(), any())).thenReturn(new PageImpl<>(List.of()));

        //when
        mockMvc.perform(get(SEARCH_PATH))
                //then
                .andExpect(status().isOk());
        verify(fuelPriceService).search(any(), any());
    }

    @Test
    void rangeRouteStillBindsIsoDates() throws Exception {
        //given
        when(fuelPriceService.findByDateRange(any(), any())).thenReturn(List.of());

        //when
        mockMvc.perform(get(RANGE_PATH).param("from", "2026-08-01").param("to", "2026-08-31"))
                //then
                .andExpect(status().isOk());
        verify(fuelPriceService).findByDateRange(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
    }
}

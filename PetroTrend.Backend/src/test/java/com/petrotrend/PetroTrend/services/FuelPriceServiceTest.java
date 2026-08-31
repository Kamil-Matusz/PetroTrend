package com.petrotrend.PetroTrend.services;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import com.petrotrend.PetroTrend.mappers.FuelPriceMapper;
import com.petrotrend.PetroTrend.repositories.FuelPriceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FuelPriceServiceTest {

    private static final FuelPriceFilter EMPTY_FILTER = new FuelPriceFilter(null, null, null, null);

    @Mock
    private FuelPriceRepository fuelPriceRepository;

    @Mock
    private FuelPriceMapper fuelPriceMapper;

    @InjectMocks
    private FuelPriceService fuelPriceService;

    @Captor
    private ArgumentCaptor<LocalDate> fromCaptor;

    @Captor
    private ArgumentCaptor<LocalDate> toCaptor;

    @Test
    void currentMonthQueriesFirstAndLastDayOfCurrentMonth() {
        //given
        when(fuelPriceRepository.findByDateGreaterThanEqualAndDateLessThanEqualOrderByDateDesc(any(), any()))
                .thenReturn(List.of());
        when(fuelPriceMapper.convertToResponses(List.of())).thenReturn(List.of());

        //when
        fuelPriceService.findCurrentMonth();

        //then
        verify(fuelPriceRepository).findByDateGreaterThanEqualAndDateLessThanEqualOrderByDateDesc(
                fromCaptor.capture(), toCaptor.capture());
        final YearMonth expected = YearMonth.now();
        assertThat(fromCaptor.getValue()).isEqualTo(expected.atDay(1));
        assertThat(toCaptor.getValue()).isEqualTo(expected.atEndOfMonth());
    }

    @Test
    void invertedRangeOnRangeEndpointThrowsWithoutHittingRepository() {
        //given
        final LocalDate from = LocalDate.of(2026, 8, 31);
        final LocalDate to = LocalDate.of(2026, 8, 1);

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.findByDateRange(from, to))
                .isInstanceOf(InvalidDateRangeException.class);
        verify(fuelPriceRepository, never())
                .findByDateGreaterThanEqualAndDateLessThanEqualOrderByDateDesc(any(), any());
    }

    @Test
    void invertedRangeOnSearchThrowsWithoutHittingRepository() {
        //given
        final FuelPriceFilter filter =
                new FuelPriceFilter(null, null, LocalDate.of(2026, 8, 31), LocalDate.of(2026, 8, 1));

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.search(filter, PageRequest.of(0, 20)))
                .isInstanceOf(InvalidDateRangeException.class);
        verify(fuelPriceRepository, never()).search(any(), any());
    }

    @Test
    void searchAcceptsOpenEndedRange() {
        //given
        final FuelPriceFilter filter = new FuelPriceFilter(null, null, LocalDate.of(2026, 8, 31), null);
        final Pageable pageable = PageRequest.of(0, 20);
        when(fuelPriceRepository.search(filter, pageable)).thenReturn(Page.empty(pageable));

        //when
        final Page<?> result = fuelPriceService.search(filter, pageable);

        //then
        assertThat(result).isEmpty();
    }

    @Test
    void searchRejectsSortOnUnsupportedProperty() {
        //given
        final Pageable pageable = PageRequest.of(0, 20, Sort.by("source"));

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.search(EMPTY_FILTER, pageable))
                .isInstanceOf(InvalidSortPropertyException.class)
                .hasMessageContaining("source");
        verify(fuelPriceRepository, never()).search(any(), any());
    }

    @Test
    void searchAllowsSortOnDateAndPrice() {
        //given
        final Pageable pageable = PageRequest.of(0, 20, Sort.by("date").descending().and(Sort.by("price")));
        when(fuelPriceRepository.search(EMPTY_FILTER, pageable)).thenReturn(Page.empty(pageable));

        //when
        //then
        assertThatCode(() -> fuelPriceService.search(EMPTY_FILTER, pageable)).doesNotThrowAnyException();
    }

    @Test
    void searchMapsEntitiesToResponsesPreservingPageMetadata() {
        //given
        final Pageable pageable = PageRequest.of(1, 2);
        final FuelPrice entity = new FuelPrice();
        when(fuelPriceRepository.search(EMPTY_FILTER, pageable))
                .thenReturn(new PageImpl<>(List.of(entity, entity), pageable, 42));
        when(fuelPriceMapper.convertToResponse(entity)).thenReturn(null);

        //when
        final Page<?> result = fuelPriceService.search(EMPTY_FILTER, pageable);

        //then
        assertThat(result.getTotalElements()).isEqualTo(42);
        assertThat(result.getTotalPages()).isEqualTo(21);
        assertThat(result.getNumber()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(2);
        verify(fuelPriceMapper, never()).convertToResponses(any());
    }
}

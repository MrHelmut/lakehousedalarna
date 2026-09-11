const form = document.querySelector("[data-booking-request-form]");
const helpText = document.querySelector("[data-request-help]");
const requestSelection = document.querySelector("[data-request-selection]");
const sendRequestLink = document.querySelector("[data-send-request-link]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const calendarStatus = document.querySelector("[data-calendar-status]");
const monthLabel = document.querySelector("[data-month-label]");
const prevButton = document.querySelector("[data-prev-month]");
const nextButton = document.querySelector("[data-next-month]");
const checkInInput = document.querySelector("[data-check-in]");
const checkOutInput = document.querySelector("[data-check-out]");
const guestsInput = document.querySelector("[data-guests]");
const priceGuestsInput = document.querySelector("[data-guests-price]");
const priceEstimate = document.querySelector("[data-price-estimate]");
const priceDetails = document.querySelector("[data-price-details]");
const summaryGuests = document.querySelector("[data-summary-guests]");
const summaryNights = document.querySelector("[data-summary-nights]");
const summarySeason = document.querySelector("[data-summary-season]");
const summaryStatus = document.querySelector("[data-summary-status]");
const seasonNote = document.querySelector("[data-season-note]");

const bookingEmail = "alexander_hjelm@hotmail.com";
[
    helpText,
    requestSelection,
    calendarGrid,
    calendarStatus,
    monthLabel,
    priceEstimate,
    priceDetails,
    summaryGuests,
    summaryNights,
    summarySeason,
    summaryStatus,
    seasonNote,
].forEach((element) => element?.setAttribute("data-no-translate", ""));

const monthNames = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    sv: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
    de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
};
const weekdayNames = {
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sv: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
};
const pricing = window.lakeHousePricing;

let bookedDates = new Set();
let visibleMonth = new Date();
let syncingGuests = false;
let availabilityUpdatedAt = "";
let availabilityLoaded = false;
let availabilityLoadFailed = false;
let coverageStart = "";
let coverageEnd = "";

visibleMonth.setDate(1);
visibleMonth.setHours(0, 0, 0, 0);

function currentLanguage() {
    return window.siteI18n?.getCurrentLanguage?.() || "en";
}

function tr(text, replacements = {}) {
    if (window.siteI18n?.t) {
        return window.siteI18n.t(text, replacements);
    }

    return Object.entries(replacements).reduce((translated, [key, value]) => (
        translated.replaceAll(`{${key}}`, value)
    ), text);
}

function guestLabel(value) {
    const guests = Number(value);
    if (!guests) {
        return tr("Not selected");
    }

    const language = currentLanguage();
    if (language === "sv") {
        return guests === 1 ? "1 gäst" : `${guests} gäster`;
    }
    if (language === "de") {
        return guests === 1 ? "1 Gast" : `${guests} Gäste`;
    }
    return guests === 1 ? "1 guest" : `${guests} guests`;
}

function nightLabel(value) {
    const nights = Number(value);
    if (!nights) {
        return tr("Not selected");
    }

    const language = currentLanguage();
    if (language === "sv") {
        return nights === 1 ? "1 natt" : `${nights} nätter`;
    }
    if (language === "de") {
        return nights === 1 ? "1 Nacht" : `${nights} Nächte`;
    }
    return nights === 1 ? "1 night" : `${nights} nights`;
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function formatValue(formData, key, fallback = "Not provided") {
    const value = String(formData.get(key) || "").trim();
    return value || tr(fallback);
}

function getSelectedGuests() {
    return guestsInput.value || priceGuestsInput.value;
}

function syncGuestControls(value) {
    if (syncingGuests) {
        return;
    }

    syncingGuests = true;
    guestsInput.value = value;
    priceGuestsInput.value = value;
    syncingGuests = false;
}

function nightsBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        return null;
    }

    const start = new Date(`${checkIn}T12:00:00`);
    const end = new Date(`${checkOut}T12:00:00`);
    const nights = Math.round((end - start) / 86400000);
    return nights > 0 ? nights : null;
}

function formatSek(amount) {
    return new Intl.NumberFormat(currentLanguage() === "sv" ? "sv-SE" : currentLanguage() === "de" ? "de-DE" : "en-GB", {
        style: "currency",
        currency: pricing.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatShortSek(amount) {
    // Calendar guide prices are rounded; the stay total retains öre precision.
    return new Intl.NumberFormat(currentLanguage(), { maximumFractionDigits: 0 }).format(amount);
}

function getNightPrice(date, guests = "") {
    const key = toDateKey(date);
    if (key < pricing.firstDate || key > pricing.lastDate) return null;
    const base = pricing.nightlyPrices[key.slice(0, 7)]?.[date.getDate() - 1];
    if (!Number.isFinite(base)) return null;
    const extraGuests = Math.max(0, (Number(guests) || 1) - pricing.includedGuests);
    const airbnbAmount = base + extraGuests * pricing.extraGuestNightly;
    return { airbnbAmount, amount: Math.round(airbnbAmount * 100 * (1 - pricing.directDiscount)) / 100 };
}

function getStayEstimate(checkIn, checkOut, guests) {
    const nights = nightsBetween(checkIn, checkOut);
    if (!nights) return null;
    let airbnbSubtotal = 0;
    for (let day = parseDateKey(checkIn); day < parseDateKey(checkOut); day = addDays(day, 1)) {
        const price = getNightPrice(day, guests);
        if (!price) return null;
        airbnbSubtotal += price.airbnbAmount;
    }
    const lengthDiscount = nights >= 28 ? pricing.monthlyDiscount : nights >= 7 ? pricing.weeklyDiscount : 0;
    // Apply the existing length discount before the returning-guest discount.
    const comparisonCents = Math.round(airbnbSubtotal * 100 * (1 - lengthDiscount));
    const discountCents = Math.round(comparisonCents * pricing.directDiscount);
    const accommodation = (comparisonCents - discountCents) / 100;
    const cleaning = pricing.cleaning;
    const linen = (Number(guests) || 0) * pricing.linenPerGuest;
    const total = Math.round((accommodation + cleaning + linen) * 100) / 100;
    return { total, accommodation, cleaning, linen, comparison: comparisonCents / 100,
        directDiscount: discountCents / 100, lengthDiscount, nights,
        average: accommodation / nights, labels: [] };
}

function getSeasonSummary() {
    return tr("Returning guest rate");
}

function getSeasonNote() {
    return tr("Prices checked against Airbnb on 11 September 2026. Later Airbnb price changes are not automatic. Final price is confirmed before booking.");
}

function isUnavailable(date) {
    const key = toDateKey(date);
    return !availabilityLoaded || availabilityLoadFailed || !coverageStart || !coverageEnd
        || key < coverageStart || key >= coverageEnd || bookedDates.has(key);
}

function collectUnavailableDates(availability) {
    const dates = new Set(availability.booked_dates || []);
    for (const range of availability.blocked_ranges || []) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(range.start) || !/^\d{4}-\d{2}-\d{2}$/.test(range.end) || range.end <= range.start) {
            throw new Error("Invalid blocked range");
        }
        for (let day = parseDateKey(range.start); day < parseDateKey(range.end); day = addDays(day, 1)) dates.add(toDateKey(day));
    }
    return dates;
}

function validateSelection() {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const today = toDateKey(new Date());
    const startBlocked = checkIn && (checkIn < today || isUnavailable(parseDateKey(checkIn)));
    const rangeBlocked = checkIn && checkOut && hasUnavailableBetween(checkIn, checkOut);
    const endInvalid = checkOut && (!nightsBetween(checkIn, checkOut) || rangeBlocked);
    checkInInput.setCustomValidity(startBlocked ? tr("These dates are unavailable. Choose other dates.") : "");
    checkOutInput.setCustomValidity(endInvalid ? tr("These dates are unavailable. Choose other dates.") : "");
    const ready = availabilityLoaded && !availabilityLoadFailed && coverageStart && coverageEnd;
    const valid = Boolean(ready && checkIn && checkOut && getSelectedGuests() && !startBlocked && !endInvalid);
    form.querySelector("button[type='submit']").disabled = !valid;
    sendRequestLink.setAttribute("aria-disabled", String(!valid));
    return valid;
}

function hasUnavailableBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        return false;
    }

    let day = parseDateKey(checkIn);
    const end = parseDateKey(checkOut);

    while (day <= end) {
        if (isUnavailable(day)) {
            return true;
        }
        day = addDays(day, 1);
    }

    return false;
}

function isSelectedRangeDate(key) {
    if (!checkInInput.value || !checkOutInput.value) {
        return false;
    }

    return key >= checkInInput.value && key <= checkOutInput.value;
}

function updateSummary() {
    validateSelection();
    const priceLabels = { comparison: "Accommodation before direct discount", directDiscount: "Returning guest discount (10%)", accommodation: "Accommodation", cleaning: "Cleaning", linen: "Bed linen" };
    document.querySelectorAll("[data-price-label]").forEach(element => { element.textContent = tr(priceLabels[element.dataset.priceLabel]); });
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = getSelectedGuests();
    const nights = nightsBetween(checkIn, checkOut);
    const unavailable = hasUnavailableBetween(checkIn, checkOut);
    const estimate = getStayEstimate(checkIn, checkOut, guests);

    document.querySelectorAll("[data-price-breakdown] strong").forEach(element => {
        const key = element.dataset.priceValue;
        element.textContent = estimate && guests && !unavailable ? `${key === "directDiscount" ? "−" : ""}${formatSek(estimate[key])}` : "—";
    });
    const lengthNote = document.querySelector("[data-length-discount]");
    lengthNote.textContent = estimate && guests && !unavailable && estimate.lengthDiscount
        ? tr("Includes {percent}% length-of-stay discount before the direct discount.", { percent: estimate.lengthDiscount * 100 }) : "";
    summaryGuests.textContent = guests ? guestLabel(guests) : tr("Not selected");
    summaryNights.textContent = nights ? nightLabel(nights) : tr("Not selected");
    summarySeason.textContent = estimate ? getSeasonSummary(estimate.labels) : tr("Not selected");
    requestSelection.textContent = estimate && guests && !unavailable
        ? tr("Your request: {checkIn} to {checkOut}, {nights}, {guests}, estimated total {total}.", {
            checkIn,
            checkOut,
            nights: nightLabel(nights),
            guests: guestLabel(guests),
            total: formatSek(estimate.total),
        })
        : tr("Choose dates and guests above to include them in your request.");

    if (!availabilityLoaded || availabilityLoadFailed) {
        summaryStatus.textContent = tr("Calendar unavailable");
        priceEstimate.textContent = tr("Calendar unavailable");
        priceDetails.textContent = tr("Dates cannot be selected until availability has loaded. Please try again later.");
        seasonNote.textContent = "";
        return;
    }

    if (!checkIn || !checkOut) {
        summaryStatus.textContent = tr("Choose dates");
        priceEstimate.textContent = tr("Choose dates");
        priceDetails.textContent = tr("Choose dates and guests to see the total, including cleaning and bed linen.");
        seasonNote.textContent = tr("Returning guests receive 10% off accommodation, including extra guests. Cleaning is 850 SEK per stay and bed linen is 150 SEK per guest.");
        return;
    }

    if (!nights) {
        summaryStatus.textContent = tr("Date issue");
        priceEstimate.textContent = tr("Check dates");
        priceDetails.textContent = tr("Check-out must be after check-in.");
        seasonNote.textContent = tr("Please choose a later check-out date.");
        return;
    }

    if (!guests) {
        summaryStatus.textContent = tr("Choose guests");
        priceEstimate.textContent = tr("Choose guests");
        priceDetails.textContent = tr("Select the number of guests to calculate the estimated price.");
        seasonNote.textContent = tr("The first guest is included. Each additional guest costs 215.10 SEK per night after the direct discount.");
        return;
    }

    if (unavailable) {
        summaryStatus.textContent = tr("Unavailable");
        priceEstimate.textContent = tr("Dates unavailable");
        priceDetails.textContent = tr("These dates overlap with unavailable nights. Please choose another stay.");
        seasonNote.textContent = tr("The Airbnb calendar marks at least one selected night as unavailable.");
        return;
    }

    if (!estimate) {
        summaryStatus.textContent = tr("Price on request");
        priceEstimate.textContent = tr("Price on request");
        priceDetails.textContent = tr("A verified price is not available for every selected night. Send a request for a quote.");
        seasonNote.textContent = getSeasonNote();
        return;
    }

    summaryStatus.textContent = tr("Looks available");
    priceEstimate.textContent = tr("{total} estimated", { total: formatSek(estimate.total) });
    priceDetails.textContent = tr("Accommodation averages {average} per night for {nights}, including {guests}. Cleaning and bed linen are included in the total below.", {
        average: formatSek(estimate.average),
        nights: nightLabel(nights),
        guests: guestLabel(guests),
    });
    seasonNote.textContent = getSeasonNote(estimate.labels);
}

function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const start = addDays(firstDay, -offset);

    const language = currentLanguage();
    const localizedMonths = monthNames[language] || monthNames.en;
    const localizedWeekdays = weekdayNames[language] || weekdayNames.en;

    monthLabel.textContent = `${localizedMonths[month]} ${year}`;
    calendarGrid.innerHTML = "";

    localizedWeekdays.forEach((name) => {
        const weekday = document.createElement("div");
        weekday.className = "calendar-weekday";
        weekday.textContent = name;
        calendarGrid.appendChild(weekday);
    });

    for (let i = 0; i < 42; i += 1) {
        const day = addDays(start, i);
        const key = toDateKey(day);
        const button = document.createElement("button");
        const unavailable = isUnavailable(day);
        const outsideMonth = day.getMonth() !== month;
        const past = day < today;
        const crossesBlockedDate = checkInInput.value && !checkOutInput.value && key > checkInInput.value
            && hasUnavailableBetween(checkInInput.value, key);

        button.type = "button";
        button.className = "calendar-day";
        const nightPrice = getNightPrice(day, getSelectedGuests());
        const guide = unavailable && !past ? "×" : nightPrice && !past ? formatShortSek(nightPrice.amount) : "—";
        button.innerHTML = `<span class="calendar-date">${day.getDate()}</span><span class="calendar-rate">${guide}</span>`;
        button.setAttribute("aria-label", `${key}: ${unavailable ? tr("Unavailable") : nightPrice ? formatSek(nightPrice.amount) : tr("Price on request")}`);
        button.dataset.date = key;

        if (outsideMonth) {
            button.classList.add("outside-month");
        }
        if (unavailable) {
            button.classList.add("unavailable");
        }
        if (past) {
            button.classList.add("past");
        }
        if (!unavailable && (checkInInput.value === key || checkOutInput.value === key)) {
            button.classList.add("selected");
        }
        if (!unavailable && isSelectedRangeDate(key) && !hasUnavailableBetween(checkInInput.value, checkOutInput.value)) {
            button.classList.add("range-selected");
        }

        if (crossesBlockedDate && !unavailable) button.classList.add("range-unavailable");
        button.disabled = past || unavailable || Boolean(crossesBlockedDate);
        button.addEventListener("click", () => selectDate(key));
        calendarGrid.appendChild(button);
    }
}

function selectDate(key) {
    if (key < toDateKey(new Date()) || isUnavailable(parseDateKey(key))) return;
    if (checkInInput.value && !checkOutInput.value && key > checkInInput.value && hasUnavailableBetween(checkInInput.value, key)) return;
    if (!checkInInput.value || checkOutInput.value || key < checkInInput.value) {
        checkInInput.value = key;
        checkOutInput.value = "";
    } else if (key > checkInInput.value) {
        checkOutInput.value = key;
    }

    updateSummary();
    renderCalendar();
}

function moveMonth(direction) {
    visibleMonth.setMonth(visibleMonth.getMonth() + direction);
    renderCalendar();
}

function focusNextRequestField() {
    const nextField = form.querySelector("input[name='guest_name'], input[name='guest_email'], textarea[name='message']");

    form.scrollIntoView({ behavior: "smooth", block: "start" });

    if (nextField) {
        window.setTimeout(() => nextField.focus({ preventScroll: true }), 450);
    }
}

function updateCalendarStatus() {
    if (availabilityLoadFailed) {
        calendarStatus.textContent = tr("Availability could not be loaded. Date selection is temporarily closed.");
        return;
    }

    if (availabilityLoaded && availabilityUpdatedAt) {
        const updated = new Date(availabilityUpdatedAt);
        calendarStatus.textContent = tr("Synced with Airbnb {date}.", {
            date: updated.toLocaleDateString(currentLanguage() === "en" ? "en-GB" : currentLanguage() === "sv" ? "sv-SE" : "de-DE"),
        });
        return;
    }

    if (availabilityLoaded) {
        calendarStatus.textContent = tr("Availability sync is prepared. Dates will update after the Airbnb calendar secret is added in GitHub.");
        return;
    }

    calendarStatus.textContent = tr("Loading availability...");
}

function updateHelpTextDefault() {
    if (!helpText.classList.contains("error")) {
        helpText.textContent = tr("Your email app will open with the request filled in.");
    }
}

async function loadAvailability() {
    try {
        const response = await fetch(`availability.json?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error("Availability data could not be loaded.");
        }

        const availability = await response.json();
        if (!availability.coverage_start || !availability.coverage_end || !availability.updated_at
            || Date.now() - new Date(availability.updated_at).getTime() > 48 * 60 * 60 * 1000
            || !Number.isFinite(Date.parse(availability.updated_at))) throw new Error("Calendar data is missing or stale");
        bookedDates = collectUnavailableDates(availability);
        coverageStart = availability.coverage_start;
        coverageEnd = availability.coverage_end;
        checkInInput.min = coverageStart;
        checkOutInput.min = coverageStart;
        checkInInput.max = toDateKey(addDays(parseDateKey(coverageEnd), -1));
        checkOutInput.max = checkInInput.max;
        availabilityUpdatedAt = availability.updated_at || "";
        availabilityLoaded = true;
        availabilityLoadFailed = false;
    } catch (error) {
        availabilityLoaded = true;
        availabilityLoadFailed = true;
    }

    updateCalendarStatus();
    renderCalendar();
    updateSummary();
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateSelection()) {
        helpText.textContent = tr("These dates are unavailable. Choose other dates.");
        helpText.classList.add("error");
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const checkIn = formatValue(formData, "check_in");
    const checkOut = formatValue(formData, "check_out");
    const guests = formatValue(formData, "guests");
    const name = formatValue(formData, "guest_name");
    const email = formatValue(formData, "guest_email");
    const phone = formatValue(formData, "guest_phone");
    const message = formatValue(formData, "message");
    const nights = nightsBetween(checkIn, checkOut);
    const estimate = getStayEstimate(checkIn, checkOut, guests);

    if (!nights) {
        helpText.textContent = tr("Please choose a check-out date after check-in.");
        helpText.classList.add("error");
        return;
    }

    if (hasUnavailableBetween(checkIn, checkOut)) {
        helpText.textContent = tr("These dates appear unavailable. Please choose another stay or ask about alternatives.");
        helpText.classList.add("error");
        return;
    }

    const subject = `Booking request Lake House Dalarna ${checkIn} to ${checkOut}`;
    const body = [
        "Hello Alexander,",
        "",
        "I would like to send a direct booking request for Lake House Dalarna.",
        "",
        `Check-in: ${checkIn}`,
        `Check-out: ${checkOut}`,
        `Nights: ${nights}`,
        `Guests: ${guests}`,
        `Estimated price: ${estimate ? `${formatSek(estimate.total)} total (${formatSek(estimate.average)} accommodation per night average)` : "Not calculated"}`,
        `Accommodation: ${estimate ? formatSek(estimate.accommodation) : "Price on request"}`,
        `Returning guest discount (10%): ${estimate ? formatSek(estimate.directDiscount) : "To be confirmed"}`,
        `Length-of-stay discount before direct discount: ${estimate ? estimate.lengthDiscount * 100 : 0}%`,
        `Cleaning: ${formatSek(pricing.cleaning)} per stay`,
        `Bed linen: ${formatSek(Number(guests) * pricing.linenPerGuest)}`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        "",
        "About us / our stay:",
        message,
        "",
        "Please let me know if these dates are available and what the total price would be.",
        "If you can host us, please send the payment details or a secure payment link before the booking is confirmed.",
    ].join("\n");

    helpText.textContent = tr("Opening your email app with the request filled in.");
    helpText.classList.remove("error");

    window.location.href = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

prevButton.addEventListener("click", () => moveMonth(-1));
nextButton.addEventListener("click", () => moveMonth(1));
sendRequestLink.addEventListener("click", (event) => {
    event.preventDefault();
    updateSummary();
    helpText.classList.remove("error");
    if (!validateSelection()) {
        helpText.textContent = tr("Choose an available date range and guests before continuing.");
        helpText.classList.add("error");
        return;
    }

    if (!checkInInput.value || !checkOutInput.value || !getSelectedGuests()) {
        helpText.textContent = tr("Choose dates and guests above, then add your contact details here.");
    } else {
        helpText.textContent = tr("Your selected dates, guests and estimated price are included in the request.");
    }

    focusNextRequestField();
});
checkInInput.addEventListener("change", () => {
    checkOutInput.value = "";
    updateSummary();
    renderCalendar();
});
checkOutInput.addEventListener("change", () => {
    updateSummary();
    renderCalendar();
});
guestsInput.addEventListener("change", () => {
    syncGuestControls(guestsInput.value);
    updateSummary();
    renderCalendar();
});
priceGuestsInput.addEventListener("change", () => {
    syncGuestControls(priceGuestsInput.value);
    updateSummary();
    renderCalendar();
});

window.addEventListener("site-language-change", () => {
    updateCalendarStatus();
    updateHelpTextDefault();
    renderCalendar();
    updateSummary();
});

updateHelpTextDefault();
updateCalendarStatus();
loadAvailability();

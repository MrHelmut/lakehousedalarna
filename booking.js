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
const pricing = {
    currency: "SEK",
    regularWeeknight: 2400,
    regularWeekend: 3000,
    midSeasonWeeknight: 2600,
    midSeasonWeekend: 3000,
    highSeasonBase: 3200,
    extraGuestNightly: 200,
};
const highSeasonLabels = {
    summer: "Summer high season",
    christmas: "Christmas & New Year",
    winterHoliday: "Swedish winter holidays",
    skiWorlds: "FIS Nordic World Ski Championships",
};
const midSeasonLabels = {
    spring: "Spring shoulder season",
    autumn: "Autumn shoulder season",
    earlyDecember: "Early December",
};

let bookedDates = new Set();
let visibleMonth = new Date();
let syncingGuests = false;
let availabilityUpdatedAt = "";
let availabilityLoaded = false;
let availabilityLoadFailed = false;

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
    return new Intl.NumberFormat("en-SE", {
        style: "currency",
        currency: pricing.currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatShortSek(amount) {
    if (amount >= 1000) {
        const rounded = amount / 1000;
        return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
    }
    return String(amount);
}

function isBetweenMonthDay(date, startMonth, startDay, endMonth, endDay) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const year = target.getFullYear();
    let startYear = year;
    let endYear = year;

    if (endMonth < startMonth) {
        if (target.getMonth() + 1 <= endMonth) {
            startYear = year - 1;
        } else {
            endYear = year + 1;
        }
    }

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    return target >= start && target <= end;
}

function getHighSeasonLabel(date) {
    const day = new Date(date);

    if (isBetweenMonthDay(day, 6, 15, 8, 20)) {
        return highSeasonLabels.summer;
    }
    if (isBetweenMonthDay(day, 12, 21, 1, 3)) {
        return highSeasonLabels.christmas;
    }
    if (isBetweenMonthDay(day, 2, 1, 2, 7)) {
        return highSeasonLabels.winterHoliday;
    }

    const skiWorldsStart = new Date(2027, 1, 24);
    const skiWorldsEnd = new Date(2027, 2, 7, 23, 59, 59);
    if (day >= skiWorldsStart && day <= skiWorldsEnd) {
        return highSeasonLabels.skiWorlds;
    }

    return "";
}

function getMidSeasonLabel(date) {
    const day = new Date(date);

    if (isBetweenMonthDay(day, 4, 1, 6, 14)) {
        return midSeasonLabels.spring;
    }
    if (isBetweenMonthDay(day, 8, 21, 10, 31)) {
        return midSeasonLabels.autumn;
    }
    if (isBetweenMonthDay(day, 12, 1, 12, 20)) {
        return midSeasonLabels.earlyDecember;
    }

    return "";
}

function isWeekendNight(date) {
    const day = date.getDay();
    return day === 5 || day === 6;
}

function getNightPrice(date, guests = "") {
    const highSeasonLabel = getHighSeasonLabel(new Date(date));
    const midSeasonLabel = getMidSeasonLabel(new Date(date));
    const guestCount = Number(guests) || 0;

    if (highSeasonLabel) {
        return {
            amount: pricing.highSeasonBase + (guestCount * pricing.extraGuestNightly),
            label: highSeasonLabel,
            highSeason: true,
        };
    }

    if (midSeasonLabel) {
        const baseAmount = isWeekendNight(date) ? pricing.midSeasonWeekend : pricing.midSeasonWeeknight;
        return {
            amount: baseAmount + (guestCount * pricing.extraGuestNightly),
            label: midSeasonLabel,
            highSeason: false,
        };
    }

    if (isWeekendNight(date)) {
        return {
            amount: pricing.regularWeekend + (guestCount * pricing.extraGuestNightly),
            label: "Weekend",
            highSeason: false,
        };
    }

    return {
        amount: pricing.regularWeeknight + (guestCount * pricing.extraGuestNightly),
        label: "Regular season",
        highSeason: false,
    };
}

function getStayEstimate(checkIn, checkOut, guests) {
    const nights = nightsBetween(checkIn, checkOut);
    if (!nights) {
        return null;
    }

    let day = parseDateKey(checkIn);
    const end = parseDateKey(checkOut);
    const nightPrices = [];
    const labels = new Set();

    while (day < end) {
        const price = getNightPrice(day, guests);
        nightPrices.push(price.amount);
        labels.add(price.label);
        day = addDays(day, 1);
    }

    const total = nightPrices.reduce((sum, amount) => sum + amount, 0);
    const average = Math.round(total / nights);

    return {
        total,
        average,
        labels: Array.from(labels),
        nights,
    };
}

function getSeasonSummary(labels) {
    const highSeasonHits = labels.filter((label) => Object.values(highSeasonLabels).includes(label));
    const midSeasonHits = labels.filter((label) => Object.values(midSeasonLabels).includes(label));

    if (highSeasonHits.length) {
        return highSeasonHits.map((label) => tr(label)).join(" + ");
    }
    if (midSeasonHits.length) {
        return midSeasonHits.map((label) => tr(label)).join(" + ");
    }

    if (labels.includes("Weekend")) {
        return tr("Regular dates, incl. weekend");
    }

    return tr("Regular dates");
}

function getSeasonNote(labels) {
    const highSeasonHits = labels.filter((label) => Object.values(highSeasonLabels).includes(label));
    const midSeasonHits = labels.filter((label) => Object.values(midSeasonLabels).includes(label));

    if (highSeasonHits.length) {
        return tr("High-season pricing is included in this estimate. Final price is confirmed before booking.");
    }
    if (midSeasonHits.length) {
        return tr("Shoulder-season pricing is included in this estimate. Final price is confirmed before booking.");
    }

    return tr("Final price is confirmed before booking.");
}

function isUnavailable(date) {
    return bookedDates.has(toDateKey(date));
}

function hasUnavailableBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        return false;
    }

    let day = parseDateKey(checkIn);
    const end = parseDateKey(checkOut);

    while (day < end) {
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
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = getSelectedGuests();
    const nights = nightsBetween(checkIn, checkOut);
    const unavailable = hasUnavailableBetween(checkIn, checkOut);
    const estimate = getStayEstimate(checkIn, checkOut, guests);

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

    if (!checkIn || !checkOut) {
        summaryStatus.textContent = tr("Choose dates");
        priceEstimate.textContent = tr("Choose dates");
        priceDetails.textContent = tr("Choose dates and guests to see an estimated total. Guest price is 200 SEK per guest and night.");
        seasonNote.textContent = tr("Low season starts from 2,400 SEK/night, shoulder season from 2,600 SEK/night and high season from 3,200 SEK/night.");
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
        seasonNote.textContent = tr("The estimate uses the nightly date price plus 200 SEK per guest and night.");
        return;
    }

    if (unavailable) {
        summaryStatus.textContent = tr("Unavailable");
        priceEstimate.textContent = tr("Dates unavailable");
        priceDetails.textContent = tr("These dates overlap with unavailable nights. Please choose another stay.");
        seasonNote.textContent = tr("The Airbnb calendar marks at least one selected night as unavailable.");
        return;
    }

    summaryStatus.textContent = tr("Looks available");
    priceEstimate.textContent = tr("{total} estimated", { total: formatSek(estimate.total) });
    priceDetails.textContent = tr("{average} per night on average for {nights}, including {guests}. Final price is confirmed before booking.", {
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

        button.type = "button";
        button.className = "calendar-day";
        button.innerHTML = `<span class="calendar-date">${day.getDate()}</span><span class="calendar-rate">${formatShortSek(getNightPrice(day, getSelectedGuests()).amount)} SEK</span>`;
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
        if (checkInInput.value === key || checkOutInput.value === key) {
            button.classList.add("selected");
        }
        if (isSelectedRangeDate(key)) {
            button.classList.add("range-selected");
        }

        button.disabled = past || unavailable;
        button.addEventListener("click", () => selectDate(key));
        calendarGrid.appendChild(button);
    }
}

function selectDate(key) {
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
        calendarStatus.textContent = tr("Availability could not be loaded. Please confirm dates in your request.");
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
        bookedDates = new Set(availability.booked_dates || []);
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
        `Estimated price: ${estimate ? `${formatSek(estimate.total)} total (${formatSek(estimate.average)} per night average)` : "Not calculated"}`,
        `Season: ${estimate ? getSeasonSummary(estimate.labels) : "Not calculated"}`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        "",
        "About us / our stay:",
        message,
        "",
        "Please let me know if these dates are available and what the total price would be.",
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

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
const adultsInput = document.querySelector("[data-adults]");
const childrenInput = document.querySelector("[data-children]");
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
const requestedMonth = new URLSearchParams(window.location?.search || '').get('month');
if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(requestedMonth || '')) {
    const [year, month] = requestedMonth.split('-').map(Number);
    visibleMonth = new Date(year, month - 1, 1);
}
let requestSending = false;
let requestComplete = false;
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
    adultsInput.value = value;
    childrenInput.value = "0";
    childrenInput.setCustomValidity("");
    syncingGuests = false;
}

function syncPartyComposition() {
    const adults = Number(adultsInput.value), children = Number(childrenInput.value);
    const valid = Number.isInteger(adults) && adults >= 1 && Number.isInteger(children) && children >= 0 && adults + children <= 6;
    childrenInput.setCustomValidity(valid ? "" : tr("Please choose at least one adult and no more than six guests in total."));
    guestsInput.value = valid ? String(adults + children) : "";
    priceGuestsInput.value = guestsInput.value;
    updateSummary();
    renderCalendar();
    return valid;
}

let requestStarted = false;
function startBookingRequest() {
    if (requestStarted) return;
    requestStarted = true;
    window.dispatchEvent(new Event("lakehouse-booking-start"));
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

function getNightPrice(date, guests = "", stayNights = 0) {
    const key = toDateKey(date);
    if (key < pricing.firstDate || key > pricing.lastDate) return null;
    const base = pricing.nightlyPrices[key.slice(0, 7)]?.[date.getDate() - 1];
    if (!Number.isFinite(base)) return null;
    const extraGuests = Math.max(0, (Number(guests) || 1) - pricing.includedGuests);
    const airbnbAmount = base + extraGuests * pricing.extraGuestNightly;
    const discountRate = (pricing.directDiscountExclusions || []).some(range => key >= range.start && key < range.end) ? 0 : stayNights >= 28 ? pricing.monthlyDiscount : pricing.directDiscount;
    return { airbnbAmount, discountRate, discount: base * discountRate, amount: Math.round((airbnbAmount - base * discountRate) * 100) / 100 };
}

function getStayEstimate(checkIn, checkOut, guests) {
    const nights = nightsBetween(checkIn, checkOut);
    if (!nights) return null;
    let airbnbSubtotal = 0;
    let discountSubtotal = 0;
    for (let day = parseDateKey(checkIn); day < parseDateKey(checkOut); day = addDays(day, 1)) {
        const price = getNightPrice(day, guests, nights);
        if (!price) return null;
        airbnbSubtotal += price.airbnbAmount;
        discountSubtotal += price.discount;
    }
    const lengthDiscount = nights >= 28 ? pricing.monthlyDiscount : 0;
    // Apply one direct discount to the base price; guest fees are unchanged.
    const comparisonCents = Math.round(airbnbSubtotal * 100);
    const discountCents = Math.round(discountSubtotal * 100);
    const accommodation = (comparisonCents - discountCents) / 100;
    const cleaning = pricing.cleaning;
    const linen = (Number(guests) || 0) * pricing.linenPerGuest;
    const total = Math.round((accommodation + cleaning + linen) * 100) / 100;
    return { total, accommodation, cleaning, linen, comparison: comparisonCents / 100,
        directDiscount: discountCents / 100, lengthDiscount, nights,
        average: accommodation / nights, labels: [] };
}

function getSeasonSummary() {
    return tr("Direct booking rate");
}

function getSeasonNote() {
    return tr("Final price is confirmed before booking.");
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
    form.querySelector("button[type='submit']").disabled = !valid || requestSending || requestComplete;
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
    const priceLabels = { comparison: "Accommodation before direct discount", directDiscount: "Direct booking discount (eligible nights)", accommodation: "Accommodation", cleaning: "Cleaning", linen: "Bed linen" };
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
        ? tr("For stays of 28 nights or more, 30% off the nightly base price replaces the 10% direct discount. Christmas and the World Championships in Falun are excluded.", { percent: estimate.lengthDiscount * 100 }) : "";
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
        seasonNote.textContent = tr("Book directly for 10% off the nightly base price, or 30% for stays of 28 nights or more. Discounts cannot be combined and exclude Christmas and the World Championships in Falun. Cleaning is 850 SEK per stay and bed linen is 150 SEK per guest.");
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
        seasonNote.textContent = tr("The first guest is included. Each additional guest costs 239 SEK per night.");
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

function isoWeekNumber(date) {
    const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    return Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
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

    const weekLabel = {sv: "Vecka", en: "Week", de: "Kalenderwoche"}[language] || "Week";
    const weekHeader = document.createElement("div");
    weekHeader.className = "calendar-weekday calendar-week-heading";
    weekHeader.textContent = {sv: "V.", en: "Wk", de: "KW"}[language] || "Wk";
    weekHeader.setAttribute("aria-label", weekLabel);
    calendarGrid.appendChild(weekHeader);

    localizedWeekdays.forEach((name) => {
        const weekday = document.createElement("div");
        weekday.className = "calendar-weekday";
        weekday.textContent = name;
        calendarGrid.appendChild(weekday);
    });

    for (let i = 0; i < 42; i += 1) {
        const day = addDays(start, i);
        if (i % 7 === 0) {
            const week = document.createElement("div");
            week.className = "calendar-week-number";
            week.textContent = String(isoWeekNumber(day));
            week.setAttribute("aria-label", `${weekLabel} ${week.textContent}`);
            calendarGrid.appendChild(week);
        }
        const key = toDateKey(day);
        const button = document.createElement("button");
        const unavailable = isUnavailable(day);
        const outsideMonth = day.getMonth() !== month;
        const past = day < today;
        const crossesBlockedDate = checkInInput.value && !checkOutInput.value && key > checkInInput.value
            && hasUnavailableBetween(checkInInput.value, key);

        button.type = "button";
        button.className = "calendar-day";
        const nightPrice = getNightPrice(day, getSelectedGuests(), nightsBetween(checkInInput.value, checkOutInput.value) || 0);
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

    startBookingRequest();
    updateSummary();
    renderCalendar();
}

function moveMonth(direction) {
    visibleMonth.setMonth(visibleMonth.getMonth() + direction);
    renderCalendar();
}

function focusNextRequestField() {
    const nextField = form.querySelector("input[name='first_name'], input[name='guest_email'], textarea[name='message']");

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

function usesDirectSubmission() {
    return Boolean(window.lakeBookingForm?.accessKey);
}

function updateHelpTextDefault() {
    if (!helpText.classList.contains("error")) {
        helpText.textContent = usesDirectSubmission() ? tr("Send your request directly to us. We will review your plans and reply personally.") : tr("Your email app will open with your request ready to send. Please send the email to complete your enquiry.");
    }
}

async function loadAvailability() {
    try {
        const response = await fetch(`/availability.json?v=${Date.now()}`);
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

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (requestSending || requestComplete || form.querySelector("[name=botcheck]")?.checked) return;

    if (!validateSelection()) {
        helpText.textContent = tr("These dates are unavailable. Choose other dates.");
        helpText.classList.add("error");
        form.reportValidity();
        return;
    }

    if (!syncPartyComposition() || !form.reportValidity()) return;
    const formData = new FormData(form);
    const checkIn = formatValue(formData, "check_in");
    const checkOut = formatValue(formData, "check_out");
    const guests = formatValue(formData, "guests");
    const name = `${formatValue(formData, "first_name")} ${formatValue(formData, "last_name")}`;
    const adults = formatValue(formData, "adults");
    const children = String(formData.get("children") || "0");
    const country = formatValue(formData, "country");
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
        `Guests: ${guests} (${adults} adults, ${children} children)`,
        `Estimated price: ${estimate ? `${formatSek(estimate.total)} total (${formatSek(estimate.average)} accommodation per night average)` : "Not calculated"}`,
        `Accommodation: ${estimate ? formatSek(estimate.accommodation) : "Price on request"}`,
        `Direct booking discount (eligible nights): ${estimate ? formatSek(estimate.directDiscount) : "To be confirmed"}`,
        `Cleaning: ${formatSek(pricing.cleaning)} per stay`,
        `Bed linen: ${formatSek(Number(guests) * pricing.linenPerGuest)}`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone / WhatsApp: ${phone}`,
        `Country: ${country}`,
        "",
        "About us / our stay:",
        message,
        "",
        "Please let me know if these dates are available and what the total price would be.",
        "I understand that my stay is confirmed only after your personal booking confirmation.",
    ].join("\n");

    const emailUrl = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const emailFallback = document.querySelector("[data-email-fallback]");
    emailFallback.href = emailUrl;
    if (usesDirectSubmission()) {
        requestSending = true;
        validateSelection();
        emailFallback.hidden = true;
        helpText.classList.remove("error");
        helpText.textContent = tr("Sending your request…");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {"Content-Type":"application/json", "Accept":"application/json"},
                signal: controller.signal,
                body: JSON.stringify({
                    access_key: window.lakeBookingForm.accessKey,
                    subject, from_name: "Lake House Dalarna booking request",
                    name, email, phone, country, adults, children,
                    arrival: checkIn, departure: checkOut, guests,
                    message: body, botcheck: false
                })
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) throw new Error("Request not accepted");
            requestComplete = true;
            helpText.textContent = tr("Thank you — we have received your request. We will reply personally. Your stay is not confirmed yet.");
            window.dispatchEvent(new Event("lakehouse-booking-received"));
        } catch {
            helpText.textContent = tr("We could not confirm receipt of your request. Your details are still here. Please try again or send it by email.");
            helpText.classList.add("error");
            emailFallback.hidden = false;
        } finally {
            clearTimeout(timeout);
            requestSending = false;
            validateSelection();
        }
        return;
    }

    helpText.textContent = tr("Your request is ready in your email app. Please send it there; your stay is not yet confirmed.");
    helpText.classList.remove("error");

    window.dispatchEvent(new Event("lakehouse-booking-submit"));
    window.dispatchEvent(new Event("lakehouse-contact-intent"));
    window.location.href = emailUrl;
});

form.addEventListener("input", () => { requestComplete = false; startBookingRequest(); validateSelection(); });
form.addEventListener("change", () => { requestComplete = false; startBookingRequest(); validateSelection(); });
adultsInput.addEventListener("change", syncPartyComposition);
childrenInput.addEventListener("change", syncPartyComposition);

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

    startBookingRequest();
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

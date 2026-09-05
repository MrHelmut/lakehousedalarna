const form = document.querySelector("[data-booking-request-form]");
const helpText = document.querySelector("[data-request-help]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const calendarStatus = document.querySelector("[data-calendar-status]");
const monthLabel = document.querySelector("[data-month-label]");
const prevButton = document.querySelector("[data-prev-month]");
const nextButton = document.querySelector("[data-next-month]");
const checkInInput = document.querySelector("[data-check-in]");
const checkOutInput = document.querySelector("[data-check-out]");
const guestsInput = document.querySelector("[data-guests]");
const priceEstimate = document.querySelector("[data-price-estimate]");
const priceDetails = document.querySelector("[data-price-details]");
const summaryGuests = document.querySelector("[data-summary-guests]");
const summaryNights = document.querySelector("[data-summary-nights]");
const summaryStatus = document.querySelector("[data-summary-status]");

const bookingEmail = "alexander_hjelm@hotmail.com";
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let bookedDates = new Set();
let visibleMonth = new Date();

visibleMonth.setDate(1);
visibleMonth.setHours(0, 0, 0, 0);

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
    return value || fallback;
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

function updateSummary() {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = guestsInput.value;
    const nights = nightsBetween(checkIn, checkOut);
    const unavailable = hasUnavailableBetween(checkIn, checkOut);

    summaryGuests.textContent = guests ? `${guests} guest${guests === "1" ? "" : "s"}` : "Not selected";
    summaryNights.textContent = nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Not selected";

    if (!checkIn || !checkOut) {
        summaryStatus.textContent = "Choose dates";
        priceEstimate.textContent = "Price on request";
        priceDetails.textContent = "Choose dates to prepare a request. Final price is confirmed before booking.";
        return;
    }

    if (!nights) {
        summaryStatus.textContent = "Date issue";
        priceEstimate.textContent = "Check dates";
        priceDetails.textContent = "Check-out must be after check-in.";
        return;
    }

    if (unavailable) {
        summaryStatus.textContent = "Unavailable";
        priceEstimate.textContent = "Dates unavailable";
        priceDetails.textContent = "These dates overlap with unavailable nights. Please choose another stay.";
        return;
    }

    summaryStatus.textContent = "Looks available";
    priceEstimate.textContent = "Price on request";
    priceDetails.textContent = "Your selected dates will be included in the request. Add your preferred nightly rates later for an automatic estimate.";
}

function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const start = addDays(firstDay, -offset);

    monthLabel.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = "";

    weekdayNames.forEach((name) => {
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
        button.textContent = String(day.getDate());
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

async function loadAvailability() {
    try {
        const response = await fetch(`availability.json?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error("Availability data could not be loaded.");
        }

        const availability = await response.json();
        bookedDates = new Set(availability.booked_dates || []);

        if (availability.updated_at) {
            const updated = new Date(availability.updated_at);
            calendarStatus.textContent = `Synced with Airbnb ${updated.toLocaleDateString("en-GB")}.`;
        } else {
            calendarStatus.textContent = "Availability sync is prepared. Dates will update after the Airbnb calendar secret is added in GitHub.";
        }
    } catch (error) {
        calendarStatus.textContent = "Availability could not be loaded. Please confirm dates in your request.";
    }

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

    if (!nights) {
        helpText.textContent = "Please choose a check-out date after check-in.";
        helpText.classList.add("error");
        return;
    }

    if (hasUnavailableBetween(checkIn, checkOut)) {
        helpText.textContent = "These dates appear unavailable. Please choose another stay or ask about alternatives.";
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

    helpText.textContent = "Opening your email app with the request filled in.";
    helpText.classList.remove("error");

    window.location.href = `mailto:${bookingEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

prevButton.addEventListener("click", () => moveMonth(-1));
nextButton.addEventListener("click", () => moveMonth(1));
checkInInput.addEventListener("change", () => {
    checkOutInput.value = "";
    updateSummary();
    renderCalendar();
});
checkOutInput.addEventListener("change", () => {
    updateSummary();
    renderCalendar();
});
guestsInput.addEventListener("change", updateSummary);

loadAvailability();

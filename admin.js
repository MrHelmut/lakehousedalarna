const adminForm = document.querySelector("[data-admin-form]");
const checkInInput = document.querySelector("[data-admin-check-in]");
const checkOutInput = document.querySelector("[data-admin-check-out]");
const guestsInput = document.querySelector("[data-admin-guests]");
const cleaningInput = document.querySelector("[data-admin-cleaning]");
const guestNameInput = document.querySelector("[data-admin-guest-name]");
const guestEmailInput = document.querySelector("[data-admin-guest-email]");
const noteInput = document.querySelector("[data-admin-note]");
const totalOutput = document.querySelector("[data-admin-total]");
const nightsOutput = document.querySelector("[data-admin-nights]");
const rentOutput = document.querySelector("[data-admin-rent]");
const cleaningOutput = document.querySelector("[data-admin-cleaning-line]");
const paymentOutput = document.querySelector("[data-admin-payment]");
const stripeOutput = document.querySelector("[data-stripe-output]");
const emailOutput = document.querySelector("[data-email-output]");
const helpOutput = document.querySelector("[data-admin-help]");
const copyStripeButton = document.querySelector("[data-copy-stripe]");
const copyEmailButton = document.querySelector("[data-copy-email]");

const pricing = {
    currency: "SEK",
    regularWeeknight: 2400,
    regularWeekend: 3000,
    midSeasonWeeknight: 2600,
    midSeasonWeekend: 3000,
    highSeasonBase: 3200,
    extraGuestNightly: 200,
};

function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
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
    return new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: pricing.currency,
        maximumFractionDigits: 0,
    }).format(amount);
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
    if (isBetweenMonthDay(day, 6, 15, 8, 20)) return "Summer high season";
    if (isBetweenMonthDay(day, 12, 21, 1, 3)) return "Christmas & New Year";
    if (isBetweenMonthDay(day, 2, 1, 2, 7)) return "Swedish winter holidays";

    const skiWorldsStart = new Date(2027, 1, 24);
    const skiWorldsEnd = new Date(2027, 2, 7, 23, 59, 59);
    if (day >= skiWorldsStart && day <= skiWorldsEnd) return "FIS Nordic World Ski Championships";
    return "";
}

function getMidSeasonLabel(date) {
    const day = new Date(date);
    if (isBetweenMonthDay(day, 4, 1, 6, 14)) return "Spring shoulder season";
    if (isBetweenMonthDay(day, 8, 21, 10, 31)) return "Autumn shoulder season";
    if (isBetweenMonthDay(day, 12, 1, 12, 20)) return "Early December";
    return "";
}

function isWeekendNight(date) {
    const day = date.getDay();
    return day === 5 || day === 6;
}

function getNightPrice(date, guests) {
    const highSeasonLabel = getHighSeasonLabel(date);
    const midSeasonLabel = getMidSeasonLabel(date);
    const guestCount = Number(guests) || 0;

    if (highSeasonLabel) {
        return {
            amount: pricing.highSeasonBase + (guestCount * pricing.extraGuestNightly),
            label: highSeasonLabel,
        };
    }

    if (midSeasonLabel) {
        const baseAmount = isWeekendNight(date) ? pricing.midSeasonWeekend : pricing.midSeasonWeeknight;
        return {
            amount: baseAmount + (guestCount * pricing.extraGuestNightly),
            label: midSeasonLabel,
        };
    }

    if (isWeekendNight(date)) {
        return {
            amount: pricing.regularWeekend + (guestCount * pricing.extraGuestNightly),
            label: "Weekend",
        };
    }

    return {
        amount: pricing.regularWeeknight + (guestCount * pricing.extraGuestNightly),
        label: "Regular season",
    };
}

function getStayEstimate(checkIn, checkOut, guests) {
    const nights = nightsBetween(checkIn, checkOut);
    if (!nights || !guests) {
        return null;
    }

    let day = parseDateKey(checkIn);
    const end = parseDateKey(checkOut);
    const labels = new Set();
    let rent = 0;

    while (day < end) {
        const price = getNightPrice(day, guests);
        rent += price.amount;
        labels.add(price.label);
        day = addDays(day, 1);
    }

    return {
        nights,
        rent,
        average: Math.round(rent / nights),
        labels: Array.from(labels),
    };
}

function getGuestLabel(guests) {
    const count = Number(guests);
    if (!count) return "-";
    return count === 1 ? "1 gäst" : `${count} gäster`;
}

function buildOutputs() {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = guestsInput.value;
    const cleaning = Number(cleaningInput.value) || 0;
    const guestName = guestNameInput.value.trim() || "gästen";
    const guestEmail = guestEmailInput.value.trim() || "";
    const note = noteInput.value.trim();
    const estimate = getStayEstimate(checkIn, checkOut, guests);

    if (!estimate) {
        totalOutput.textContent = "Välj datum";
        nightsOutput.textContent = "-";
        rentOutput.textContent = "-";
        cleaningOutput.textContent = formatSek(cleaning);
        paymentOutput.textContent = "-";
        stripeOutput.textContent = "Fyll i datum och antal gäster.";
        emailOutput.textContent = "Fyll i datum och antal gäster.";
        helpOutput.textContent = "Fyll i bokningen för att skapa underlaget.";
        return;
    }

    const total = estimate.rent + cleaning;
    const period = `${checkIn} till ${checkOut}`;
    const season = estimate.labels.join(" + ");
    const guestLine = getGuestLabel(guests);

    totalOutput.textContent = formatSek(total);
    nightsOutput.textContent = `${estimate.nights} ${estimate.nights === 1 ? "natt" : "nätter"}`;
    rentOutput.textContent = formatSek(estimate.rent);
    cleaningOutput.textContent = formatSek(cleaning);
    paymentOutput.textContent = formatSek(total);

    stripeOutput.textContent = [
        "Stripe Payment Link",
        "",
        `Product name: Lake House Dalarna, ${period}`,
        `Description: ${guestLine}, ${estimate.nights} ${estimate.nights === 1 ? "natt" : "nätter"}. Cleaning included.`,
        `Amount: ${total} SEK`,
        `Rental: ${estimate.rent} SEK`,
        `Cleaning: ${cleaning} SEK`,
        `Guest email: ${guestEmail || "Add manually"}`,
        "",
        "After payment: mark the dates as confirmed and reply to the guest.",
    ].join("\n");

    emailOutput.textContent = [
        `Hej ${guestName},`,
        "",
        `Tack för er förfrågan. Vi kan preliminärt erbjuda ${period} för ${guestLine}.`,
        "",
        `Pris för boendet: ${formatSek(estimate.rent)}`,
        `Slutstädning: ${formatSek(cleaning)}`,
        `Totalt att betala: ${formatSek(total)}`,
        "",
        "Om allt ser bra ut skickar vi en säker betalningslänk via Stripe. Bokningen är bekräftad först när betalningen är genomförd och vi har skickat bekräftelsen.",
        note ? `\n${note}` : "",
        "",
        "Vänliga hälsningar,",
        "Alexander",
        "Lake House Dalarna",
    ].filter(Boolean).join("\n");

    helpOutput.textContent = `Underlag klart. Säsong: ${season}. Snittpris: ${formatSek(estimate.average)} per natt.`;
}

async function copyText(text, label) {
    try {
        await navigator.clipboard.writeText(text);
        helpOutput.textContent = `${label} kopierat.`;
    } catch (error) {
        helpOutput.textContent = "Kopiering fungerade inte i webbläsaren. Markera texten och kopiera manuellt.";
    }
}

adminForm.addEventListener("input", buildOutputs);
adminForm.addEventListener("change", buildOutputs);
copyStripeButton.addEventListener("click", () => copyText(stripeOutput.textContent, "Stripe-underlag"));
copyEmailButton.addEventListener("click", () => copyText(emailOutput.textContent, "Svar till gäst"));

buildOutputs();

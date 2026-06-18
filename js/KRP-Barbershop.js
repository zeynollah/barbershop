function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatBookingDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T12:00:00`);
  return date.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildConfirmationMessage(booking) {
  const formattedDate = formatBookingDate(booking.date);

  return `Hej ${booking.name}!

Tack för din bokning hos KRP Barbershop.

Här är din bokning:
• Tjänst: ${booking.service}
• Datum: ${formattedDate}
• Tid: ${booking.time}

Vi ses!
KRP Barbershop
Kronoparken, Karlstad

Öppettider:
Mån–Fre: 10:00–19:00
Lör: 11:00–17:00`;
}

async function sendBookingConfirmationEmail(booking) {
  if (!isEmailConfigured()) {
    console.warn(
      "E-post är inte konfigurerad. Uppdatera js/email-config.js med din e-postadress."
    );
    return false;
  }

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(FORM_CONFIG.barbershopEmail)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: booking.name,
        email: booking.email,
        service: booking.service,
        date: formatBookingDate(booking.date),
        time: booking.time,
        _subject: `Bokningsbekräftelse – ${booking.service}`,
        _autoresponse: buildConfirmationMessage(booking),
        _template: "table",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("FormSubmit svarade med ett fel.");
  }

  const result = await response.json();
  if (result.success !== "true" && result.success !== true) {
    throw new Error("Kunde inte skicka bekräftelse.");
  }

  return true;
}

function setBookingSubmitState(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]');
  const errorAlert = document.getElementById("bookingError");

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Skickar bekräftelse..." : "Boka nu";

  if (errorAlert && !isSubmitting) {
    errorAlert.classList.add("d-none");
  }
}

function showBookingError(message) {
  const errorAlert = document.getElementById("bookingError");
  if (!errorAlert) {
    return;
  }

  errorAlert.textContent = message;
  errorAlert.classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    const dateInput = bookingForm.querySelector('input[name="date"]');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split("T")[0];
    }

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setBookingSubmitState(bookingForm, true);

      const formData = new FormData(bookingForm);
      const booking = Object.fromEntries(formData.entries());

      try {
        const emailSent = await sendBookingConfirmationEmail(booking);
        sessionStorage.setItem(
          "krpBooking",
          JSON.stringify({ ...booking, emailSent })
        );
        window.location.href = "bokningsBekräftelse.html";
      } catch (error) {
        console.error("Kunde inte skicka bokningsbekräftelse:", error);
        setBookingSubmitState(bookingForm, false);
        showBookingError(
          "Kunde inte skicka bekräftelse via e-post. Kontrollera att du fyllt i din e-post i js/email-config.js och aktiverat FormSubmit via länken i mailet du får första gången."
        );
      }
    });
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const successAlert = document.getElementById("contactSuccess");
      if (successAlert) {
        successAlert.classList.remove("d-none");
        contactForm.reset();
        successAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  const confirmDetails = document.getElementById("bookingConfirmDetails");
  if (!confirmDetails) {
    return;
  }

  const rawBooking = sessionStorage.getItem("krpBooking");
  if (!rawBooking) {
    confirmDetails.innerHTML =
      '<p class="text-muted mb-0">Ingen bokning hittades. <a href="index.html">Gå tillbaka och boka en tid</a>.</p>';
    return;
  }

  const booking = JSON.parse(rawBooking);
  const emailNote = booking.emailSent
    ? `<p class="text-success small mt-3 mb-0"><i class="fas fa-envelope me-1"></i>En bekräftelse har skickats till <strong>${escapeHtml(booking.email)}</strong>.</p>`
    : `<p class="text-muted small mt-3 mb-0">Tips: Lägg in din e-post i <code>js/email-config.js</code> så skickas bekräftelse automatiskt till kunden.</p>`;

  confirmDetails.innerHTML = `
    <ul class="list-group list-group-flush shadow-sm">
      <li class="list-group-item"><strong>Namn:</strong> ${escapeHtml(booking.name)}</li>
      <li class="list-group-item"><strong>Tjänst:</strong> ${escapeHtml(booking.service)}</li>
      <li class="list-group-item"><strong>Datum:</strong> ${escapeHtml(formatBookingDate(booking.date))}</li>
      <li class="list-group-item"><strong>Tid:</strong> ${escapeHtml(booking.time)}</li>
      <li class="list-group-item"><strong>E-post:</strong> ${escapeHtml(booking.email)}</li>
    </ul>
    ${emailNote}
  `;
  sessionStorage.removeItem("krpBooking");
});

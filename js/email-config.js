// Byt ut e-postadressen nedan till din riktiga e-post (t.ex. din Gmail).
// Första gången du bokar via sidan får du ett aktiveringsmail från FormSubmit — klicka på länken.
// Därefter skickas bekräftelse automatiskt till kunden varje gång någon bokar.

const FORM_CONFIG = {
  barbershopEmail: "ecdf62b5124b4ff6036b473f66eed093",
};

function isEmailConfigured() {
  return FORM_CONFIG.barbershopEmail !== "din@email.com";
}

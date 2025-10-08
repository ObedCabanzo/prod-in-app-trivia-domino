(function (global) {
  if (!global.App) global.App = {};
  const container = document.getElementById("metadata");
  const metadata = {};

  function fechasToBin(fechaStr, fechaInicio, fechaFin) {
    // Helper: convierte fecha a YYYY-MM-DD
    const toKey = (date) => date.toISOString().split("T")[0]; // siempre da formato YYYY-MM-DD

    console.log("fechaStr:", fechaStr);
    console.log("fechaInicio:", fechaInicio);
    console.log("fechaFin:", fechaFin);
    // 1. Parsear las fechas del string y normalizar
    const fechasArray = fechaStr
      .split("_")
      .filter(Boolean)
      .map((f) => new Date(f));

    const fechasSet = new Set(fechasArray.length > 0 ? fechasArray.map(toKey) : []);

    // 2. Recorrer desde inicio hasta fin
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    let resultado = "";

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const existe = fechasSet.has(toKey(d));
      console.log(toKey(d), existe);
      resultado += existe ? "1" : "0";
    }

    return resultado;
  }

  // Ejemplo de uso:

  if (container) {
    const children = container.querySelectorAll("div[id^='meta-']");

    children.forEach((el) => {
      const key = el.id.replace("meta-", "");
      const data = { ...el.dataset };

      if (data.options) {
        try {
          data.options = String(data.options).split(";").map((opt) => opt.trim());
        } catch (e) {
          console.warn("No se pudo parsear data-options:", e);
        }
      }
      metadata[key] = data;
    });
  }

  // convertir fecha actual a formato YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const formattedToday = `${yyyy}-${mm}-${dd}`;

  console.log("Fecha actual:", formattedToday);
  console.log("Fecha lanzamiento:", metadata.config?.initialDate);
  console.log("Fecha actual:", metadata.config?.currentDate );



  metadata.streakDays = fechasToBin(
    metadata.user?.streakDays,
    metadata.config?.initialDate || "2025-10-03",
    metadata.config?.finalDate || "2025-10-17",
    metadata.config?.currentDate || formattedToday
  );

  // count the number of days that have passed since initialDate to currentDate
  const initialDate = new Date(metadata.config?.initialDate || "2025-10-03");
  const currentDate = new Date(metadata.config?.currentDate || formattedToday);
  const timeDiff = currentDate - initialDate;
  const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include the initial day
  
  metadata.config.daysPassed = daysPassed > 0 ? daysPassed : 0;

  // If final date is same as current date, user has finished the game
  // Convertir a string y limpiar espacios y ceros en casos como 2025-10-03 debe quedar "2025-10-3"
  const cleanFinalDate = String(metadata.config?.finalDate).trim().replace(/-0/g, "-");
  const cleanCurrentDate = String(metadata.config?.currentDate).trim().replace(/-0/g, "-");
  metadata.config.gameFinished = cleanFinalDate === cleanCurrentDate;

  console.log("Last day:", metadata.config.gameFinished);
  console.log(metadata)

  // lo haces global explícitamente
  global.App.metadata = metadata;
})(window);

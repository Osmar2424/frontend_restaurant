import axios from "axios";

// Devuelve la fecha con el formato YYYY--MM-DD
export const obtenerFecha = () => {
  const now = new Date();
  const fechaBol = now.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' });
  const [dia, mes, año] = fechaBol.split('/');
  const fecha = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`; // Resultado: YYYY-MM-DD
  return fecha;
};

// Devuelve la hora con el formato HH:MM
export const obtenerHora = () => {
  const now = new Date();
  const horaBol = now.toLocaleTimeString('es-BO', {
    timeZone: 'America/La_Paz',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  return horaBol;
};

// Manejador de errores
export const handleUIError = (
  err: unknown,
  setErrorFn: (msg: string) => void,
  defaultMsg: string = 'Ocurrio un error'
) => {
  let errMsg = defaultMsg;

  // Este console solo debe mostrarse en desarrollo, desactivar para subir a producción.
  if (import.meta.env.DEV) {
    console.error(defaultMsg, err);
  };

  // comprobamos si el error es de axios
  if (axios.isAxiosError(err)) {
    errMsg = err.response?.data?.message || err.message || defaultMsg;
  }

  // Si resulta ser un error de JS nos dejara usar .message
  else if (err instanceof Error) {
    errMsg = err.message;
  }

  setErrorFn(Array.isArray(errMsg) ? errMsg[0] : errMsg);
};

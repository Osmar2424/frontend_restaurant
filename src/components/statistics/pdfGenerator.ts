import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyResume } from '../../types';
import { obtenerFecha, obtenerHora } from '../utils';

/**
 * Genera un reporte PDF con las ventas detalladas de platillos agrupadas en tablas por fecha.
 * @param data Lista de DailyResume que contiene los datos de ventas diarias y detalles de platillos.
 */
export const generarReportePDF = (data: DailyResume[]) => {
  // Crear una nueva instancia de jsPDF (formato A4 vertical)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const fechaReporte = obtenerFecha();
  const horaReporte = obtenerHora();

  // Colores principales del tema de REStBack (Naranja/Amber #f97316 y Gris oscuro)
  const primaryColor = [249, 115, 22]; // rgb(249, 115, 22)
  const darkTextColor = [31, 41, 55]; // rgb(31, 41, 55)
  const lightGrayColor = [100, 116, 139]; // rgb(100, 116, 139)

  // 1. Encabezado del Reporte
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, 'F'); // Línea decorativa superior naranja

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('REStBack', 15, 22);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESTAURANT OS - DETALLE DE VENTAS', 15, 27);

  // Título del documento
  doc.setFontSize(16);
  doc.text('REPORTE DETALLADO DE VENTAS POR FECHA', 15, 40);

  // Metadatos colocados a la derecha del encabezado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  doc.text(`Fecha de emisión: ${fechaReporte} ${horaReporte}`, 140, 22);

  const fechaInicio = data.length > 0 ? data[0].fecha : 'N/A';
  const fechaFin = data.length > 0 ? data[data.length - 1].fecha : 'N/A';
  doc.text(`Periodo evaluado: ${fechaInicio} al ${fechaFin}`, 140, 27);

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 45, 195, 45);

  // 2. Cálculos globales
  let totalFacturado = 0;
  let totalPlatillosVendidos = 0;

  data.forEach(dia => {
    totalFacturado += Number(dia.totalVenta);

    if (dia.detailItems) {
      dia.detailItems.forEach(item => {
        totalPlatillosVendidos += item.cantidad;
      });
    }
  });

  // Mostrar paneles tipo tarjeta con resumen ejecutivo
  doc.setFillColor(248, 250, 252); // Gris muy claro para fondo de tarjetas
  doc.roundedRect(15, 50, 85, 22, 3, 3, 'F');
  doc.roundedRect(110, 50, 85, 22, 3, 3, 'F');

  // Tarjeta 1: Total de Ventas Facturadas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  doc.text('TOTAL VENTAS FACTURADAS', 20, 56);
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Bs. ${totalFacturado.toFixed(2)}`, 20, 65);

  // Tarjeta 2: Total de Unidades Vendidas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
  doc.text('TOTAL UNIDADES VENDIDAS', 115, 56);
  doc.setFontSize(14);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`${totalPlatillosVendidos} Unidades`, 115, 65);

  // 3. Tablas por fecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Desglose de Ventas por Día', 15, 82);

  let currentY = 88;

  data.forEach((dia, index) => {
    // Si queda poco espacio en la página actual (menos de 50mm del final de página), pasamos a la siguiente hoja
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Subtítulo con la fecha y el total facturado del día
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Fecha: ${dia.fecha}   |   Venta Total del Día: Bs. ${Number(dia.totalVenta).toFixed(2)}`, 15, currentY);

    // Dibujar línea delgada naranja debajo del subtítulo de la fecha
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.line(15, currentY + 1.5, 195, currentY + 1.5);

    currentY += 4;

    const items = dia.detailItems || [];

    if (items.length > 0) {
      const cuerpoTabla = items.map(item => {
        const platilloObj = item.dish || (item.dishItems && item.dishItems[0]);
        const platilloNombre = platilloObj?.name || 'Platillo Desconocido';
        const platilloPrecio = Number(platilloObj?.price || 0);
        return [
          platilloNombre,
          `${item.cantidad} u.`,
          `Bs. ${platilloPrecio.toFixed(2)}`,
          `Bs. ${Number(item.totalDetail).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: [['Platillo / Item', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: cuerpoTabla,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59], // Gris/pizarra oscuro para encabezado de la fecha
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 8,
          textColor: darkTextColor as [number, number, number]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          cellPadding: 2,
          valign: 'middle'
        }
      });

      // Actualizar la posición Y del cursor basándose en dónde terminó la última tabla generada
      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      // Si no hay detalles para esa fecha, poner un mensaje aclaratorio
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
      doc.text('No se registraron detalles específicos de platillos para este día.', 17, currentY + 3);
      currentY += 10;
    }
  });

  // 4. Pie de página dinámico con paginación en todo el documento
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);

    // Centrar el número de página
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );

    // Identificador del sistema a la izquierda
    doc.text(
      'Sistema de Gestión REStBack - Detalle de Ventas Diarias',
      15,
      287
    );
  }

  // Descargar el documento PDF
  doc.save(`Detalle_Ventas_${fechaReporte}.pdf`);
};

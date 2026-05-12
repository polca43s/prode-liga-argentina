import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generateGeneralRankingPdf(ranking: any[], tournamentName: string): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Tabla General - ${tournamentName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);

    const tableData = ranking.map((r, i) => [
      i + 1,
      r.user.nickname,
      r.puntos || 0,
      r.fechasGanadas || 0,
      r.visita || 0,
      r.empate || 0,
      r.local || 0
    ]);

    autoTable(doc, {
      head: [['#', 'Jugador', 'Puntos', 'FG', 'V', 'E', 'L']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 135, 84] }
    });

    doc.save(`tabla-general-${tournamentName}.pdf`);
  }

  generateFixtureRankingPdf(ranking: any[], fixtureName: string): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Posiciones - ${fixtureName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);

    const tableData = ranking.map((r, i) => [
      i + 1,
      r.user.nickname,
      r.puntos || 0,
      r.stats?.V || 0,
      r.stats?.E || 0,
      r.stats?.L || 0
    ]);

    autoTable(doc, {
      head: [['#', 'Jugador', 'Puntos', 'V', 'E', 'L']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 135, 84] }
    });

    doc.save(`posiciones-${fixtureName}.pdf`);
  }

  generatePredictionPdf(user: any, fixture: any, detalles: any[], fecha: string): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Comprobante de Jugada', 14, 20);

    doc.setFontSize(11);
    doc.text(`Fecha: ${fixture?.nombre || fecha}`, 14, 32);
    doc.text(`Jugador: ${user?.nickname}`, 14, 40);
    doc.text(`Fecha de carga: ${new Date().toLocaleString('es-AR')}`, 14, 48);

    const startY = 58;

    detalles.forEach((d: any, index: number) => {
      const y = startY + (index * 12);

      doc.setFillColor(240, 240, 240);
      if (index % 2 === 1) doc.setFillColor(255, 255, 255);
      doc.rect(14, y - 4, 182, 10, 'F');

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);

      doc.text(d.seleccion.includes('L') ? 'X' : '', 20, y + 2, { align: 'center' });

      const localImg = d.match?.local?.escudo;
      if (localImg) {
        try { doc.addImage(localImg, 'PNG', 30, y - 3, 8, 8); } catch {}
      }

      doc.text(d.match?.local?.nombre || 'Local', 70, y + 2, { align: 'right' });

      doc.text(d.seleccion.includes('E') ? 'X' : '', 110, y + 2, { align: 'center' });

      const visitImg = d.match?.visitante?.escudo;
      if (visitImg) {
        try { doc.addImage(visitImg, 'PNG', 120, y - 3, 8, 8); } catch {}
      }

      doc.text(d.match?.visitante?.nombre || 'Visitante', 160, y + 2, { align: 'left' });

      doc.text(d.seleccion.includes('V') ? 'X' : '', 190, y + 2, { align: 'center' });
    });

    doc.save(`mi-jugada-${fixture?.nombre || fecha}.pdf`);
  }
}

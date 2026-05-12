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

    const headerY = startY - 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('L', 18, headerY, { align: 'center' });
    doc.text('LOCAL', 58, headerY, { align: 'right' });
    doc.text('E', 98, headerY, { align: 'center' });
    doc.text('VISITANTE', 142, headerY, { align: 'left' });
    doc.text('V', 188, headerY, { align: 'center' });

    doc.setLineWidth(0.3);
    doc.line(14, startY - 3, 196, startY - 3);

    detalles.forEach((d: any, index: number) => {
      const y = startY + 6 + (index * 14);

      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(14, y - 5, 182, 10, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const localSelected = d.seleccion.includes('L') ? 'X' : '';
      const empSelected = d.seleccion.includes('E') ? 'X' : '';
      const visitSelected = d.seleccion.includes('V') ? 'X' : '';

      doc.text(localSelected, 18, y + 2, { align: 'center' });

      doc.text(d.match?.local?.nombre || 'Local', 70, y + 2, { align: 'right' });

      const localEscudo = d.match?.local?.escudo;
      if (localEscudo) {
        try { doc.addImage(localEscudo, 'PNG', 72, y - 4, 10, 10); } catch {}
      }

      doc.text(empSelected, 98, y + 2, { align: 'center' });

      const visitEscudo = d.match?.visitante?.escudo;
      if (visitEscudo) {
        try { doc.addImage(visitEscudo, 'PNG', 106, y - 4, 10, 10); } catch {}
      }

      doc.text(d.match?.visitante?.nombre || 'Visitante', 130, y + 2, { align: 'left' });

      doc.text(visitSelected, 188, y + 2, { align: 'center' });
    });

    doc.save(`mi-jugada-${fixture?.nombre || fecha}.pdf`);
  }
}

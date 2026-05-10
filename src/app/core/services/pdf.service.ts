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

    // Armar tabla con formato similar al mail: L, Local, E, Visitante, V
    const tableData = detalles.map((d: any) => {
      const local = d.match?.local?.nombre || 'Local';
      const visit = d.match?.visitante?.nombre || 'Visitante';
      const sel = d.seleccion || '';
      return [
        sel.includes('L') ? 'X' : '',
        local,
        sel.includes('E') ? 'X' : '',
        visit,
        sel.includes('V') ? 'X' : ''
      ];
    });

    autoTable(doc, {
      head: [['L', 'LOCAL', 'E', 'VISITANTE', 'V']],
      body: tableData,
      startY: 58,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 135, 84] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'right' },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'left' },
        4: { halign: 'center', cellWidth: 15 }
      }
    });

    doc.save(`mi-jugada-${fixture?.nombre || fecha}.pdf`);
  }
}
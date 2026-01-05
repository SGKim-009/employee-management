import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollStatement } from '@/types/payroll';

export function generatePayrollPDF(statement: PayrollStatement): void {
  const doc = new jsPDF();
  const employee = statement.employee;

  // 제목
  doc.setFontSize(18);
  doc.text('급여 명세서', 105, 20, { align: 'center' });

  // 기본 정보
  doc.setFontSize(12);
  doc.text(`발급일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 35);
  doc.text(`지급년월: ${statement.year}년 ${statement.month}월`, 20, 42);

  // 직원 정보
  if (employee) {
    doc.setFontSize(11);
    doc.text(`사번: ${employee.employee_number}`, 20, 52);
    doc.text(`성명: ${employee.name}`, 20, 59);
    doc.text(`부서: ${employee.department}`, 20, 66);
    doc.text(`직책: ${employee.position}`, 20, 73);
  }

  // 지급 내역
  doc.setFontSize(12);
  doc.text('지급 내역', 20, 85);
  
  autoTable(doc, {
    startY: 90,
    head: [['항목', '금액 (원)']],
    body: [
      ['기본급', statement.base_salary.toLocaleString()],
      ['연장근로수당', statement.overtime_pay.toLocaleString()],
      ['상여금', statement.bonus.toLocaleString()],
      ['제수당', statement.allowances.toLocaleString()],
      ['총 지급액', statement.total_income.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
  });

  // 공제 내역
  const finalY = (doc as any).lastAutoTable.finalY || 130;
  doc.setFontSize(12);
  doc.text('공제 내역', 20, finalY + 10);

  autoTable(doc, {
    startY: finalY + 15,
    head: [['항목', '금액 (원)']],
    body: [
      ['소득세', statement.income_tax.toLocaleString()],
      ['지방소득세', statement.local_tax.toLocaleString()],
      ['국민연금', statement.national_pension.toLocaleString()],
      ['건강보험', statement.health_insurance.toLocaleString()],
      ['고용보험', statement.employment_insurance.toLocaleString()],
      ['장기요양보험', statement.long_term_care.toLocaleString()],
      ['총 공제액', statement.total_deduction.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [202, 66, 66] },
    styles: { fontSize: 10 },
  });

  // 실지급액
  const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 60;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`실지급액: ${statement.net_pay.toLocaleString()}원`, 105, finalY2 + 20, { align: 'center' });

  // 지급 정보
  if (statement.payment_date) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`지급일: ${new Date(statement.payment_date).toLocaleDateString('ko-KR')}`, 20, finalY2 + 30);
  }
  if (statement.bank_account) {
    doc.text(`계좌번호: ${statement.bank_account}`, 20, finalY2 + 37);
  }
  if (statement.notes) {
    doc.text(`비고: ${statement.notes}`, 20, finalY2 + 44);
  }

  // 파일명 생성
  const fileName = `급여명세서_${employee?.name || '직원'}_${statement.year}년${statement.month}월.pdf`;
  
  // PDF 다운로드
  doc.save(fileName);
}



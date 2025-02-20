import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { PDFDownloadLink, Document, Page, View, Text, StyleSheet, Font, pdf } from '@react-pdf/renderer';

// Register fonts for PDF
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold'
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 12,
    marginBottom: 5
  },
  section: {
    marginBottom: 15
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 10
  },
  gridItem: {
    flex: 1,
    paddingHorizontal: 10
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5
  },
  table: {
    marginBottom: 15
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000'
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#000'
  },
  tableCellHeader: {
    fontWeight: 'bold'
  }
});

const ProgressCardPDF = ({ student, monthlyRecords = {}, quarterlyTests = [] }) => {
  if (!student) return null;

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  // Extract months from monthlyRecords object and sort them chronologically
  const sortedMonthlyRecords = Object.entries(monthlyRecords).sort((a, b) => {
    const monthsOrder = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthA = a[0].split('-')[0];
    const monthB = b[0].split('-')[0];
    return monthsOrder.indexOf(monthA) - monthsOrder.indexOf(monthB);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DIRECTORATE OF VOCATIONAL EDUCATION & TRAINING</Text>
          <Text style={styles.headerSubtitle}>Industrial Training Institute, Dodamarg</Text>
          <Text style={[styles.headerTitle, { marginTop: 10 }]}>PROGRESS CARD</Text>
        </View>

        {/* Student Details Section */}
        <View style={styles.section}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.label}>Name of Trainee:</Text>
                {student.userName || '-'}
              </Text>
              <Text>
                <Text style={styles.label}>Date of Birth:</Text>
                {formatDate(student.DOB)}
              </Text>
              <Text>
                <Text style={styles.label}>Trade:</Text>
                {student.trade || '-'}
              </Text>
              <Text>
                <Text style={styles.label}>Edu. Qual.:</Text>
                {student.educationQualification || '-'}
              </Text>
              <Text>
                <Text style={styles.label}>Stipend:</Text>
                {student.stipend ? 'YES' : 'NO'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.label}>Trainee Code:</Text>
                {student.registerId || '-'}
              </Text>
              <Text>
                <Text style={styles.label}>CMD Rec. No.:</Text>
                {student.cmdRecordNumber || '-'}
              </Text>
              <Text>
                <Text style={styles.label}>Permanent Address:</Text>
                {student.address || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Record Table */}
        <View style={styles.table}>
          <Text style={[styles.label, { marginBottom: 5 }]}>Monthly Record</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '5%' }]}>Sr. No.</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Month</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Theory</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Practical</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Attendance</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Progress %</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>Signature</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '30%' }]}>Remarks</Text>
          </View>
          {sortedMonthlyRecords.map(([month, record], index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '5%' }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{month}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{record.theory || '-'}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{record.practical || '-'}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{`${record.presentDays || '-'} / ${record.totalDays || '-'}`}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{record.progress || '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{record.signature || '-'}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{record.remarks || '-'}</Text>
            </View>
          ))}
          <Text style={{ marginTop: 10 }}>Average(Sep-Jun): {sortedMonthlyRecords.reduce((sum, [_, record]) => sum + (record.progress || 0), 0) / sortedMonthlyRecords.length || '-'}</Text>
        </View>

        {/* Quarterly Tests Table */}
        <View style={styles.table}>
          <Text style={[styles.label, { marginBottom: 5 }]}>QUARTERLY TESTS</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '5%' }]}>Quart. No.</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Practical</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Theory</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '10%' }]}>Empl. Skills</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '15%' }]}>Signature</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: '50%' }]}>Remarks</Text>
          </View>
          {quarterlyTests.map((test, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '5%' }]}>Q{test.quarter}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{test.practical || '-'}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{test.theory || '-'}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{test.skills || '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{test.signature || '-'}</Text>
              <Text style={[styles.tableCell, { width: '50%' }]}>{test.remarks || '-'}</Text>
            </View>
          ))}
          <Text style={{ marginTop: 10 }}>Average: {quarterlyTests.reduce((sum, test) => sum + (test.practical || 0) + (test.theory || 0) + (test.skills || 0), 0) / (quarterlyTests.length * 3) || '-'}</Text>
        </View>
      </Page>
    </Document>
  );
};

const ProgressCard = ({ studentProfiles = [], stats  }) => {
    console.log(stats)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    const generatePreview = async () => {
      if (!selectedStudent) {
        setPdfUrl('');
        return;
      }

      try {
        const blob = await pdf(
          <ProgressCardPDF 
            student={selectedStudent}
            monthlyRecords={stats.find(item => item.userId === selectedStudent.userId).monthlyAttendance || {} }
            quarterlyTests={selectedStudent.quarterlyTests || []}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
        setPdfUrl('');
      }
    };

    generatePreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [selectedStudent]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[280px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <span className="text-gray-700">
              {selectedStudent ? selectedStudent.userName : "Select student"}
            </span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {studentProfiles.map((student) => (
                <div
                  key={student.userId}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsDropdownOpen(false);
                  }}
                >
                  {student.userName}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedStudent && (
          <PDFDownloadLink
            document={
              <ProgressCardPDF 
                student={selectedStudent}
                monthlyRecords={selectedStudent.monthlyRecords || []}
                quarterlyTests={selectedStudent.quarterlyTests || []}
              />
            }
            fileName={`progress-card-${selectedStudent.userName}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {({ loading }) => (
              <>
                <Printer className="h-4 w-4" />
                {loading ? 'Generating PDF...' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <div className="bg-white p-6 border rounded-lg shadow-sm">
        {selectedStudent ? (
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[842px] border-0"
              title="Progress Card Preview"
            />
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center">
              <p className="text-gray-500">Generating preview...</p>
            </div>
          )
        ) : (
          <div className="w-full h-[842px] flex items-center justify-center">
            <p className="text-gray-500">Select a student to view their progress card</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;
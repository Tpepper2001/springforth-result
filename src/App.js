import React, { useState, useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, PDFViewer, Image as PDFImage, Font } from '@react-pdf/renderer';
import { Plus, Trash2, Download, RefreshCw } from 'lucide-react';

// ==========================================
// 1. PDF STYLES & DOCUMENT DEFINITION
// ==========================================

// Register a standard font (optional, using default Helvetica here for simplicity)
// You can register custom fonts if you want specific bold weights.

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: 'Helvetica' },
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' },
  logoBox: { width: 60, height: 60, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  schoolInfo: { flex: 1, textAlign: 'center', marginHorizontal: 10 },
  schoolName: { fontSize: 16, color: '#1a365d', fontWeight: 'bold', textTransform: 'uppercase' },
  schoolAddress: { fontSize: 8, marginTop: 2, fontWeight: 'bold' },
  schoolContact: { fontSize: 8, marginTop: 2, fontWeight: 'bold' },
  reportTitle: { fontSize: 10, marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  photoBox: { width: 60, height: 60, border: '1px solid #ccc' },
  
  // Red/Blue dividers
  redBar: { height: 2, backgroundColor: 'red', width: '100%' },
  
  // Student Info Grid
  studentInfoContainer: { flexDirection: 'row', border: '1px solid #000', marginVertical: 5, backgroundColor: '#dbeafe' },
  infoCol: { flex: 1, padding: 2 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { fontWeight: 'bold', width: 60 },
  infoValue: { fontWeight: 'bold' },

  // Tables General
  table: { width: '100%', borderLeft: '1px solid #000', borderTop: '1px solid #000' },
  row: { flexDirection: 'row' },
  cell: { borderRight: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'center', padding: 2, justifyContent: 'center' },
  headerCell: { backgroundColor: '#bfdbfe', fontWeight: 'bold' },
  
  // Subject Table Column Widths
  colSn: { width: '4%' },
  colSubject: { width: '25%', textAlign: 'left', paddingLeft: 4 },
  colScore: { width: '6%' }, // For small scores (5%, 15%)
  colTotal: { width: '7%', backgroundColor: '#e5e7eb' },
  colGrade: { width: '6%' },
  colPos: { width: '6%' },
  colHigh: { width: '8%' },
  colRemark: { flex: 1 },

  // Grade Key & Summary
  gradeSummarySection: { flexDirection: 'row', marginTop: 5, border: '1px solid #000' },
  gradeKey: { padding: 2, fontSize: 7, textAlign: 'center', backgroundColor: '#eff6ff', borderBottom: '1px solid #000' },
  
  // Comments
  sectionHeader: { backgroundColor: '#bfdbfe', padding: 2, border: '1px solid #000', marginTop: 5, fontWeight: 'bold', fontSize: 9 },
  commentBox: { flexDirection: 'row', border: '1px solid #000', borderTop: 'none', minHeight: 30 },
  commentLabel: { width: 70, backgroundColor: '#eff6ff', padding: 4, borderRight: '1px solid #000', justifyContent: 'center', fontWeight: 'bold', fontSize: 7 },
  commentText: { flex: 1, padding: 4, fontSize: 8 },

  // Behavioral
  behaviorContainer: { flexDirection: 'row', marginTop: 5, border: '1px solid #000' },
  behaviorLeft: { width: '65%', borderRight: '1px solid #000' },
  behaviorRight: { width: '35%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
  
  // Signatures
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  signBox: { width: '40%', borderTop: '1px solid #000', paddingTop: 4, textAlign: 'center' }
});

// Helper to determine grade color/text
const getGrade = (score) => {
  const s = parseFloat(score);
  if (s >= 86) return 'A*';
  if (s >= 76) return 'A';
  if (s >= 66) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  if (s >= 40) return 'E';
  return 'F';
};

const ResultPDF = ({ data }) => {
  // Calculate aggregate stats
  const totalScore = data.subjects.reduce((acc, sub) => acc + (parseFloat(sub.total) || 0), 0);
  const average = (totalScore / (data.subjects.length || 1)).toFixed(1);
  
  // Calculate grade counts
  const gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
  data.subjects.forEach(sub => {
    const g = getGrade(sub.total);
    if (gradeCounts[g] !== undefined) gradeCounts[g]++;
    else gradeCounts['F']++;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === HEADER === */}
        <View style={styles.headerContainer}>
           {/* Placeholder for Logo */}
          <View style={styles.logoBox}><Text>LOGO</Text></View>
          
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{data.schoolName}</Text>
            <Text style={styles.schoolAddress}>{data.address}</Text>
            <Text style={styles.schoolContact}>{data.contact}</Text>
            <Text style={styles.reportTitle}>{data.term} REPORT {data.session}</Text>
          </View>

          {/* Placeholder for Photo */}
          <View style={styles.photoBox}>
             {/* If you have a real image URL, use <Image src={url} /> */}
          </View>
        </View>
        <View style={styles.redBar} />

        {/* === STUDENT INFO === */}
        <View style={styles.studentInfoContainer}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>NAME:</Text><Text style={styles.infoValue}>{data.studentName}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>CLASS:</Text><Text style={styles.infoValue}>{data.className}</Text></View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>AVG SCORE:</Text><Text style={styles.infoValue}>{average}%</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>OVERALL:</Text><Text style={styles.infoValue}>{getGrade(average)}</Text></View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>CLASS SIZE:</Text><Text style={styles.infoValue}>{data.classSize}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>GENDER:</Text><Text style={styles.infoValue}>{data.gender}</Text></View>
          </View>
        </View>

        {/* === ACADEMIC TABLE === */}
        <View style={styles.table}>
          {/* Header Row 1 */}
          <View style={[styles.row, styles.headerCell]}>
            <Text style={[styles.cell, styles.colSn]}>S/N</Text>
            <Text style={[styles.cell, styles.colSubject]}>SUBJECTS</Text>
            <Text style={[styles.cell, styles.colScore]}>NOTE 5%</Text>
            <Text style={[styles.cell, styles.colScore]}>CW 5%</Text>
            <Text style={[styles.cell, styles.colScore]}>HW 5%</Text>
            <Text style={[styles.cell, styles.colScore]}>TEST 15%</Text>
            <Text style={[styles.cell, styles.colScore]}>CA 15%</Text>
            <Text style={[styles.cell, styles.colTotal]}>TOTAL 100%</Text>
            <Text style={[styles.cell, styles.colGrade]}>GRD</Text>
            <Text style={[styles.cell, styles.colPos]}>POS</Text>
            <Text style={[styles.cell, styles.colHigh]}>HIGH</Text>
            <Text style={[styles.cell, styles.colRemark]}>REMARKS</Text>
          </View>

          {/* Subject Rows */}
          {data.subjects.map((sub, index) => (
            <View key={index} style={styles.row}>
              <Text style={[styles.cell, styles.colSn]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colSubject]}>{sub.name}</Text>
              <Text style={[styles.cell, styles.colScore]}>{sub.note}</Text>
              <Text style={[styles.cell, styles.colScore]}>{sub.cw}</Text>
              <Text style={[styles.cell, styles.colScore]}>{sub.hw}</Text>
              <Text style={[styles.cell, styles.colScore]}>{sub.test}</Text>
              <Text style={[styles.cell, styles.colScore]}>{sub.ca}</Text>
              <Text style={[styles.cell, styles.colTotal, {fontWeight:'bold'}]}>{sub.total}</Text>
              <Text style={[styles.cell, styles.colGrade]}>{getGrade(sub.total)}</Text>
              <Text style={[styles.cell, styles.colPos]}>{sub.position}</Text>
              <Text style={[styles.cell, styles.colHigh]}>{sub.highest}</Text>
              <Text style={[styles.cell, styles.colRemark]}>{sub.remarks}</Text>
            </View>
          ))}
          
          {/* Totals Row */}
          <View style={[styles.row, {backgroundColor: '#e5e7eb', fontWeight:'bold'}]}>
             <Text style={[styles.cell, {flex:1, textAlign:'right', paddingRight: 10}]}>
               TOTAL SCORE: {totalScore.toFixed(1)}   |   NO OF SUBJECTS: {data.subjects.length}
             </Text>
          </View>
        </View>

        {/* === GRADE KEY === */}
        <Text style={styles.gradeKey}>
          86-100 (A*) Excellent, 76-85 (A) Outstanding, 66-75 (B) Very Good, 60-65 (C) Good, 50-59 (D) Fairly Good, 40-49 (E) Below, 0-39 (F) Fail
        </Text>

        {/* === GRADE SUMMARY TABLE === */}
        <View style={styles.table}>
            <View style={[styles.row, styles.headerCell]}>
               <Text style={[styles.cell, {flex:1}]}>GRADE SUMMARY</Text>
            </View>
            <View style={styles.row}>
               {Object.keys(gradeCounts).map((g) => (
                 <Text key={g} style={[styles.cell, {flex:1}]}>{g}</Text>
               ))}
            </View>
            <View style={styles.row}>
               {Object.values(gradeCounts).map((c, i) => (
                 <Text key={i} style={[styles.cell, {flex:1}]}>{c}</Text>
               ))}
            </View>
        </View>

        {/* === COMMENTS === */}
        <View style={styles.sectionHeader}><Text style={{textAlign:'center'}}>COMMENTS</Text></View>
        
        <View style={styles.commentBox}>
           <Text style={styles.commentLabel}>FORM TUTOR'S COMMENT</Text>
           <Text style={styles.commentText}>{data.tutorComment}</Text>
        </View>
        <View style={styles.commentBox}>
           <Text style={styles.commentLabel}>PRINCIPAL'S COMMENT</Text>
           <Text style={styles.commentText}>{data.principalComment}</Text>
        </View>

        {/* === BEHAVIORAL REPORT === */}
        <View style={styles.sectionHeader}><Text style={{textAlign:'center'}}>STUDENTS BEHAVIOURAL REPORT</Text></View>
        <View style={styles.behaviorContainer}>
           <View style={styles.behaviorLeft}>
              <View style={[styles.row, styles.headerCell]}>
                 <Text style={[styles.cell, {width:'40%', textAlign:'left'}]}>BEHAVIOURAL TRAITS</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>5</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>4</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>3</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>2</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>1</Text>
                 <Text style={[styles.cell, {width:'10%'}]}>REMARKS</Text>
              </View>
              {data.behaviors.map((b, i) => (
                 <View key={i} style={styles.row}>
                    <Text style={[styles.cell, {width:'40%', textAlign:'left'}]}>{b.trait}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>{b.rating === 5 ? '✓' : ''}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>{b.rating === 4 ? '✓' : ''}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>{b.rating === 3 ? '✓' : ''}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>{b.rating === 2 ? '✓' : ''}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>{b.rating === 1 ? '✓' : ''}</Text>
                    <Text style={[styles.cell, {width:'10%'}]}>
                        {b.rating === 5 ? 'Excellent' : b.rating === 4 ? 'V. Good' : 'Good'}
                    </Text>
                 </View>
              ))}
           </View>
           <View style={styles.behaviorRight}>
               <Text style={{fontWeight:'bold', fontSize: 10, marginBottom: 10}}>SUMMARY OF RATING</Text>
               <Text style={{fontSize: 24, fontWeight: 'bold', color: 'red'}}>
                  {Math.round(data.behaviors.reduce((acc, curr) => acc + (curr.rating * 20), 0) / data.behaviors.length)}%
               </Text>
               <Text style={{marginTop: 5}}>Excellent Degree</Text>
           </View>
        </View>

        {/* === FOOTER === */}
        <View style={styles.footer}>
           <View style={styles.signBox}>
              <Text>{data.formTutorName}</Text>
              <Text style={{fontSize: 6}}>FORM TUTOR</Text>
           </View>
           <View style={styles.signBox}>
              <Text>{data.principalName}</Text>
              <Text style={{fontSize: 6}}>ACTING PRINCIPAL</Text>
           </View>
        </View>

      </Page>
    </Document>
  );
};

// ==========================================
// 2. MAIN APP COMPONENT (INPUT FORM)
// ==========================================

const App = () => {
  const [data, setData] = useState({
    schoolName: 'THE CAVENDISH COLLEGE',
    address: '26 KINSHASA ROAD, OPPOSITE INEC OFFICE U/RIMI KADUNA',
    contact: 'PHONE: 08144939839, EMAIL: thecavendishc@gmail.com',
    term: 'TERM ONE',
    session: '2025/2026',
    studentName: 'SANDAH AHMADU USMAN',
    className: 'YEAR 12 RIGEL',
    classSize: '24',
    gender: 'M',
    tutorComment: 'Usman consistently displays a performance that is outstanding.',
    principalComment: 'An adequate understanding of the overall objectives.',
    formTutorName: 'PRINCE UKPELE EYIMOGA',
    principalName: 'CHARITY IDEHEN',
    subjects: [
      { name: 'BIOLOGY', note: 5, cw: 5, hw: 5, test: 15, ca: 15, total: 95, position: '4th', highest: 98, remarks: 'Very Good' },
      { name: 'CHEMISTRY', note: 4, cw: 4, hw: 4, test: 12, ca: 10, total: 78, position: '2nd', highest: 88, remarks: 'Good' },
    ],
    behaviors: [
       { trait: 'RESPECT', rating: 5 },
       { trait: 'RESPONSIBILITY', rating: 5 },
       { trait: 'EMPATHY', rating: 4 },
       { trait: 'SELF DISCIPLINE', rating: 4 },
       { trait: 'COOPERATION', rating: 5 },
       { trait: 'LEADERSHIP', rating: 4 },
       { trait: 'HONESTY', rating: 5 },
    ]
  });

  const handleSchoolChange = (e) => setData({...data, [e.target.name]: e.target.value});
  
  const updateSubject = (index, field, value) => {
    const newSubjects = [...data.subjects];
    newSubjects[index][field] = value;
    // Auto calc total
    if (['note', 'cw', 'hw', 'test', 'ca'].includes(field)) {
        const s = newSubjects[index];
        const total = (parseFloat(s.note)||0) + (parseFloat(s.cw)||0) + (parseFloat(s.hw)||0) + (parseFloat(s.test)||0) + (parseFloat(s.ca)||0) + 40; // Assuming Exam is remainder? 
        // Based on screenshot, colums add up to ~45. There is an implicit exam score or the formula is different.
        // For this demo, let's just sum what is there.
        newSubjects[index].total = (parseFloat(s.note)||0) + (parseFloat(s.cw)||0) + (parseFloat(s.hw)||0) + (parseFloat(s.test)||0) + (parseFloat(s.ca)||0);
        // Usually there is an Exam column (60%). If not, the input should include it.
    }
    setData({...data, subjects: newSubjects});
  };

  const addSubject = () => {
    setData({...data, subjects: [...data.subjects, { name: '', note: 0, cw: 0, hw: 0, test: 0, ca: 0, total: 0, position: '', highest: 0, remarks: '' }]});
  };

  const removeSubject = (index) => {
    const newSubjects = [...data.subjects];
    newSubjects.splice(index, 1);
    setData({...data, subjects: newSubjects});
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden flex flex-col lg:flex-row">
        
        {/* === LEFT: EDITOR FORM === */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto h-screen">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <RefreshCw className="w-6 h-6"/> Report Card Generator
          </h2>
          
          <div className="space-y-6">
            {/* School Info */}
            <section className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-bold text-blue-800 mb-2">School Details</h3>
                <input name="schoolName" value={data.schoolName} onChange={handleSchoolChange} className="w-full p-2 mb-2 border rounded" placeholder="School Name" />
                <input name="address" value={data.address} onChange={handleSchoolChange} className="w-full p-2 mb-2 border rounded" placeholder="Address" />
                <input name="term" value={data.term} onChange={handleSchoolChange} className="w-1/2 p-2 mb-2 border rounded mr-2" placeholder="Term" />
                <input name="session" value={data.session} onChange={handleSchoolChange} className="w-1/3 p-2 mb-2 border rounded" placeholder="Session" />
            </section>

            {/* Student Info */}
            <section className="bg-green-50 p-4 rounded-md">
                <h3 className="font-bold text-green-800 mb-2">Student Details</h3>
                <div className="grid grid-cols-2 gap-2">
                    <input name="studentName" value={data.studentName} onChange={handleSchoolChange} className="p-2 border rounded" placeholder="Name" />
                    <input name="className" value={data.className} onChange={handleSchoolChange} className="p-2 border rounded" placeholder="Class" />
                    <input name="classSize" value={data.classSize} onChange={handleSchoolChange} className="p-2 border rounded" placeholder="Class Size" />
                    <input name="gender" value={data.gender} onChange={handleSchoolChange} className="p-2 border rounded" placeholder="Gender" />
                </div>
            </section>

            {/* Subjects */}
            <section>
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-700">Subjects</h3>
                   <button onClick={addSubject} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"><Plus size={16}/> Add</button>
                </div>
                {data.subjects.map((sub, i) => (
                    <div key={i} className="mb-2 p-2 border rounded bg-gray-50 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500 w-4">{i+1}</span>
                        <input value={sub.name} onChange={(e)=>updateSubject(i,'name',e.target.value)} placeholder="Subject" className="flex-1 min-w-[120px] p-1 border rounded" />
                        <input type="number" value={sub.total} onChange={(e)=>updateSubject(i,'total',e.target.value)} placeholder="Total" className="w-16 p-1 border rounded text-center font-bold" />
                        <input value={sub.remarks} onChange={(e)=>updateSubject(i,'remarks',e.target.value)} placeholder="Remark" className="w-24 p-1 border rounded" />
                        <button onClick={()=>removeSubject(i)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button>
                        
                        {/* Expandable details if needed, simplified here */}
                        <div className="w-full flex gap-1 mt-1">
                            <input placeholder="Note" className="w-1/6 text-xs p-1 border" value={sub.note} onChange={(e)=>updateSubject(i,'note',e.target.value)}/>
                            <input placeholder="CW" className="w-1/6 text-xs p-1 border" value={sub.cw} onChange={(e)=>updateSubject(i,'cw',e.target.value)}/>
                            <input placeholder="HW" className="w-1/6 text-xs p-1 border" value={sub.hw} onChange={(e)=>updateSubject(i,'hw',e.target.value)}/>
                            <input placeholder="Test" className="w-1/6 text-xs p-1 border" value={sub.test} onChange={(e)=>updateSubject(i,'test',e.target.value)}/>
                            <input placeholder="CA" className="w-1/6 text-xs p-1 border" value={sub.ca} onChange={(e)=>updateSubject(i,'ca',e.target.value)}/>
                        </div>
                    </div>
                ))}
            </section>
            
            {/* Comments */}
             <section className="bg-yellow-50 p-4 rounded-md">
                <h3 className="font-bold text-yellow-800 mb-2">Comments</h3>
                <textarea name="tutorComment" value={data.tutorComment} onChange={handleSchoolChange} className="w-full p-2 mb-2 border rounded h-20" placeholder="Tutor Comment" />
                <textarea name="principalComment" value={data.principalComment} onChange={handleSchoolChange} className="w-full p-2 mb-2 border rounded h-20" placeholder="Principal Comment" />
            </section>
          </div>
        </div>

        {/* === RIGHT: PDF PREVIEW === */}
        <div className="w-full lg:w-1/2 bg-gray-700 p-4 h-screen flex flex-col">
          <div className="flex justify-between items-center text-white mb-4">
             <h3 className="font-bold">Live Preview</h3>
          </div>
          <div className="flex-1 bg-white rounded-lg overflow-hidden">
             <PDFViewer width="100%" height="100%" className="border-none">
                 <ResultPDF data={data} />
             </PDFViewer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;

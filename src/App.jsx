import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, Font } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, UserPlus, FileText, 
  LayoutDashboard, LogOut, CheckCircle, Lock, User, Plus, Trash2, Save
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. HIGH-FIDELITY PDF TEMPLATE
// ==========================================
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  // Header
  headerBox: { flexDirection: 'row', border: '2px solid red', padding: 5, marginBottom: 2 },
  logo: { width: 50, height: 50, marginRight: 10 },
  headerText: { flex: 1, textAlign: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: '#1a365d', textTransform: 'uppercase' },
  schoolDetails: { fontSize: 7, fontWeight: 'bold', marginTop: 2 },
  termTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4, textDecoration: 'underline' },
  photo: { width: 50, height: 50, border: '1px solid #ccc', marginLeft: 10 },
  
  // Student Strip
  infoStrip: { flexDirection: 'row', backgroundColor: '#bfdbfe', border: '1px solid black', marginBottom: 2 },
  infoItem: { flex: 1, borderRight: '1px solid black', padding: 2, fontSize: 8, fontWeight: 'bold' },

  // Main Table
  table: { width: '100%', borderTop: '1px solid black', borderLeft: '1px solid black' },
  row: { flexDirection: 'row' },
  cell: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: 2, textAlign: 'center', justifyContent: 'center' },
  
  // Columns
  colSn: { width: '3%' },
  colSub: { width: '25%', textAlign: 'left', paddingLeft: 4 },
  colSmall: { width: '6%', fontSize: 7 }, // Note, CW, HW
  colMed: { width: '7%' }, // Total
  colRem: { flex: 1, textAlign: 'left', paddingLeft: 4 },

  headerCell: { backgroundColor: '#bfdbfe', fontWeight: 'bold' },
  
  // Grade Summary
  summaryBox: { flexDirection: 'row', marginTop: 2, border: '1px solid black' },
  
  // Behavior & Comments Layout
  bottomSection: { flexDirection: 'row', marginTop: 2 },
  commentsCol: { width: '60%', paddingRight: 2 },
  behaviorCol: { width: '40%' },

  commentBox: { border: '1px solid black', marginBottom: 2, padding: 2, minHeight: 30 },
  commentLabel: { backgroundColor: '#bfdbfe', padding: 2, fontWeight: 'bold', fontSize: 7, borderBottom: '1px solid black' },

  behaviorRow: { flexDirection: 'row', borderBottom: '1px solid black', borderLeft: '1px solid black', borderRight: '1px solid black' },
  bCell: { borderRight: '1px solid black', padding: 2, textAlign: 'center' },
  bLabel: { width: '40%', textAlign: 'left', paddingLeft: 2, backgroundColor: '#eff6ff' },
  bCheck: { width: '10%' },
  bRem: { width: '20%', fontSize: 7 },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sigLine: { borderBottom: '1px solid black', width: '30%', height: 20, marginBottom: 2 }
});

const ResultPDF = ({ school, student, results, behaviors, comments, classInfo }) => {
  const totalScore = results.reduce((acc, r) => acc + (r.score_note+r.score_cw+r.score_hw+r.score_test+r.score_ca+r.score_exam), 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);

  // Behavioral Calcs
  const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
  const getRating = (trait) => behaviors.find(b => b.trait === trait)?.rating || 0;
  const ratingSum = behaviors.reduce((acc, b) => acc + b.rating, 0);
  const ratingAvg = Math.round((ratingSum / (traits.length * 5)) * 100);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerBox}>
           <PDFImage src={school.logo_url} style={styles.logo} />
           <View style={styles.headerText}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolDetails}>{school.address}</Text>
              <Text style={styles.schoolDetails}>{school.contact}</Text>
              <Text style={styles.termTitle}>{school.current_term} REPORT {school.current_session}</Text>
           </View>
           {student.photo_url && <PDFImage src={student.photo_url} style={styles.photo} />}
        </View>

        {/* INFO STRIP */}
        <View style={styles.infoStrip}>
           <Text style={styles.infoItem}>NAME: {student.name}</Text>
           <Text style={styles.infoItem}>ADM NO: {student.admission_no}</Text>
        </View>
        <View style={styles.infoStrip}>
           <Text style={styles.infoItem}>CLASS: {classInfo.name}</Text>
           <Text style={styles.infoItem}>AVG SCORE: {average}%</Text>
           <Text style={styles.infoItem}>CLASS SIZE: {classInfo.size}</Text>
           <Text style={styles.infoItem}>GENDER: {student.gender}</Text>
        </View>

        {/* ACADEMIC TABLE */}
        <View style={styles.table}>
           {/* Header */}
           <View style={[styles.row, styles.headerCell]}>
              <Text style={[styles.cell, styles.colSn]}>S/N</Text>
              <Text style={[styles.cell, styles.colSub]}>SUBJECTS</Text>
              <Text style={[styles.cell, styles.colSmall]}>NOTE</Text>
              <Text style={[styles.cell, styles.colSmall]}>CW</Text>
              <Text style={[styles.cell, styles.colSmall]}>HW</Text>
              <Text style={[styles.cell, styles.colSmall]}>TEST</Text>
              <Text style={[styles.cell, styles.colSmall]}>CA</Text>
              <Text style={[styles.cell, styles.colSmall]}>EXAM</Text>
              <Text style={[styles.cell, styles.colMed]}>TOTAL</Text>
              <Text style={[styles.cell, styles.colSmall]}>GRD</Text>
              <Text style={[styles.cell, styles.colRem]}>REMARKS</Text>
           </View>
           {/* Rows */}
           {results.map((r, i) => {
             const tot = r.score_note + r.score_cw + r.score_hw + r.score_test + r.score_ca + r.score_exam;
             return (
               <View key={i} style={styles.row}>
                  <Text style={[styles.cell, styles.colSn]}>{i+1}</Text>
                  <Text style={[styles.cell, styles.colSub]}>{r.subjects?.name || 'Subject'}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_note}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_cw}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_hw}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_test}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_ca}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.score_exam}</Text>
                  <Text style={[styles.cell, styles.colMed, {fontWeight:'bold'}]}>{tot}</Text>
                  <Text style={[styles.cell, styles.colSmall]}>{r.grade}</Text>
                  <Text style={[styles.cell, styles.colRem]}>{r.remarks}</Text>
               </View>
             );
           })}
        </View>

        {/* GRADING KEY */}
        <Text style={{fontSize: 6, textAlign:'center', backgroundColor: '#bfdbfe', border:'1px solid black', marginTop: 2}}>
           86-100 (A*) Excellent, 76-85 (A) Outstanding, 66-75 (B) Very Good, 60-65 (C) Good, 50-59 (D) Fair, 40-49 (E) Pass
        </Text>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>
           {/* LEFT: Comments */}
           <View style={styles.commentsCol}>
              <View style={styles.commentBox}>
                 <Text style={styles.commentLabel}>FORM TUTOR'S COMMENT</Text>
                 <Text style={{padding: 2}}>{comments?.tutor_comment}</Text>
              </View>
              <View style={styles.commentBox}>
                 <Text style={styles.commentLabel}>PRINCIPAL'S COMMENT</Text>
                 <Text style={{padding: 2}}>{comments?.principal_comment}</Text>
              </View>
              
              <View style={styles.footer}>
                 <View style={{alignItems:'center'}}>
                    <View style={styles.sigLine} />
                    <Text>Form Tutor</Text>
                 </View>
                 <View style={{alignItems:'center'}}>
                    <View style={styles.sigLine} />
                    <Text>Principal: {school.principal_name}</Text>
                 </View>
              </View>
           </View>

           {/* RIGHT: Behavior */}
           <View style={styles.behaviorCol}>
              <View style={[styles.behaviorRow, styles.headerCell]}>
                 <Text style={[styles.bCell, styles.bLabel]}>TRAIT</Text>
                 <Text style={[styles.bCell, styles.bCheck]}>5</Text>
                 <Text style={[styles.bCell, styles.bCheck]}>4</Text>
                 <Text style={[styles.bCell, styles.bCheck]}>3</Text>
                 <Text style={[styles.bCell, styles.bCheck]}>2</Text>
                 <Text style={[styles.bCell, styles.bCheck]}>1</Text>
              </View>
              {traits.map(t => {
                 const r = getRating(t);
                 return (
                  <View key={t} style={styles.behaviorRow}>
                    <Text style={[styles.bCell, styles.bLabel]}>{t}</Text>
                    <Text style={[styles.bCell, styles.bCheck]}>{r===5?'✓':''}</Text>
                    <Text style={[styles.bCell, styles.bCheck]}>{r===4?'✓':''}</Text>
                    <Text style={[styles.bCell, styles.bCheck]}>{r===3?'✓':''}</Text>
                    <Text style={[styles.bCell, styles.bCheck]}>{r===2?'✓':''}</Text>
                    <Text style={[styles.bCell, styles.bCheck]}>{r===1?'✓':''}</Text>
                  </View>
                 );
              })}
              <View style={{border:'1px solid black', marginTop: 2, padding: 4, alignItems:'center', backgroundColor:'#bfdbfe'}}>
                 <Text style={{fontWeight:'bold'}}>BEHAVIOURAL RATING</Text>
                 <Text style={{fontSize: 14, fontWeight:'bold', color:'red'}}>{ratingAvg}%</Text>
              </View>
           </View>
        </View>

      </Page>
    </Document>
  );
};

// ==========================================
// 2. PARENT PORTAL
// ==========================================
const ParentPortal = ({ onBack }) => {
   const [adm, setAdm] = useState('');
   const [pin, setPin] = useState('');
   const [data, setData] = useState(null);
   const [loading, setLoading] = useState(false);

   const checkResult = async (e) => {
      e.preventDefault();
      setLoading(true);
      // 1. Get Student
      const {data: stu} = await supabase.from('students').select(`*, schools(*), classes(*)`).eq('admission_no', adm).eq('parent_pin', pin).single();
      
      if(stu) {
         // 2. Get Data
         const {data: res} = await supabase.from('results').select(`*, subjects(*)`).eq('student_id', stu.id);
         const {data: beh} = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
         const {data: com} = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
         setData({ student: stu, school: stu.schools, classInfo: stu.classes, results: res, behaviors: beh, comments: com });
      } else {
         alert('Invalid Admission No or PIN');
      }
      setLoading(false);
   };

   return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
         {data ? (
            <div className="w-full h-screen bg-gray-900 p-4 rounded-xl">
               <button onClick={()=>setData(null)} className="text-white mb-2 underline">Close Result</button>
               <PDFViewer width="100%" height="100%">
                  <ResultPDF {...data} />
               </PDFViewer>
            </div>
         ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
               <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">Parent Portal</h2>
               <form onSubmit={checkResult} className="space-y-4">
                  <input placeholder="Admission Number" className="w-full p-3 border rounded-lg" value={adm} onChange={e=>setAdm(e.target.value)} required />
                  <input type="password" placeholder="Parent PIN" className="w-full p-3 border rounded-lg" value={pin} onChange={e=>setPin(e.target.value)} required />
                  <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">{loading?'Checking...':'View Result'}</button>
               </form>
               <button onClick={onBack} className="mt-4 text-sm text-gray-500 w-full text-center">Back to Staff Login</button>
            </div>
         )}
      </div>
   );
};

// ==========================================
// 3. ADMIN DASHBOARD
// ==========================================
const AdminDashboard = ({ profile }) => {
   const [view, setView] = useState('school'); // school, classes, students
   const [school, setSchool] = useState({});
   const [classes, setClasses] = useState([]);
   const [teachers, setTeachers] = useState([]);
   
   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      // Fetch School
      const {data: s} = await supabase.from('schools').select('*').single();
      setSchool(s || {});
      // Fetch Classes & Teachers
      const {data: c} = await supabase.from('classes').select(`*, profiles(full_name)`);
      setClasses(c || []);
      const {data: t} = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(t || []);
   };

   const saveSchool = async () => {
      await supabase.from('schools').upsert({ ...school, id: school.id || undefined }).select();
      alert('School Saved');
   };

   const createClass = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('classes').insert({ 
         name: fd.get('name'), 
         form_tutor_id: fd.get('tutor'),
         school_id: school.id 
      });
      fetchData();
   };

   const createStudent = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('students').insert({
         name: fd.get('name'),
         admission_no: fd.get('adm'),
         class_id: fd.get('class_id'),
         gender: fd.get('gender'),
         school_id: school.id
      });
      alert('Student Enrolled & Assigned to Class');
      e.target.reset();
   };

   return (
      <div className="p-8">
         <h1 className="text-3xl font-bold text-blue-900 mb-6">Admin Dashboard</h1>
         <div className="flex gap-4 mb-6">
            <button onClick={()=>setView('school')} className="btn-nav">School Info</button>
            <button onClick={()=>setView('classes')} className="btn-nav">Classes & Teachers</button>
            <button onClick={()=>setView('students')} className="btn-nav">Enroll Students</button>
         </div>

         {view === 'school' && (
            <div className="card">
               <h3 className="text-xl font-bold mb-4">School Details</h3>
               <div className="grid grid-cols-2 gap-4">
                  <input placeholder="School Name" className="input" value={school.name||''} onChange={e=>setSchool({...school, name:e.target.value})}/>
                  <input placeholder="Address" className="input" value={school.address||''} onChange={e=>setSchool({...school, address:e.target.value})}/>
                  <input placeholder="Logo URL" className="input" value={school.logo_url||''} onChange={e=>setSchool({...school, logo_url:e.target.value})}/>
                  <input placeholder="Principal Name" className="input" value={school.principal_name||''} onChange={e=>setSchool({...school, principal_name:e.target.value})}/>
               </div>
               <button onClick={saveSchool} className="btn-primary mt-4">Save Configuration</button>
            </div>
         )}

         {view === 'classes' && (
            <div className="grid md:grid-cols-2 gap-6">
               <div className="card">
                  <h3 className="font-bold mb-4">Create Class & Assign Tutor</h3>
                  <form onSubmit={createClass} className="space-y-4">
                     <input name="name" placeholder="Class Name (e.g. Year 12)" className="input" required />
                     <select name="tutor" className="input" required>
                        <option value="">Select Teacher...</option>
                        {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                     </select>
                     <button className="btn-primary w-full">Create Class</button>
                  </form>
               </div>
               <div className="card">
                  <h3 className="font-bold mb-4">Existing Classes</h3>
                  {classes.map(c => (
                     <div key={c.id} className="border-b p-2 flex justify-between">
                        <span>{c.name}</span>
                        <span className="text-sm text-gray-500">{c.profiles?.full_name || 'No Tutor'}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {view === 'students' && (
            <div className="card max-w-2xl">
               <h3 className="font-bold mb-4">Register Student</h3>
               <form onSubmit={createStudent} className="space-y-4">
                  <input name="name" placeholder="Full Name" className="input" required />
                  <input name="adm" placeholder="Admission No" className="input" required />
                  <select name="gender" className="input"><option>Male</option><option>Female</option></select>
                  <select name="class_id" className="input" required>
                     <option value="">Assign Class...</option>
                     {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="btn-primary w-full">Enroll Student</button>
               </form>
            </div>
         )}
      </div>
   );
};

// ==========================================
// 4. TEACHER DASHBOARD
// ==========================================
const TeacherDashboard = ({ profile }) => {
   const [myClass, setMyClass] = useState(null);
   const [subjects, setSubjects] = useState([]);
   const [students, setStudents] = useState([]);
   const [selectedStudent, setSelectedStudent] = useState(null);
   const [scores, setScores] = useState({}); // Local score state
   const [behaviors, setBehaviors] = useState([]);
   const [comments, setComments] = useState({});

   useEffect(() => {
      // Find class assigned to this teacher
      const init = async () => {
         const {data: cls} = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id).single();
         if(cls) {
            setMyClass(cls);
            // Fetch Subjects for this class
            const {data: sub} = await supabase.from('subjects').select('*').eq('class_id', cls.id);
            setSubjects(sub || []);
            // Fetch Students in this class
            const {data: stu} = await supabase.from('students').select('*').eq('class_id', cls.id);
            setStudents(stu || []);
         }
      };
      init();
   }, [profile]);

   const addSubject = async () => {
      const name = prompt("Subject Name:");
      if(name && myClass) {
         const {data} = await supabase.from('subjects').insert({class_id: myClass.id, name}).select();
         setSubjects([...subjects, ...data]);
      }
   };

   const loadStudentData = async (stu) => {
      setSelectedStudent(stu);
      // Fetch existing results
      const {data: res} = await supabase.from('results').select('*').eq('student_id', stu.id);
      const {data: beh} = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
      const {data: com} = await supabase.from('comments').select('*').eq('student_id', stu.id).single();

      // Init local state for inputs
      const scoreMap = {};
      subjects.forEach(sub => {
         const existing = res?.find(r => r.subject_id === sub.id) || {};
         scoreMap[sub.id] = {
            note: existing.score_note || 0,
            cw: existing.score_cw || 0,
            hw: existing.score_hw || 0,
            test: existing.score_test || 0,
            ca: existing.score_ca || 0,
            exam: existing.score_exam || 0
         };
      });
      setScores(scoreMap);
      setBehaviors(beh || []);
      setComments(com || {tutor_comment:'', principal_comment:''});
   };

   const saveAll = async () => {
      // Upsert Results
      const resPayload = subjects.map(sub => ({
         student_id: selectedStudent.id,
         subject_id: sub.id,
         score_note: scores[sub.id].note,
         score_cw: scores[sub.id].cw,
         score_hw: scores[sub.id].hw,
         score_test: scores[sub.id].test,
         score_ca: scores[sub.id].ca,
         score_exam: scores[sub.id].exam,
         // Auto grade logic
         grade: 'A', // Simplified for brevity
         remarks: 'Excellent'
      }));
      // Delete old scores for this student (simple upsert replacement)
      await supabase.from('results').delete().eq('student_id', selectedStudent.id);
      await supabase.from('results').insert(resPayload);
      
      // Upsert Comments
      await supabase.from('comments').delete().eq('student_id', selectedStudent.id);
      await supabase.from('comments').insert({student_id: selectedStudent.id, ...comments});

      alert('Result Saved!');
   };

   if(!myClass) return <div className="p-8">No class assigned to you yet. Contact Admin.</div>;

   return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
         {/* Sidebar List */}
         <div className="w-1/4 bg-white border-r p-4 overflow-y-auto">
            <h2 className="font-bold text-xl text-blue-900 mb-2">{myClass.name}</h2>
            <button onClick={addSubject} className="w-full mb-4 text-xs bg-blue-100 text-blue-700 py-2 rounded flex items-center justify-center gap-1"><Plus size={12}/> Add Subject</button>
            <h3 className="font-bold text-sm text-gray-500 mb-2">Students</h3>
            {students.map(s => (
               <div key={s.id} onClick={()=>loadStudentData(s)} className={`p-3 rounded cursor-pointer mb-1 ${selectedStudent?.id===s.id ? 'bg-blue-600 text-white':'hover:bg-gray-100'}`}>
                  {s.name}
               </div>
            ))}
         </div>

         {/* Editor Area */}
         <div className="flex-1 p-8 overflow-y-auto">
            {selectedStudent ? (
               <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                     <h1 className="text-2xl font-bold">{selectedStudent.name} - Result Entry</h1>
                     <button onClick={saveAll} className="btn-primary flex items-center gap-2"><Save size={16}/> Save Result</button>
                  </div>

                  {/* Score Grid */}
                  <div className="bg-white p-4 rounded shadow mb-6">
                     <div className="grid grid-cols-7 gap-2 font-bold text-xs text-center mb-2">
                        <div className="text-left col-span-1">Subject</div>
                        <div>Note (5)</div><div>CW (5)</div><div>HW (5)</div><div>Test (15)</div><div>CA (15)</div><div>Exam (60)</div>
                     </div>
                     {subjects.map(sub => (
                        <div key={sub.id} className="grid grid-cols-7 gap-2 mb-2 items-center">
                           <div className="text-sm font-bold">{sub.name}</div>
                           <input className="input-sm" type="number" value={scores[sub.id]?.note} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], note: parseFloat(e.target.value)}})} />
                           <input className="input-sm" type="number" value={scores[sub.id]?.cw} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], cw: parseFloat(e.target.value)}})} />
                           <input className="input-sm" type="number" value={scores[sub.id]?.hw} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], hw: parseFloat(e.target.value)}})} />
                           <input className="input-sm" type="number" value={scores[sub.id]?.test} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], test: parseFloat(e.target.value)}})} />
                           <input className="input-sm" type="number" value={scores[sub.id]?.ca} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], ca: parseFloat(e.target.value)}})} />
                           <input className="input-sm" type="number" value={scores[sub.id]?.exam} onChange={(e)=>setScores({...scores, [sub.id]: {...scores[sub.id], exam: parseFloat(e.target.value)}})} />
                        </div>
                     ))}
                  </div>

                  {/* Comments */}
                  <div className="bg-white p-4 rounded shadow">
                     <h3 className="font-bold mb-2">Remarks</h3>
                     <textarea className="input w-full mb-2" placeholder="Tutor's Comment" value={comments.tutor_comment} onChange={e=>setComments({...comments, tutor_comment:e.target.value})} />
                     <textarea className="input w-full" placeholder="Principal's Comment" value={comments.principal_comment} onChange={e=>setComments({...comments, principal_comment:e.target.value})} />
                  </div>
               </div>
            ) : (
               <div className="text-center text-gray-400 mt-20">Select a student to enter scores.</div>
            )}
         </div>
      </div>
   );
};

// ==========================================
// 5. AUTH & ROOT
// ==========================================
const Auth = ({ onLogin, onParent }) => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isRegister, setIsRegister] = useState(false);
   const [name, setName] = useState('');
   const [role, setRole] = useState('teacher'); // admin or teacher for signup

   const handleAuth = async (e) => {
      e.preventDefault();
      if(isRegister) {
         // Sign Up
         const {data, error} = await supabase.auth.signUp({email, password});
         if(error) return alert(error.message);
         // Create Profile
         await supabase.from('profiles').insert({id: data.user.id, full_name: name, role: role});
         alert('Registered! Please log in.');
         setIsRegister(false);
      } else {
         // Login
         const {error} = await supabase.auth.signInWithPassword({email, password});
         if(error) alert(error.message);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
         <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">{isRegister ? 'Staff Registration' : 'Staff Login'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
               {isRegister && (
                  <>
                     <input placeholder="Full Name" className="input" value={name} onChange={e=>setName(e.target.value)} required/>
                     <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                     </select>
                  </>
               )}
               <input type="email" placeholder="Email" className="input" value={email} onChange={e=>setEmail(e.target.value)} required/>
               <input type="password" placeholder="Password" className="input" value={password} onChange={e=>setPassword(e.target.value)} required/>
               <button className="btn-primary w-full">{isRegister ? 'Sign Up' : 'Login'}</button>
            </form>
            <div className="mt-4 text-center text-sm cursor-pointer text-blue-600" onClick={()=>setIsRegister(!isRegister)}>
               {isRegister ? 'Have an account? Login' : 'New Staff? Register'}
            </div>
            <div className="mt-6 pt-4 border-t text-center">
               <button onClick={onParent} className="text-green-600 font-bold flex items-center justify-center w-full gap-2"><User size={16}/> Parent Portal</button>
            </div>
         </div>
      </div>
   );
};

const App = () => {
   const [session, setSession] = useState(null);
   const [profile, setProfile] = useState(null);
   const [mode, setMode] = useState('auth'); // auth, parent

   useEffect(() => {
      supabase.auth.getSession().then(({data:{session}}) => checkUser(session));
      supabase.auth.onAuthStateChange((_e, session) => checkUser(session));
   }, []);

   const checkUser = async (session) => {
      setSession(session);
      if(session) {
         const {data} = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
         setProfile(data);
         setMode('dashboard');
      } else if (mode !== 'parent') {
         setMode('auth');
      }
   };

   if(mode === 'parent') return <ParentPortal onBack={()=>setMode('auth')} />;
   if(!session) return <Auth onParent={()=>setMode('parent')} />;
   if(!profile) return <div className="p-10">Loading Profile...</div>;

   if(profile.role === 'admin') return <AdminDashboard profile={profile} />;
   return <TeacherDashboard profile={profile} />;
};

export default App;

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, Font } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, UserPlus, FileText, 
  LayoutDashboard, LogOut, Save, Plus, Trash2, User, Lock, Loader2
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. PDF TEMPLATE (Cavendish Style)
// ==========================================
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  headerBox: { flexDirection: 'row', border: '2px solid red', padding: 5, marginBottom: 5 },
  logo: { width: 50, height: 50, marginRight: 10, objectFit:'contain' },
  headerText: { flex: 1, textAlign: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: '#1a365d', textTransform: 'uppercase' },
  schoolDetails: { fontSize: 7, fontWeight: 'bold', marginTop: 2 },
  termTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4, textDecoration: 'underline' },
  infoStrip: { flexDirection: 'row', backgroundColor: '#bfdbfe', border: '1px solid black', marginBottom: 2 },
  infoItem: { flex: 1, borderRight: '1px solid black', padding: 2, fontSize: 8, fontWeight: 'bold' },
  table: { width: '100%', borderTop: '1px solid black', borderLeft: '1px solid black' },
  row: { flexDirection: 'row' },
  cell: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: 2, textAlign: 'center', justifyContent: 'center' },
  colSn: { width: '3%' },
  colSub: { width: '25%', textAlign: 'left', paddingLeft: 4 },
  colSmall: { width: '6%', fontSize: 7 },
  colMed: { width: '7%' },
  colRem: { flex: 1, textAlign: 'left', paddingLeft: 4 },
  headerCell: { backgroundColor: '#bfdbfe', fontWeight: 'bold' },
  bottomSection: { flexDirection: 'row', marginTop: 5 },
  commentsCol: { width: '60%', paddingRight: 5 },
  behaviorCol: { width: '40%' },
  commentBox: { border: '1px solid black', marginBottom: 5, padding: 2, minHeight: 40 },
  commentLabel: { backgroundColor: '#bfdbfe', padding: 2, fontWeight: 'bold', fontSize: 7, borderBottom: '1px solid black' },
  behaviorRow: { flexDirection: 'row', borderBottom: '1px solid black', borderLeft: '1px solid black', borderRight: '1px solid black' },
  bCell: { borderRight: '1px solid black', padding: 2, textAlign: 'center' },
  bLabel: { width: '40%', textAlign: 'left', paddingLeft: 2, backgroundColor: '#eff6ff' },
  bCheck: { width: '10%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  sigLine: { borderBottom: '1px solid black', width: '40%', height: 20, marginBottom: 2, textAlign:'center' }
});

const ResultPDF = ({ school, student, results, behaviors, comments, classInfo }) => {
  const totalScore = results.reduce((acc, r) => acc + (r.score_note+r.score_cw+r.score_hw+r.score_test+r.score_ca+r.score_exam), 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
  const getRating = (t) => behaviors.find(b => b.trait === t)?.rating || 0;
  
  // Calculate percentage for behavior
  const behaviorTotal = behaviors.reduce((acc, b) => acc + b.rating, 0);
  const behaviorMax = traits.length * 5;
  const behaviorPercent = behaviorMax > 0 ? Math.round((behaviorTotal / behaviorMax) * 100) : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
           {school.logo_url && <PDFImage src={school.logo_url} style={styles.logo} />}
           <View style={styles.headerText}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolDetails}>{school.address}</Text>
              <Text style={styles.schoolDetails}>{school.contact}</Text>
              <Text style={styles.termTitle}>{school.current_term} REPORT {school.current_session}</Text>
           </View>
        </View>
        <View style={styles.infoStrip}>
           <Text style={styles.infoItem}>NAME: {student.name}</Text>
           <Text style={styles.infoItem}>ADM NO: {student.admission_no}</Text>
           <Text style={styles.infoItem}>CLASS: {classInfo?.name}</Text>
        </View>
        <View style={styles.infoStrip}>
           <Text style={styles.infoItem}>AVG SCORE: {average}%</Text>
           <Text style={styles.infoItem}>CLASS SIZE: {classInfo?.size || 0}</Text>
           <Text style={styles.infoItem}>GENDER: {student.gender}</Text>
        </View>
        <View style={styles.table}>
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
        <Text style={{fontSize: 6, textAlign:'center', backgroundColor: '#bfdbfe', border:'1px solid black', marginTop: 2}}>
           86-100 (A*) Excellent, 76-85 (A) Outstanding, 66-75 (B) Very Good, 60-65 (C) Good, 50-59 (D) Fair, 40-49 (E) Pass
        </Text>
        <View style={styles.bottomSection}>
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
                 <View style={{alignItems:'center', width:'45%'}}>
                    <Text style={{marginBottom:15}}>{classInfo?.profiles?.full_name}</Text>
                    <View style={styles.sigLine} />
                    <Text>Form Tutor</Text>
                 </View>
                 <View style={{alignItems:'center', width:'45%'}}>
                    <Text style={{marginBottom:15}}>{school.principal_name}</Text>
                    <View style={styles.sigLine} />
                    <Text>Principal</Text>
                 </View>
              </View>
           </View>
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
                 <Text style={{fontSize: 14, fontWeight:'bold', color:'red'}}>{behaviorPercent}%</Text>
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
      const {data: stu} = await supabase.from('students').select(`*, schools(*), classes(*)`).eq('admission_no', adm).eq('parent_pin', pin).single();
      if(stu) {
         const {data: res} = await supabase.from('results').select(`*, subjects(*)`).eq('student_id', stu.id);
         const {data: beh} = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
         const {data: com} = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
         const {data: tutor} = await supabase.from('profiles').select('full_name').eq('id', stu.classes?.form_tutor_id).single();
         // Attach tutor name to class info for PDF
         if (stu.classes) stu.classes.profiles = tutor;

         setData({ student: stu, school: stu.schools, classInfo: stu.classes, results: res, behaviors: beh, comments: com });
      } else {
         alert('Invalid details');
      }
      setLoading(false);
   };

   return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
         {data ? (
            <div className="w-full h-screen bg-gray-900 p-4 rounded-xl relative">
               <button onClick={()=>setData(null)} className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded z-10">Close</button>
               <PDFViewer width="100%" height="100%">
                  <ResultPDF {...data} />
               </PDFViewer>
            </div>
         ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
               <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">Parent Portal</h2>
               <form onSubmit={checkResult} className="space-y-4">
                  <input placeholder="Admission Number" className="input" value={adm} onChange={e=>setAdm(e.target.value)} required />
                  <input type="password" placeholder="Parent PIN" className="input" value={pin} onChange={e=>setPin(e.target.value)} required />
                  <button className="btn-primary w-full">{loading?'Checking...':'View Result'}</button>
               </form>
               <button onClick={onBack} className="mt-4 text-sm text-gray-500 w-full text-center">Back to Staff Login</button>
            </div>
         )}
      </div>
   );
};

// ==========================================
// 3. ADMIN & TEACHER DASHBOARDS
// ==========================================
const AdminDashboard = ({ profile }) => {
   const [view, setView] = useState('school');
   const [school, setSchool] = useState({});
   const [classes, setClasses] = useState([]);
   const [teachers, setTeachers] = useState([]);

   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      const {data: s} = await supabase.from('schools').select('*').single();
      setSchool(s || {});
      const {data: c} = await supabase.from('classes').select(`*, profiles(full_name)`);
      setClasses(c || []);
      const {data: t} = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(t || []);
   };

   const saveSchool = async () => {
      await supabase.from('schools').upsert({ ...school, id: school.id || undefined }).select();
      alert('School Info Saved');
   };

   const createClass = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('classes').insert({ name: fd.get('name'), form_tutor_id: fd.get('tutor'), school_id: school.id });
      fetchData();
      e.target.reset();
   };

   const createStudent = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('students').insert({
         name: fd.get('name'), admission_no: fd.get('adm'), class_id: fd.get('class_id'),
         gender: fd.get('gender'), parent_pin: fd.get('pin'), school_id: school.id
      });
      alert('Student Created');
      e.target.reset();
   };

   return (
      <div className="p-8 bg-gray-50 min-h-screen">
         <h1 className="text-3xl font-bold text-blue-900 mb-6">Admin Dashboard</h1>
         <div className="flex gap-4 mb-6">
            <button onClick={()=>setView('school')} className={`btn-nav ${view==='school'?'bg-blue-200':''}`}>School Info</button>
            <button onClick={()=>setView('classes')} className={`btn-nav ${view==='classes'?'bg-blue-200':''}`}>Classes</button>
            <button onClick={()=>setView('students')} className={`btn-nav ${view==='students'?'bg-blue-200':''}`}>Students</button>
            <button onClick={()=>supabase.auth.signOut()} className="btn-nav text-red-600 ml-auto">Logout</button>
         </div>

         {view === 'school' && (
            <div className="card max-w-2xl">
               <h3 className="font-bold mb-4">School Configuration</h3>
               <div className="space-y-4">
                  <input placeholder="School Name" className="input" value={school.name||''} onChange={e=>setSchool({...school, name:e.target.value})}/>
                  <input placeholder="Address" className="input" value={school.address||''} onChange={e=>setSchool({...school, address:e.target.value})}/>
                  <input placeholder="Contact Phone/Email" className="input" value={school.contact||''} onChange={e=>setSchool({...school, contact:e.target.value})}/>
                  <input placeholder="Logo URL" className="input" value={school.logo_url||''} onChange={e=>setSchool({...school, logo_url:e.target.value})}/>
                  <input placeholder="Principal Name" className="input" value={school.principal_name||''} onChange={e=>setSchool({...school, principal_name:e.target.value})}/>
                  <div className="flex gap-2">
                     <input placeholder="Current Term" className="input" value={school.current_term||''} onChange={e=>setSchool({...school, current_term:e.target.value})}/>
                     <input placeholder="Session (2025/2026)" className="input" value={school.current_session||''} onChange={e=>setSchool({...school, current_session:e.target.value})}/>
                  </div>
                  <button onClick={saveSchool} className="btn-primary">Save Changes</button>
               </div>
            </div>
         )}

         {view === 'classes' && (
            <div className="grid md:grid-cols-2 gap-6">
               <div className="card">
                  <h3 className="font-bold mb-4">Add Class</h3>
                  <form onSubmit={createClass} className="space-y-4">
                     <input name="name" placeholder="Class Name (e.g. Year 12)" className="input" required />
                     <select name="tutor" className="input" required>
                        <option value="">Select Tutor...</option>
                        {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                     </select>
                     <button className="btn-primary w-full">Create Class</button>
                  </form>
               </div>
               <div className="card">
                  <h3 className="font-bold mb-4">Class List</h3>
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
                  <div className="flex gap-2">
                     <input name="adm" placeholder="Admission No" className="input" required />
                     <input name="pin" placeholder="Parent PIN" className="input" required />
                  </div>
                  <div className="flex gap-2">
                     <select name="gender" className="input"><option>Male</option><option>Female</option></select>
                     <select name="class_id" className="input" required>
                        <option value="">Assign Class...</option>
                        {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <button className="btn-primary w-full">Enroll Student</button>
               </form>
            </div>
         )}
      </div>
   );
};

const TeacherDashboard = ({ profile }) => {
   const [myClass, setMyClass] = useState(null);
   const [subjects, setSubjects] = useState([]);
   const [students, setStudents] = useState([]);
   const [selectedStudent, setSelectedStudent] = useState(null);
   const [scores, setScores] = useState({});
   const [behaviors, setBehaviors] = useState([]);
   const [comments, setComments] = useState({});
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const init = async () => {
         const {data: cls} = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id).single();
         if(cls) {
            setMyClass(cls);
            const {data: sub} = await supabase.from('subjects').select('*').eq('class_id', cls.id);
            setSubjects(sub || []);
            const {data: stu} = await supabase.from('students').select('*').eq('class_id', cls.id);
            setStudents(stu || []);
         }
         setLoading(false);
      };
      init();
   }, [profile]);

   const addSubject = async () => {
      const name = prompt("Enter Subject Name:");
      if(name && myClass) {
         const {data} = await supabase.from('subjects').insert({class_id: myClass.id, name}).select();
         setSubjects([...subjects, ...data]);
      }
   };

   const loadStudent = async (stu) => {
      setSelectedStudent(stu);
      const {data: res} = await supabase.from('results').select('*').eq('student_id', stu.id);
      const {data: beh} = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
      const {data: com} = await supabase.from('comments').select('*').eq('student_id', stu.id).single();

      const scoreMap = {};
      subjects.forEach(sub => {
         const existing = res?.find(r => r.subject_id === sub.id) || {};
         scoreMap[sub.id] = {
            note: existing.score_note || 0, cw: existing.score_cw || 0, hw: existing.score_hw || 0,
            test: existing.score_test || 0, ca: existing.score_ca || 0, exam: existing.score_exam || 0
         };
      });
      setScores(scoreMap);
      setBehaviors(beh || []);
      setComments(com || {tutor_comment:'', principal_comment:''});
   };

   const updateScore = (subId, field, val) => {
      setScores(prev => ({
         ...prev, [subId]: { ...prev[subId], [field]: parseFloat(val) || 0 }
      }));
   };

   const toggleBehavior = (trait, rating) => {
      const existing = behaviors.find(b => b.trait === trait);
      if(existing && existing.rating === rating) return; // no change
      
      const newBeh = behaviors.filter(b => b.trait !== trait);
      newBeh.push({ trait, rating });
      setBehaviors(newBeh);
   };

   const saveResult = async () => {
      // 1. Results
      const resPayload = subjects.map(sub => {
         const s = scores[sub.id];
         const tot = s.note + s.cw + s.hw + s.test + s.ca + s.exam;
         // Simple Grading
         let g = 'F', r = 'Fail';
         if(tot>=86){g='A*';r='Excellent';} else if(tot>=76){g='A';r='Outstanding';} else if(tot>=66){g='B';r='Very Good';}
         else if(tot>=60){g='C';r='Good';} else if(tot>=50){g='D';r='Fair';} else if(tot>=40){g='E';r='Pass';}

         return {
            student_id: selectedStudent.id, subject_id: sub.id,
            score_note: s.note, score_cw: s.cw, score_hw: s.hw, score_test: s.test, score_ca: s.ca, score_exam: s.exam,
            grade: g, remarks: r
         };
      });
      await supabase.from('results').delete().eq('student_id', selectedStudent.id);
      await supabase.from('results').insert(resPayload);

      // 2. Behaviors
      const behPayload = behaviors.map(b => ({ student_id: selectedStudent.id, trait: b.trait, rating: b.rating }));
      await supabase.from('behaviorals').delete().eq('student_id', selectedStudent.id);
      await supabase.from('behaviorals').insert(behPayload);

      // 3. Comments
      await supabase.from('comments').delete().eq('student_id', selectedStudent.id);
      await supabase.from('comments').insert({ student_id: selectedStudent.id, ...comments });

      alert('Results Saved!');
   };

   if(loading) return <div className="p-10">Loading Class...</div>;
   if(!myClass) return <div className="p-10 text-red-600">No class assigned. Contact Admin to assign you a class. <button onClick={()=>supabase.auth.signOut()} className="underline ml-2">Logout</button></div>;

   const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];

   return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
         <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <h2 className="font-bold text-xl text-blue-900 mb-2">{myClass.name}</h2>
            <div className="text-sm text-gray-500 mb-4">{profile.full_name}</div>
            <button onClick={addSubject} className="btn-nav w-full text-xs mb-4 flex items-center justify-center gap-1"><Plus size={12}/> Add Subject</button>
            <div className="space-y-1">
               {students.map(s => (
                  <div key={s.id} onClick={()=>loadStudent(s)} className={`p-2 rounded cursor-pointer text-sm ${selectedStudent?.id===s.id?'bg-blue-600 text-white':'hover:bg-gray-100'}`}>
                     {s.name}
                  </div>
               ))}
            </div>
            <button onClick={()=>supabase.auth.signOut()} className="mt-8 text-red-500 text-sm flex items-center gap-1"><LogOut size={12}/> Logout</button>
         </div>

         <div className="flex-1 p-6 overflow-y-auto">
            {selectedStudent ? (
               <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                     <button onClick={saveResult} className="btn-primary flex items-center gap-2"><Save size={16}/> Save Report</button>
                  </div>
                  
                  {/* Scores */}
                  <div className="mb-6">
                     <h3 className="font-bold mb-2 border-b pb-1">Academic Scores</h3>
                     <div className="grid grid-cols-7 gap-2 text-xs font-bold text-center mb-2">
                        <div className="text-left">Subject</div>
                        <div>Note(5)</div><div>CW(5)</div><div>HW(5)</div><div>Test(15)</div><div>CA(15)</div><div>Exam(60)</div>
                     </div>
                     {subjects.map(sub => (
                        <div key={sub.id} className="grid grid-cols-7 gap-2 mb-2 items-center">
                           <div className="text-sm font-bold truncate">{sub.name}</div>
                           {['note','cw','hw','test','ca','exam'].map(f => (
                              <input key={f} type="number" className="input-sm" value={scores[sub.id]?.[f]||0} onChange={e=>updateScore(sub.id, f, e.target.value)} />
                           ))}
                        </div>
                     ))}
                  </div>

                  {/* Behavior & Comments */}
                  <div className="grid md:grid-cols-2 gap-6">
                     <div>
                        <h3 className="font-bold mb-2 border-b pb-1">Behavioral Ratings (1-5)</h3>
                        {traits.map(t => {
                           const current = behaviors.find(b=>b.trait===t)?.rating || 0;
                           return (
                              <div key={t} className="flex justify-between items-center mb-1 text-sm">
                                 <span>{t}</span>
                                 <div className="flex gap-1">
                                    {[1,2,3,4,5].map(r => (
                                       <button key={r} onClick={()=>toggleBehavior(t, r)} 
                                          className={`w-6 h-6 rounded border ${current===r?'bg-blue-600 text-white':'bg-gray-100'}`}>{r}</button>
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                     <div>
                        <h3 className="font-bold mb-2 border-b pb-1">Comments</h3>
                        <textarea className="input mb-2" placeholder="Tutor Comment" value={comments.tutor_comment||''} onChange={e=>setComments({...comments, tutor_comment:e.target.value})} />
                        <textarea className="input" placeholder="Principal Comment" value={comments.principal_comment||''} onChange={e=>setComments({...comments, principal_comment:e.target.value})} />
                     </div>
                  </div>
               </div>
            ) : (
               <div className="flex items-center justify-center h-full text-gray-400">Select a student from the sidebar</div>
            )}
         </div>
      </div>
   );
};

// ==========================================
// 4. AUTH & MAIN WRAPPER
// ==========================================
const Auth = ({ onMode }) => {
   const [isReg, setIsReg] = useState(false);
   const [email, setEmail] = useState('');
   const [pass, setPass] = useState('');
   const [name, setName] = useState('');
   const [role, setRole] = useState('teacher');
   const [loading, setLoading] = useState(false);

   const handleAuth = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         if(isReg) {
            // Register
            const {data, error} = await supabase.auth.signUp({email, password: pass});
            if(error) throw error;
            // INSERT PROFILE MANUALLY TO FIX "STUCK" ISSUE
            if (data?.user) {
               const { error: profError } = await supabase.from('profiles').insert({
                  id: data.user.id, full_name: name, role: role
               });
               if(profError) throw profError;
               alert('Registration Successful! Please Log in.');
               setIsReg(false);
            }
         } else {
            // Login
            const {error} = await supabase.auth.signInWithPassword({email, password: pass});
            if(error) throw error;
         }
      } catch(err) {
         alert(err.message);
      }
      setLoading(false);
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
         <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">{isReg?'Staff Register':'Staff Login'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
               {isReg && (
                  <>
                     <input placeholder="Full Name" className="input" value={name} onChange={e=>setName(e.target.value)} required />
                     <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                     </select>
                  </>
               )}
               <input type="email" placeholder="Email" className="input" value={email} onChange={e=>setEmail(e.target.value)} required />
               <input type="password" placeholder="Password" className="input" value={pass} onChange={e=>setPass(e.target.value)} required />
               <button disabled={loading} className="btn-primary w-full">{loading?'Processing...':(isReg?'Sign Up':'Login')}</button>
            </form>
            <div className="mt-4 text-center text-sm text-blue-600 cursor-pointer" onClick={()=>setIsReg(!isReg)}>
               {isReg ? 'Have account? Login' : 'New Staff? Register'}
            </div>
            <button onClick={()=>onMode('parent')} className="mt-6 w-full py-2 border rounded text-green-700 font-bold">Parent Portal</button>
         </div>
      </div>
   );
};

const App = () => {
   const [session, setSession] = useState(null);
   const [profile, setProfile] = useState(null);
   const [mode, setMode] = useState('auth'); // auth, parent, dashboard
   const [checking, setChecking] = useState(true);

   useEffect(() => {
      supabase.auth.getSession().then(({data:{session}}) => checkUser(session));
      const {data:{subscription}} = supabase.auth.onAuthStateChange((_e, session) => checkUser(session));
      return () => subscription.unsubscribe();
   }, []);

   const checkUser = async (sess) => {
      setSession(sess);
      if(sess) {
         // Fetch profile with error handling
         const {data, error} = await supabase.from('profiles').select('*').eq('id', sess.user.id).single();
         if(error || !data) {
            // Fallback: If profile missing (race condition), show error or try to auto-fix
            console.error("Profile missing", error);
            // Optional: You could redirect to a 'Complete Profile' page here
            setProfile(null); 
         } else {
            setProfile(data);
            setMode('dashboard');
         }
      } else {
         setProfile(null);
         if(mode !== 'parent') setMode('auth');
      }
      setChecking(false);
   };

   if(checking) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin mr-2"/> Loading...</div>;

   // Handle the "Stuck" state gracefully
   if(session && !profile) {
      return (
         <div className="flex h-screen items-center justify-center flex-col">
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-500 mb-4">Your account exists but has no profile data.</p>
            <button onClick={()=>supabase.auth.signOut()} className="btn-primary">Sign Out & Register Again</button>
         </div>
      );
   }

   if(mode === 'parent') return <ParentPortal onBack={()=>setMode('auth')} />;
   if(!session) return <Auth onMode={setMode} />;

   return profile.role === 'admin' ? <AdminDashboard profile={profile} /> : <TeacherDashboard profile={profile} />;
};

export default App;

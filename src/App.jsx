import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, Save, Plus, LogOut, User, Loader2, AlertCircle
} from 'lucide-react';

// ==========================================
// ⚠️ REPLACE KEYS
// ==========================================
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE'; 
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. PDF TEMPLATE (Unchanged)
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
  const behaviorTotal = behaviors.reduce((acc, b) => acc + b.rating, 0);
  const behaviorPercent = Math.round((behaviorTotal / (traits.length * 5)) * 100);

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
         if(stu.classes?.form_tutor_id) {
             const {data:t} = await supabase.from('profiles').select('full_name').eq('id', stu.classes.form_tutor_id).single();
             if(t && stu.classes) stu.classes.profiles = t;
         }
         setData({ student: stu, school: stu.schools, classInfo: stu.classes, results: res, behaviors: beh, comments: com });
      } else {
         alert('Invalid Admission No or PIN');
      }
      setLoading(false);
   };

   if(data) {
      return (
         <div className="w-full h-screen bg-gray-900 p-4 rounded-xl relative">
            <button onClick={()=>setData(null)} className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded z-50">Close</button>
            <PDFViewer width="100%" height="100%"><ResultPDF {...data} /></PDFViewer>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
         <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">Parent Portal</h2>
            <form onSubmit={checkResult} className="space-y-4">
               <input placeholder="Admission Number" className="w-full p-3 border rounded" value={adm} onChange={e=>setAdm(e.target.value)} required />
               <input type="password" placeholder="PIN" className="w-full p-3 border rounded" value={pin} onChange={e=>setPin(e.target.value)} required />
               <button className="w-full bg-blue-600 text-white p-3 rounded font-bold">{loading?'Checking...':'View Result'}</button>
            </form>
            <button onClick={onBack} className="mt-4 text-sm text-gray-500 w-full text-center">Back to Staff Login</button>
         </div>
      </div>
   );
};

// ==========================================
// 3. ADMIN DASHBOARD
// ==========================================
const AdminDashboard = ({ profile, doLogout }) => {
   const [view, setView] = useState('school');
   const [school, setSchool] = useState({});
   const [classes, setClasses] = useState([]);
   const [teachers, setTeachers] = useState([]);

   useEffect(() => { fetchAll(); }, []);

   const fetchAll = async () => {
      const {data: s} = await supabase.from('schools').select('*').single();
      setSchool(s||{});
      const {data: c} = await supabase.from('classes').select(`*, profiles(full_name)`);
      setClasses(c||[]);
      const {data: t} = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(t||[]);
   };

   const saveSchool = async () => {
      await supabase.from('schools').upsert({...school, id: school.id||undefined});
      alert('Saved');
   };

   const addClass = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('classes').insert({name: fd.get('name'), form_tutor_id: fd.get('tutor'), school_id: school.id});
      fetchAll(); e.target.reset();
   };

   const addStudent = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await supabase.from('students').insert({
         name: fd.get('name'), admission_no: fd.get('adm'), class_id: fd.get('class_id'),
         gender: fd.get('gender'), parent_pin: fd.get('pin'), school_id: school.id
      });
      alert('Student Added'); e.target.reset();
   };

   return (
      <div className="p-6 bg-gray-50 min-h-screen">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
            <button onClick={doLogout} className="text-red-500 font-bold flex items-center gap-1"><LogOut size={16}/> Logout</button>
         </div>
         <div className="flex gap-4 mb-6">
            {['school','classes','students'].map(v => (
               <button key={v} onClick={()=>setView(v)} className={`px-4 py-2 rounded capitalize ${view===v?'bg-blue-600 text-white':'bg-white'}`}>{v}</button>
            ))}
         </div>

         {view === 'school' && (
            <div className="bg-white p-6 rounded shadow max-w-lg space-y-4">
               <input className="w-full p-2 border rounded" placeholder="School Name" value={school.name||''} onChange={e=>setSchool({...school, name:e.target.value})} />
               <input className="w-full p-2 border rounded" placeholder="Address" value={school.address||''} onChange={e=>setSchool({...school, address:e.target.value})} />
               <input className="w-full p-2 border rounded" placeholder="Contact" value={school.contact||''} onChange={e=>setSchool({...school, contact:e.target.value})} />
               <input className="w-full p-2 border rounded" placeholder="Logo URL" value={school.logo_url||''} onChange={e=>setSchool({...school, logo_url:e.target.value})} />
               <input className="w-full p-2 border rounded" placeholder="Principal Name" value={school.principal_name||''} onChange={e=>setSchool({...school, principal_name:e.target.value})} />
               <button onClick={saveSchool} className="w-full bg-blue-600 text-white p-2 rounded">Save School Info</button>
            </div>
         )}

         {view === 'classes' && (
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded shadow">
                  <h3 className="font-bold mb-4">Create Class</h3>
                  <form onSubmit={addClass} className="space-y-4">
                     <input name="name" className="w-full p-2 border rounded" placeholder="Class Name" required />
                     <select name="tutor" className="w-full p-2 border rounded" required>
                        <option value="">Select Tutor</option>
                        {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                     </select>
                     <button className="w-full bg-green-600 text-white p-2 rounded">Create Class</button>
                  </form>
               </div>
               <div className="bg-white p-6 rounded shadow">
                  <h3 className="font-bold mb-4">Existing Classes</h3>
                  {classes.map(c=>(
                     <div key={c.id} className="border-b p-2 flex justify-between">
                        <span>{c.name}</span><span className="text-gray-500 text-sm">{c.profiles?.full_name}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {view === 'students' && (
            <div className="bg-white p-6 rounded shadow max-w-lg">
               <h3 className="font-bold mb-4">Register Student</h3>
               <form onSubmit={addStudent} className="space-y-4">
                  <input name="name" className="w-full p-2 border rounded" placeholder="Full Name" required />
                  <div className="flex gap-2">
                     <input name="adm" className="w-full p-2 border rounded" placeholder="Adm No" required />
                     <input name="pin" className="w-full p-2 border rounded" placeholder="PIN" required />
                  </div>
                  <div className="flex gap-2">
                     <select name="gender" className="w-full p-2 border rounded"><option>Male</option><option>Female</option></select>
                     <select name="class_id" className="w-full p-2 border rounded" required>
                        <option value="">Select Class</option>
                        {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <button className="w-full bg-blue-600 text-white p-2 rounded">Enroll</button>
               </form>
            </div>
         )}
      </div>
   );
};

// ==========================================
// 4. TEACHER DASHBOARD
// ==========================================
const TeacherDashboard = ({ profile, doLogout }) => {
   const [myClass, setMyClass] = useState(null);
   const [subjects, setSubjects] = useState([]);
   const [students, setStudents] = useState([]);
   const [selStu, setSelStu] = useState(null);
   const [scores, setScores] = useState({});
   const [beh, setBeh] = useState([]);
   const [comm, setComm] = useState({});
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const init = async () => {
         const {data:c} = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id).single();
         if(c){
            setMyClass(c);
            const {data:s} = await supabase.from('subjects').select('*').eq('class_id', c.id);
            setSubjects(s||[]);
            const {data:st} = await supabase.from('students').select('*').eq('class_id', c.id);
            setStudents(st||[]);
         }
         setLoading(false);
      };
      init();
   }, [profile]);

   const addSub = async () => {
      const n = prompt("Subject Name:");
      if(n && myClass) {
         const {data} = await supabase.from('subjects').insert({class_id: myClass.id, name: n}).select();
         setSubjects([...subjects, ...data]);
      }
   };

   const loadStu = async (stu) => {
      setSelStu(stu);
      const {data:r} = await supabase.from('results').select('*').eq('student_id', stu.id);
      const {data:b} = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
      const {data:c} = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
      
      const map = {};
      subjects.forEach(s => {
         const ex = r?.find(x => x.subject_id === s.id) || {};
         map[s.id] = { note: ex.score_note||0, cw: ex.score_cw||0, hw: ex.score_hw||0, test: ex.score_test||0, ca: ex.score_ca||0, exam: ex.score_exam||0 };
      });
      setScores(map); setBeh(b||[]); setComm(c||{tutor_comment:'', principal_comment:''});
   };

   const save = async () => {
      const rPay = subjects.map(s => {
         const v = scores[s.id];
         const t = v.note+v.cw+v.hw+v.test+v.ca+v.exam;
         let g='F', m='Fail';
         if(t>=86){g='A*';m='Excellent';} else if(t>=76){g='A';m='Outstanding';} else if(t>=66){g='B';m='Very Good';}
         else if(t>=60){g='C';m='Good';} else if(t>=50){g='D';m='Fair';} else if(t>=40){g='E';m='Pass';}
         return { student_id: selStu.id, subject_id: s.id, score_note: v.note, score_cw: v.cw, score_hw: v.hw, score_test: v.test, score_ca: v.ca, score_exam: v.exam, grade: g, remarks: m };
      });
      await supabase.from('results').delete().eq('student_id', selStu.id);
      await supabase.from('results').insert(rPay);

      const bPay = beh.map(b => ({student_id: selStu.id, trait: b.trait, rating: b.rating}));
      await supabase.from('behaviorals').delete().eq('student_id', selStu.id);
      await supabase.from('behaviorals').insert(bPay);

      await supabase.from('comments').delete().eq('student_id', selStu.id);
      await supabase.from('comments').insert({student_id: selStu.id, ...comm});
      alert('Saved!');
   };

   const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
   const toggleBeh = (t, r) => {
      const list = beh.filter(x => x.trait !== t);
      list.push({trait: t, rating: r});
      setBeh(list);
   };

   if(loading) return <div className="p-10">Loading...</div>;
   if(!myClass) return <div className="p-10 text-red-500">No Class Assigned. <button onClick={doLogout} className="underline">Logout</button></div>;

   return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
         <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <h2 className="font-bold text-xl text-blue-900 mb-2">{myClass.name}</h2>
            <button onClick={addSub} className="w-full mb-4 bg-gray-100 py-2 rounded text-xs flex justify-center gap-1"><Plus size={14}/> Add Subject</button>
            {students.map(s => (
               <div key={s.id} onClick={()=>loadStu(s)} className={`p-2 mb-1 rounded cursor-pointer ${selStu?.id===s.id?'bg-blue-600 text-white':'hover:bg-gray-100'}`}>{s.name}</div>
            ))}
            <button onClick={doLogout} className="mt-8 text-red-500 text-sm flex items-center gap-1"><LogOut size={14}/> Logout</button>
         </div>
         <div className="flex-1 p-6 overflow-y-auto">
            {selStu ? (
               <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold">{selStu.name}</h2>
                     <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Save size={16}/> Save</button>
                  </div>
                  <div className="mb-6">
                     <div className="grid grid-cols-7 gap-1 font-bold text-xs mb-2 text-center">
                        <div className="text-left">Subject</div><div>Nt(5)</div><div>CW(5)</div><div>HW(5)</div><div>Ts(15)</div><div>CA(15)</div><div>Ex(60)</div>
                     </div>
                     {subjects.map(s => (
                        <div key={s.id} className="grid grid-cols-7 gap-1 mb-2 items-center">
                           <div className="text-sm font-bold truncate">{s.name}</div>
                           {['note','cw','hw','test','ca','exam'].map(f => (
                              <input key={f} type="number" className="w-full p-1 border rounded text-center text-sm" value={scores[s.id]?.[f]||''} onChange={e=>setScores({...scores, [s.id]: {...scores[s.id], [f]: parseFloat(e.target.value)||0}})} />
                           ))}
                        </div>
                     ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     <div>
                        <h3 className="font-bold mb-2">Behavior</h3>
                        {traits.map(t => {
                           const cur = beh.find(x=>x.trait===t)?.rating;
                           return (
                              <div key={t} className="flex justify-between items-center text-sm mb-1">
                                 <span>{t}</span>
                                 <div className="flex gap-1">
                                    {[1,2,3,4,5].map(r=><button key={r} onClick={()=>toggleBeh(t,r)} className={`w-5 h-5 rounded border text-xs ${cur===r?'bg-blue-600 text-white':'bg-gray-50'}`}>{r}</button>)}
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                     <div>
                        <h3 className="font-bold mb-2">Comments</h3>
                        <textarea className="w-full p-2 border rounded mb-2" placeholder="Tutor" value={comm.tutor_comment||''} onChange={e=>setComm({...comm, tutor_comment:e.target.value})}/>
                        <textarea className="w-full p-2 border rounded" placeholder="Principal" value={comm.principal_comment||''} onChange={e=>setComm({...comm, principal_comment:e.target.value})}/>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="text-center text-gray-400 mt-20">Select Student</div>
            )}
         </div>
      </div>
   );
};

// ==========================================
// 5. AUTH & ROOT
// ==========================================
const Auth = ({ onMode }) => {
   const [isReg, setIsReg] = useState(false);
   const [email, setEmail] = useState('');
   const [pass, setPass] = useState('');
   const [name, setName] = useState('');
   const [role, setRole] = useState('teacher');
   const [loading, setLoading] = useState(false);

   const sub = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
         if(isReg) {
            const {data, error} = await supabase.auth.signUp({email, password: pass});
            if(error) throw error;
            if(data?.user) {
               await supabase.from('profiles').insert({id: data.user.id, full_name: name, role});
               alert('Registered! Please Login'); setIsReg(false);
            }
         } else {
            const {error} = await supabase.auth.signInWithPassword({email, password: pass});
            if(error) throw error;
         }
      } catch(e){ alert(e.message); }
      setLoading(false);
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
         <div className="bg-white p-8 rounded shadow w-full max-w-sm">
            <h2 className="text-xl font-bold text-center mb-4">{isReg?'Staff Register':'Staff Login'}</h2>
            <form onSubmit={sub} className="space-y-4">
               {isReg && (
                  <>
                     <input placeholder="Full Name" className="w-full p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} required />
                     <select className="w-full p-2 border rounded" value={role} onChange={e=>setRole(e.target.value)}><option value="teacher">Teacher</option><option value="admin">Admin</option></select>
                  </>
               )}
               <input placeholder="Email" className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} required />
               <input type="password" placeholder="Password" className="w-full p-2 border rounded" value={pass} onChange={e=>setPass(e.target.value)} required />
               <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold">{loading?'...':(isReg?'Sign Up':'Login')}</button>
            </form>
            <div className="mt-4 text-center text-sm text-blue-600 cursor-pointer" onClick={()=>setIsReg(!isReg)}>{isReg?'Login':'Create Account'}</div>
            <button onClick={()=>onMode('parent')} className="mt-6 w-full border border-green-600 text-green-700 p-2 rounded font-bold">Parent Portal</button>
         </div>
      </div>
   );
};

const App = () => {
   const [sess, setSess] = useState(null);
   const [prof, setProf] = useState(null);
   const [mode, setMode] = useState('auth');
   const [init, setInit] = useState(true);

   // Hard Logout Function (Clears storage too)
   const doLogout = async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      setSess(null);
      setProf(null);
      setMode('auth');
   };

   useEffect(() => {
      supabase.auth.getSession().then(({data:{session}}) => checkUser(session));
      const {data:{subscription}} = supabase.auth.onAuthStateChange((event, session) => {
         if (event === 'SIGNED_OUT') doLogout();
         else checkUser(session);
      });
      return () => subscription.unsubscribe();
   }, []);

   const checkUser = async (s) => {
      if(s) {
         setSess(s);
         const {data, error} = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
         if(error) {
            console.error("Profile Fetch Error:", error);
            // If fetching fails, force logout so they aren't stuck
            doLogout();
         } else {
            setProf(data);
            setMode('dash');
         }
      }
      setInit(false);
   };

   if(init) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;

   if(mode === 'parent') return <ParentPortal onBack={()=>setMode('auth')} />;
   if(!sess) return <Auth onMode={setMode} />;
   
   if(!prof) return (
      <div className="flex h-screen items-center justify-center flex-col">
         <Loader2 className="animate-spin mb-4"/>
         <p>Loading Profile...</p>
         <button onClick={doLogout} className="mt-4 text-red-500 underline">Cancel</button>
      </div>
   );

   return prof.role === 'admin' ? <AdminDashboard profile={prof} doLogout={doLogout} /> : <TeacherDashboard profile={prof} doLogout={doLogout} />;
};

export default App;

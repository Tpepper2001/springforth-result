import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink 
} from '@react-pdf/renderer';
import { 
  LayoutDashboard, Key, LogOut, Loader2, Save, Plus, School, 
  Copy, Check, AlertCircle, User, FileText, Download, Upload, Menu, X, Image as ImageIcon, Eye
} from 'lucide-react';

// --- CONFIGURATION ---
// Replace these with your actual Supabase URL and Key if they change
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONSTANTS & HELPERS ---
const SCORE_LIMITS = { note: 5, cw: 5, hw: 5, test: 15, ca: 15, exam: 60 };
const BEHAVIOR_TRAITS = [
  'Punctuality', 'Neatness', 'Politeness', 'Honesty', 
  'Leadership', 'Attentiveness', 'Cooperation'
];

const validateScore = (value, field) => {
  if (value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(num, SCORE_LIMITS[field]));
};

const calculateGrade = (total) => {
  if (total >= 86) return { grade: 'A*', remark: 'Excellent' };
  if (total >= 76) return { grade: 'A', remark: 'Outstanding' };
  if (total >= 66) return { grade: 'B', remark: 'Very Good' };
  if (total >= 60) return { grade: 'C', remark: 'Good' };
  if (total >= 50) return { grade: 'D', remark: 'Fairly Good' };
  if (total >= 40) return { grade: 'E', remark: 'Weak' };
  return { grade: 'F', remark: 'Fail' };
};

// --- HOOKS ---
const useAutoSave = (callback, delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = React.useRef(null);

  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await callback(data);
      setLastSaved(new Date());
      setSaving(false);
    }, delay);
  }, [callback, delay]);

  return { debouncedSave, saving, lastSaved };
};

// --- PDF STYLES ---
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8, color: '#000' },
  headerContainer: { flexDirection: 'row', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 10, alignItems: 'center' },
  logo: { width: 50, height: 50, marginRight: 15, objectFit: 'contain' },
  headerText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: '#1a365d', marginBottom: 4, textTransform: 'uppercase' },
  schoolInfo: { fontSize: 8, color: '#444', marginBottom: 1 },
  reportTitle: { fontSize: 10, fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase', textDecoration: 'underline' },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', border: '1px solid #000', marginBottom: 10 },
  infoItem: { width: '25%', padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000' },
  infoLabel: { fontSize: 6, color: '#555', marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 8, fontWeight: 'bold' },
  
  table: { width: '100%', borderTop: '1px solid #000', borderLeft: '1px solid #000', marginBottom: 10 },
  row: { flexDirection: 'row', borderBottom: '1px solid #000' },
  headerRow: { backgroundColor: '#f0f9ff' },
  cell: { borderRight: '1px solid #000', padding: 3, textAlign: 'center', justifyContent: 'center' },
  cellLeft: { textAlign: 'left', paddingLeft: 4 },
  
  cSN: { width: '4%' }, cSub: { width: '20%' }, cMini: { width: '5%' }, cTot: { width: '6%', fontWeight: 'bold' },
  cGrd: { width: '5%' }, cPos: { width: '5%' }, cRem: { flex: 1 },
  
  bottomContainer: { flexDirection: 'row', gap: 10 },
  leftCol: { flex: 1.5 }, rightCol: { flex: 1 },
  
  sectionBox: { border: '1px solid #000', marginBottom: 8 },
  sectionHeader: { backgroundColor: '#e2e8f0', padding: 3, fontSize: 7, fontWeight: 'bold', borderBottom: '1px solid #000', textAlign: 'center' },
  
  behavRow: { flexDirection: 'row', borderBottom: '1px solid #eee' },
  behavLabel: { flex: 2, padding: 2, fontSize: 7, paddingLeft: 4 },
  behavVal: { flex: 1, padding: 2, textAlign: 'center', fontSize: 7, borderLeft: '1px solid #eee' },
  
  signatureBox: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' },
  signLine: { width: '45%', alignItems: 'center' },
  line: { width: '100%', borderBottom: '1px solid #000', marginBottom: 4 },
  signText: { fontSize: 7, fontStyle: 'italic' }
});

// --- PDF DOCUMENT COMPONENT ---
const ResultPDF = ({ school, student, results, classInfo, comments, behaviors }) => {
  const totalScore = results.reduce((acc, r) => acc + (r.total || 0), 0);
  const avgScore = results.length ? (totalScore / results.length).toFixed(1) : 0;
  
  const gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
  results.forEach(r => { if(gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++; });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {school?.logo_url && <PDFImage src={school.logo_url} style={styles.logo} />}
          <View style={styles.headerText}>
            <Text style={styles.schoolName}>{school?.name || 'SCHOOL NAME'}</Text>
            <Text style={styles.schoolInfo}>{school?.address}</Text>
            <Text style={styles.schoolInfo}>{school?.contact}</Text>
            <Text style={styles.reportTitle}>{school?.current_term} REPORT SHEET {school?.current_session}</Text>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Student Name</Text><Text style={styles.infoValue}>{student.name}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Admission No</Text><Text style={styles.infoValue}>{student.admission_no}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Class</Text><Text style={styles.infoValue}>{classInfo?.name}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Gender</Text><Text style={styles.infoValue}>{student.gender}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>No. of Subjects</Text><Text style={styles.infoValue}>{results.length}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Total Score</Text><Text style={styles.infoValue}>{parseFloat(totalScore).toFixed(1)}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Average</Text><Text style={styles.infoValue}>{avgScore}%</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text></View>
        </View>

        {/* Results Table */}
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.cSN]}>S/N</Text>
            <Text style={[styles.cell, styles.cSub, styles.cellLeft]}>SUBJECTS</Text>
            <Text style={[styles.cell, styles.cMini]}>NOTE</Text>
            <Text style={[styles.cell, styles.cMini]}>CW</Text>
            <Text style={[styles.cell, styles.cMini]}>HW</Text>
            <Text style={[styles.cell, styles.cMini]}>TEST</Text>
            <Text style={[styles.cell, styles.cMini]}>CA</Text>
            <Text style={[styles.cell, styles.cMini]}>EXAM</Text>
            <Text style={[styles.cell, styles.cTot]}>TOT</Text>
            <Text style={[styles.cell, styles.cGrd]}>GRD</Text>
            <Text style={[styles.cell, styles.cPos]}>POS</Text>
            <Text style={[styles.cell, styles.cPos]}>HI</Text>
            <Text style={[styles.cell, styles.cRem, styles.cellLeft]}>REMARK</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, styles.cSN]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.cSub, styles.cellLeft]}>{r.subject_name || r.subjects?.name}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_note}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_cw}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_hw}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_test}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_ca}</Text>
              <Text style={[styles.cell, styles.cMini]}>{r.score_exam}</Text>
              <Text style={[styles.cell, styles.cTot]}>{r.total}</Text>
              <Text style={[styles.cell, styles.cGrd]}>{r.grade}</Text>
              <Text style={[styles.cell, styles.cPos]}>{r.position || '-'}</Text>
              <Text style={[styles.cell, styles.cPos]}>{r.highest || '-'}</Text>
              <Text style={[styles.cell, styles.cRem, styles.cellLeft]}>{r.remarks}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.leftCol}>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>FORM TUTOR'S COMMENT</Text>
              <Text style={{padding: 5, minHeight: 30}}>{comments?.tutor_comment}</Text>
            </View>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>PRINCIPAL'S COMMENT</Text>
              <Text style={{padding: 5, minHeight: 30}}>{comments?.principal_comment}</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signLine}><View style={styles.line} /><Text style={styles.signText}>Form Tutor's Signature</Text></View>
              <View style={styles.signLine}><View style={styles.line} /><Text style={styles.signText}>Principal's Signature</Text></View>
            </View>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>GRADE SUMMARY</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap'}}>
                {Object.entries(gradeCounts).map(([g, c]) => (
                  <View key={g} style={{width:'33%', alignItems:'center', padding:2}}><Text style={{fontWeight:'bold'}}>{g}</Text><Text>{c}</Text></View>
                ))}
              </View>
            </View>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>BEHAVIORAL REPORT</Text>
              {BEHAVIOR_TRAITS.map(trait => {
                const rating = behaviors?.find(b => b.trait === trait)?.rating || '-';
                return (
                  <View key={trait} style={styles.behavRow}>
                    <Text style={styles.behavLabel}>{trait}</Text>
                    <Text style={styles.behavVal}>{rating} / 5</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// --- CENTRAL ADMIN DASHBOARD ---
const CentralAdmin = ({ onLogout }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPinData, setNewPinData] = useState({ months: 3, limit: 200 });

  useEffect(() => { fetchPins(); }, []);

  const fetchPins = async () => {
    const { data } = await supabase.from('subscription_pins').select('*').order('created_at', { ascending: false });
    setPins(data || []);
  };

  const generatePin = async () => {
    setLoading(true);
    const code = `SUB-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await supabase.from('subscription_pins').insert({ code, duration_months: newPinData.months, student_limit: newPinData.limit });
    await fetchPins();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
          <div className="flex items-center gap-4"><LayoutDashboard className="text-blue-400" /><h1 className="text-3xl font-bold">Central Admin</h1></div>
          <button onClick={onLogout} className="text-red-400 flex items-center gap-2"><LogOut size={18}/> Logout</button>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-slate-800 p-6 rounded-2xl h-fit">
            <h2 className="text-xl font-bold mb-4">Generate PIN</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">{[3,6,12].map(m=><button key={m} onClick={()=>setNewPinData({...newPinData, months:m})} className={`py-2 rounded ${newPinData.months===m?'bg-blue-600':'bg-slate-700'}`}>{m}m</button>)}</div>
              <input type="number" className="w-full bg-slate-900 p-3 rounded border border-slate-700" value={newPinData.limit} onChange={e=>setNewPinData({...newPinData, limit:parseInt(e.target.value)})} placeholder="Student Limit"/>
              <button onClick={generatePin} disabled={loading} className="w-full bg-blue-600 p-3 rounded font-bold">{loading?'...':'Generate'}</button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl max-h-[500px] overflow-y-auto space-y-3">
            {pins.map(p=>(
              <div key={p.id} className="p-3 border-b border-slate-700 flex justify-between items-center">
                <div><span className="font-mono text-lg font-bold text-blue-300">{p.code}</span><p className="text-xs text-slate-400">{p.duration_months} Months • {p.student_limit} Students</p></div>
                <span className={p.is_used?'text-red-400':'text-green-400'}>{p.is_used?'USED':'ACTIVE'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SCHOOL ADMIN DASHBOARD ---
const SchoolAdmin = ({ profile, onLogout }) => {
  const [view, setView] = useState('home');
  const [school, setSchool] = useState({});
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
    if(s) { 
      setSchool(s); 
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', s.id);
      setTotalStudents(count||0); 
    }
    const { data: c } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s?.id); setClasses(c||[]);
    const { data: t } = await supabase.from('profiles').select('*').eq('role', 'teacher').eq('school_id', s?.id); setTeachers(t||[]);
  };

  const handleLogo = (e) => {
    const f = e.target.files[0];
    if(f){ const r=new FileReader(); r.onloadend=()=>setSchool(p=>({...p, logo_url:r.result})); r.readAsDataURL(f); }
  };

  const saveSchool = async () => { await supabase.from('schools').upsert(school); alert('Settings Saved'); };
  
  const addClass = async (e) => { 
    e.preventDefault(); const fd=new FormData(e.target); 
    await supabase.from('classes').insert({name:fd.get('name'), form_tutor_id:fd.get('tutor'), school_id:school.id}); 
    fetchAll(); e.target.reset(); 
  };
  
  const addStudent = async (e) => { 
    e.preventDefault(); const fd=new FormData(e.target);
    if(totalStudents >= school.max_students) return alert('Limit Reached');
    await supabase.from('students').insert({name:fd.get('name'), admission_no:fd.get('adm'), class_id:fd.get('class_id'), gender:fd.get('gender'), parent_pin:fd.get('pin'), school_id:school.id});
    fetchAll(); e.target.reset(); alert('Student Added');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 rounded shadow mb-6 flex justify-between items-center">
          <div className="flex gap-4 items-center">
             {school.logo_url && <img src={school.logo_url} className="h-12 object-contain" alt="Logo"/>}
             <div><h1 className="text-2xl font-bold">{school.name}</h1><p className="text-sm text-gray-500">Code: {school.id}</p></div>
          </div>
          <button onClick={onLogout} className="text-red-600 flex gap-2"><LogOut size={18}/> Logout</button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['home','classes','students','settings'].map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-2 rounded capitalize ${view===v?'bg-blue-600 text-white':'bg-white shadow'}`}>{v}</button>)}
        </div>

        {view==='home' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center"><h3 className="font-bold text-gray-500">Students</h3><p className="text-4xl text-blue-600 font-bold">{totalStudents}</p></div>
            <div className="bg-white p-6 rounded shadow text-center"><h3 className="font-bold text-gray-500">Classes</h3><p className="text-4xl text-purple-600 font-bold">{classes.length}</p></div>
            <div className="bg-white p-6 rounded shadow text-center"><h3 className="font-bold text-gray-500">Teachers</h3><p className="text-4xl text-green-600 font-bold">{teachers.length}</p></div>
          </div>
        )}

        {view==='classes' && (
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={addClass} className="bg-white p-6 rounded shadow space-y-4">
              <h3 className="font-bold">Add Class</h3>
              <input name="name" placeholder="Class Name" className="w-full border p-2 rounded" required/>
              <select name="tutor" className="w-full border p-2 rounded"><option value="">Select Tutor</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
              <button className="w-full bg-blue-600 text-white p-2 rounded">Create Class</button>
            </form>
            <div className="bg-white p-6 rounded shadow space-y-2">
              <h3 className="font-bold">Class List</h3>
              {classes.map(c=><div key={c.id} className="p-2 border-b flex justify-between"><span>{c.name}</span><span className="text-gray-500">{c.profiles?.full_name}</span></div>)}
            </div>
          </div>
        )}

        {view==='students' && (
          <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
            <h3 className="font-bold mb-4">Register Student</h3>
            <form onSubmit={addStudent} className="space-y-4">
              <input name="name" placeholder="Full Name" className="w-full border p-2 rounded" required/>
              <div className="grid grid-cols-2 gap-4">
                <input name="adm" placeholder="Admission No" className="w-full border p-2 rounded" required/>
                <input name="pin" placeholder="Parent PIN" className="w-full border p-2 rounded" required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="class_id" className="w-full border p-2 rounded" required><option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select name="gender" className="w-full border p-2 rounded"><option>Male</option><option>Female</option></select>
              </div>
              <button className="w-full bg-green-600 text-white p-2 rounded">Enroll Student</button>
            </form>
          </div>
        )}

        {view==='settings' && (
          <div className="bg-white p-6 rounded shadow max-w-xl mx-auto space-y-4">
            <h3 className="font-bold">School Settings</h3>
            <div className="border-2 border-dashed p-4 text-center">
              {school.logo_url ? <img src={school.logo_url} className="h-20 mx-auto mb-2"/> : <ImageIcon className="mx-auto text-gray-400"/>}
              <input type="file" onChange={handleLogo} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <input value={school.name||''} onChange={e=>setSchool({...school,name:e.target.value})} className="w-full border p-2 rounded" placeholder="School Name"/>
            <input value={school.address||''} onChange={e=>setSchool({...school,address:e.target.value})} className="w-full border p-2 rounded" placeholder="Address"/>
            <input value={school.contact||''} onChange={e=>setSchool({...school,contact:e.target.value})} className="w-full border p-2 rounded" placeholder="Contact Info"/>
            <div className="grid grid-cols-2 gap-4">
               <input value={school.current_term||''} onChange={e=>setSchool({...school,current_term:e.target.value})} className="w-full border p-2 rounded" placeholder="Current Term"/>
               <input value={school.current_session||''} onChange={e=>setSchool({...school,current_session:e.target.value})} className="w-full border p-2 rounded" placeholder="Session (2025/2026)"/>
            </div>
            <button onClick={saveSchool} className="w-full bg-blue-600 text-white p-2 rounded">Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD ---
const TeacherDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [selStu, setSelStu] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [behaviors, setBehaviors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      if(profile.school_id) {
        const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
        setSchool(s);
      }
      const { data: classes } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
      if(classes?.[0]) {
        const { data: stus } = await supabase.from('students').select('*').eq('class_id', classes[0].id);
        setStudents(stus || []);
        const { data: subs } = await supabase.from('subjects').select('*').eq('class_id', classes[0].id);
        setSubjects(subs || []);
      }
    };
    init();
  }, [profile]);

  const loadStudent = async (stu) => {
    setSelStu(stu);
    const { data: res } = await supabase.from('results').select('*').eq('student_id', stu.id);
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
    const { data: beh } = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);

    const map = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id);
      map[s.id] = existing || { score_note:0, score_cw:0, score_hw:0, score_test:0, score_ca:0, score_exam:0, position:'', highest:'' };
    });
    setScores(map);
    setComments(com || { tutor_comment: '', principal_comment: '' });
    setBehaviors(beh || []);
  };

  const updateScore = (sid, field, val) => {
    setScores(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [field]: (field === 'position' || field === 'highest') ? val : validateScore(val, field) }
    }));
  };

  const updateBehav = (trait, rating) => {
    setBehaviors(prev => {
      const idx = prev.findIndex(b => b.trait === trait);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], rating };
        return copy;
      }
      return [...prev, { trait, rating }];
    });
  };

  const saveData = async () => {
    if(!selStu) return;
    
    // Save Results
    const resPayload = subjects.map(s => {
      const v = scores[s.id];
      const total = (parseFloat(v.score_note)||0)+(parseFloat(v.score_cw)||0)+(parseFloat(v.score_hw)||0)+(parseFloat(v.score_test)||0)+(parseFloat(v.score_ca)||0)+(parseFloat(v.score_exam)||0);
      return {
        student_id: selStu.id, subject_id: s.id,
        score_note: v.score_note, score_cw: v.score_cw, score_hw: v.score_hw, score_test: v.score_test, score_ca: v.score_ca, score_exam: v.score_exam,
        position: v.position ? parseInt(v.position) : null,
        highest: v.highest ? parseFloat(v.highest) : null,
        ...calculateGrade(total)
      };
    });
    await supabase.from('results').delete().eq('student_id', selStu.id);
    await supabase.from('results').insert(resPayload);

    // Save Comments
    await supabase.from('comments').upsert({ student_id: selStu.id, ...comments }, { onConflict: 'student_id' });

    // Save Behaviors
    const behPayload = behaviors.map(b => ({ student_id: selStu.id, trait: b.trait, rating: b.rating }));
    await supabase.from('behaviorals').delete().eq('student_id', selStu.id);
    if(behPayload.length) await supabase.from('behaviorals').insert(behPayload);
  };

  const { debouncedSave, saving } = useAutoSave(saveData);
  useEffect(() => { if(selStu) debouncedSave(); }, [scores, comments, behaviors]);

  const addSubject = async () => {
    const n = prompt("Subject Name");
    if(n && students.length) {
       await supabase.from('subjects').insert({name:n, class_id:students[0].class_id, school_id:profile.school_id});
       // Reload
       const { data: subs } = await supabase.from('subjects').select('*').eq('class_id', students[0].class_id);
       setSubjects(subs || []);
    }
  };

  const getPreviewData = () => {
    if(!selStu || !school) return null;
    const res = subjects.map(s => {
      const sc = scores[s.id];
      const total = (parseFloat(sc.score_note)||0)+(parseFloat(sc.score_cw)||0)+(parseFloat(sc.score_hw)||0)+(parseFloat(sc.score_test)||0)+(parseFloat(sc.score_ca)||0)+(parseFloat(sc.score_exam)||0);
      return { subject_name: s.name, ...sc, total, ...calculateGrade(total) };
    });
    return { school, student: selStu, classInfo: { name: 'Current Class' }, results: res, comments, behaviors };
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 bg-blue-600 text-white font-bold">Teacher Panel</div>
        <div className="flex-1 overflow-y-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selStu?.id===s.id?'bg-blue-50 border-l-4 border-blue-600':''}`}>
              {s.name} <span className="text-xs text-gray-500 block">{s.admission_no}</span>
            </div>
          ))}
        </div>
        <button onClick={onLogout} className="p-4 text-red-600 border-t hover:bg-red-50">Logout</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selStu ? (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
              <h2 className="text-2xl font-bold">{selStu.name}</h2>
              <div className="flex gap-2 items-center">
                {saving && <span className="text-gray-500 flex gap-1 text-sm"><Loader2 className="animate-spin" size={16}/> Saving...</span>}
                <button onClick={()=>setShowPreview(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-700"><Eye size={18}/> Preview</button>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow overflow-x-auto">
              <div className="flex justify-between mb-4"><h3 className="font-bold">Scores</h3><button onClick={addSubject} className="text-xs bg-gray-100 px-2 py-1 rounded">+ Subject</button></div>
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-100"><th className="p-2 text-left">Subject</th><th>Note(5)</th><th>CW(5)</th><th>HW(5)</th><th>Test(15)</th><th>CA(15)</th><th>Exam(60)</th><th>Pos</th><th>High</th></tr></thead>
                <tbody>
                  {subjects.map(s => {
                     const sc = scores[s.id]||{};
                     return (
                       <tr key={s.id} className="border-b">
                         <td className="p-2 font-bold">{s.name}</td>
                         {['score_note','score_cw','score_hw','score_test','score_ca','score_exam'].map(f=><td key={f}><input className="w-10 border text-center p-1" value={sc[f]||''} onChange={e=>updateScore(s.id, f.replace('score_',''), e.target.value)}/></td>)}
                         <td><input className="w-10 border text-center p-1" value={sc.position||''} onChange={e=>updateScore(s.id,'position',e.target.value)}/></td>
                         <td><input className="w-10 border text-center p-1" value={sc.highest||''} onChange={e=>updateScore(s.id,'highest',e.target.value)}/></td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-4">Behavioral</h3>
                {BEHAVIOR_TRAITS.map(t => (
                  <div key={t} className="flex justify-between items-center mb-2 text-sm">
                    <span>{t}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={()=>updateBehav(t,r)} className={`w-6 h-6 rounded border ${behaviors.find(b=>b.trait===t)?.rating===r?'bg-blue-600 text-white':''}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-4 rounded shadow space-y-4">
                <h3 className="font-bold">Comments</h3>
                <textarea className="w-full border p-2 h-24 rounded" placeholder="Tutor Comment" value={comments.tutor_comment||''} onChange={e=>setComments({...comments,tutor_comment:e.target.value})}/>
                <textarea className="w-full border p-2 h-24 rounded" placeholder="Principal Comment" value={comments.principal_comment||''} onChange={e=>setComments({...comments,principal_comment:e.target.value})}/>
              </div>
            </div>
          </div>
        ) : <div className="p-10 text-center text-gray-500">Select a student</div>}
      </div>

      {showPreview && getPreviewData() && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 flex flex-col">
          <div className="flex justify-between items-center text-white mb-2"><h2 className="font-bold text-lg">Preview</h2><button onClick={()=>setShowPreview(false)}><X/></button></div>
          <PDFViewer className="flex-1 w-full rounded"><ResultPDF {...getPreviewData()}/></PDFViewer>
        </div>
      )}
    </div>
  );
};

// --- AUTH ---
const Auth = ({ onLogin, onParent }) => {
  const [mode, setMode] = useState('login'); const [role, setRole] = useState('teacher');
  const [data, setData] = useState({ email: '', password: '', name: '', pin: '', schoolCode: '' });
  const [loading, setLoading] = useState(false);

  const sub = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if(mode==='central'){ if(data.email==='oluwatoyin' && data.password==='Funmilola') onLogin({role:'central'}); else alert('Invalid'); return; }
      if(mode==='register'){
        if(role==='admin'){
          const { data: p } = await supabase.from('subscription_pins').select('*').eq('code', data.pin.trim()).eq('is_used', false).single();
          if(!p) throw new Error('Invalid/Used PIN');
          const { data: u, error: e1 } = await supabase.auth.signUp({email:data.email, password:data.password});
          if(e1) throw e1;
          const exp = new Date(); exp.setMonth(exp.getMonth()+p.duration_months);
          const { data: s } = await supabase.from('schools').insert({owner_id:u.user.id, name:'My School', max_students:p.student_limit, subscription_expires_at:exp.toISOString()}).select().single();
          await supabase.from('profiles').insert({id:u.user.id, full_name:data.name, role:'admin', school_id:s.id});
          await supabase.from('subscription_pins').update({is_used:true, used_by_email:data.email}).eq('id',p.id);
        } else {
          const { data: s } = await supabase.from('schools').select('id').eq('id', data.schoolCode.trim()).single();
          if(!s) throw new Error('Invalid School Code');
          const { data: u, error: e1 } = await supabase.auth.signUp({email:data.email, password:data.password});
          if(e1) throw e1;
          await supabase.from('profiles').insert({id:u.user.id, full_name:data.name, role:'teacher', school_id:s.id});
        }
        alert('Registered! Please Login.'); setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({email:data.email, password:data.password});
        if(error) throw error;
      }
    } catch(err){ alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6 gap-4 text-sm font-bold text-gray-400">
           {['login','register','central'].map(m=><button key={m} onClick={()=>setMode(m)} className={`capitalize ${mode===m?'text-blue-600 border-b-2 border-blue-600':''}`}>{m}</button>)}
        </div>
        <form onSubmit={sub} className="space-y-4">
          {mode==='register' && <><input placeholder="Full Name" className="w-full border p-2 rounded" value={data.name} onChange={e=>setData({...data,name:e.target.value})}/><div className="flex gap-2"><button type="button" onClick={()=>setRole('admin')} className={`flex-1 p-2 border rounded ${role==='admin'?'bg-blue-600 text-white':''}`}>Owner</button><button type="button" onClick={()=>setRole('teacher')} className={`flex-1 p-2 border rounded ${role==='teacher'?'bg-blue-600 text-white':''}`}>Teacher</button></div><input placeholder={role==='admin'?'PIN':'School Code'} className="w-full border p-2 rounded" value={role==='admin'?data.pin:data.schoolCode} onChange={e=>setData(role==='admin'?{...data,pin:e.target.value}:{...data,schoolCode:e.target.value})}/></>}
          <input placeholder={mode==='central'?'Username':'Email'} className="w-full border p-2 rounded" value={data.email} onChange={e=>setData({...data,email:e.target.value})}/>
          <input type="password" placeholder="Password" className="w-full border p-2 rounded" value={data.password} onChange={e=>setData({...data,password:e.target.value})}/>
          <button disabled={loading} className={`w-full p-2 rounded text-white font-bold ${mode==='central'?'bg-red-600':'bg-blue-600'}`}>{loading?'...':'Submit'}</button>
        </form>
        {mode==='login' && <button onClick={onParent} className="w-full mt-4 text-green-700 font-bold border border-green-600 p-2 rounded flex justify-center gap-2"><User size={18}/> Parent Portal</button>}
      </div>
    </div>
  );
};

// --- PARENT PORTAL ---
const ParentPortal = ({ onBack }) => {
  const [adm, setAdm] = useState(''); const [pin, setPin] = useState(''); const [data, setData] = useState(null);
  const check = async (e) => { e.preventDefault();
    const { data: s } = await supabase.from('students').select('*, schools(*), classes(*)').eq('admission_no', adm).eq('parent_pin', pin).single();
    if(!s) return alert('Invalid Credentials');
    const { data: r } = await supabase.from('results').select('*, subjects(*)').eq('student_id', s.id);
    const { data: c } = await supabase.from('comments').select('*').eq('student_id', s.id).single();
    const { data: b } = await supabase.from('behaviorals').select('*').eq('student_id', s.id);
    
    const processed = (r||[]).map(x => ({ 
      ...x, 
      subject_name: x.subjects?.name,
      total: (x.score_note||0)+(x.score_cw||0)+(x.score_hw||0)+(x.score_test||0)+(x.score_ca||0)+(x.score_exam||0) 
    }));
    setData({ student: s, school: s.schools, classInfo: s.classes, results: processed, comments: c, behaviors: b });
  };

  if(data) return <div className="h-screen flex flex-col"><div className="bg-white p-4 shadow flex justify-between items-center"><button onClick={()=>setData(null)}><X/></button><span className="font-bold">{data.student.name}</span><PDFDownloadLink document={<ResultPDF {...data}/>} fileName="Result.pdf" className="bg-blue-600 text-white px-3 py-1 rounded">Download PDF</PDFDownloadLink></div><PDFViewer className="flex-1"><ResultPDF {...data}/></PDFViewer></div>;
  return <div className="min-h-screen flex items-center justify-center bg-gray-100"><form onSubmit={check} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4"><h2 className="text-xl font-bold text-center">Check Result</h2><input placeholder="Admission No" className="w-full border p-2 rounded" value={adm} onChange={e=>setAdm(e.target.value)}/><input type="password" placeholder="PIN" className="w-full border p-2 rounded" value={pin} onChange={e=>setPin(e.target.value)}/><button className="w-full bg-green-600 text-white p-2 rounded">Check</button><button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-500">Back</button></form></div>;
};

// --- APP ENTRY ---
const App = () => {
  const [session, setSession] = useState(null); const [profile, setProfile] = useState(null); const [view, setView] = useState('auth');
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if(session) loadProfile(session.user.id); }); supabase.auth.onAuthStateChange((_, s) => { setSession(s); if(s) loadProfile(s.user.id); else { setProfile(null); setView('auth'); } }); }, []);
  const loadProfile = async (id) => { const { data } = await supabase.from('profiles').select('*').eq('id', id).single(); setProfile(data); };
  if(view==='central') return <CentralAdmin onLogout={()=>setView('auth')}/>;
  if(view==='parent') return <ParentPortal onBack={()=>setView('auth')}/>;
  if(!session) return <Auth onLogin={(d)=>{if(d.role==='central')setView('central')}} onParent={()=>setView('parent')}/>;
  if(!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  return profile.role==='admin' ? <SchoolAdmin profile={profile} onLogout={()=>supabase.auth.signOut()}/> : <TeacherDashboard profile={profile} onLogout={()=>supabase.auth.signOut()}/>;
};

export default App;

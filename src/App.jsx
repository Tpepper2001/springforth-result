import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink 
} from '@react-pdf/renderer';
import { 
  LayoutDashboard, Key, LogOut, Loader2, Save, Plus, School, 
  Copy, Check, AlertCircle, User, FileText, Download, Menu, X, Users, TrendingUp
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPERS ---
const SCORE_LIMITS = { note: 5, cw: 5, hw: 5, test: 15, ca: 15, exam: 60 };

const validateScore = (value, field) => {
  const num = parseFloat(value) || 0;
  return Math.max(0, Math.min(num, SCORE_LIMITS[field]));
};

const calculateGrade = (total) => {
  if (total >= 86) return { grade: 'A*', remark: 'Excellent' };
  if (total >= 76) return { grade: 'A', remark: 'Outstanding' };
  if (total >= 66) return { grade: 'B', remark: 'Very Good' };
  if (total >= 60) return { grade: 'C', remark: 'Good' };
  if (total >= 50) return { grade: 'D', remark: 'Fairly Good' };
  if (total >= 40) return { grade: 'E', remark: 'Below Expectation' };
  return { grade: 'E*', remark: 'Rarely' };
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
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9 },
  headerBox: { flexDirection: 'row', border: '2px solid #DC2626', padding: 8, marginBottom: 8, alignItems: 'center' },
  logo: { width: 60, height: 60, marginRight: 12, objectFit: 'contain' },
  headerText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#1E40AF', marginBottom: 3 },
  schoolDetails: { fontSize: 8, color: '#374151' },
  termTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 5, textDecoration: 'underline' },
  infoRow: { flexDirection: 'row', backgroundColor: '#DBEAFE', border: '1px solid #000', marginBottom: 1 },
  infoCell: { flex: 1, borderRight: '1px solid #000', padding: 4, fontSize: 8, fontWeight: 'bold' },
  table: { width: '100%', border: '1px solid #000', marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#DBEAFE', borderBottom: '1px solid #000' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
  cell: { borderRight: '1px solid #000', padding: 3, justifyContent: 'center', alignItems: 'center', fontSize: 8 },
  colSubject: { width: '25%' }, colScore: { width: '7%' }, colTotal: { width: '8%', fontWeight: 'bold' },
  colGrade: { width: '8%' }, colRemark: { flex: 1 },
});

// --- PDF DOCUMENT ---
const ResultPDF = ({ school, student, results, classInfo, comments }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          {school.logo_url && <PDFImage src={school.logo_url} style={styles.logo} />}
          <View style={styles.headerText}>
            <Text style={styles.schoolName}>{school.name?.toUpperCase()}</Text>
            <Text style={styles.schoolDetails}>{school.address}</Text>
            <Text style={styles.schoolDetails}>{school.contact}</Text>
            <Text style={styles.termTitle}>{school.current_term} REPORT {school.current_session}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>NAME: {student.name}</Text>
          <Text style={styles.infoCell}>ADM NO: {student.admission_no}</Text>
          <Text style={styles.infoCell}>CLASS: {classInfo?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>AVERAGE: {average}%</Text>
          <Text style={styles.infoCell}>GENDER: {student.gender}</Text>
          <Text style={styles.infoCell}>NO. SUBJECTS: {results.length}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colSubject]}>SUBJECT</Text>
            <Text style={[styles.cell, styles.colScore]}>CA</Text>
            <Text style={[styles.cell, styles.colScore]}>EXAM</Text>
            <Text style={[styles.cell, styles.colTotal]}>TOTAL</Text>
            <Text style={[styles.cell, styles.colGrade]}>GRADE</Text>
            <Text style={[styles.cell, styles.colRemark]}>REMARK</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colSubject]}>{r.subjects?.name}</Text>
              <Text style={[styles.cell, styles.colScore]}>{(r.score_note+r.score_cw+r.score_hw+r.score_test+r.score_ca)}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_exam}</Text>
              <Text style={[styles.cell, styles.colTotal]}>{r.total}</Text>
              <Text style={[styles.cell, styles.colGrade]}>{r.grade}</Text>
              <Text style={[styles.cell, styles.colRemark]}>{r.remarks}</Text>
            </View>
          ))}
        </View>
        <View style={{marginTop: 10, border: '1px solid #000', padding: 5}}>
          <Text style={{fontWeight: 'bold', fontSize: 8}}>PRINCIPAL'S COMMENT:</Text>
          <Text style={{fontSize: 8, marginTop: 2}}>{comments?.principal_comment || 'No comment'}</Text>
        </View>
      </Page>
    </Document>
  );
};

// --- CENTRAL ADMIN DASHBOARD ---
const CentralAdmin = ({ onLogout }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [newPinData, setNewPinData] = useState({ months: 3, limit: 200 });

  useEffect(() => { fetchPins(); }, []);

  const fetchPins = async () => {
    const { data } = await supabase.from('subscription_pins').select('*').order('created_at', { ascending: false });
    setPins(data || []);
  };

  const generatePin = async () => {
    setLoading(true);
    const code = `SUB-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error } = await supabase.from('subscription_pins').insert({
      code, duration_months: newPinData.months, student_limit: newPinData.limit
    });
    if (error) alert(error.message);
    else await fetchPins();
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
          <div className="flex items-center gap-4">
            <LayoutDashboard size={32} className="text-blue-400" />
            <h1 className="text-3xl font-bold">Central Admin</h1>
          </div>
          <button onClick={onLogout} className="flex gap-2 text-red-400 hover:text-red-300"><LogOut size={18} /> Logout</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl shadow-xl h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="text-green-400" /> Generate PIN</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Duration</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[3, 6, 12].map(m => (
                    <button key={m} onClick={() => setNewPinData({...newPinData, months: m})} 
                      className={`py-2 rounded text-sm font-bold ${newPinData.months === m ? 'bg-blue-600' : 'bg-slate-700'}`}>
                      {m} Mo
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Student Limit</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-3 mt-1"
                  value={newPinData.limit} onChange={e => setNewPinData({...newPinData, limit: parseInt(e.target.value)})} />
              </div>
              <button onClick={generatePin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold flex justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Create Code'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6">Active PINs</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {pins.map((pin) => (
                <div key={pin.id} className={`p-4 rounded-xl border flex justify-between items-center ${pin.is_used ? 'bg-slate-900/50 border-slate-700 opacity-60' : 'bg-slate-700/30 border-slate-600'}`}>
                  <div>
                    <div className="flex gap-3 items-center">
                      <span className={`font-mono text-lg font-bold ${pin.is_used ? 'line-through text-slate-500' : 'text-blue-300'}`}>{pin.code}</span>
                      <span className={`text-xs px-2 rounded ${pin.is_used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{pin.is_used ? 'USED' : 'ACTIVE'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{pin.duration_months} Months • {pin.student_limit} Students</div>
                  </div>
                  {!pin.is_used && (
                    <button onClick={() => copyToClipboard(pin.code)} className="p-2 bg-slate-600 hover:bg-blue-600 rounded">
                      {copied === pin.code ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
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
      setTotalStudents(count || 0);
    }
    const { data: c } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s?.id);
    setClasses(c || []);
    const { data: t } = await supabase.from('profiles').select('*').eq('role', 'teacher').eq('school_id', s?.id);
    setTeachers(t || []);
  };

  const addClass = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('classes').insert({
      name: fd.get('name'), form_tutor_id: fd.get('tutor'), size: 0, school_id: school.id
    });
    fetchAll(); e.target.reset();
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (totalStudents >= school.max_students) return alert('Student limit reached!');
    
    const fd = new FormData(e.target);
    const { error } = await supabase.from('students').insert({
      name: fd.get('name'), admission_no: fd.get('adm'), class_id: fd.get('class_id'),
      gender: fd.get('gender'), parent_pin: fd.get('pin'), school_id: school.id
    });
    
    if (error) alert(error.message);
    else { alert('Student Added'); fetchAll(); e.target.reset(); }
  };

  const saveSchool = async () => {
    await supabase.from('schools').upsert(school);
    alert('Saved');
  };

  const isExpired = new Date(school.subscription_expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{school.name || 'My School'}</h1>
            <p className="text-sm text-gray-500">School ID: {school.id} (Share with Teachers)</p>
          </div>
          <button onClick={onLogout} className="text-red-600"><LogOut size={20}/></button>
        </div>

        {isExpired && <div className="bg-red-600 text-white p-4 rounded-xl mb-6 text-center font-bold">SUBSCRIPTION EXPIRED</div>}

        <div className="flex gap-3 mb-6">
          {['home', 'classes', 'students', 'settings'].map(v => (
            <button key={v} onClick={() => setView(v)} 
              className={`px-4 py-2 rounded-lg capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-white shadow'}`}>
              {v}
            </button>
          ))}
        </div>

        {view === 'home' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Students</h3>
              <p className="text-3xl font-bold">{totalStudents} / {school.max_students}</p>
              <div className="w-full bg-gray-100 h-2 rounded mt-2"><div className="bg-blue-600 h-full" style={{width: `${(totalStudents/school.max_students)*100}%`}}></div></div>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Subscription</h3>
              <p className={`text-xl font-bold ${isExpired ? 'text-red-500' : 'text-green-600'}`}>{isExpired ? 'Expired' : 'Active'}</p>
              <p className="text-xs mt-1">Ends: {new Date(school.subscription_expires_at).toDateString()}</p>
            </div>
          </div>
        )}

        {view === 'classes' && !isExpired && (
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={addClass} className="bg-white p-6 rounded shadow space-y-4">
              <h3 className="font-bold">Add Class</h3>
              <input name="name" placeholder="Class Name" className="w-full p-2 border rounded" required />
              <select name="tutor" className="w-full p-2 border rounded">
                <option value="">Select Tutor</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <button className="w-full bg-blue-600 text-white p-2 rounded">Create Class</button>
            </form>
            <div className="bg-white p-6 rounded shadow space-y-2">
              <h3 className="font-bold">Existing Classes</h3>
              {classes.map(c => (
                <div key={c.id} className="border p-2 rounded flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-sm text-gray-500">{c.profiles?.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'students' && !isExpired && (
          <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
            <h3 className="font-bold mb-4">Enroll Student</h3>
            <form onSubmit={addStudent} className="space-y-4">
              <input name="name" placeholder="Full Name" className="w-full p-2 border rounded" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="adm" placeholder="Admission No" className="w-full p-2 border rounded" required />
                <input name="pin" type="password" placeholder="Parent PIN" className="w-full p-2 border rounded" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="gender" className="w-full p-2 border rounded"><option>Male</option><option>Female</option></select>
                <select name="class_id" className="w-full p-2 border rounded" required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button className="w-full bg-green-600 text-white p-2 rounded">Enroll</button>
            </form>
          </div>
        )}

        {view === 'settings' && (
          <div className="bg-white p-6 rounded shadow max-w-xl space-y-4">
             <input className="w-full p-2 border rounded" placeholder="School Name" value={school.name || ''} onChange={e=>setSchool({...school, name: e.target.value})} />
             <input className="w-full p-2 border rounded" placeholder="Address" value={school.address || ''} onChange={e=>setSchool({...school, address: e.target.value})} />
             <input className="w-full p-2 border rounded" placeholder="Contact" value={school.contact || ''} onChange={e=>setSchool({...school, contact: e.target.value})} />
             <input className="w-full p-2 border rounded" placeholder="Principal Name" value={school.principal_name || ''} onChange={e=>setSchool({...school, principal_name: e.target.value})} />
             <div className="grid grid-cols-2 gap-2">
               <input className="w-full p-2 border rounded" placeholder="Term" value={school.current_term || ''} onChange={e=>setSchool({...school, current_term: e.target.value})} />
               <input className="w-full p-2 border rounded" placeholder="Session" value={school.current_session || ''} onChange={e=>setSchool({...school, current_session: e.target.value})} />
             </div>
             <button onClick={saveSchool} className="w-full bg-blue-600 text-white p-2 rounded">Save Info</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD ---
const TeacherDashboard = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [curClass, setCurClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selStu, setSelStu] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    const init = async () => {
      // Fetch classes where this teacher is tutor OR all classes in school (depending on policy). 
      // Simplified: Fetch classes assigned to this tutor
      const { data } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
      setClasses(data || []);
      if(data?.[0]) handleClassSelect(data[0]);
    };
    init();
  }, [profile]);

  const handleClassSelect = async (cls) => {
    setCurClass(cls);
    const { data: stus } = await supabase.from('students').select('*').eq('class_id', cls.id);
    setStudents(stus || []);
    const { data: subs } = await supabase.from('subjects').select('*').eq('class_id', cls.id);
    setSubjects(subs || []);
    setSelStu(null);
  };

  const addSubject = async () => {
    const name = prompt('Subject Name:');
    if(name && curClass) {
      await supabase.from('subjects').insert({ name, class_id: curClass.id, school_id: profile.school_id });
      handleClassSelect(curClass); // refresh
    }
  };

  const loadStudentData = async (stu) => {
    setSelStu(stu);
    const { data: res } = await supabase.from('results').select('*').eq('student_id', stu.id);
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
    
    const scoreMap = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id);
      scoreMap[s.id] = existing || { note: 0, cw: 0, hw: 0, test: 0, ca: 0, exam: 0 };
    });
    setScores(scoreMap);
    setComment(com?.tutor_comment || '');
  };

  const saveData = async () => {
    if(!selStu) return;
    
    // Save Results
    const resToSave = subjects.map(s => {
      const sc = scores[s.id];
      const total = (sc.score_note||0)+(sc.score_cw||0)+(sc.score_hw||0)+(sc.score_test||0)+(sc.score_ca||0)+(sc.score_exam||0);
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selStu.id, subject_id: s.id,
        score_note: sc.score_note, score_cw: sc.score_cw, score_hw: sc.score_hw,
        score_test: sc.score_test, score_ca: sc.score_ca, score_exam: sc.score_exam,
        grade, remarks: remark
      };
    });
    
    await supabase.from('results').delete().eq('student_id', selStu.id);
    await supabase.from('results').insert(resToSave);

    // Save Comment
    await supabase.from('comments').upsert({ student_id: selStu.id, tutor_comment: comment }, { onConflict: 'student_id' });
  };

  const { debouncedSave, saving } = useAutoSave(saveData);

  useEffect(() => { if(selStu) debouncedSave(); }, [scores, comment]);

  const updateScore = (subId, field, val) => {
    const v = validateScore(val, field);
    setScores(prev => ({ ...prev, [subId]: { ...prev[subId], [`score_${field}`]: v } }));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h2 className="font-bold">{profile.full_name}</h2>
          <p className="text-xs opacity-75">Tutor Dashboard</p>
        </div>
        <div className="p-2 border-b">
           <select className="w-full p-2 rounded border" onChange={e => handleClassSelect(classes.find(c => c.id === e.target.value))}>
             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudentData(s)} className={`p-3 cursor-pointer hover:bg-gray-100 ${selStu?.id === s.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-gray-500">{s.admission_no}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t"><button onClick={onLogout} className="text-red-600 text-sm flex gap-2"><LogOut size={16}/> Logout</button></div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selStu ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{selStu.name}</h1>
              {saving && <span className="text-sm text-gray-500 flex gap-2"><Loader2 className="animate-spin" size={16}/> Saving...</span>}
            </div>

            <div className="bg-white p-6 rounded shadow mb-6">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold">Scores</h3>
                 <button onClick={addSubject} className="text-sm bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><Plus size={14}/> Add Subject</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-2">Subject</th>
                    <th className="p-2 w-16">Note<br/>(5)</th>
                    <th className="p-2 w-16">CW<br/>(5)</th>
                    <th className="p-2 w-16">HW<br/>(5)</th>
                    <th className="p-2 w-16">Test<br/>(15)</th>
                    <th className="p-2 w-16">CA<br/>(15)</th>
                    <th className="p-2 w-16">Exam<br/>(60)</th>
                    <th className="p-2 w-16 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => {
                    const sc = scores[s.id] || {};
                    const total = (sc.score_note||0)+(sc.score_cw||0)+(sc.score_hw||0)+(sc.score_test||0)+(sc.score_ca||0)+(sc.score_exam||0);
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-medium">{s.name}</td>
                        {['note','cw','hw','test','ca','exam'].map(f => (
                          <td key={f} className="p-2"><input className="w-full text-center border rounded p-1" type="number" 
                             value={sc[`score_${f}`] || ''} onChange={e => updateScore(s.id, f, e.target.value)} /></td>
                        ))}
                        <td className="p-2 font-bold text-center">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold mb-2">Form Tutor Comment</h3>
              <textarea className="w-full border rounded p-3 h-24" placeholder="Enter comment..." 
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">Select a student</div>
        )}
      </div>
    </div>
  );
};

// --- AUTH COMPONENT ---
const Auth = ({ onLogin, onParent }) => {
  const [mode, setMode] = useState('login'); 
  const [role, setRole] = useState('teacher');
  const [data, setData] = useState({ email: '', password: '', name: '', pin: '', schoolCode: '' });
  const [loading, setLoading] = useState(false);

  // CENTRAL ADMIN CREDENTIALS
  const CENTRAL_USER = "oluwatoyin";
  const CENTRAL_PASS = "Funmilola";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'central') {
        if (data.email.trim() === CENTRAL_USER && data.password.trim() === CENTRAL_PASS) {
          onLogin({ role: 'central' });
        } else alert('Invalid Credentials');
        return;
      }

      if (mode === 'register') {
        if (role === 'admin') {
          // School Owner
          const { data: pinRes, error: pinErr } = await supabase.from('subscription_pins').select('*').eq('code', data.pin.trim()).eq('is_used', false).single();
          if (pinErr || !pinRes) throw new Error("Invalid/Used PIN");

          const { data: auth, error: authErr } = await supabase.auth.signUp({ email: data.email, password: data.password });
          if (authErr) throw authErr;

          const expiry = new Date(); expiry.setMonth(expiry.getMonth() + pinRes.duration_months);
          const { data: school, error: schErr } = await supabase.from('schools').insert({
            owner_id: auth.user.id, name: 'My School', max_students: pinRes.student_limit, subscription_expires_at: expiry.toISOString()
          }).select().single();
          if (schErr) throw schErr;

          await supabase.from('profiles').insert({ id: auth.user.id, full_name: data.name, role: 'admin', school_id: school.id });
          await supabase.from('subscription_pins').update({ is_used: true, used_by_email: data.email }).eq('id', pinRes.id);
          
          alert('Registered! Please Login.'); setMode('login');

        } else {
          // Teacher
          if (!data.schoolCode) throw new Error("School Code Required");
          const { data: sch, error: sErr } = await supabase.from('schools').select('id').eq('id', data.schoolCode.trim()).single();
          if (sErr || !sch) throw new Error("Invalid School Code");

          const { data: auth, error: authErr } = await supabase.auth.signUp({ email: data.email, password: data.password });
          if (authErr) throw authErr;

          await supabase.from('profiles').insert({ id: auth.user.id, full_name: data.name, role: 'teacher', school_id: sch.id });
          alert('Registered! Please Login.'); setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) throw error;
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6 gap-4 text-sm font-bold text-gray-400">
          {['login','register','central'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`pb-1 capitalize ${mode === m ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>
              {m === 'central' ? 'Central Admin' : m}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input placeholder="Full Name" className="w-full p-3 border rounded" required value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setRole('admin')} className={`flex-1 p-2 rounded border ${role === 'admin' ? 'bg-blue-600 text-white' : ''}`}>Owner</button>
                <button type="button" onClick={() => setRole('teacher')} className={`flex-1 p-2 rounded border ${role === 'teacher' ? 'bg-blue-600 text-white' : ''}`}>Teacher</button>
              </div>
              {role === 'admin' ? 
                <input placeholder="Subscription PIN" className="w-full p-3 border-2 border-orange-100 bg-orange-50 rounded" required value={data.pin} onChange={e => setData({...data, pin: e.target.value})} /> :
                <input placeholder="School Code" className="w-full p-3 border rounded" required value={data.schoolCode} onChange={e => setData({...data, schoolCode: e.target.value})} />
              }
            </>
          )}
          
          <input placeholder={mode === 'central' ? 'Username' : 'Email'} className="w-full p-3 border rounded" required value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded" required value={data.password} onChange={e => setData({...data, password: e.target.value})} />
          
          <button disabled={loading} className={`w-full p-3 rounded text-white font-bold ${mode === 'central' ? 'bg-red-600' : 'bg-blue-600'}`}>
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {mode === 'login' && (
          <button onClick={onParent} className="w-full mt-4 border border-green-600 text-green-700 p-3 rounded font-bold hover:bg-green-50 flex justify-center gap-2">
            <User size={18}/> Parent Portal
          </button>
        )}
      </div>
    </div>
  );
};

// --- PARENT PORTAL ---
const ParentPortal = ({ onBack }) => {
  const [adm, setAdm] = useState('');
  const [pin, setPin] = useState('');
  const [resData, setResData] = useState(null);

  const check = async (e) => {
    e.preventDefault();
    const { data: s } = await supabase.from('students').select('*, schools(*), classes(*)').eq('admission_no', adm).eq('parent_pin', pin).single();
    if (!s) return alert('Invalid details');
    const { data: r } = await supabase.from('results').select('*, subjects(*)').eq('student_id', s.id);
    const { data: c } = await supabase.from('comments').select('*').eq('student_id', s.id).single();
    
    const processed = (r||[]).map(x => ({ ...x, total: (x.score_note||0)+(x.score_cw||0)+(x.score_hw||0)+(x.score_test||0)+(x.score_ca||0)+(x.score_exam||0) }));
    setResData({ student: s, school: s.schools, classInfo: s.classes, results: processed, comments: c });
  };

  if (resData) return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <button onClick={() => setResData(null)}><X size={20}/></button>
        <span className="font-bold">{resData.student.name}</span>
        <PDFDownloadLink document={<ResultPDF {...resData} />} fileName="Result.pdf" className="bg-blue-600 text-white px-3 py-1 rounded">Download</PDFDownloadLink>
      </div>
      <PDFViewer className="flex-1 w-full"><ResultPDF {...resData} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={check} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">Check Result</h2>
        <input placeholder="Admission No" className="w-full p-2 border rounded" value={adm} onChange={e => setAdm(e.target.value)} />
        <input type="password" placeholder="PIN" className="w-full p-2 border rounded" value={pin} onChange={e => setPin(e.target.value)} />
        <button className="w-full bg-green-600 text-white p-2 rounded">Check</button>
        <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-500">Back</button>
      </form>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth'); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess);
      if (sess) loadProfile(sess.user.id); else { setProfile(null); setView('auth'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(data);
  };

  if (view === 'central') return <CentralAdmin onLogout={() => setView('auth')} />;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;

  if (!session) return <Auth onLogin={(d) => { if(d.role === 'central') setView('central'); }} onParent={() => setView('parent')} />;
  
  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return profile.role === 'admin' 
    ? <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} /> 
    : <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;

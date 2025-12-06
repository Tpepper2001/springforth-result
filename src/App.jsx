import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink 
} from '@react-pdf/renderer';
import { 
  LayoutDashboard, Key, LogOut, Loader2, Save, Plus, School, 
  Copy, Check, AlertCircle, User, FileText, Download, Menu, X, Users, TrendingUp, Eye
} from 'lucide-react';

// --- CONFIGURATION --
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
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  headerBox: { flexDirection: 'row', border: '2px solid #000', padding: 10, marginBottom: 5, alignItems: 'center' },
  logo: { width: 70, height: 70, marginRight: 10, objectFit: 'contain' },
  headerText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2, textTransform: 'uppercase' },
  schoolDetails: { fontSize: 7, color: '#000', textAlign: 'center' },
  termTitle: { fontSize: 9, fontWeight: 'bold', marginTop: 3, textDecoration: 'underline' },
  
  infoGrid: { flexDirection: 'row', marginTop: 5, marginBottom: 5 },
  infoBox: { flex: 1, border: '1px solid #000', padding: 3, marginRight: 2, backgroundColor: '#f0f0f0' },
  infoLabel: { fontSize: 7, fontWeight: 'bold' },
  infoValue: { fontSize: 8, marginTop: 1 },
  
  table: { width: '100%', border: '1px solid #000', marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1px solid #000' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20 },
  cell: { borderRight: '1px solid #000', padding: 2, justifyContent: 'center', fontSize: 7 },
  cellCenter: { alignItems: 'center' },
  
  colSN: { width: '4%' },
  colSubject: { width: '18%' },
  colNote: { width: '5%' },
  colCW: { width: '5%' },
  colHW: { width: '5%' },
  colTest: { width: '6%' },
  colCA: { width: '6%' },
  colExam: { width: '6%' },
  colTotal: { width: '7%', fontWeight: 'bold' },
  colGrade: { width: '6%' },
  colPosition: { width: '7%' },
  colHighest: { width: '8%' },
  colRemark: { width: '12%' },
  
  summarySection: { marginTop: 8, border: '1px solid #000', padding: 5 },
  summaryTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 3, textDecoration: 'underline' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', fontSize: 7, marginBottom: 2 },
  
  behaviorSection: { marginTop: 5, border: '1px solid #000', padding: 5 },
  behaviorGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 },
  behaviorItem: { width: '33.33%', fontSize: 7, marginBottom: 2 },
  
  commentSection: { marginTop: 5, border: '1px solid #000', padding: 5 },
  commentLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  commentText: { fontSize: 7, lineHeight: 1.3 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureLine: { borderTop: '1px solid #000', width: '100%', marginTop: 20, marginBottom: 2 },
  signatureLabel: { fontSize: 7, fontWeight: 'bold' },
});

// --- PDF DOCUMENT ---
const ResultPDF = ({ school, student, results, classInfo, comments }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const { grade: overallGrade } = calculateGrade(parseFloat(average));
  
  const gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'E*': 0 };
  results.forEach(r => {
    if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++;
  });
  
  const behaviors = [
    { trait: 'COOPERATION', rating: 'Excellent Degree' },
    { trait: 'LEADERSHIP', rating: 'Excellent Degree' },
    { trait: 'HONESTY', rating: 'Excellent Degree' },
    { trait: 'SELF DISCIPLINE', rating: 'Excellent Degree' },
    { trait: 'RESPECT', rating: 'Excellent Degree' },
    { trait: 'RESPONSIBILITY', rating: 'Excellent Degree' },
    { trait: 'EMPATHY', rating: 'Excellent Degree' },
  ];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          {school.logo_url && <PDFImage src={school.logo_url} style={styles.logo} />}
          <View style={styles.headerText}>
            <Text style={styles.schoolName}>{school.name?.toUpperCase() || 'SCHOOL NAME'}</Text>
            <Text style={styles.schoolDetails}>{school.address || 'School Address'}</Text>
            <Text style={styles.schoolDetails}>{school.contact || 'School Contact'}</Text>
            <Text style={styles.termTitle}>{school.current_term || 'TERM ONE'} REPORT {school.current_session || '2024/2025'} ACADEMIC SESSION</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>NAME:</Text>
            <Text style={styles.infoValue}>{student.name}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ADM NO:</Text>
            <Text style={styles.infoValue}>{student.admission_no}</Text>
          </View>
          <View style={[styles.infoBox, { marginRight: 0 }]}>
            <Text style={styles.infoLabel}>CLASS:</Text>
            <Text style={styles.infoValue}>{classInfo?.name}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>AVERAGE SCORE:</Text>
            <Text style={styles.infoValue}>{average}%</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>CLASS SIZE:</Text>
            <Text style={styles.infoValue}>{classInfo?.size || 'N/A'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>OVERALL GRADE:</Text>
            <Text style={styles.infoValue}>{overallGrade}</Text>
          </View>
          <View style={[styles.infoBox, { marginRight: 0 }]}>
            <Text style={styles.infoLabel}>GENDER:</Text>
            <Text style={styles.infoValue}>{student.gender}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colSN, styles.cellCenter]}>S/N</Text>
            <Text style={[styles.cell, styles.colSubject]}>SUBJECTS</Text>
            <Text style={[styles.cell, styles.colNote, styles.cellCenter]}>NOTE{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colCW, styles.cellCenter]}>CW{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colHW, styles.cellCenter]}>HW{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colTest, styles.cellCenter]}>TEST{'\n'}15%</Text>
            <Text style={[styles.cell, styles.colCA, styles.cellCenter]}>CA{'\n'}15%</Text>
            <Text style={[styles.cell, styles.colExam, styles.cellCenter]}>EXAM{'\n'}60%</Text>
            <Text style={[styles.cell, styles.colTotal, styles.cellCenter]}>TOTAL{'\n'}100%</Text>
            <Text style={[styles.cell, styles.colGrade, styles.cellCenter]}>GRADE</Text>
            <Text style={[styles.cell, styles.colPosition, styles.cellCenter]}>SUBJECT{'\n'}POSITION</Text>
            <Text style={[styles.cell, styles.colHighest, styles.cellCenter]}>SUBJECT{'\n'}HIGHEST</Text>
            <Text style={[styles.cell, styles.colRemark, { borderRight: 0 }]}>REMARKS</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colSN, styles.cellCenter]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.colSubject]}>{r.subjects?.name?.toUpperCase()}</Text>
              <Text style={[styles.cell, styles.colNote, styles.cellCenter]}>{r.score_note || 0}</Text>
              <Text style={[styles.cell, styles.colCW, styles.cellCenter]}>{r.score_cw || 0}</Text>
              <Text style={[styles.cell, styles.colHW, styles.cellCenter]}>{r.score_hw || 0}</Text>
              <Text style={[styles.cell, styles.colTest, styles.cellCenter]}>{r.score_test || 0}</Text>
              <Text style={[styles.cell, styles.colCA, styles.cellCenter]}>{r.score_ca || 0}</Text>
              <Text style={[styles.cell, styles.colExam, styles.cellCenter]}>{r.score_exam || 0}</Text>
              <Text style={[styles.cell, styles.colTotal, styles.cellCenter]}>{r.total}</Text>
              <Text style={[styles.cell, styles.colGrade, styles.cellCenter]}>{r.grade}</Text>
              <Text style={[styles.cell, styles.colPosition, styles.cellCenter]}>{r.position || '-'}</Text>
              <Text style={[styles.cell, styles.colHighest, styles.cellCenter]}>{r.highest || '-'}</Text>
              <Text style={[styles.cell, styles.colRemark, { borderRight: 0 }]}>{r.remarks}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>GRADE SUMMARY</Text>
          <View style={styles.summaryGrid}>
            <Text style={styles.summaryItem}>A*: {gradeCounts['A*']}</Text>
            <Text style={styles.summaryItem}>A: {gradeCounts['A']}</Text>
            <Text style={styles.summaryItem}>B: {gradeCounts['B']}</Text>
            <Text style={styles.summaryItem}>C: {gradeCounts['C']}</Text>
            <Text style={styles.summaryItem}>D: {gradeCounts['D']}</Text>
            <Text style={styles.summaryItem}>E: {gradeCounts['E']}</Text>
          </View>
          <Text style={[styles.summaryItem, { width: '100%', marginTop: 3, fontSize: 6 }]}>
            86-100 (A*) Excellent, 76-85 (A) Outstanding, 66-75 (B) Very Good, 60-65 (C) Good, 50-59 (D) Fairly Good, 40-49 (E) Below Expectation, 0-39 (E*) Rarely
          </Text>
          <Text style={[styles.summaryItem, { width: '100%', marginTop: 2 }]}>
            TOTAL SCORE: {totalScore.toFixed(1)} | NO OF SUBJECTS: {results.length}
          </Text>
        </View>

        <View style={styles.behaviorSection}>
          <Text style={styles.summaryTitle}>STUDENTS BEHAVIOURAL REPORT</Text>
          <View style={styles.behaviorGrid}>
            {behaviors.map((b, i) => (
              <Text key={i} style={styles.behaviorItem}>{b.trait}: {b.rating}</Text>
            ))}
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>FORM TUTOR'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.tutor_comment || 'No comment provided.'}</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>PRINCIPAL'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.principal_comment || 'No comment provided.'}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FORM TUTOR</Text>
            <Text style={[styles.signatureLabel, { fontSize: 6, marginTop: 1 }]}>{classInfo?.profiles?.full_name || ''}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>PRINCIPAL</Text>
            <Text style={[styles.signatureLabel, { fontSize: 6, marginTop: 1 }]}>{school.principal_name || ''}</Text>
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
             
             <div className="border-t pt-4">
               <label className="block text-sm font-bold mb-2">School Logo</label>
               <input type="file" accept="image/*" className="w-full p-2 border rounded" 
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file) return;
                   
                   const reader = new FileReader();
                   reader.onload = async (event) => {
                     const base64 = event.target.result;
                     setSchool({...school, logo_url: base64});
                   };
                   reader.readAsDataURL(file);
                 }} />
               {school.logo_url && (
                 <div className="mt-2">
                   <img src={school.logo_url} alt="Logo" className="h-20 object-contain border rounded p-2" />
                 </div>
               )}
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
  const [showPreview, setShowPreview] = useState(false);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
      setClasses(data || []);
      if(data?.[0]) handleClassSelect(data[0]);
      
      const { data: sch } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
      setSchool(sch);
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
      handleClassSelect(curClass);
    }
  };

  const loadStudentData = async (stu) => {
    setSelStu(stu);
    const { data: res } = await supabase.from('results').select('*').eq('student_id', stu.id);
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
    
    const scoreMap = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id);
      scoreMap[s.id] = existing || { note: 0, cw: 0, hw: 0, test: 0, ca: 0, exam: 0, position: '', highest: '' };
    });
    setScores(scoreMap);
    setComment(com?.tutor_comment || '');
  };

  const saveData = async () => {
    if(!selStu) return;
    
    const resToSave = subjects.map(s => {
      const sc = scores[s.id];
      const total = (sc.score_note||0)+(sc.score_cw||0)+(sc.score_hw||0)+(sc.score_test||0)+(sc.score_ca||0)+(sc.score_exam||0);
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selStu.id, subject_id: s.id,
        score_note: sc.score_note, score_cw: sc.score_cw, score_hw: sc.score_hw,
        score_test: sc.score_test, score_ca: sc.score_ca, score_exam: sc.score_exam,
        total, grade, remarks: remark,
        position: sc.position || null,
        highest: sc.highest || null
      };
    });
    
    await supabase.from('results').delete().eq('student_id', selStu.id);
    await supabase.from('results').insert(resToSave);
    await supabase.from('comments').upsert({ student_id: selStu.id, tutor_comment: comment }, { onConflict: 'student_id' });
  };

  const { debouncedSave, saving } = useAutoSave(saveData);

  useEffect(() => { if(selStu) debouncedSave(); }, [scores, comment]);

  const updateScore = (subId, field, val) => {
    const v = validateScore(val, field);
    setScores(prev => ({ ...prev, [subId]: { ...prev[subId], [`score_${field}`]: v } }));
  };

  const getPreviewData = async () => {
    if (!selStu) return null;
    
    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', selStu.id);
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', selStu.id).single();
    
    const processed = (res||[]).map(x => ({ 
      ...x, 
      total: (x.score_note||0)+(x.score_cw||0)+(x.score_hw||0)+(x.score_test||0)+(x.score_ca||0)+(x.score_exam||0) 
    }));
    
    return {
      student: selStu,
      school: school,
      classInfo: curClass,
      results: processed,
      comments: com
    };
  };

  const openPreview = async () => {
    const data = await getPreviewData();
    if (data) {
      setShowPreview(data);
    }
  };

  if (showPreview) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <X size={20}/> Close Preview
          </button>
          <span className="font-bold">{showPreview.student.name}</span>
          <PDFDownloadLink 
            document={<ResultPDF {...showPreview} />} 
            fileName={`${showPreview.student.name}_Result.pdf`} 
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Download size={16}/> Download PDF
          </PDFDownloadLink>
        </div>
        <PDFViewer className="flex-1 w-full">
          <ResultPDF {...showPreview} />
        </PDFViewer>
      </div>
    );
  }

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
              <div className="flex items-center gap-4">
                {saving && <span className="text-sm text-gray-500 flex gap-2"><Loader2 className="animate-spin" size={16}/> Saving...</span>}
                <button 
                  onClick={openPreview} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2">
                  <Eye size={18}/> Preview Result
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded shadow mb-6">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold">Scores</h3>
                 <button onClick={addSubject} className="text-sm bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><Plus size={14}/> Add Subject</button>
              </div>
              <div className="overflow-x-auto">
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
                      <th className="p-2 w-20">Position</th>
                      <th className="p-2 w-20">Highest</th>
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
                            <td key={f} className="p-2">
                              <input 
                                className="w-full text-center border rounded p-1" 
                                type="number" 
                                value={sc[`score_${f}`] || ''} 
                                onChange={e => updateScore(s.id, f, e.target.value)} 
                              />
                            </td>
                          ))}
                          <td className="p-2 font-bold text-center">{total}</td>
                          <td className="p-2">
                            <input 
                              className="w-full text-center border rounded p-1" 
                              placeholder="1st" 
                              value={sc.position || ''} 
                              onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], position: e.target.value } }))} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full text-center border rounded p-1" 
                              placeholder="95" 
                              value={sc.highest || ''} 
                              onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], highest: e.target.value } }))} 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold mb-2">Form Tutor Comment</h3>
              <textarea 
                className="w-full border rounded p-3 h-24" 
                placeholder="Enter comment..." 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
              <User size={64} className="mx-auto mb-4 opacity-20"/>
              <p>Select a student to begin</p>
            </div>
          </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <School size={48} className="mx-auto text-blue-600 mb-2"/>
          <h1 className="text-2xl font-bold text-gray-800">School Result System</h1>
        </div>
        
        <div className="flex justify-center mb-6 gap-4 text-sm font-bold text-gray-400">
          {['login','register','central'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`pb-1 capitalize ${mode === m ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>
              {m === 'central' ? 'Admin' : m}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input placeholder="Full Name" className="w-full p-3 border rounded-lg" required value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setRole('admin')} className={`flex-1 p-2 rounded-lg border ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>School Owner</button>
                <button type="button" onClick={() => setRole('teacher')} className={`flex-1 p-2 rounded-lg border ${role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>Teacher</button>
              </div>
              {role === 'admin' ? 
                <input placeholder="Subscription PIN" className="w-full p-3 border-2 border-orange-200 bg-orange-50 rounded-lg" required value={data.pin} onChange={e => setData({...data, pin: e.target.value})} /> :
                <input placeholder="School ID Code" className="w-full p-3 border rounded-lg" required value={data.schoolCode} onChange={e => setData({...data, schoolCode: e.target.value})} />
              }
            </>
          )}
          
          <input placeholder={mode === 'central' ? 'Username' : 'Email'} className="w-full p-3 border rounded-lg" required value={data.email} onChange={e => setData({...data, email: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" required value={data.password} onChange={e => setData({...data, password: e.target.value})} />
          
          <button disabled={loading} className={`w-full p-3 rounded-lg text-white font-bold ${mode === 'central' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {mode === 'login' && (
          <button onClick={onParent} className="w-full mt-4 border-2 border-green-600 text-green-700 p-3 rounded-lg font-bold hover:bg-green-50 flex justify-center gap-2">
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
    const { data: s } = await supabase.from('students').select('*, schools(*), classes(*, profiles(full_name))').eq('admission_no', adm).eq('parent_pin', pin).single();
    if (!s) return alert('Invalid details');
    const { data: r } = await supabase.from('results').select('*, subjects(*)').eq('student_id', s.id);
    const { data: c } = await supabase.from('comments').select('*').eq('student_id', s.id).single();
    
    const processed = (r||[]).map(x => ({ ...x, total: (x.score_note||0)+(x.score_cw||0)+(x.score_hw||0)+(x.score_test||0)+(x.score_ca||0)+(x.score_exam||0) }));
    setResData({ student: s, school: s.schools, classInfo: s.classes, results: processed, comments: c });
  };

  if (resData) return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <button onClick={() => setResData(null)} className="flex items-center gap-2">
          <X size={20}/> Back
        </button>
        <span className="font-bold">{resData.student.name}</span>
        <PDFDownloadLink document={<ResultPDF {...resData} />} fileName="Result.pdf" className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2">
          <Download size={16}/> Download
        </PDFDownloadLink>
      </div>
      <PDFViewer className="flex-1 w-full"><ResultPDF {...resData} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <form onSubmit={check} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <User size={48} className="mx-auto text-green-600 mb-2"/>
          <h2 className="text-xl font-bold">Parent Portal</h2>
          <p className="text-sm text-gray-500">Check Student Result</p>
        </div>
        <input placeholder="Admission Number" className="w-full p-3 border rounded-lg" value={adm} onChange={e => setAdm(e.target.value)} required />
        <input type="password" placeholder="Parent PIN" className="w-full p-3 border rounded-lg" value={pin} onChange={e => setPin(e.target.value)} required />
        <button className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold">Check Result</button>
        <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">Back to Login</button>
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
  
  if (!profile) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={48}/>
    </div>
  );

  return profile.role === 'admin' 
    ? <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} /> 
    : <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink 
} from '@react-pdf/renderer';
import { 
  LayoutDashboard, Key, LogOut, Loader2, Save, Plus, School, 
  Copy, Check, AlertCircle, User, FileText, Download, Menu, X, Users, TrendingUp, Eye, Send, CheckCircle
} from 'lucide-react';

// --- CONFIGURATION --
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg';
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
const ResultPDF = ({ school, student, results, classInfo, comments, behaviors }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const { grade: overallGrade } = calculateGrade(parseFloat(average));
  
  const gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'E*': 0 };
  results.forEach(r => {
    if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++;
  });
  
  const defaultBehaviors = [
    { trait: 'COOPERATION', rating: behaviors?.cooperation || 'Excellent Degree' },
    { trait: 'LEADERSHIP', rating: behaviors?.leadership || 'Excellent Degree' },
    { trait: 'HONESTY', rating: behaviors?.honesty || 'Excellent Degree' },
    { trait: 'SELF DISCIPLINE', rating: behaviors?.self_discipline || 'Excellent Degree' },
    { trait: 'RESPECT', rating: behaviors?.respect || 'Excellent Degree' },
    { trait: 'RESPONSIBILITY', rating: behaviors?.responsibility || 'Excellent Degree' },
    { trait: 'EMPATHY', rating: behaviors?.empathy || 'Excellent Degree' },
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
            {defaultBehaviors.map((b, i) => (
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
          <Text style={styles.commentText}>{comments?.principal_comment || 'Awaiting principal approval.'}</Text>
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
  const [pendingResults, setPendingResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [principalComment, setPrincipalComment] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
    if(s) {
      setSchool(s);
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', s.id);
      setTotalStudents(count || 0);
      
      // Fetch pending results
      const { data: pending } = await supabase
        .from('comments')
        .select('*, students(*, classes(name))')
        .eq('students.school_id', s.id)
        .eq('approved_by_principal', false)
        .not('tutor_comment', 'is', null);
      setPendingResults(pending || []);
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

  const openResultPreview = async (comment) => {
    setSelectedResult(comment);
    setPrincipalComment(comment.principal_comment || '');
    
    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', comment.student_id);
    const { data: beh } = await supabase.from('behaviors').select('*').eq('student_id', comment.student_id).single();
    const { data: stu } = await supabase.from('students').select('*, classes(*, profiles(full_name))').eq('id', comment.student_id).single();
    
    const processed = (res||[]).map(x => ({ 
      ...x, 
      total: (x.score_note||0)+(x.score_cw||0)+(x.score_hw||0)+(x.score_test||0)+(x.score_ca||0)+(x.score_exam||0) 
    }));
    
    setShowPreview({
      student: stu,
      school: school,
      classInfo: stu.classes,
      results: processed,
      comments: comment,
      behaviors: beh
    });
  };

  const approveResult = async () => {
    await supabase.from('comments')
      .update({ 
        principal_comment: principalComment,
        approved_by_principal: true
      })
      .eq('id', selectedResult.id);
    
    alert('Result Approved!');
    setShowPreview(false);
    setSelectedResult(null);
    fetchAll();
  };

  const isExpired = new Date(school.subscription_expires_at) < new Date();

  if (showPreview) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <X size={20}/> Close Preview
          </button>
          <span className="font-bold">{showPreview.student.name}</span>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Principal's Comment"
              className="border rounded px-3 py-2 w-96"
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
            />
            <button 
              onClick={approveResult}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <CheckCircle size={16}/> Approve
            </button>
          </div>
        </div>
        <PDFViewer className="flex-1 w-full">
          <ResultPDF {...showPreview} comments={{...showPreview.comments, principal_comment: principalComment}} />
        </PDFViewer>
      </div>
    );
  }

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
          {['home', 'pending', 'classes', 'students', 'settings'].map(v => (
            <button key={v} onClick={() => setView(v)} 
              className={`px-4 py-2 rounded-lg capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-white shadow'} relative`}>
              {v}
              {v === 'pending' && pendingResults.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {pendingResults.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {view === 'home' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Students</h3>          <div className="text-3xl font-bold">{totalStudents} / {school.max_students}</div>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Subscription</h3>
              <div className={`text-xl font-bold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                {isExpired ? 'Expired' : 'Active'}
              </div>
              <p className="text-xs text-gray-400">Expires: {new Date(school.subscription_expires_at).toLocaleDateString()}</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Pending Results</h3>
              <div className="text-3xl font-bold text-orange-500">{pendingResults.length}</div>
            </div>
          </div>
        )}

        {view === 'pending' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-bold mb-4">Results Awaiting Approval</h2>
            {pendingResults.length === 0 ? <p className="text-gray-500">No pending results.</p> : (
              <div className="space-y-3">
                {pendingResults.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-bold">{c.students.name}</p>
                      <p className="text-xs text-gray-500">{c.students.classes?.name}</p>
                    </div>
                    <button onClick={() => openResultPreview(c)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm font-medium">
                      Review & Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'classes' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow h-fit">
              <h3 className="font-bold mb-4">Add Class</h3>
              <form onSubmit={addClass} className="space-y-4">
                <input name="name" placeholder="Class Name (e.g. JSS 1)" className="w-full border p-2 rounded" required />
                <select name="tutor" className="w-full border p-2 rounded">
                  <option value="">Select Form Tutor</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
                <button className="w-full bg-blue-600 text-white py-2 rounded">Create Class</button>
              </form>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold mb-4">Existing Classes</h3>
              {classes.map(c => (
                <div key={c.id} className="border-b py-2 flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-sm text-gray-500">{c.profiles?.full_name || 'No Tutor'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'students' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow h-fit">
              <h3 className="font-bold mb-4">Add Student</h3>
              <form onSubmit={addStudent} className="space-y-4">
                <input name="name" placeholder="Full Name" className="w-full border p-2 rounded" required />
                <input name="adm" placeholder="Admission No" className="w-full border p-2 rounded" required />
                <div className="grid grid-cols-2 gap-2">
                  <select name="class_id" className="border p-2 rounded" required>
                    <option value="">Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select name="gender" className="border p-2 rounded" required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <input name="pin" placeholder="Parent Access PIN" className="w-full border p-2 rounded" required />
                <button className="w-full bg-green-600 text-white py-2 rounded">Register Student</button>
              </form>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-bold mb-4">Student List ({totalStudents})</h3>
              <div className="max-h-96 overflow-y-auto">
                 {/* In a real app, this should be paginated */}
                 <p className="text-sm text-gray-500">Search logic would go here...</p>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="bg-white p-6 rounded shadow max-w-2xl">
            <h3 className="font-bold mb-4">School Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">School Name</label>
                <input value={school.name || ''} onChange={e => setSchool({...school, name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Logo URL</label>
                <input value={school.logo_url || ''} onChange={e => setSchool({...school, logo_url: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Current Term</label>
                  <input value={school.current_term || ''} onChange={e => setSchool({...school, current_term: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Session</label>
                  <input value={school.current_session || ''} onChange={e => setSchool({...school, current_session: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Principal's Name</label>
                <input value={school.principal_name || ''} onChange={e => setSchool({...school, principal_name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <button onClick={saveSchool} className="bg-blue-600 text-white px-6 py-2 rounded">Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- TEACHER PORTAL ---
const TeacherPortal = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Data for editing
  const [scores, setScores] = useState({});
  const [behavior, setBehavior] = useState({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    // Fetch classes where this teacher is assigned (or all if school policy allows)
    // Here we fetch all classes in the teacher's school for simplicity, normally filtered by permission
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setClasses(c || []);
    const { data: s } = await supabase.from('subjects').select('*').eq('school_id', profile.school_id);
    setSubjects(s || []);
  };

  const loadStudents = async (classId) => {
    setSelectedClass(classId);
    setLoading(true);
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
    setStudents(data || []);
    setLoading(false);
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    
    // Fetch Results
    const { data: res } = await supabase.from('results').select('*').eq('student_id', student.id);
    // Transform to object for easier input mapping: { subject_id: { ...scoreData } }
    const scoreMap = {};
    res?.forEach(r => scoreMap[r.subject_id] = r);
    setScores(scoreMap);

    // Fetch Behavior
    const { data: beh } = await supabase.from('behaviors').select('*').eq('student_id', student.id).single();
    setBehavior(beh || {});

    // Fetch Comment
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', student.id).single();
    setComment(com?.tutor_comment || '');
    
    setLoading(false);
  };

  const handleScoreUpdate = async (subjectId, field, value) => {
    const validValue = validateScore(value, field);
    const newScores = { ...scores };
    if (!newScores[subjectId]) newScores[subjectId] = { student_id: selectedStudent.id, subject_id: subjectId };
    newScores[subjectId][field] = validValue;
    
    // Auto calc total/grade locally for UI
    const s = newScores[subjectId];
    const total = (parseFloat(s.score_note)||0) + (parseFloat(s.score_cw)||0) + (parseFloat(s.score_hw)||0) + (parseFloat(s.score_test)||0) + (parseFloat(s.score_ca)||0) + (parseFloat(s.score_exam)||0);
    const { grade, remark } = calculateGrade(total);
    s.total = total;
    s.grade = grade;
    s.remarks = remark;

    setScores(newScores);

    // Debounced save or instant save
    await supabase.from('results').upsert({
      student_id: selectedStudent.id,
      subject_id: subjectId,
      [field]: validValue,
      total, grade, remarks: remark
    });
  };

  const saveDetails = async () => {
    await supabase.from('behaviors').upsert({ ...behavior, student_id: selectedStudent.id });
    await supabase.from('comments').upsert({ 
      student_id: selectedStudent.id, 
      tutor_comment: comment,
      approved_by_principal: false // Reset approval on change
    });
    alert('Student Record Saved');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Teacher Portal</h1>
          <button onClick={onLogout} className="flex gap-2 text-red-600"><LogOut size={20}/> Logout</button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Class/Student Selection */}
          <div className="col-span-12 md:col-span-3 bg-white p-4 rounded-xl shadow h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-gray-500 mb-2">CLASSES</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {classes.map(c => (
                <button key={c.id} onClick={() => loadStudents(c.id)}
                  className={`px-3 py-1 rounded text-sm ${selectedClass === c.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {c.name}
                </button>
              ))}
            </div>

            {selectedClass && (
              <>
                <h3 className="font-bold text-gray-500 mb-2">STUDENTS</h3>
                <div className="space-y-1">
                  {students.map(s => (
                    <button key={s.id} onClick={() => selectStudent(s)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${selectedStudent?.id === s.id ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Main Content - Grading Area */}
          <div className="col-span-12 md:col-span-9 bg-white p-6 rounded-xl shadow h-[80vh] overflow-y-auto">
            {!selectedStudent ? (
              <div className="h-full flex items-center justify-center text-gray-400">Select a student to begin grading</div>
            ) : loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin"/></div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500">{selectedStudent.admission_no}</p>
                  </div>
                  <button onClick={saveDetails} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex gap-2 items-center">
                    <Save size={18} /> Save Comments
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText size={18}/> Subject Scores</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-xs uppercase">
                        <tr>
                          <th className="p-2">Subject</th>
                          <th className="p-2 w-16">Note (5)</th>
                          <th className="p-2 w-16">CW (5)</th>
                          <th className="p-2 w-16">HW (5)</th>
                          <th className="p-2 w-16">Test (15)</th>
                          <th className="p-2 w-16">CA (15)</th>
                          <th className="p-2 w-16">Exam (60)</th>
                          <th className="p-2 w-16">Total</th>
                          <th className="p-2 w-16">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(sub => {
                          const s = scores[sub.id] || {};
                          return (
                            <tr key={sub.id} className="border-b hover:bg-slate-50">
                              <td className="p-2 font-medium">{sub.name}</td>
                              {['score_note', 'score_cw', 'score_hw', 'score_test', 'score_ca', 'score_exam'].map(field => (
                                <td key={field} className="p-1">
                                  <input 
                                    type="number" 
                                    className="w-full border rounded p-1 text-center focus:ring-2 ring-blue-200 outline-none"
                                    value={s[field] || ''}
                                    onChange={(e) => handleScoreUpdate(sub.id, field, e.target.value)}
                                  />
                                </td>
                              ))}
                              <td className="p-2 font-bold text-center">{s.total || 0}</td>
                              <td className="p-2 text-center text-xs">{s.grade || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><User size={18}/> Behavioral Traits</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {['cooperation', 'leadership', 'honesty', 'self_discipline', 'respect', 'responsibility', 'empathy'].map(trait => (
                        <div key={trait}>
                          <label className="text-xs uppercase font-bold text-gray-500 mb-1 block">{trait.replace('_', ' ')}</label>
                          <select 
                            className="w-full border rounded p-2 text-sm"
                            value={behavior[trait] || ''}
                            onChange={(e) => setBehavior({...behavior, [trait]: e.target.value})}
                          >
                            <option value="Excellent Degree">Excellent</option>
                            <option value="Good Degree">Good</option>
                            <option value="Fair Degree">Fair</option>
                            <option value="Poor Degree">Poor</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Send size={18}/> Class Teacher's Comment</h3>
                    <textarea 
                      className="w-full h-32 border rounded p-3 text-sm"
                      placeholder="Write a comprehensive comment about the student's performance..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PARENT/PUBLIC PORTAL ---
const ParentPortal = ({ onBack }) => {
  const [admNo, setAdmNo] = useState('');
  const [pin, setPin] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkResult = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResultData(null);

    // 1. Find Student
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('*, schools(*), classes(*, profiles(full_name))')
      .eq('admission_no', admNo)
      .eq('parent_pin', pin)
      .single();

    if (sErr || !student) {
      setLoading(false); return setError('Invalid Admission Number or PIN.');
    }

    // 2. Check Subscription
    if (new Date(student.schools.subscription_expires_at) < new Date()) {
      setLoading(false); return setError('School subscription has expired. Please contact the administration.');
    }

    // 3. Fetch Data
    const { data: results } = await supabase.from('results').select('*, subjects(name)').eq('student_id', student.id);
    const { data: comments } = await supabase.from('comments').select('*').eq('student_id', student.id).single();
    const { data: behaviors } = await supabase.from('behaviors').select('*').eq('student_id', student.id).single();

    if (!comments?.approved_by_principal) {
      setLoading(false); return setError('Result is being processed and has not been approved by the principal yet.');
    }

    // Process results for PDF
    const processedResults = results.map(r => ({
      ...r,
      total: (r.score_note||0)+(r.score_cw||0)+(r.score_hw||0)+(r.score_test||0)+(r.score_ca||0)+(r.score_exam||0)
    }));

    setResultData({
      student,
      school: student.schools,
      classInfo: student.classes,
      results: processedResults,
      comments,
      behaviors
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <School className="mx-auto text-white mb-2" size={40} />
          <h1 className="text-2xl font-bold text-white">Student Result Portal</h1>
          <p className="text-blue-100 text-sm">Access your academic records securely</p>
        </div>

        {!resultData ? (
          <form onSubmit={checkResult} className="p-8 space-y-6">
            {error && <div className="p-3 bg-red-100 text-red-600 text-xs rounded flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Admission Number</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 2024/001"
                  value={admNo}
                  onChange={e => setAdmNo(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Access PIN</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  required
                />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex justify-center">
              {loading ? <Loader2 className="animate-spin" /> : 'Check Result'}
            </button>
            <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">Back to Login</button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{resultData.student.name}</h2>
              <p className="text-gray-500">{resultData.classInfo.name} • {resultData.school.current_term}</p>
            </div>
            
            <PDFDownloadLink
              document={<ResultPDF {...resultData} />}
              fileName={`${resultData.student.name}_Result.pdf`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {({ loading }) => loading ? 'Generating PDF...' : <><Download size={20}/> Download Report Card</>}
            </PDFDownloadLink>
            
            <button onClick={() => setResultData(null)} className="text-gray-500 text-sm hover:underline">Check Another Result</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- AUTH COMPONENT ---
const Auth = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Only for School Owners
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error;

    if (isRegistering) {
      const { error: err } = await supabase.auth.signUp({ 
        email, password, options: { data: { full_name: fullName, role: 'school_admin' } } 
      });
      error = err;
      if (!error) alert('Check your email to confirm registration!');
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      error = err;
    }

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
          {isRegistering ? 'Register School' : 'Staff Login'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
             <input type="text" placeholder="Full Name" className="w-full border p-3 rounded" value={fullName} onChange={e=>setFullName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" className="w-full border p-3 rounded" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full border p-3 rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded font-bold hover:bg-slate-800">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : (isRegistering ? 'Sign Up' : 'Login')}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500 space-y-2">
          <button onClick={() => setIsRegistering(!isRegistering)} className="hover:text-blue-600">
            {isRegistering ? 'Already have an account? Login' : 'Create School Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('landing'); // landing, parent

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  if (!session) {
    if (view === 'parent') return <ParentPortal onBack={() => setView('landing')} />;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <LayoutDashboard size={64} className="text-blue-600 mb-6" />
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Smart School Manager</h1>
          <p className="text-slate-600 mb-8 max-w-md">Seamless results processing, student management, and report generation for modern schools.</p>
          <div className="flex gap-4 flex-col sm:flex-row w-full max-w-sm">
            <button onClick={() => setView('auth')} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">
              Staff Login
            </button>
            <button onClick={() => setView('parent')} className="flex-1 bg-white text-blue-600 border-2 border-blue-600 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition">
              Check Result
            </button>
          </div>
        </div>
        {view === 'auth' && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="w-full max-w-md relative">
               <button onClick={() => setView('landing')} className="absolute -top-10 right-0 p-2 text-gray-600"><X/></button>
               <Auth />
             </div>
          </div>
        )}
      </div>
    );
  }

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  if (profile.role === 'central_admin') return <CentralAdmin onLogout={() => supabase.auth.signOut()} />;
  if (profile.role === 'school_admin') return <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} />;
  if (profile.role === 'teacher') return <TeacherPortal profile={profile} onLogout={() => supabase.auth.signOut()} />;

  return <div className="p-10 text-center">Access Denied. Unknown Role.</div>;
};

export default App;

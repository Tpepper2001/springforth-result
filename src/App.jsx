import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink } from '@react-pdf/renderer';
import { LayoutDashboard, Key, LogOut, Loader2, Save, Plus, School, Copy, Check, AlertCircle, User, FileText, Download, Menu, X, Users, TrendingUp, Eye, CheckCircle, Clock, Send } from 'lucide-react';

// --- CONFIGURATION ---
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

// Behavioral Traits
const BEHAVIORAL_TRAITS = [
  'COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE',
  'RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'PUNCTUALITY', 'NEATNESS', 'INITIATIVE'
];

const RATINGS = ['Excellent Degree', 'Very Good', 'Good', 'Fair', 'Poor'];

// --- HOOKS ---
const useAutoSave = (callback, delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const timeoutRef = React.useRef(null);

  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await callback(data);
      setSaving(false);
    }, delay);
  }, [callback, delay]);

  React.useEffect(() => () => timeoutRef.current && clearTimeout(timeoutRef.current), []);

  return { debouncedSave, saving };
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
  colSN: { width: '4%' }, colSubject: { width: '18%' }, colNote: { width: '5%' },
  colCW: { width: '5%' }, colHW: { width: '5%' }, colTest: { width: '6%' },
  colCA: { width: '6%' }, colExam: { width: '6%' }, colTotal: { width: '7%', fontWeight: 'bold' },
  colGrade: { width: '6%' }, colPosition: { width: '7%' }, colHighest: { width: '8%' },
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
const ResultPDF = ({ school, student, results, classInfo, comments, behaviors = [] }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const { grade: overallGrade } = calculateGrade(parseFloat(average));

  const gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'E*': 0 };
  results.forEach(r => gradeCounts[r.grade]++);

  const behaviorMap = Object.fromEntries(behaviors.map(b => [b.trait, b.rating]));

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
          <View style={styles.infoBox}><Text style={styles.infoLabel}>NAME:</Text><Text style={styles.infoValue}>{student.name}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>ADM NO:</Text><Text style={styles.infoValue}>{student.admission_no}</Text></View>
          <View style={[styles.infoBox, { marginRight: 0 }]}><Text style={styles.infoLabel}>CLASS:</Text><Text style={styles.infoValue}>{classInfo?.name}</Text></View>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>AVERAGE SCORE:</Text><Text style={styles.infoValue}>{average}%</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>CLASS SIZE:</Text><Text style={styles.infoValue}>{classInfo?.size || 'N/A'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>OVERALL GRADE:</Text><Text style={styles.infoValue}>{overallGrade}</Text></View>
          <View style={[styles.infoBox, { marginRight: 0 }]}><Text style={styles.infoLabel}>GENDER:</Text><Text style={styles.infoValue}>{student.gender}</Text></View>
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
            <Text style={[styles.cell, styles.colPosition, styles.cellCenter]}>POS</Text>
            <Text style={[styles.cell, styles.colHighest, styles.cellCenter]}>HIGH</Text>
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
            {Object.entries(gradeCounts).map(([g, c]) => (
              <Text key={g} style={styles.summaryItem}>{g}: {c}</Text>
            ))}
          </View>
          <Text style={[styles.summaryItem, { width: '100%', marginTop: 5, fontSize: 6 }]}>
            86-100 (A*) Excellent • 76-85 (A) Outstanding • 66-75 (B) Very Good • 60-65 (C) Good • 50-59 (D) Fairly Good • 40-49 (E) Below Expectation • 0-39 (E*) Rarely
          </Text>
          <Text style={[styles.summaryItem, { width: '100%' }]}>TOTAL SCORE: {totalScore.toFixed(1)} | SUBJECTS: {results.length}</Text>
        </View>

        <View style={styles.behaviorSection}>
          <Text style={styles.summaryTitle}>BEHAVIOURAL REPORT</Text>
          <View style={styles.behaviorGrid}>
            {BEHAVIORAL_TRAITS.map(trait => (
              <Text key={trait} style={styles.behaviorItem}>{trait}: {behaviorMap[trait] || 'Good'}</Text>
            ))}
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>FORM TUTOR'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.tutor_comment || 'No comment provided.'}</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>PRINCIPAL'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.principal_comment || 'Result approved and released.'}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FORM TUTOR</Text>
            <Text style={[styles.signatureLabel, { fontSize: 6 }]}>{classInfo?.profiles?.full_name || ''}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>PRINCIPAL</Text>
            <Text style={[styles.signatureLabel, { fontSize: 6 }]}>{school.principal_name || ''}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// --- CENTRAL ADMIN ---
const CentralAdmin = ({ onLogout }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [newPinData, setNewPinData] = useState({ months: 6, limit: 200 });

  useEffect(() => { fetchPins(); }, []);

  const fetchPins = async () => {
    const { data } = await supabase.from('subscription_pins').select('*').order('created_at', { ascending: false });
    setPins(data || []);
  };

  const generatePin = async () => {
    setLoading(true);
    const code = `SUB-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const { error } = await supabase.from('subscription_pins').insert({
      code, duration_months: newPinData.months, student_limit: newPinData.limit
    });
    if (!error) fetchPins();
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
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="text-green-400" /> Generate PIN</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Duration</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[3, 6, 12].map(m => (
                    <button key={m} onClick={() => setNewPinData(p => ({ ...p, months: m }))}
                      className={`py-2 rounded text-sm font-bold ${newPinData.months === m ? 'bg-blue-600' : 'bg-slate-700'}`}>
                      {m} Mo
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" placeholder="Student Limit" className="w-full bg-slate-900 border border-slate-700 rounded p-3"
                value={newPinData.limit} onChange={e => setNewPinData(p => ({ ...p, limit: +e.target.value }))} />
              <button onClick={generatePin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold flex justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Create PIN'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6">Active PINs</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pins.map(pin => (
                <div key={pin.id} className={`p-4 rounded-xl border flex justify-between items-center ${pin.is_used ? 'bg-slate-900/50 border-slate-700 opacity-60' : 'bg-slate-700/30 border-slate-600'}`}>
                  <div>
                    <div className="flex gap-3 items-center">
                      <span className={`font-mono text-lg font-bold ${pin.is_used ? 'line-through text-slate-500' : 'text-blue-300'}`}>{pin.code}</span>
                      <span className={`text-xs px-2 rounded ${pin.is_used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {pin.is_used ? 'USED' : 'ACTIVE'}
                      </span>
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

// --- SCHOOL ADMIN DASHBOARD (with Principal Approval) ---
const SchoolAdmin = ({ profile, onLogout }) => {
  const [school, setSchool] = useState({});
  const [classes, setClasses] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [view, setView] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
    setSchool(s || {});

    const { data: c } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s?.id);
    setClasses(c || []);

    const { data: pending } = await supabase.from('comments')
      .select('*, students(*, classes(*)), profiles(full_name)')
      .eq('school_id', s?.id)
      .neq('principal_comment', null)
      .is('principal_comment', null);
    setPendingResults(pending || []);
  };

  const approveResult = async (commentId, comment) => {
    await supabase.from('comments').update({ principal_comment: comment, status: 'approved' }).eq('id', commentId);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">{school.name}</h1>
            <p className="text-sm text-gray-500">Approve Results for Release</p>
          </div>
          <button onClick={onLogout} className="text-red-600"><LogOut /></button>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="border-b p-4 font-bold text-lg">Pending Results for Approval ({pendingResults.length})</div>
          <div className="p-6 space-y-4">
            {pendingResults.map(item => (
              <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.students.name} - {item.students.classes.name}</p>
                  <p className="text-sm text-gray-600">Tutor: {item.profiles.full_name}</p>
                  <p className="text-sm italic mt-2">"{item.tutor_comment}"</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => approveResult(item.id, 'Promoted to next class. Keep it up!')} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
            {pendingResults.length === 0 && <p className="text-center text-gray-500 py-8">No pending results</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD (Fixed + Behavioral Input) ---
const TeacherDashboard = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [curClass, setCurClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selStu, setSelStu] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [behaviors, setBehaviors] = useState({});
  const [tutorComment, setTutorComment] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: cls } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
      setClasses(cls || []);
      if (cls?.[0]) handleClassSelect(cls[0]);

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

  const loadStudentData = async (stu) => {
    setSelStu(stu);

    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', stu.id);
    const { data: com } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();

    const scoreMap = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id) || {};
      scoreMap[s.id] = {
        score_note: existing?.score_note || 0,
        score_cw: existing?.score_cw || 0,
        score_hw: existing?.score_hw || 0,
        score_test: existing?.score_test || 0,
        score_ca: existing?.score_ca || 0,
        score_exam: existing?.score_exam || 0,
        position: existing?.position || '',
        highest: existing?.highest || '',
      };
    });
    setScores(scoreMap);

    const behaviorMap = com?.behaviors ? JSON.parse(com.behaviors) : {};
    setBehaviors(behaviorMap);
    setTutorComment(com?.tutor_comment || '');
  };

  const updateScore = (subId, field, val) => {
    const v = validateScore(val, field.replace('score_', ''));
    setScores(prev => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: v }
    }));
  };

  const saveAll = async () => {
    if (!selStu) return;

    const resultsToSave = subjects.map(s => {
      const sc = scores[s.id] || {};
      const total = Object.values(sc).reduce((a, b) => a + b, 0);
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selStu.id,
        subject_id: s.id,
        ...sc,
        total,
        grade,
        remarks: remark,
      };
    });

    await supabase.from('results').delete().eq('student_id', selStu.id);
    await supabase.from('results').insert(resultsToSave);

    await supabase.from('comments').upsert({
      student_id: selStu.id,
      tutor_comment: tutorComment,
      behaviors: JSON.stringify(behaviors),
      status: 'pending' // waiting for principal
    });

    alert('Result submitted for approval!');
  };

  const { debouncedSave, saving } = useAutoSave(saveAll, 3000);

  useEffect(() => {
    if (selStu) debouncedSave();
  }, [scores, tutorComment, behaviors, selStu]);

  const getPreviewData = async () => {
    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', selStu.id);
    const processed = res.map(r => ({
      ...r,
      total: (r.score_note||0) + (r.score_cw||0) + (r.score_hw||0) + (r.score_test||0) + (r.score_ca||0) + (r.score_exam||0)
    }));

    const { data: com } = await supabase.from('comments').select('*').eq('student_id', selStu.id).single();
    const behaviorList = BEHAVIORAL_TRAITS.map(trait => ({
      trait,
      rating: behaviors[trait] || 'Good'
    }));

    return {
      student: selStu,
      school,
      classInfo: curClass,
      results: processed,
      comments: com || {},
      behaviors: behaviorList
    };
  };

  if (showPreview) {
    const data = await getPreviewData();
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2"><X /> Close</button>
          <span className="font-bold">{selStu.name}'s Result</span>
          <PDFDownloadLink document={<ResultPDF {...data} />} fileName={`${selStu.name}_Result.pdf`}>
            {({ loading }) => (
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <Download size={16} /> {loading ? 'Preparing...' : 'Download PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
        <PDFViewer className="flex-1"><ResultPDF {...data} /></PDFViewer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h2 className="font-bold">{profile.full_name}</h2>
          <p className="text-xs opacity-75">Form Tutor</p>
        </div>
        <select className="m-4 p-2 border rounded" onChange={e => {
          const cls = classes.find(c => c.id === e.target.value);
          if (cls) handleClassSelect(cls);
        }}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-y-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudentData(s)}
              className={`p-3 cursor-pointer hover:bg-gray-100 ${selStu?.id === s.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-gray-500">{s.admission_no}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selStu ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{selStu.name}</h1>
              <div className="flex gap-4">
                {saving && <span className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Saving...</span>}
                <button onClick={() => setShowPreview(true)} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  <Eye size={18} /> Preview & Submit
                </button>
              </div>
            </div>

            {/* Scores Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Subject</th>
                    {['note', 'cw', 'hw', 'test', 'ca', 'exam'].map(f => (
                      <th key={f} className="p-3 text-center">{f.toUpperCase()}<br />({SCORE_LIMITS[f]}%)</th>
                    ))}
                    <th className="p-3 font-bold">Total</th>
                    <th>Pos</th>
                    <th>High</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => {
                    const sc = scores[s.id] || {};
                    const total = Object.keys(sc).filter(k => k.startsWith('score_')).reduce((a, k) => a + (sc[k] || 0), 0);
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="p-3 font-medium">{s.name}</td>
                        {['note', 'cw', 'hw', 'test', 'ca', 'exam'].map(f => (
                          <td key={f} className="p-2">
                            <input type="number" className="w-16 text-center border rounded p-1"
                              value={sc[`score_${f}`] || ''}
                              onChange={e => updateScore(s.id, `score_${f}`, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="p-3 font-bold text-center">{total}</td>
                        <td className="p-2"><input className="w-12 text-center border rounded" value={sc.position || ''} onChange={e => updateScore(s.id, 'position', e.target.value)} /></td>
                        <td className="p-2"><input className="w-12 text-center border rounded" value={sc.highest || ''} onChange={e => updateScore(s.id, 'highest', e.target.value)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Behavioral Traits */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="font-bold mb-4">Behavioral Traits</h3>
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIORAL_TRAITS.map(trait => (
                  <div key={trait}>
                    <label className="block text-sm font-medium">{trait}</label>
                    <select className="w-full border rounded p-2 mt-1"
                      value={behaviors[trait] || 'Good'}
                      onChange={e => setBehaviors(p => ({ ...p, [trait]: e.target.value }))}>
                      {RATINGS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Tutor Comment */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Form Tutor's Comment</h3>
              <textarea className="w-full border rounded p-3 h-32"
                value={tutorComment}
                onChange={e => setTutorComment(e.target.value)}
                placeholder="Write your comment here..." />
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-32">
            <User size={64} className="mx-auto mb-4 opacity-20" />
            <p>Select a student to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- AUTH & PARENT PORTAL (unchanged logic, minor UX fixes) ---
const Auth = ({ onLogin, onParent }) => { ... }; // unchanged
const ParentPortal = ({ onBack }) => { ... }; // unchanged

// --- MAIN APP ---
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setView('auth');
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(data);
  };

  if (view === 'central') return <CentralAdmin onLogout={() => setView('auth')} />;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onLogin={({ role }) => setView(role === 'central' ? 'central' : 'dashboard')} onParent={() => setView('parent')} />;

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  if (profile.role === 'admin') return <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut().then(() => setView('auth'))} />;
  if (profile.role === 'teacher') return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut().then(() => setView('auth'))} />;

  return <div>Loading...</div>;
};

export default App;

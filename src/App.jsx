import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image as PDFImage,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import {
  LayoutDashboard,
  LogOut,
  Loader2,
  Plus,
  School,
  Copy,
  Check,
  User,
  Download,
  X,
  Eye,
  CheckCircle,
  Send,
} from 'lucide-react';

// ==================== SUPABASE CONFIG ====================
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== HELPERS ====================
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

const BEHAVIORAL_TRAITS = [
  'COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE',
  'RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'PUNCTUALITY', 'NEATNESS', 'INITIATIVE'
];
const RATINGS = ['Excellent Degree', 'Very Good', 'Good', 'Fair', 'Poor'];

// ==================== AUTO-SAVE HOOK ====================
const useAutoSave = (callback, delay = 2500) => {
  const [saving, setSaving] = useState(false);
  const timeoutRef = React.useRef(null);

  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await callback();
      setSaving(false);
    }, delay);
  }, [callback, delay]);

  useEffect(() => () => timeoutRef.current && clearTimeout(timeoutRef.current), []);

  return { save: trigger, saving };
};

// ==================== PDF STYLES ====================
const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  headerBox: { flexDirection: 'row', border: '2px solid #000', padding: 10, marginBottom: 5, alignItems: 'center' },
  logo: { width: 70, height: 70, marginRight: 10, objectFit: 'contain' },
  headerText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  schoolDetails: { fontSize: 7, textAlign: 'center' },
  termTitle: { fontSize: 9, fontWeight: 'bold', marginTop: 3, textDecoration: 'underline' },
  infoGrid: { flexDirection: 'row', marginTop: 5 },
  infoBox: { flex: 1, border: '1px solid #000', padding: 3, marginRight: 2, backgroundColor: '#f0f0f0' },
  infoLabel: { fontSize: 7, fontWeight: 'bold' },
  infoValue: { fontSize: 8 },
  table: { width: '100%', border: '1px solid #000', marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1px solid #000' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 22 },
  cell: { borderRight: '1px solid #000', padding: 3, fontSize: 7 },
  cellCenter: { alignItems: 'center', justifyContent: 'center' },
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
  colRemark: { width: '12%', borderRight: 0 },
  summarySection: { marginTop: 8, border: '1px solid #000', padding: 5 },
  summaryTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 3, textDecoration: 'underline' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', fontSize: 7 },
  behaviorSection: { marginTop: 5, border: '1px solid #000', padding: 5 },
  behaviorGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  behaviorItem: { width: '33.33%', fontSize: 7 },
  commentSection: { marginTop: 5, border: '1px solid #000', padding: 5 },
  commentLabel: { fontSize: 8, fontWeight: 'bold' },
  commentText: { fontSize: 7, lineHeight: 1.4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureLine: { borderTop: '1px solid #000', width: '100%', marginTop: 25 },
  signatureLabel: { fontSize: 7, fontWeight: 'bold' },
});

// ==================== PDF DOCUMENT ====================
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
            <Text style={styles.schoolDetails}>{school.address || 'Address'}</Text>
            <Text style={styles.schoolDetails}>{school.contact || 'Contact'}</Text>
            <Text style={styles.termTitle}>
              {school.current_term || 'TERM ONE'} REPORT {school.current_session || '2024/2025'} SESSION
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>NAME:</Text><Text style={styles.infoValue}>{student.name}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>ADM NO:</Text><Text style={styles.infoValue}>{student.admission_no}</Text></View>
          <View style={[styles.infoBox, { marginRight: 0 }]}><Text style={styles.infoLabel}>CLASS:</Text><Text style={styles.infoValue}>{classInfo?.name}</Text></View>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>AVERAGE:</Text><Text style={styles.infoValue}>{average}%</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>CLASS SIZE:</Text><Text style={styles.infoValue}>{classInfo?.size || 'N/A'}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>GRADE:</Text><Text style={styles.infoValue}>{overallGrade}</Text></View>
          <View style={[styles.infoBox, { marginRight: 0 }]}><Text style={styles.infoLabel}>GENDER:</Text><Text style={styles.infoValue}>{student.gender}</Text></View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colSN, styles.cellCenter]}>S/N</Text>
            <Text style={[styles.cell, styles.colSubject]}>SUBJECTS</Text>
            <Text style={[styles.cell, styles.colNote, styles.cellCenter]}>NOTE{'\n'}5</Text>
            <Text style={[styles.cell, styles.colCW, styles.cellCenter]}>CW{'\n'}5</Text>
            <Text style={[styles.cell, styles.colHW, styles.cellCenter]}>HW{'\n'}5</Text>
            <Text style={[styles.cell, styles.colTest, styles.cellCenter]}>TEST{'\n'}15</Text>
            <Text style={[styles.cell, styles.colCA, styles.cellCenter]}>CA{'\n'}15</Text>
            <Text style={[styles.cell, styles.colExam, styles.cellCenter]}>EXAM{'\n'}60</Text>
            <Text style={[styles.cell, styles.colTotal, styles.cellCenter]}>TOTAL</Text>
            <Text style={[styles.cell, styles.colGrade, styles.cellCenter]}>GRADE</Text>
            <Text style={[styles.cell, styles.colPosition, styles.cellCenter]}>POS</Text>
            <Text style={[styles.cell, styles.colHighest, styles.cellCenter]}>HIGH</Text>
            <Text style={[styles.cell, styles.colRemark]}>REMARKS</Text>
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
              <Text style={[styles.cell, styles.colRemark]}>{r.remarks}</Text>
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
            86-100 A* • 76-85 A • 66-75 B • 60-65 C • 50-59 D • 40-49 E • 0-39 E*
          </Text>
          <Text style={[styles.summaryItem, { width: '100%' }]}>
            TOTAL: {totalScore.toFixed(1)} | SUBJECTS: {results.length}
          </Text>
        </View>

        <View style={styles.behaviorSection}>
          <Text style={styles.summaryTitle}>BEHAVIOURAL REPORT</Text>
          <View style={styles.behaviorGrid}>
            {BEHAVIORAL_TRAITS.map(t => (
              <Text key={t} style={styles.behaviorItem}>{t}: {behaviorMap[t] || 'Good'}</Text>
            ))}
          </View>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>FORM TUTOR'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.tutor_comment || 'No comment.'}</Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>PRINCIPAL'S COMMENT:</Text>
          <Text style={styles.commentText}>{comments?.principal_comment || 'Result approved.'}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>FORM TUTOR</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>PRINCIPAL</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ==================== CENTRAL ADMIN ====================
const CentralAdmin = ({ onLogout }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ months: 6, limit: 200 });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('subscription_pins').select('*').order('created_at', { ascending: false });
      setPins(data || []);
    };
    fetch();
  }, []);

  const generate = async () => {
    setLoading(true);
    const code = `SUB-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    await supabase.from('subscription_pins').insert({ code, duration_months: form.months, student_limit: form.limit });
    const { data } = await supabase.from('subscription_pins').select('*').order('created_at', { ascending: false });
    setPins(data || []);
    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3"><LayoutDashboard /> Central Admin</h1>
          <button onClick={onLogout} className="flex items-center gap-2 text-red-400"><LogOut /> Logout</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-slate-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Generate PIN</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm">Duration (months)</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[3,6,12].map(m=>(
                    <button key={m} onClick={()=>setForm(f=>({...f,months:m}))}
                      className={form.months===m ? "bg-blue-600 py-2 rounded" : "bg-slate-700 py-2 rounded"}>
                      {m} mo
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" placeholder="Student Limit" className="w-full bg-slate-900 p-3 rounded"
                value={form.limit} onChange={e=>setForm(f=>({...f,limit:+e.target.value}))} />
              <button onClick={generate} disabled={loading} className="w-full bg-blue-600 py-3 rounded font-bold">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create PIN'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Active PINs</h2>
            <div className="space-y-3">
              {pins.map(p=>(
                <div key={p.id} className="bg-slate-700/50 p-4 rounded flex justify-between items-center">
                  <div>
                    <span className="font-mono text-lg">{p.code}</span>
                    <span className="ml-3 text-xs px-2 py-1 rounded bg-green-900/50">{p.is_used?'USED':'ACTIVE'}</span>
                    <div className="text-xs text-gray-400">{p.duration_months} mo • {p.student_limit} students</div>
                  </div>
                  {!p.is_used && (
                    <button onClick={()=>copy(p.code)} className="p-2 bg-slate-600 rounded">
                      {copied===p.code ? <Check/> : <Copy/>}
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

// ==================== SCHOOL ADMIN (Principal Approval) ====================
const SchoolAdmin = ({ profile, onLogout }) => {
  const [school, setSchool] = useState({});
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
      setSchool(s||{});

      const { data: p } = await supabase
        .from('comments')
        .select('*, students(*), profiles(full_name)')
        .eq('school_id', s?.id)
        .is('principal_comment', null)
        .neq('tutor_comment', null);
      setPending(p || []);
    };
    fetch();
  }, [profile]);

  const approve = async (id, text) => {
    await supabase.from('comments').update({ principal_comment: text || 'Approved & released.' }).eq('id', id);
    setPending(prev => prev.filter(x=>x.id!==id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{school.name || 'School Dashboard'}</h1>
            <p className="text-sm text-gray-600">Principal Approval Center</p>
          </div>
          <button onClick={onLogout} className="text-red-600"><LogOut size={24}/></button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Pending Results ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No pending results</p>
          ) : (
            <div className="space-y-4">
              {pending.map(item => (
                <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.students.name} ({item.students.admission_no})</p>
                    <p className="text-sm text-gray-600">Tutor: {item.profiles.full_name}</p>
                    <p className="italic mt-2">"{item.tutor_comment}"</p>
                  </div>
                  <button onClick={()=>approve(item.id)} className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2">
                    <CheckCircle size={18}/> Approve & Release
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== TEACHER DASHBOARD ====================
const TeacherDashboard = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [curClass, setCurClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selStudent, setSelStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scores, setScores] = useState({});
  const [behaviors, setBehaviors] = useState({});
  const [tutorComment, setTutorComment] = useState('');
  const [school, setSchool] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const { save, saving } = useAutoSave(async () => {
    if (!selStudent) return;

    const results = subjects.map(s => {
      const sc = scores[s.id] || {};
      const total = ['note','cw','hw','test','ca','exam'].reduce((a,f)=>a+(sc[`score_${f}`]||0),0);
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selStudent.id,
        subject_id: s.id,
        score_note: sc.score_note||0,
        score_cw: sc.score_cw||0,
        score_hw: sc.score_hw||0,
        score_test: sc.score_test||0,
        score_ca: sc.score_ca||0,
        score_exam: sc.score_exam||0,
        total, grade, remarks: remark,
        position: sc.position || null,
        highest: sc.highest || null,
      };
    });

    await supabase.from('results').delete().eq('student_id', selStudent.id);
    await supabase.from('results').insert(results);

    await supabase.from('comments').upsert({
      student_id: selStudent.id,
      tutor_comment: tutorComment,
      behaviors: JSON.stringify(behaviors),
    });
  }, 3000);

  useEffect(() => {
    const init = async () => {
      const { data: cls } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
      setClasses(cls || []);
      if (cls?.[0]) loadClass(cls[0]);

      const { data: sch } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
      setSchool(sch);
    };
    init();
  }, [profile]);

  const loadClass = async (cls) => {
    setCurClass(cls);
    const { data: sts } = await supabase.from('students').select('*').eq('class_id', cls.id);
    setStudents(sts || []);
    const { data: subs } = await supabase.from('subjects').select('*').eq('class_id', cls.id);
    setSubjects(subs || []);
    setSelStudent(null);
  };

  const loadStudent = async (stu) => {
    setSelStudent(stu);

    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', stu.id);
    const scoreMap = {};
    subjects.forEach(s => {
      const found = res?.find(r => r.subject_id === s.id);
      scoreMap[s.id] = found ? {
        score_note: found.score_note,
        score_cw: found.score_cw,
        score_hw: found.score_hw,
        score_test: found.score_test,
        score_ca: found.score_ca,
        score_exam: found.score_exam,
        position: found.position,
        highest: found.highest,
      } : {
        score_note: 0, score_cw: 0, score_hw: 0, score_test: 0, score_ca: 0, score_exam: 0,
        position: '', highest: '',
      };
    });
    setScores(scoreMap);

    const { data: com } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();
    setTutorComment(com?.tutor_comment || '');
    setBehaviors(com?.behaviors ? JSON.parse(com.behaviors) : {});
  };

  const updateScore = (subId, field, value) => {
    const validated = validateScore(value, field.replace('score_', ''));
    setScores(prev => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: validated }
    }));
  };

  const openPreview = async () => {
    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', selStudent.id);
    const processed = res?.map(r => ({
      ...r,
      total: (r.score_note||0)+(r.score_cw||0)+(r.score_hw||0)+(r.score_test||0)+(r.score_ca||0)+(r.score_exam||0)
    })) || [];

    const { data: com } = await supabase.from('comments').select('*').eq('student_id', selStudent.id).single();

    const behaviorList = BEHAVIORAL_TRAITS.map(t => ({
      trait: t,
      rating: behaviors[t] || 'Good'
    }));

    setPreviewData({
      student: selStudent,
      school,
      classInfo: curClass,
      results: processed,
      comments: com || {},
      behaviors: behaviorList
    });
    setShowPreview(true);
  };

  if (showPreview && previewData) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2"><X /> Close</button>
          <h2 className="font-bold text-lg">{previewData.student.name} - Result Preview</h2>
          <PDFDownloadLink document={<ResultPDF {...previewData} />} fileName={`${previewData.student.name}_Result.pdf`}>
            {({ loading }) => (
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <Download /> {loading ? 'Preparing...' : 'Download PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
        <PDFViewer className="flex-1 w-full">
          <ResultPDF {...previewData} />
        </PDFViewer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
          <h2 className="font-bold">{profile.full_name}</h2>
          <p className="text-sm">Form Tutor</p>
        </div>
        <select className="m-4 p-2 border rounded" onChange={e => {
          const cls = classes.find(c=>c.id===e.target.value);
          if(cls) loadClass(cls);
        }}>
          {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex-1 overflow-y-auto">
          {students.map(s=>(
            <div key={s.id} onClick={()=>loadStudent(s)}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${selStudent?.id===s.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-gray-500">{s.admission_no}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selStudent ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">{selStudent.name}</h1>
              <div className="flex items-center gap-4">
                {saving && <span className="text-green-600 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Saving...</span>}
                <button onClick={openPreview} className="bg-green-600 text-white px-6 py-3 rounded flex items-center gap-2">
                  <Eye /> Preview & Submit for Approval
                </button>
              </div>
            </div>

            {/* Scores */}
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Subject</th>
                    {['note','cw','hw','test','ca','exam'].map(f=>(
                      <th key={f} className="p-3 text-center">{f.toUpperCase()}<br />({SCORE_LIMITS[f]})</th>
                    ))}
                    <th className="p-3">Total</th>
                    <th>Pos</th>
                    <th>High</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => {
                    const sc = scores[s.id] || {};
                    const total = ['note','cw','hw','test','ca','exam'].reduce((a,f)=>a+(sc[`score_${f}`]||0),0);
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="p-3 font-medium">{s.name}</td>
                        {['note','cw','hw','test','ca','exam'].map(f=>(
                          <td key={f} className="p-2 text-center">
                            <input type="number" className="w-16 border rounded px-2 py-1"
                              value={sc[`score_${f}`] || ''}
                              onChange={e=>updateScore(s.id, `score_${f}`, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="p-3 text-center font-bold">{total}</td>
                        <td className="p-2"><input className="w-16 border rounded text-center" value={sc.position||''} onChange={e=>updateScore(s.id,'position',e.target.value)} /></td>
                        <td className="p-2"><input className="w-16 border rounded text-center" value={sc.highest||''} onChange={e=>updateScore(s.id,'highest',e.target.value)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Behavioral */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="font-bold mb-4">Behavioral Traits</h3>
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIORAL_TRAITS.map(t=>(
                  <div key={t}>
                    <label className="block text-sm font-medium">{t}</label>
                    <select className="w-full border rounded p-2 mt-1"
                      value={behaviors[t] || 'Good'}
                      onChange={e=>setBehaviors(p=>({...p, [t]: e.target.value}))}>
                      {RATINGS.map(r=><option key={r}>{r}</option>)}
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
                onChange={e=>setTutorComment(e.target.value)}
                placeholder="Enter comment..."
              />
            </div>
          </>
        ) : (
          <div className="text-center mt-32 text-gray-400">
            <User size={80} className="mx-auto mb-4 opacity-20" />
            <p>Select a student to start</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== AUTH COMPONENT ====================
const Auth = ({ onLogin, onParent }) => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('teacher');
  const [form, setForm] = useState({ email: '', password: '', name: '', pin: '', schoolCode: '' });
  const [loading, setLoading] = useState(false);

  const CENTRAL_USER = "oluwatoyin";
  const CENTRAL_PASS = "Funmilola";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'central') {
        if (form.email === CENTRAL_USER && form.password === CENTRAL_PASS) {
          onLogin({ role: 'central' });
        } else alert('Invalid central login');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        if (role === 'admin') {
          const { data: pinData, error: pinErr } = await supabase
            .from('subscription_pins')
            .select('*')
            .eq('code', form.pin.trim())
            .eq('is_used', false)
            .single();

          if (pinErr || !pinData) throw new Error('Invalid or used PIN');

          const { data: { user } } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
          });

          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + pinData.duration_months);

          const { data: school } = await supabase
            .from('schools')
            .insert({
              owner_id: user.id,
              name: 'My School',
              max_students: pinData.student_limit,
              subscription_expires_at: expiry.toISOString(),
            })
            .select()
            .single();

          await supabase.from('profiles').insert({
            id: user.id,
            full_name: form.name,
            role: 'admin',
            school_id: school.id,
          });

          await supabase.from('subscription_pins').update({ is_used: true }).eq('id', pinData.id);

          alert('School created! Please login.');
          setMode('login');
        } else {
          // teacher registration
          const { data: sch } = await supabase.from('schools').select('id').eq('id', form.schoolCode).single();
          if (!sch) throw new Error('Invalid School Code');

          const { data: { user } } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
          });

          await supabase.from('profiles').insert({
            id: user.id,
            full_name: form.name,
            role: 'teacher',
            school_id: sch.id,
          });

          alert('Teacher registered! Please login.');
          setMode('login');
        }
      } else {
        // login
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <School size={50} className="mx-auto text-blue-600 mb-3" />
          <h1 className="text-2xl font-bold">Springforth Result System</h1>
        </div>

        <div className="flex justify-center gap-8 mb-6 text-sm font-bold">
          <button onClick={()=>setMode('login')} className={mode==='login' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-500'}>Login</button>
          <button onClick={()=>setMode('register')} className={mode==='register' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-500'}>Register</button>
          <button onClick={()=>setMode('central')} className={mode==='central' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-500'}>Admin</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input placeholder="Full Name" className="w-full p-3 border rounded" required
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={()=>setRole('admin')} className={role==='admin' ? 'bg-blue-600 text-white py-2 rounded' : 'bg-gray-100 py-2 rounded'}>
                  School Owner
                </button>
                <button type="button" onClick={()=>setRole('teacher')} className={role==='teacher' ? 'bg-blue-600 text-white py-2 rounded' : 'bg-gray-100 py-2 rounded'}>
                  Teacher
                </button>
              </div>
              {role==='admin' ? (
                <input placeholder="Subscription PIN" className="w-full p-3 border-2 border-orange-300 bg-orange-50 rounded" required
                  value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value}))} />
              ) : (
                <input placeholder="School ID Code" className="w-full p-3 border rounded" required
                  value={form.schoolCode} onChange={e=>setForm(f=>({...f,schoolCode:e.target.value}))} />
              )}
            </>
          )}

          {mode === 'central' ? (
            <input placeholder="Username" className="w-full p-3 border rounded" required
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          ) : (
            <input type="email" placeholder="Email" className="w-full p-3 border rounded" required
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          )}

          <input type="password" placeholder="Password" className="w-full p-3 border rounded" required
            value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold">
            {loading ? 'Processing...' : mode==='central' ? 'Admin Login' : mode==='register' ? 'Register' : 'Login'}
          </button>
        </form>

        {mode === 'login' && (
          <button onClick={onParent} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold">
            Parent Portal
          </button>
        )}
      </div>
    </div>
  );
};

// ==================== PARENT PORTAL ====================
const ParentPortal = ({ onBack }) => {
  const [adm, setAdm] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState(null);

  const check = async (e) => {
    e.preventDefault();
    const { data: student, error } = await supabase
      .from('students')
      .select('*, schools(*), classes(*), comments(*), results(*, subjects(*))')
      .eq('admission_no', adm)
      .eq('parent_pin', pin)
      .single();

    if (error || !student) {
      alert('Invalid credentials');
      return;
    }

    const processedResults = student.results.map(r => ({
      ...r,
      total: (r.score_note||0)+(r.score_cw||0)+(r.score_hw||0)+(r.score_test||0)+(r.score_ca||0)+(r.score_exam||0)
    }));

    const behaviorList = student.comments?.[0]?.behaviors
      ? JSON.parse(student.comments[0].behaviors)
      : {};
    const behaviorArray = BEHAVIORAL_TRAITS.map(t=>({ trait: t, rating: behaviorList[t] || 'Good' }));

    setData({
      student,
      school: student.schools,
      classInfo: student.classes,
      results: processedResults,
      comments: student.comments?.[0] || {},
      behaviors: behaviorArray
    });
  };

  if (data) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="bg-white p-4 shadow flex justify-between items-center">
          <button onClick={()=>setData(null)} className="flex items-center gap-2"><X /> Back</button>
          <h2 className="font-bold">{data.student.name} Result</h2>
          <PDFDownloadLink document={<ResultPDF {...data} />} fileName="Result.pdf">
            <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <Download /> Download PDF
            </button>
          </PDFDownloadLink>
        </div>
        <PDFViewer className="flex-1"><ResultPDF {...data} /></PDFViewer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <form onSubmit={check} className="bg-white p-10 rounded-2xl shadow-2xl w-96 space-y-6">
        <h2 className="text-2xl font-bold text-center">Parent Portal</h2>
        <input placeholder="Admission Number" className="w-full p-3 border rounded" value={adm} onChange={e=>setAdm(e.target.value)} required />
        <input type="password" placeholder="Parent PIN" className="w-full p-3 border rounded" value={pin} onChange={e=>setPin(e.target.value)} required />
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold">View Result</button>
        <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-600">Back to Login</button>
      </form>
    </div>
  );
};

// ==================== MAIN APP ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setView('auth');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data, error }) => {
        if (!error && data) setProfile(data);
      });
    }
  }, [session]);

  const handleLogin = ({ role }) => {
    if (role === 'central') setView('central');
  };

  if (view === 'central') return <CentralAdmin onLogout={() => setView('auth')} />;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onLogin={handleLogin} onParent={() => setView('parent')} />;
  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={60} /></div>;

  if (profile.role === 'admin') return <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} />;
  if (profile.role === 'teacher') return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;

  return null;
};

export default App;

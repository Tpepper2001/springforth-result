import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, Save, Plus, LogOut, User, Loader2, AlertCircle, 
  Menu, X, Download, Upload, Check, RefreshCw, TrendingUp, FileText
} from 'lucide-react';

// Supabase Configuration
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Score Validation
const SCORE_LIMITS = {
  note: 5, cw: 5, hw: 5, test: 15, ca: 15, exam: 60
};

const validateScore = (value, field) => {
  const num = parseFloat(value) || 0;
  const max = SCORE_LIMITS[field];
  return Math.max(0, Math.min(num, max));
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

// PDF Styles matching the sample
const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontFamily: 'Helvetica', 
    fontSize: 9,
    backgroundColor: '#ffffff'
  },
  headerBox: { 
    flexDirection: 'row', 
    border: '2px solid #DC2626', 
    padding: 8,
    marginBottom: 8,
    alignItems: 'center'
  },
  logo: { 
    width: 60, 
    height: 60, 
    marginRight: 12,
    objectFit: 'contain'
  },
  headerText: { 
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  schoolName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1E40AF',
    marginBottom: 3
  },
  schoolDetails: { 
    fontSize: 8, 
    marginTop: 1,
    color: '#374151'
  },
  termTitle: { 
    fontSize: 11, 
    fontWeight: 'bold',
    marginTop: 5,
    textDecoration: 'underline',
    color: '#1F2937'
  },
  infoRow: { 
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    border: '1px solid #000',
    marginBottom: 1
  },
  infoCell: { 
    flex: 1,
    borderRight: '1px solid #000',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold'
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#1F2937'
  },
  table: { 
    width: '100%',
    border: '1px solid #000',
    marginTop: 8
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderBottom: '1px solid #000'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000'
  },
  cell: {
    borderRight: '1px solid #000',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8
  },
  cellLeft: {
    alignItems: 'flex-start',
    paddingLeft: 4
  },
  colSN: { width: '4%' },
  colSubject: { width: '22%' },
  colScore: { width: '6%', fontSize: 7 },
  colTotal: { width: '7%', fontWeight: 'bold' },
  colGrade: { width: '6%' },
  colPos: { width: '6%' },
  colHigh: { width: '7%' },
  colRemark: { flex: 1 },
  summaryBox: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8
  },
  leftSection: {
    flex: 1.5
  },
  rightSection: {
    flex: 1
  },
  commentBox: {
    border: '1px solid #000',
    marginBottom: 8,
    minHeight: 50
  },
  commentHeader: {
    backgroundColor: '#DBEAFE',
    padding: 4,
    borderBottom: '1px solid #000',
    fontWeight: 'bold',
    fontSize: 8
  },
  commentText: {
    padding: 6,
    fontSize: 8,
    lineHeight: 1.4
  },
  gradeSummary: {
    border: '1px solid #000',
    marginBottom: 8,
    padding: 6
  },
  gradeSummaryTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 4,
    textAlign: 'center'
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    marginTop: 2
  },
  behaviorBox: {
    border: '1px solid #000'
  },
  behaviorHeader: {
    backgroundColor: '#DBEAFE',
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 8,
    borderBottom: '1px solid #000'
  },
  behaviorRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000'
  },
  behaviorTrait: {
    width: '50%',
    borderRight: '1px solid #000',
    padding: 3,
    fontSize: 7,
    backgroundColor: '#F3F4F6'
  },
  behaviorRating: {
    width: '50%',
    padding: 3,
    fontSize: 7,
    textAlign: 'center'
  },
  behaviorSummary: {
    padding: 6,
    alignItems: 'center',
    backgroundColor: '#DBEAFE'
  },
  behaviorPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8
  },
  signatureBlock: {
    alignItems: 'center',
    width: '45%'
  },
  signatureName: {
    fontSize: 9,
    marginBottom: 20,
    fontWeight: 'bold'
  },
  signatureLine: {
    borderTop: '1px solid #000',
    width: '100%',
    marginBottom: 3
  },
  signatureRole: {
    fontSize: 8,
    textTransform: 'uppercase'
  },
  gradeKey: {
    fontSize: 6,
    marginTop: 8,
    padding: 4,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    lineHeight: 1.3
  }
});

// Enhanced PDF Template
const ResultPDF = ({ school, student, results, behaviors, comments, classInfo }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  
  const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
  const getRating = (t) => {
    const b = behaviors.find(x => x.trait === t);
    if (!b) return '';
    if (b.rating === 5) return 'Excellent Degree';
    if (b.rating === 4) return 'Very Good';
    if (b.rating === 3) return 'Good';
    if (b.rating === 2) return 'Fair';
    return 'Needs Improvement';
  };
  
  const behaviorTotal = behaviors.reduce((acc, b) => acc + b.rating, 0);
  const behaviorPercent = Math.round((behaviorTotal / (traits.length * 5)) * 100);
  
  const gradeCount = results.reduce((acc, r) => {
    acc[r.grade] = (acc[r.grade] || 0) + 1;
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBox}>
          {school.logo_url && <PDFImage src={school.logo_url} style={styles.logo} />}
          <View style={styles.headerText}>
            <Text style={styles.schoolName}>{school.name?.toUpperCase()}</Text>
            <Text style={styles.schoolDetails}>{school.address}</Text>
            <Text style={styles.schoolDetails}>{school.contact}</Text>
            <Text style={styles.termTitle}>
              {school.current_term} REPORT {school.current_session} ACADEMIC SESSION
            </Text>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>NAME: {student.name}</Text>
          <Text style={styles.infoCell}>ADM NO: {student.admission_no}</Text>
          <Text style={styles.infoCell}>CLASS: {classInfo?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCell}>AVERAGE SCORE: {average}%</Text>
          <Text style={styles.infoCell}>CLASS SIZE: {classInfo?.size || 0}</Text>
          <Text style={styles.infoCell}>GENDER: {student.gender}</Text>
        </View>

        {/* Results Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colSN]}>S/N</Text>
            <Text style={[styles.cell, styles.colSubject, styles.cellLeft]}>SUBJECTS</Text>
            <Text style={[styles.cell, styles.colScore]}>NOTE{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colScore]}>CW{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colScore]}>HW{'\n'}5%</Text>
            <Text style={[styles.cell, styles.colScore]}>TEST{'\n'}15%</Text>
            <Text style={[styles.cell, styles.colScore]}>CA{'\n'}15%</Text>
            <Text style={[styles.cell, styles.colScore]}>EXAM{'\n'}60%</Text>
            <Text style={[styles.cell, styles.colTotal]}>TOTAL{'\n'}100%</Text>
            <Text style={[styles.cell, styles.colGrade]}>GRADE</Text>
            <Text style={[styles.cell, styles.colPos]}>POS</Text>
            <Text style={[styles.cell, styles.colHigh]}>HIGHEST</Text>
            <Text style={[styles.cell, styles.colRemark, styles.cellLeft]}>REMARKS</Text>
          </View>
          
          {results.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colSN]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.colSubject, styles.cellLeft]}>{r.subjects?.name}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_note}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_cw}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_hw}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_test}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_ca}</Text>
              <Text style={[styles.cell, styles.colScore]}>{r.score_exam}</Text>
              <Text style={[styles.cell, styles.colTotal]}>{r.total}</Text>
              <Text style={[styles.cell, styles.colGrade]}>{r.grade}</Text>
              <Text style={[styles.cell, styles.colPos]}>{r.position || '-'}</Text>
              <Text style={[styles.cell, styles.colHigh]}>{r.highest || '-'}</Text>
              <Text style={[styles.cell, styles.colRemark, styles.cellLeft]}>{r.remarks}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={styles.summaryBox}>
          {/* Left: Comments and Signatures */}
          <View style={styles.leftSection}>
            <View style={styles.commentBox}>
              <Text style={styles.commentHeader}>FORM TUTOR'S COMMENT</Text>
              <Text style={styles.commentText}>{comments?.tutor_comment}</Text>
            </View>
            
            <View style={styles.commentBox}>
              <Text style={styles.commentHeader}>PRINCIPAL'S COMMENT</Text>
              <Text style={styles.commentText}>{comments?.principal_comment}</Text>
            </View>
            
            <View style={styles.signatures}>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureName}>{classInfo?.tutor_name || 'Form Tutor'}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureRole}>Form Tutor</Text>
              </View>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureName}>{school.principal_name}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureRole}>Principal</Text>
              </View>
            </View>
          </View>

          {/* Right: Grade Summary and Behavior */}
          <View style={styles.rightSection}>
            <View style={styles.gradeSummary}>
              <Text style={styles.gradeSummaryTitle}>GRADE SUMMARY</Text>
              {['A*', 'A', 'B', 'C', 'D', 'E', 'E*'].map(g => (
                <View key={g} style={styles.gradeRow}>
                  <Text>{g}</Text>
                  <Text>{gradeCount[g] || 0}</Text>
                </View>
              ))}
              <View style={[styles.gradeRow, { marginTop: 6, paddingTop: 4, borderTop: '1px solid #000' }]}>
                <Text>TOTAL SCORE</Text>
                <Text>{totalScore.toFixed(1)}</Text>
              </View>
              <View style={styles.gradeRow}>
                <Text>NO OF SUBJECTS</Text>
                <Text>{results.length}</Text>
              </View>
            </View>

            <View style={styles.behaviorBox}>
              <Text style={styles.behaviorHeader}>STUDENTS BEHAVIOURAL REPORT</Text>
              {traits.map(t => (
                <View key={t} style={styles.behaviorRow}>
                  <Text style={styles.behaviorTrait}>{t}</Text>
                  <Text style={styles.behaviorRating}>{getRating(t)}</Text>
                </View>
              ))}
              <View style={styles.behaviorSummary}>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>SUMMARY OF</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>BEHAVIOURAL RATING</Text>
                <Text style={styles.behaviorPercent}>{behaviorPercent}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Grade Key */}
        <Text style={styles.gradeKey}>
          GRADE DETAILS: 86-100 (A*) Excellent, 76-85 (A) Outstanding, 66-75 (B) Very Good, 60-65 (C) Good, 50-59 (D) Fairly Good, 40-49 (E) Below Expectation, 0-39 (E*) Rarely
        </Text>
      </Page>
    </Document>
  );
};

// Auto-save Hook
const useAutoSave = (callback, delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = React.useRef(null);

  const debouncedSave = useCallback((data) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await callback(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        setSaving(false);
      }
    }, delay);
  }, [callback, delay]);

  return { debouncedSave, saving, lastSaved };
};

// Parent Portal
const ParentPortal = ({ onBack }) => {
  const [adm, setAdm] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data: stu, error: stuError } = await supabase
        .from('students')
        .select('*, schools(*), classes(*)')
        .eq('admission_no', adm)
        .eq('parent_pin', pin)
        .single();

      if (stuError || !stu) {
        setError('Invalid Admission Number or PIN');
        setLoading(false);
        return;
      }

      const { data: res } = await supabase
        .from('results')
        .select('*, subjects(*)')
        .eq('student_id', stu.id)
        .order('subjects(name)');

      const { data: beh } = await supabase
        .from('behaviorals')
        .select('*')
        .eq('student_id', stu.id);

      const { data: com } = await supabase
        .from('comments')
        .select('*')
        .eq('student_id', stu.id)
        .single();

      if (stu.classes?.form_tutor_id) {
        const { data: t } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', stu.classes.form_tutor_id)
          .single();
        if (t) stu.classes.tutor_name = t.full_name;
      }

      setData({
        student: stu,
        school: stu.schools,
        classInfo: stu.classes,
        results: res || [],
        behaviors: beh || [],
        comments: com || {}
      });
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  if (data) {
    return (
      <div className="w-full h-screen bg-gray-900 p-4 relative">
        <button
          onClick={() => setData(null)}
          className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg z-50 flex items-center gap-2 shadow-lg"
        >
          <X size={18} /> Close
        </button>
        <PDFViewer width="100%" height="100%">
          <ResultPDF {...data} />
        </PDFViewer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <School className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">Parent Portal</h2>
          <p className="text-gray-600 mt-2">View your child's report card</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={checkResult} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admission Number
            </label>
            <input
              placeholder="Enter admission number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={adm}
              onChange={(e) => setAdm(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN
            </label>
            <input
              type="password"
              placeholder="Enter PIN"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Checking...
              </>
            ) : (
              <>
                <FileText size={18} />
                View Result
              </>
            )}
          </button>
        </form>
        
        <button
          onClick={onBack}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700 w-full text-center"
        >
          ← Back to Staff Login
        </button>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ profile, doLogout }) => {
  const [view, setView] = useState('school');
  const [school, setSchool] = useState({});
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: s } = await supabase.from('schools').select('*').single();
    setSchool(s || {});
    const { data: c } = await supabase.from('classes').select('*, profiles(full_name)');
    setClasses(c || []);
    const { data: t } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    setTeachers(t || []);
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('school-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(fileName);

      setSchool({ ...school, logo_url: publicUrl });
      setSaveStatus('Logo uploaded! Click Save to apply.');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
    setUploading(false);
  };

  const saveSchool = async () => {
    try {
      await supabase.from('schools').upsert({ ...school, id: school.id || undefined });
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      alert('Save failed: ' + error.message);
    }
  };

  const addClass = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('classes').insert({
      name: fd.get('name'),
      form_tutor_id: fd.get('tutor'),
      size: parseInt(fd.get('size')) || 0,
      school_id: school.id
    });
    fetchAll();
    e.target.reset();
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('students').insert({
      name: fd.get('name'),
      admission_no: fd.get('adm'),
      class_id: fd.get('class_id'),
      gender: fd.get('gender'),
      parent_pin: fd.get('pin'),
      school_id: school.id
    });
    alert('Student Added Successfully!');
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <School className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">{profile.full_name}</p>
            </div>
          </div>
          <button
            onClick={doLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-3 mb-6">
          {['school', 'classes', 'students'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-6 py-2 rounded-lg capitalize font-medium transition ${
                view === v
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {view === 'school' && (
          <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">School Information</h3>
            
            {saveStatus && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <Check size={18} />
                {saveStatus}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
              <div className="flex items-center gap-4">
                {school.logo_url && (
                  <img src={school.logo_url} alt="Logo" className="w-20 h-20 object-contain border rounded" />
                )}
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={uploadLogo} />
                  <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </div>
                </label>
              </div>
            </div>

            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="School Name"
              value={school.name || ''}
              onChange={(e) => setSchool({ ...school, name: e.target.value })}
            />
            
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Address"
              value={school.address || ''}
              onChange={(e) => setSchool({ ...school, address: e.target.value })}
            />
            
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contact (Phone/Email)"
              value={school.contact || ''}
              onChange={(e) => setSchool({ ...school, contact: e.target.value })}
            />
            
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Principal Name"
              value={school.principal_name || ''}
              onChange={(e) => setSchool({ ...school, principal_name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Current Term (e.g., TERM ONE)"
                value={school.current_term || ''}
                onChange={(e) => setSchool({ ...school, current_term: e.target.value })}
              />
              <input
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Session (e.g., 2025/2026)"
                value={school.current_session || ''}
                onChange={(e) => setSchool({ ...school, current_session: e.target.value })}
              />
            </div>

            <button
              onClick={saveSchool}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save School Information
            </button>
          </div>
        )}

        {view === 'classes' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Class</h3>
              <form onSubmit={addClass} className="space-y-4">
                <input
                  name="name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Class Name (e.g., YEAR 12 RIGEL)"
                  required
                />
                <input
                  name="size"
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Class Size"
                  required
                />
                <select
                  name="tutor"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Form Tutor</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Plus size={18} />
                  Create Class
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Classes</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No classes yet</p>
                ) : (
                  classes.map((c) => (
                    <div key={c.id} className="border border-gray-200 p-3 rounded-lg flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <p className="text-sm text-gray-500">Size: {c.size || 0}</p>
                      </div>
                      <span className="text-sm text-gray-600">{c.profiles?.full_name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'students' && (
          <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Register New Student</h3>
            <form onSubmit={addStudent} className="space-y-4">
              <input
                name="name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Full Name"
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="adm"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Admission No"
                  required
                />
                <input
                  name="pin"
                  type="password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Parent PIN"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="gender"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                
                <select
                  name="class_id"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Plus size={18} />
                Enroll Student
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Teacher Dashboard with Autosave
const TeacherDashboard = ({ profile, doLogout }) => {
  const [myClass, setMyClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selStu, setSelStu] = useState(null);
  const [scores, setScores] = useState({});
  const [beh, setBeh] = useState([]);
  const [comm, setComm] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const saveData = useCallback(async () => {
    if (!selStu) return;

    const rPay = subjects.map((s) => {
      const v = scores[s.id] || { note: 0, cw: 0, hw: 0, test: 0, ca: 0, exam: 0 };
      const total = v.note + v.cw + v.hw + v.test + v.ca + v.exam;
      const { grade, remark } = calculateGrade(total);
      
      return {
        student_id: selStu.id,
        subject_id: s.id,
        score_note: v.note,
        score_cw: v.cw,
        score_hw: v.hw,
        score_test: v.test,
        score_ca: v.ca,
        score_exam: v.exam,
        total,
        grade,
        remarks: remark,
        position: null,
        highest: null
      };
    });

    await supabase.from('results').delete().eq('student_id', selStu.id);
    await supabase.from('results').insert(rPay);

    const bPay = beh.map((b) => ({ student_id: selStu.id, trait: b.trait, rating: b.rating }));
    await supabase.from('behaviorals').delete().eq('student_id', selStu.id);
    if (bPay.length > 0) await supabase.from('behaviorals').insert(bPay);

    await supabase.from('comments').delete().eq('student_id', selStu.id);
    await supabase.from('comments').insert({ student_id: selStu.id, ...comm });
  }, [selStu, subjects, scores, beh, comm]);

  const { debouncedSave, saving, lastSaved } = useAutoSave(saveData);

  useEffect(() => {
    const init = async () => {
      const { data: c } = await supabase
        .from('classes')
        .select('*')
        .eq('form_tutor_id', profile.id)
        .single();

      if (c) {
        setMyClass(c);
        const { data: s } = await supabase.from('subjects').select('*').eq('class_id', c.id);
        setSubjects(s || []);
        const { data: st } = await supabase.from('students').select('*').eq('class_id', c.id);
        setStudents(st || []);
      }
      setLoading(false);
    };
    init();
  }, [profile]);

  useEffect(() => {
    if (selStu && Object.keys(scores).length > 0) {
      debouncedSave();
    }
  }, [scores, beh, comm, debouncedSave, selStu]);

  const addSub = async () => {
    const n = prompt('Enter Subject Name:');
    if (n && myClass) {
      const { data } = await supabase.from('subjects').insert({ class_id: myClass.id, name: n }).select();
      if (data) setSubjects([...subjects, ...data]);
    }
  };

  const loadStu = async (stu) => {
    setSelStu(stu);
    setSidebarOpen(false);

    const { data: r } = await supabase.from('results').select('*').eq('student_id', stu.id);
    const { data: b } = await supabase.from('behaviorals').select('*').eq('student_id', stu.id);
    const { data: c } = await supabase.from('comments').select('*').eq('student_id', stu.id).single();

    const map = {};
    subjects.forEach((s) => {
      const ex = r?.find((x) => x.subject_id === s.id) || {};
      map[s.id] = {
        note: ex.score_note || 0,
        cw: ex.score_cw || 0,
        hw: ex.score_hw || 0,
        test: ex.score_test || 0,
        ca: ex.score_ca || 0,
        exam: ex.score_exam || 0
      };
    });
    
    setScores(map);
    setBeh(b || []);
    setComm(c || { tutor_comment: '', principal_comment: '' });
    setErrors({});
  };

  const updateScore = (subjectId, field, value) => {
    const validated = validateScore(value, field);
    setScores({
      ...scores,
      [subjectId]: { ...scores[subjectId], [field]: validated }
    });
  };

  const traits = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
  
  const toggleBeh = (t, r) => {
    const list = beh.filter((x) => x.trait !== t);
    list.push({ trait: t, rating: r });
    setBeh(list);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!myClass) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <p className="text-xl text-gray-700 mb-4">No Class Assigned</p>
          <button onClick={doLogout} className="text-blue-600 underline">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
        w-72 bg-white border-r flex flex-col
        lg:relative fixed inset-y-0 left-0 z-40
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold mb-1">{myClass.name}</h2>
          <p className="text-sm opacity-90">{students.length} Students</p>
        </div>

        <div className="p-4">
          <button
            onClick={addSub}
            className="w-full mb-4 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Subject
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No students enrolled</p>
          ) : (
            students.map((s) => (
              <div
                key={s.id}
                onClick={() => loadStu(s)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition ${
                  selStu?.id === s.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className={`text-xs ${selStu?.id === s.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {s.admission_no}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={doLogout}
            className="w-full text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {selStu ? selStu.name : 'Select a Student'}
            </h1>
            {selStu && <p className="text-sm text-gray-500">Admission No: {selStu.admission_no}</p>}
          </div>
          
          {selStu && (
            <div className="flex items-center gap-3">
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </div>
              )}
              {lastSaved && !saving && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check size={16} />
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {selStu ? (
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Scores Section */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Academic Scores</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Subject</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Note<br/>(5%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CW<br/>(5%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">HW<br/>(5%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Test<br/>(15%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">CA<br/>(15%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Exam<br/>(60%)</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => {
                        const v = scores[s.id] || {};
                        const total = (v.note || 0) + (v.cw || 0) + (v.hw || 0) + (v.test || 0) + (v.ca || 0) + (v.exam || 0);
                        const { grade } = calculateGrade(total);
                        
                        return (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium text-gray-800">{s.name}</td>
                            {['note', 'cw', 'hw', 'test', 'ca', 'exam'].map((f) => (
                              <td key={f} className="py-3 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-16 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  value={v[f] || ''}
                                  onChange={(e) => updateScore(s.id, f, e.target.value)}
                                  max={SCORE_LIMITS[f]}
                                />
                              </td>
                            ))}
                            <td className="py-3 px-2 text-center font-bold text-gray-800">{total.toFixed(1)}</td>
                            <td className="py-3 px-2 text-center">
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Behavior and Comments */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Behavioral Traits */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Behavioral Assessment</h3>
                  <div className="space-y-3">
                    {traits.map((t) => {
                      const cur = beh.find((x) => x.trait === t)?.rating;
                      return (
                        <div key={t} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{t}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <button
                                key={r}
                                onClick={() => toggleBeh(t, r)}
                                className={`w-8 h-8 rounded-lg border-2 text-sm font-semibold transition ${
                                  cur === r
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-700">Behavioral Rating</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {Math.round((beh.reduce((acc, b) => acc + b.rating, 0) / (traits.length * 5)) * 100)}%
                    </p>
                  </div>
                </div>

                {/* Comments */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Comments</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Form Tutor's Comment
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Enter your comment about the student's performance..."
                        value={comm.tutor_comment || ''}
                        onChange={(e) => setComm({ ...comm, tutor_comment: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Principal's Comment
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Enter principal's comment..."
                        value={comm.principal_comment || ''}
                        onChange={(e) => setComm({ ...comm, principal_comment: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Users size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">Select a student to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Auth Component
const Auth = ({ onMode }) => {
  const [isReg, setIsReg] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sub = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isReg) {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        if (data?.user) {
          await supabase.from('profiles').insert({ id: data.user.id, full_name: name, role });
          alert('Registered Successfully! Please Login');
          setIsReg(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <School className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">{isReg ? 'Staff Register' : 'Staff Login'}</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={sub} className="space-y-4">
          {isReg && (
            <>
              <input
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}
          <input
            placeholder="Email"
            type="email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isReg ? 'Sign Up' : 'Login'}
          </button>
        </form>
        
        <div
          className="mt-4 text-center text-sm text-blue-600 cursor-pointer hover:text-blue-800"
          onClick={() => setIsReg(!isReg)}
        >
          {isReg ? 'Already have an account? Login' : "Don't have an account? Register"}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => onMode('parent')}
            className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 p-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <User size={18} />
            Parent Portal
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [sess, setSess] = useState(null);
  const [prof, setProf] = useState(null);
  const [mode, setMode] = useState('auth');
  const [init, setInit] = useState(true);

  const doLogout = async () => {
    await supabase.auth.signOut();
    setSess(null);
    setProf(null);
    setMode('auth');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => checkUser(session));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') doLogout();
      else checkUser(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async (s) => {
    if (s) {
      setSess(s);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
      if (error) {
        console.error('Profile Fetch Error:', error);
        doLogout();
      } else {
        setProf(data);
        setMode('dash');
      }
    }
    setInit(false);
  };

  if (init) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (mode === 'parent') return <ParentPortal onBack={() => setMode('auth')} />;
  if (!sess) return <Auth onMode={setMode} />;

  if (!prof) {
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p className="text-gray-600 mb-4">Loading Profile...</p>
        <button onClick={doLogout} className="text-red-500 underline">
          Cancel
        </button>
      </div>
    );
  }

  return prof.role === 'admin' ? (
    <AdminDashboard profile={prof} doLogout={doLogout} />
  ) : (
    <TeacherDashboard profile={prof} doLogout={doLogout} />
  );
};

export default App;

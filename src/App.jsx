import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink
} from '@react-pdf/renderer';
import {
  LayoutDashboard, LogOut, Loader2, Plus, School, Copy, Check, User, Download,
  X, Eye, Settings, Users, BookOpen, FileText, Trash2, ClipboardCopy, FileBarChart, Globe, Lock, ShieldCheck, UploadCloud
} from 'lucide-react';

// ==================== SUPABASE CONFIG ====================
// Replace these with your actual keys if they differ
const supabaseUrl = 'https://xtciiatfetqecsfxoicq.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y2lpYXRmZXRxZWNzZnhvaWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDEyMDIsImV4cCI6MjA4MDYxNzIwMn0.81K9w-XbCHWRWmKkq3rcJHxslx3hs5mGCSNIvyJRMuw'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== CONSTANTS & HELPERS ====================
const BEHAVIORAL_TRAITS = [
  'COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE',
  'RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'PUNCTUALITY', 'NEATNESS', 'INITIATIVE'
];
const RATINGS = ['Excellent Degree', 'Very Good', 'Good', 'Fair', 'Poor'];

const calculateGrade = (total) => {
  if (total >= 86) return { grade: 'A*', remark: 'Excellent' };
  if (total >= 76) return { grade: 'A', remark: 'Outstanding' };
  if (total >= 66) return { grade: 'B', remark: 'Very Good' };
  if (total >= 60) return { grade: 'C', remark: 'Good' };
  if (total >= 50) return { grade: 'D', remark: 'Fairly Good' };
  if (total >= 40) return { grade: 'E', remark: 'Below Expectation' };
  return { grade: 'E*', remark: 'Rarely' };
};

const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate Auto Admission Number (Format: Year/4-Digit-Random)
const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits
    return `${year}/${random}`;
};

const imageUrlToBase64 = async (url) => {
    if (!url) return null;
    try {
        const response = await fetch(url + '?t=' + new Date().getTime());
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Image convert error:", e);
        return null;
    }
};

// ==================== HOOKS ====================
const useAutoSave = (callback, delay = 2000) => {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);

  const trigger = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await callback();
      setSaving(false);
      setLastSaved(new Date());
    }, delay);
  }, [callback, delay]);

  return { save: trigger, saving, lastSaved };
};

// ==================== PDF COMPONENT ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9 },
  watermarkContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: -1
  },
  watermarkImage: { width: 350, height: 350, opacity: 0.08 },
  headerBox: { flexDirection: 'row', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 10, alignItems: 'center' },
  logo: { width: 70, height: 70, marginRight: 15, objectFit: 'contain' },
  headerText: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  schoolAddress: { fontSize: 9, textAlign: 'center', marginBottom: 2 },
  schoolContact: { fontSize: 9, textAlign: 'center', fontStyle: 'italic' },
  termTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 8, textDecoration: 'underline', textTransform: 'uppercase' },
  infoGrid: { flexDirection: 'row', marginTop: 5, justifyContent: 'space-between' },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoLabel: { fontWeight: 'bold', marginRight: 5 },
  infoValue: { },
  table: { width: '100%', border: '1px solid #000', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderBottom: '1px solid #000', paddingVertical: 4 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #000', minHeight: 20, alignItems: 'center' },
  cell: { borderRight: '1px solid #000', padding: 4, fontSize: 8 },
  cellCenter: { alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  colSN: { width: '5%' }, 
  colSubject: { width: '30%' }, 
  colTotal: { width: '10%', fontWeight: 'bold' }, 
  colGrade: { width: '10%' },
  colRemark: { width: '15%', borderRight: 0 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signatureBox: { width: '40%', alignItems: 'center', borderTop: '1px solid #000', paddingTop: 5 },
});

const ResultPDF = ({ school, student, results, classInfo, comments, behaviors = [], reportType = 'full', logoBase64 }) => {
  const isMidTerm = reportType === 'mid';
  const config = school.assessment_config || [];
  
  const displayFields = isMidTerm 
    ? config.filter(f => f.code.toLowerCase() !== 'exam') 
    : config;

  // Calculate dynamic column width
  const fixedWidths = 5 + 30 + 10 + (isMidTerm ? 0 : 10) + 15; // SN + Sub + Total + Grade + Remark
  const remainingWidth = 100 - fixedWidths;
  const scoreColWidth = displayFields.length > 0 ? `${remainingWidth / displayFields.length}%` : '0%';

  const processedResults = results.map(r => {
    const rawScores = r.scores || {};
    let total = 0;
    displayFields.forEach(f => {
      total += (parseFloat(rawScores[f.code]) || 0);
    });
    const { grade, remark } = calculateGrade(total);
    return { ...r, scores: rawScores, total, grade, remark };
  });

  const totalScore = processedResults.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const behaviorMap = Object.fromEntries(behaviors.map(b => [b.trait, b.rating]));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* WATERMARK */}
        {logoBase64 && (
            <View style={pdfStyles.watermarkContainer}>
                <PDFImage src={logoBase64} style={pdfStyles.watermarkImage} />
            </View>
        )}

        <View style={pdfStyles.headerBox}>
          {logoBase64 ? <PDFImage src={logoBase64} style={pdfStyles.logo} /> : <View style={{width: 60}} />}
          <View style={pdfStyles.headerText}>
            <Text style={pdfStyles.schoolName}>{school?.name || 'SCHOOL NAME'}</Text>
            
            {/* ADDRESS AND CONTACT INFO */}
            {school?.address && <Text style={pdfStyles.schoolAddress}>{school.address}</Text>}
            <Text style={pdfStyles.schoolContact}>
               {school?.email ? `Email: ${school.email}` : ''} 
               {school?.email && school?.contact ? ' | ' : ''} 
               {school?.contact ? `Tel: ${school.contact}` : ''}
            </Text>

            <Text style={pdfStyles.termTitle}>
              {isMidTerm ? 'MID-TERM' : 'TERM'} REPORT {school?.current_session || ''} SESSION
            </Text>
            <Text style={{fontSize: 9}}>{school?.current_term}</Text>
          </View>
        </View>

        {/* STUDENT DETAILS GRID */}
        <View style={{border: '1px solid #000', padding: 5, marginBottom: 5}}>
            <View style={pdfStyles.infoGrid}>
                <View style={[pdfStyles.infoBox, {width: '50%'}]}><Text style={pdfStyles.infoLabel}>NAME:</Text><Text style={pdfStyles.infoValue}>{student.name}</Text></View>
                <View style={[pdfStyles.infoBox, {width: '25%'}]}><Text style={pdfStyles.infoLabel}>CLASS:</Text><Text style={pdfStyles.infoValue}>{classInfo?.name}</Text></View>
                <View style={[pdfStyles.infoBox, {width: '25%'}]}><Text style={pdfStyles.infoLabel}>ADM NO:</Text><Text style={pdfStyles.infoValue}>{student.admission_no}</Text></View>
            </View>
            
            {!isMidTerm && (
            <View style={pdfStyles.infoGrid}>
                <View style={[pdfStyles.infoBox, {width: '25%'}]}><Text style={pdfStyles.infoLabel}>GENDER:</Text><Text style={pdfStyles.infoValue}>{student.gender}</Text></View>
                <View style={[pdfStyles.infoBox, {width: '25%'}]}><Text style={pdfStyles.infoLabel}>AVERAGE:</Text><Text style={pdfStyles.infoValue}>{average}%</Text></View>
                <View style={[pdfStyles.infoBox, {width: '25%'}]}><Text style={pdfStyles.infoLabel}>GRADE:</Text><Text style={pdfStyles.infoValue}>{calculateGrade(average).grade}</Text></View>
            </View>
            )}
        </View>

        {/* RESULTS TABLE */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, pdfStyles.colSN, pdfStyles.cellCenter]}>S/N</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colSubject]}>SUBJECT</Text>
            {displayFields.map(f => (
               <Text key={f.code} style={[pdfStyles.cell, {width: scoreColWidth}, pdfStyles.cellCenter]}>{f.name.toUpperCase()}</Text>
            ))}
            <Text style={[pdfStyles.cell, pdfStyles.colTotal, pdfStyles.cellCenter]}>TOTAL</Text>
            {!isMidTerm && <Text style={[pdfStyles.cell, pdfStyles.colGrade, pdfStyles.cellCenter]}>GRADE</Text>}
            <Text style={[pdfStyles.cell, pdfStyles.colRemark]}>REMARK</Text>
          </View>
          {processedResults.map((r, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, pdfStyles.colSN, pdfStyles.cellCenter]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colSubject]}>{r.subjects?.name}</Text>
              
              {displayFields.map(f => (
                 <Text key={f.code} style={[pdfStyles.cell, {width: scoreColWidth}, pdfStyles.cellCenter]}>
                    {r.scores[f.code] || 0}
                 </Text>
              ))}

              <Text style={[pdfStyles.cell, pdfStyles.colTotal, pdfStyles.cellCenter]}>{r.total}</Text>
              {!isMidTerm && <Text style={[pdfStyles.cell, pdfStyles.colGrade, pdfStyles.cellCenter]}>{r.grade}</Text>}
              <Text style={[pdfStyles.cell, pdfStyles.colRemark]}>{isMidTerm ? (r.total >= (totalScore/(results.length||1))/2 ? 'Pass' : 'Fail') : r.remark}</Text>
            </View>
          ))}
        </View>

        {!isMidTerm && (
        <View style={{marginTop: 15, flexDirection: 'row'}}>
            <View style={{width: '65%', marginRight: 15}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', marginBottom: 4, textDecoration: 'underline'}}>BEHAVIOURAL REPORT</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', border: '1px solid #000', padding: 5}}>
                    {BEHAVIORAL_TRAITS.map(t => (
                         <Text key={t} style={{width: '50%', fontSize: 8, marginBottom: 3}}>{t}: {behaviorMap[t] || 'Good'}</Text>
                    ))}
                </View>
            </View>
            <View style={{width: '35%'}}>
                 <Text style={{fontSize: 9, fontWeight: 'bold', marginBottom: 4, textDecoration: 'underline'}}>PERFORMANCE SUMMARY</Text>
                 <View style={{border: '1px solid #000', padding: 5}}>
                     <Text style={{fontSize: 8, marginBottom: 3}}>Total Obtained: {totalScore}</Text>
                     <Text style={{fontSize: 8, marginBottom: 3}}>Subjects Taken: {results.length}</Text>
                     <Text style={{fontSize: 8, marginBottom: 3}}>Class Average: {average}%</Text>
                 </View>
            </View>
        </View>
        )}

        <View style={{marginTop: 15, border: '1px solid #000', padding: 5, minHeight: 35}}>
            <Text style={{fontSize: 8, fontWeight: 'bold'}}>FORM TUTOR'S COMMENT:</Text>
            <Text style={{fontSize: 8, marginTop: 2}}>{comments?.tutor_comment || 'No comment.'}</Text>
        </View>

        <View style={{marginTop: 5, border: '1px solid #000', padding: 5, minHeight: 35}}>
            <Text style={{fontSize: 8, fontWeight: 'bold'}}>PRINCIPAL'S COMMENT:</Text>
            <Text style={{fontSize: 8, marginTop: 2}}>{comments?.principal_comment || 'Result Verified and Approved.'}</Text>
        </View>

        <View style={pdfStyles.footer}>
            <View style={pdfStyles.signatureBox}><Text style={{fontSize: 8, fontWeight: 'bold'}}>FORM TUTOR SIGNATURE</Text></View>
            <View style={pdfStyles.signatureBox}><Text style={{fontSize: 8, fontWeight: 'bold'}}>PRINCIPAL SIGNATURE</Text></View>
        </View>
      </Page>
    </Document>
  );
};

// ==================== SCHOOL ADMIN DASHBOARD ====================
const SchoolAdmin = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [reportType, setReportType] = useState('full');
  const [previewData, setPreviewData] = useState(null);
  const [newConfig, setNewConfig] = useState({ name: '', max: 10, code: '' });

  useEffect(() => { fetchSchoolData(); }, [profile]);

  const fetchSchoolData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
    setSchool(s);
    if (s) {
      const { data: cls } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s.id);
      setClasses(cls || []);
      const { data: stu } = await supabase.from('students').select('*, classes(name), comments(submission_status)').eq('school_id', s.id).order('name');
      setStudents(stu || []);
      const { data: tch } = await supabase.from('profiles').select('*').eq('school_id', s.id).eq('role', 'teacher');
      setTeachers(tch || []);
    }
    setLoading(false);
  };

  const updateSchool = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const file = formData.get('logo_file');
    let logo_url = school.logo_url;

    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${school.id}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('school-assets').upload(fileName, file);
        if (!error) {
            const { data } = supabase.storage.from('school-assets').getPublicUrl(fileName);
            logo_url = data.publicUrl;
        }
    }
    
    const { logo_file, ...otherUpdates } = Object.fromEntries(formData.entries());
    
    const { error } = await supabase.from('schools').update({ ...otherUpdates, logo_url }).eq('id', school.id);
    
    if(!error) {
        setSchool(prev => ({ ...prev, ...otherUpdates, logo_url }));
        alert('School Info Updated!');
    } else {
        alert('Update Failed: ' + error.message);
    }
    setLoading(false);
  };

  const addConfigField = async () => {
      if(!newConfig.name || !newConfig.max) return;
      const code = newConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const updatedConfig = [...(school.assessment_config || []), { ...newConfig, code }];
      await supabase.from('schools').update({ assessment_config: updatedConfig }).eq('id', school.id);
      setNewConfig({ name: '', max: 10, code: '' });
      fetchSchoolData();
  };

  const removeConfigField = async (code) => {
      const updatedConfig = school.assessment_config.filter(c => c.code !== code);
      await supabase.from('schools').update({ assessment_config: updatedConfig }).eq('id', school.id);
      fetchSchoolData();
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    
    if (students.length >= school.max_students) return window.alert("Limit reached!");
    
    const pin = generatePIN();
    // AUTOMATIC ADMISSION NUMBER GENERATION
    const autoAdmissionNo = generateAdmissionNumber();

    const { error } = await supabase.from('students').insert({
      school_id: school.id, 
      name: data.name, 
      admission_no: autoAdmissionNo, // Using generated value
      gender: data.gender, 
      class_id: data.class_id, 
      parent_pin: pin
    });
    
    if (error) window.alert(error.message); 
    else { 
        window.alert(`Student Added! \nAdm No: ${autoAdmissionNo} \nPIN: ${pin}`); 
        e.target.reset(); 
        fetchSchoolData(); 
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete student? This is irreversible.")) return;
    await supabase.from('students').delete().eq('id', id);
    fetchSchoolData();
  };

  const addClass = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await supabase.from('classes').insert({ school_id: school.id, name: form.get('name'), form_tutor_id: form.get('form_tutor_id') || null });
    e.target.reset();
    fetchSchoolData();
  };

  const deleteClass = async (id) => {
    if(!window.confirm("Delete Class?")) return;
    await supabase.from('classes').delete().eq('id', id);
    fetchSchoolData();
  };

  const loadStudentResult = async (student, type) => {
      setViewingStudent(student);
      setReportType(type);
      const { data: results } = await supabase.from('results').select('*, subjects(*)').eq('student_id', student.id);
      const { data: comments } = await supabase.from('comments').select('*').eq('student_id', student.id).maybeSingle();
      const behaviorList = comments?.behaviors ? JSON.parse(comments.behaviors) : {};
      const behaviorArray = BEHAVIORAL_TRAITS.map(trait => ({ trait, rating: behaviorList[trait] || 'Good' }));
      
      const logoBase64 = await imageUrlToBase64(school.logo_url);

      setPreviewData({ school, student, classInfo: student.classes, results: results || [], comments: comments || {}, behaviors: behaviorArray, logoBase64 });
  };

  const approveResult = async (studentId) => {
      await supabase.from('comments').update({ submission_status: 'approved' }).eq('student_id', studentId);
      window.alert("Result Approved! Parents can now check.");
      fetchSchoolData();
  };

  const getStatus = (s) => {
      if (Array.isArray(s.comments) && s.comments.length > 0) return s.comments[0].submission_status;
      if (s.comments && !Array.isArray(s.comments)) return s.comments.submission_status;
      return 'draft';
  };

  if (viewingStudent && previewData) {
      return (
          <div className="h-screen flex flex-col bg-gray-100">
              <div className="bg-white p-4 shadow flex justify-between items-center">
                  <button onClick={() => setViewingStudent(null)} className="flex items-center gap-2"><X /> Close</button>
                  <h2 className="font-bold">{viewingStudent.name} - {reportType}</h2>
                  <PDFDownloadLink document={<ResultPDF {...previewData} reportType={reportType} logoBase64={previewData.logoBase64} />} fileName={`${viewingStudent.name}.pdf`}>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Download /> Download</button>
                  </PDFDownloadLink>
              </div>
              <PDFViewer className="flex-1 w-full"><ResultPDF {...previewData} reportType={reportType} logoBase64={previewData.logoBase64} /></PDFViewer>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><School /> Admin Panel</h2>
        <nav className="space-y-2 flex-1">
          {['dashboard', 'info', 'students', 'classes'].map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} className={`w-full text-left p-3 rounded capitalize ${activeTab===t?'bg-blue-600':''}`}>{t}</button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 mt-auto"><LogOut size={18}/> Logout</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
           <div>
               <h1 className="text-2xl font-bold mb-6">Welcome, {school?.name}</h1>
               {school && (
                   <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg mb-6 flex justify-between items-center">
                       <div><h2 className="text-lg font-bold">Teacher Code</h2><p className="text-blue-100 text-sm">Share this code with teachers.</p></div>
                       <div className="flex items-center gap-2 bg-blue-800 p-3 rounded-lg"><code className="text-xl font-mono font-bold">{school.id}</code></div>
                   </div>
               )}
               <div className="grid grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded shadow"><h3>Students</h3><p className="text-3xl font-bold">{students.length}</p></div>
                   <div className="bg-white p-6 rounded shadow"><h3>Teachers</h3><p className="text-3xl font-bold">{teachers.length}</p></div>
               </div>
           </div>
        )}

        {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">School Details</h2>
                    <form onSubmit={updateSchool} className="space-y-4">
                        <label className="block text-xs font-bold text-gray-500">SCHOOL NAME</label>
                        <input name="name" defaultValue={school?.name} className="w-full p-2 border rounded" placeholder="School Name" />
                        
                        {/* NEW ADDRESS & CONTACT FIELDS */}
                        <label className="block text-xs font-bold text-gray-500 mt-2">ADDRESS</label>
                        <input name="address" defaultValue={school?.address} className="w-full p-2 border rounded" placeholder="Full School Address" />
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="block text-xs font-bold text-gray-500">PHONE CONTACT</label>
                                <input name="contact" defaultValue={school?.contact} className="w-full p-2 border rounded" placeholder="Phone Number" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500">EMAIL CONTACT</label>
                                <input name="email" defaultValue={school?.email} className="w-full p-2 border rounded" placeholder="School Email" />
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500">TERM</label>
                                <input name="current_term" defaultValue={school?.current_term} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500">SESSION</label>
                                <input name="current_session" defaultValue={school?.current_session} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 mt-2">School Logo</label>
                            <input type="file" name="logo_file" className="text-sm border p-2 w-full rounded" />
                            {school?.logo_url && <img src={school.logo_url} alt="Logo" className="h-20 mt-2 border p-1" />}
                        </div>
                        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Assessment Config</h2>
                    <div className="space-y-2 mb-4">
                        {(school?.assessment_config || []).map(c => (
                            <div key={c.code} className="flex justify-between bg-gray-50 p-2 rounded">
                                <span>{c.name} ({c.max}m)</span>
                                <button onClick={() => removeConfigField(c.code)} className="text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input placeholder="Name (e.g. CA 1)" className="border p-2 rounded flex-1" value={newConfig.name} onChange={e=>setNewConfig({...newConfig, name:e.target.value})} />
                        <input placeholder="Max" type="number" className="border p-2 rounded w-20" value={newConfig.max} onChange={e=>setNewConfig({...newConfig, max:parseInt(e.target.value)})} />
                        <button onClick={addConfigField} className="bg-green-600 text-white px-4 rounded">Add</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div>
                <h2 className="text-xl font-bold mb-4">Manage Students</h2>
                <div className="bg-white p-4 rounded shadow mb-6">
                    <form onSubmit={addStudent} className="grid grid-cols-4 gap-3 items-end">
                        {/* REMOVED MANUAL ADMISSION NUMBER INPUT */}
                        <input name="name" placeholder="Full Name" className="border p-2 rounded" required />
                        <select name="gender" className="border p-2 rounded"><option>Male</option><option>Female</option></select>
                        <select name="class_id" className="border p-2 rounded" required>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <button className="bg-green-600 text-white p-2 rounded">Register Student</button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2">* Admission Numbers are generated automatically (Year/Random)</p>
                </div>
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Adm No</th>
                                <th className="p-3">Class</th>
                                <th className="p-3">PIN</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => {
                                const status = getStatus(s);
                                return (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{s.name}</td>
                                    <td className="p-3 font-mono">{s.admission_no}</td>
                                    <td className="p-3">{s.classes?.name}</td>
                                    <td className="p-3 font-mono bg-yellow-50">{s.parent_pin}</td>
                                    <td className="p-3">
                                        {status === 'approved' ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Approved</span> :
                                         status === 'awaiting_approval' ? <button onClick={() => approveResult(s.id)} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs hover:bg-orange-200">Approve?</button> :
                                         <span className="text-gray-400 text-xs">Draft</span>
                                        }
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => loadStudentResult(s, 'full')} className="text-blue-600"><Eye size={16}/></button>
                                        <button onClick={() => deleteStudent(s.id)} className="text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'classes' && (
            <div className="bg-white p-4 rounded shadow">
                <form onSubmit={addClass} className="flex gap-4 items-end mb-4">
                    <input name="name" placeholder="Class Name" className="border p-2 rounded flex-1" required />
                    <select name="form_tutor_id" className="border p-2 rounded flex-1"><option value="">Select Tutor</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
                </form>
                <div className="grid grid-cols-2 gap-4">{classes.map(c => (
                    <div key={c.id} className="border p-3 rounded flex justify-between">
                        <div><b>{c.name}</b><br/><span className="text-sm text-gray-500">{c.profiles?.full_name}</span></div>
                        <button onClick={() => deleteClass(c.id)} className="text-red-500"><Trash2 size={16}/></button>
                    </div>))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// ==================== TEACHER DASHBOARD ====================
const TeacherDashboard = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [curClass, setCurClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [behaviors, setBehaviors] = useState({});
  const [comment, setComment] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [reportType, setReportType] = useState('full');
  const [previewData, setPreviewData] = useState(null);
  const [schoolConfig, setSchoolConfig] = useState([]);
  const [schoolData, setSchoolData] = useState(null);

  const { save, saving, lastSaved } = useAutoSave(async () => {
    if (!selectedStudent) return;
    await saveResultToDB();
  }, 2000);

  useEffect(() => {
    const init = async () => {
        const { data: cls } = await supabase.from('classes').select('*, schools(*)').eq('form_tutor_id', profile.id);
        setClasses(cls || []);
        if (cls?.[0]) {
            setSchoolConfig(cls[0].schools.assessment_config || []);
            setSchoolData(cls[0].schools);
            loadClass(cls[0].id);
        }
    };
    init();
  }, [profile]);

  const loadClass = async (classId) => {
    const cls = classes.find(c => c.id === classId);
    setCurClass(cls);
    setSelectedStudent(null);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', classId);
    setSubjects(sub || []);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
    setStudents(stu || []);
  };

  const addSubject = async () => {
    const name = window.prompt("Subject Name:");
    if (name) { await supabase.from('subjects').insert({ class_id: curClass.id, name }); loadClass(curClass.id); }
  };

  const deleteSubject = async (id) => {
    if (window.confirm("Delete subject?")) { await supabase.from('subjects').delete().eq('id', id); loadClass(curClass.id); }
  };

  const loadStudentData = async (student) => {
    setSelectedStudent(null);
    
    const { data: res } = await supabase.from('results').select('*, subjects(*)').eq('student_id', student.id);
    const scoreMap = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id);
      scoreMap[s.id] = existing?.scores || {};
    });
    setScores(scoreMap);

    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', student.id).maybeSingle();
    setComment(comm?.tutor_comment || "");
    setBehaviors(comm?.behaviors ? JSON.parse(comm.behaviors) : {});
    setSelectedStudent(student);
  };

  const updateScore = (subId, code, value, max) => {
    const num = Math.min(parseFloat(value) || 0, max);
    setScores(prev => ({ ...prev, [subId]: { ...prev[subId], [code]: num } }));
    save();
  };

  const saveResultToDB = async (status = null) => {
    if(!selectedStudent) return;
    
    const resultsPayload = subjects.map(s => {
      const subScores = scores[s.id] || {};
      let total = 0;
      schoolConfig.forEach(c => total += (subScores[c.code] || 0));
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selectedStudent.id,
        subject_id: s.id,
        scores: subScores,
        total, grade, remarks: remark
      };
    });

    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(resultsPayload);

    const payload = {
      student_id: selectedStudent.id,
      school_id: curClass.school_id,
      tutor_comment: comment,
      behaviors: JSON.stringify(behaviors)
    };
    if (status) payload.submission_status = status;
    await supabase.from('comments').upsert(payload, { onConflict: 'student_id' });
  };

  const handlePreview = async (type) => {
    await saveResultToDB();
    const { data: results } = await supabase.from('results').select('*, subjects(*)').eq('student_id', selectedStudent.id);
    const behaviorArray = BEHAVIORAL_TRAITS.map(trait => ({ trait, rating: behaviors[trait] || 'Good' }));
    
    // Generate Base64 Logo for PDF
    const logoBase64 = await imageUrlToBase64(schoolData.logo_url);

    setPreviewData({ school: schoolData, student: selectedStudent, classInfo: { ...curClass }, results: results || [], comments: { tutor_comment: comment }, behaviors: behaviorArray, logoBase64 });
    setShowPreview(true);
  };

  const publishResult = async () => {
    if(!window.confirm("Publish result for Admin Approval?")) return;
    await saveResultToDB('awaiting_approval');
    window.alert("Sent for Approval!");
    setShowPreview(false);
  }

  if (showPreview) {
      return (
          <div className="h-screen flex flex-col bg-gray-100">
              <div className="bg-white p-4 shadow flex justify-between items-center">
                  <button onClick={() => setShowPreview(false)} className="flex items-center gap-2"><X /> Close</button>
                  <div className="flex gap-2">
                     <button onClick={publishResult} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"><ShieldCheck size={18}/> Submit for Approval</button>
                     <PDFDownloadLink document={<ResultPDF {...previewData} logoBase64={previewData.logoBase64} />} fileName="Result.pdf">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Download /> PDF</button>
                     </PDFDownloadLink>
                  </div>
              </div>
              <PDFViewer className="flex-1 w-full"><ResultPDF {...previewData} logoBase64={previewData.logoBase64} /></PDFViewer>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
            <h2 className="font-bold truncate">{profile.full_name}</h2>
            <button onClick={onLogout} className="text-sm underline mt-2">Logout</button>
            <select className="mt-4 w-full text-black p-2 rounded" onChange={(e) => loadClass(parseInt(e.target.value))}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
        <div className="flex-1 overflow-y-auto">
            {curClass && (
                <>
                <div className="p-3 bg-gray-100 font-bold text-xs flex justify-between"><span>SUBJECTS</span><button onClick={addSubject}><Plus size={16}/></button></div>
                <div className="p-2 flex flex-wrap gap-2 border-b">{subjects.map(s => (<span key={s.id} className="bg-blue-100 text-xs px-2 py-1 rounded flex gap-1">{s.name} <button onClick={()=>deleteSubject(s.id)}>×</button></span>))}</div>
                <div className="p-3 bg-gray-100 font-bold text-xs">STUDENTS</div>
                {students.map(s => (
                    <div key={s.id} onClick={() => loadStudentData(s)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>{s.name}</div>
                ))}
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {!selectedStudent ? <div className="text-center mt-20 text-gray-400">Select a student</div> : (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                    <div className="flex gap-2">
                        {saving && <span className="text-orange-500 text-xs">Saving...</span>}
                        <button onClick={() => handlePreview()} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Eye size={18}/> Preview</button>
                    </div>
                </div>

                <div className="bg-white rounded shadow overflow-x-auto mb-8">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left">Subject</th>
                                {schoolConfig.map(c => <th key={c.code} className="p-2 text-center">{c.name}<br/>({c.max})</th>)}
                                <th className="p-3 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map(s => {
                                const subScores = scores[s.id] || {};
                                let total = 0;
                                schoolConfig.forEach(c => total += (subScores[c.code] || 0));
                                return (
                                    <tr key={s.id} className="border-b">
                                        <td className="p-3">{s.name}</td>
                                        {schoolConfig.map(c => (
                                            <td key={c.code} className="p-2 text-center">
                                                <input type="number" className="w-14 text-center border rounded" 
                                                    value={subScores[c.code] || ''} 
                                                    onChange={(e) => updateScore(s.id, c.code, e.target.value, c.max)} 
                                                />
                                            </td>
                                        ))}
                                        <td className="p-3 text-center font-bold">{total}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold mb-4">Behavioral Traits</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {BEHAVIORAL_TRAITS.map(t => (
                                <div key={t}>
                                    <label className="text-xs block text-gray-500">{t}</label>
                                    <select className="w-full border rounded text-sm" value={behaviors[t] || 'Good'} onChange={(e) => { setBehaviors(p => ({...p, [t]: e.target.value})); save(); }}>
                                        {RATINGS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded shadow h-fit">
                        <h3 className="font-bold mb-4">Comment</h3>
                        <textarea className="w-full border rounded p-3 h-32 text-sm" value={comment} onChange={(e) => { setComment(e.target.value); save(); }} />
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// ==================== AUTH & PARENT PORTAL ====================
const Auth = ({ onLogin, onParent }) => {
    const [mode, setMode] = useState('login'); 
    const [form, setForm] = useState({ email: '', password: '', name: '', pin: '', schoolCode: '' });

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            if (mode === 'central') {
                if (form.email === 'oluwatoyin' && form.password === 'Funmilola') onLogin({ role: 'central' });
            } else if (mode === 'school_reg') {
                const { data: pinData } = await supabase.from('subscription_pins').select('*').eq('code', form.pin).eq('is_used', false).single();
                if (!pinData) throw new Error('Invalid PIN');
                const { data: auth } = await supabase.auth.signUp({ email: form.email, password: form.password });
                const { data: school } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: 'My School', max_students: pinData.student_limit }).select().single();
                await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: school.id });
                await supabase.from('subscription_pins').update({ is_used: true }).eq('id', pinData.id);
                window.alert("Registered!"); setMode('login');
            } else if (mode === 'teacher_reg') {
                 const { data: sch } = await supabase.from('schools').select('id').eq('id', form.schoolCode).single();
                 if (!sch) throw new Error('Invalid Code');
                 const { data: auth } = await supabase.auth.signUp({ email: form.email, password: form.password });
                 await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: sch.id });
                 window.alert("Registered!"); setMode('login');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (error) throw error;
            }
        } catch (err) { window.alert(err.message); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                <div className="text-center mb-6"><School className="mx-auto text-blue-600 mb-2" size={48} /><h1 className="text-2xl font-bold">Springforth Results</h1></div>
                <div className="flex justify-center gap-4 mb-6 text-sm font-bold border-b pb-2">
                    {['login', 'school_reg', 'teacher_reg', 'central'].map(m => <button key={m} onClick={()=>setMode(m)} className={`capitalize ${mode===m?'text-blue-600':''}`}>{m.replace('_', ' ')}</button>)}
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    {(mode.includes('reg')) && <input placeholder="Full Name" className="w-full p-3 border rounded" onChange={e=>setForm({...form, name:e.target.value})} />}
                    <input placeholder={mode==='central'?'User':'Email'} className="w-full p-3 border rounded" onChange={e=>setForm({...form, email:e.target.value})} />
                    <input type="password" placeholder="Pass" className="w-full p-3 border rounded" onChange={e=>setForm({...form, password:e.target.value})} />
                    {mode === 'school_reg' && <input placeholder="PIN" className="w-full p-3 border rounded" onChange={e=>setForm({...form, pin:e.target.value})} />}
                    {mode === 'teacher_reg' && <input placeholder="School Code" className="w-full p-3 border rounded" onChange={e=>setForm({...form, schoolCode:e.target.value})} />}
                    <button className="w-full bg-blue-600 text-white py-3 rounded font-bold">Submit</button>
                </form>
                {mode === 'login' && <button onClick={onParent} className="w-full mt-4 bg-green-600 text-white py-3 rounded font-bold">Parent Portal</button>}
            </div>
        </div>
    );
};

// 4. PARENT PORTAL
const ParentPortal = ({ onBack }) => {
    const [creds, setCreds] = useState({ adm: '', pin: '' });
    const [data, setData] = useState(null);

    const fetchResult = async (e) => {
        e.preventDefault();
        const { data: stu } = await supabase.from('students').select('*, schools(*), classes(*), comments(*), results(*, subjects(*))').eq('admission_no', creds.adm).eq('parent_pin', creds.pin).maybeSingle();
        if (!stu) return window.alert('Invalid Credentials');
        
        const comm = Array.isArray(stu.comments) ? stu.comments[0] : stu.comments;
        if (comm?.submission_status !== 'approved') return window.alert("Result not yet approved.");

        const behaviors = comm?.behaviors ? JSON.parse(comm.behaviors) : {};
        const behaviorArray = BEHAVIORAL_TRAITS.map(trait => ({ trait, rating: behaviors[trait] || 'Good' }));
        
        // Base64 logo conversion for parents too
        const logoBase64 = await imageUrlToBase64(stu.schools.logo_url);

        setData({ student: stu, school: stu.schools, classInfo: stu.classes, results: stu.results, comments: comm || {}, behaviors: behaviorArray, logoBase64 });
    };

    if (data) return (
        <div className="h-screen flex flex-col bg-gray-100">
            <div className="bg-white p-4 shadow flex justify-between items-center">
                <button onClick={()=>setData(null)} className="flex items-center gap-2"><X /> Back</button>
                <div className="flex gap-2">
                    <PDFDownloadLink document={<ResultPDF {...data} reportType="mid" logoBase64={data.logoBase64} />} fileName="MidTerm.pdf"><button className="bg-blue-100 text-blue-600 px-4 py-2 rounded">Mid-Term</button></PDFDownloadLink>
                    <PDFDownloadLink document={<ResultPDF {...data} reportType="full" logoBase64={data.logoBase64} />} fileName="FullTerm.pdf"><button className="bg-green-600 text-white px-4 py-2 rounded">Full-Term</button></PDFDownloadLink>
                </div>
            </div>
            <PDFViewer className="flex-1"><ResultPDF {...data} reportType="full" logoBase64={data.logoBase64} /></PDFViewer>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50">
            <form onSubmit={fetchResult} className="bg-white p-8 rounded-xl shadow-xl w-96 space-y-4">
                <h2 className="text-xl font-bold text-center">Parent Portal</h2>
                <input placeholder="Adm No" className="w-full p-3 border rounded" onChange={e=>setCreds({...creds, adm:e.target.value})} />
                <input type="password" placeholder="PIN" className="w-full p-3 border rounded" onChange={e=>setCreds({...creds, pin:e.target.value})} />
                <button className="w-full bg-green-600 text-white py-3 rounded font-bold">Check</button>
                <button type="button" onClick={onBack} className="w-full text-center text-sm">Back</button>
            </form>
        </div>
    );
};

// 5. CENTRAL ADMIN
const CentralAdmin = ({ onLogout }) => {
    const [pins, setPins] = useState([]);
    useEffect(()=>{ const f = async () => { const {data} = await supabase.from('subscription_pins').select('*'); setPins(data||[]); }; f(); },[]);
    const gen = async () => { await supabase.from('subscription_pins').insert({ code: `SUB-${Math.floor(Math.random()*90000)}` }); window.location.reload(); };
    return (
        <div className="p-8 bg-slate-900 min-h-screen text-white">
            <button onClick={onLogout} className="mb-4 text-red-400">Logout</button>
            <button onClick={gen} className="bg-blue-600 px-6 py-3 rounded font-bold mb-6 block">New PIN</button>
            {pins.map(p=><div key={p.id} className="bg-slate-800 p-4 mb-2">{p.code} - {p.is_used?'USED':'ACTIVE'}</div>)}
        </div>
    );
};

// ==================== APP ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(!session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setView('auth');
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !data) {
          console.warn("Profile not found. Logging out.");
          await supabase.auth.signOut();
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [session]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  if (view === 'central') return <CentralAdmin onLogout={() => setView('auth')} />;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  
  if (!session) return <Auth onLogin={(d) => setView(d.role === 'central' ? 'central' : 'dashboard')} onParent={() => setView('parent')} />;
  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  return profile.role === 'admin' 
    ? <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} />
    : <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage, PDFDownloadLink
} from '@react-pdf/renderer';
import {
  LayoutDashboard, LogOut, Loader2, Plus, School, Copy, Check, User, Download,
  X, Eye, CheckCircle, Send, Settings, Users, BookOpen, FileText, Trash2, AlertCircle, Unlock
} from 'lucide-react';

// ==================== SUPABASE CONFIG ====================
// Replace with your project details if not already set
const supabaseUrl = 'https://xtciiatfetqecsfxoicq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Y2lpYXRmZXRxZWNzZnhvaWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDEyMDIsImV4cCI6MjA4MDYxNzIwMn0.81K9w-XbCHWRWmKkq3rcJHxslx3hs5mGCSNIvyJRMuw';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== CONSTANTS & HELPERS ====================
const SCORE_LIMITS = { note: 5, cw: 5, hw: 5, test: 15, ca: 15, exam: 60 };
const BEHAVIORAL_TRAITS = [
  'COOPERATION', 'LEADERSHIP', 'HONESTY', 'SELF DISCIPLINE',
  'RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'PUNCTUALITY', 'NEATNESS', 'INITIATIVE'
];
const RATINGS = ['Excellent Degree', 'Very Good', 'Good', 'Fair', 'Poor'];

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

const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();

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
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  headerBox: { flexDirection: 'row', border: '2px solid #000', padding: 10, marginBottom: 5, alignItems: 'center' },
  logo: { width: 60, height: 60, marginRight: 10, objectFit: 'contain' },
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
  colSN: { width: '4%' }, colSubject: { width: '18%' }, colScore: { width: '5%' },
  colTotal: { width: '7%', fontWeight: 'bold' }, colGrade: { width: '6%' },
  colPos: { width: '6%' }, colRemark: { width: '12%', borderRight: 0 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  signatureBox: { width: '40%', alignItems: 'center', borderTop: '1px solid #000', paddingTop: 5 },
});

const ResultPDF = ({ school, student, results, classInfo, comments, behaviors = [] }) => {
  const totalScore = results.reduce((acc, r) => acc + r.total, 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);
  const { grade: overallGrade } = calculateGrade(parseFloat(average));
  const behaviorMap = Object.fromEntries(behaviors.map(b => [b.trait, b.rating]));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBox}>
          {school?.logo_url ? (
            <PDFImage src={school.logo_url} style={pdfStyles.logo} />
          ) : <View style={{width: 60}} />}
          <View style={pdfStyles.headerText}>
            <Text style={pdfStyles.schoolName}>{school?.name || 'SCHOOL NAME'}</Text>
            <Text style={pdfStyles.schoolDetails}>{school?.address}</Text>
            <Text style={pdfStyles.schoolDetails}>{school?.contact} | {school?.email}</Text>
            <Text style={pdfStyles.termTitle}>
              {school?.current_term || 'TERM'} REPORT {school?.current_session || ''} SESSION
            </Text>
          </View>
        </View>

        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>NAME:</Text><Text style={pdfStyles.infoValue}>{student.name}</Text></View>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>ADM NO:</Text><Text style={pdfStyles.infoValue}>{student.admission_no}</Text></View>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>CLASS:</Text><Text style={pdfStyles.infoValue}>{classInfo?.name}</Text></View>
        </View>
        <View style={pdfStyles.infoGrid}>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>AVG:</Text><Text style={pdfStyles.infoValue}>{average}%</Text></View>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>GRADE:</Text><Text style={pdfStyles.infoValue}>{overallGrade}</Text></View>
          <View style={pdfStyles.infoBox}><Text style={pdfStyles.infoLabel}>GENDER:</Text><Text style={pdfStyles.infoValue}>{student.gender}</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, pdfStyles.colSN, pdfStyles.cellCenter]}>S/N</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colSubject]}>SUBJECT</Text>
            {['NOTE','CW','HW','TEST','CA','EXAM'].map(h => (
               <Text key={h} style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{h}</Text>
            ))}
            <Text style={[pdfStyles.cell, pdfStyles.colTotal, pdfStyles.cellCenter]}>TOTAL</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colGrade, pdfStyles.cellCenter]}>GRADE</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colPos, pdfStyles.cellCenter]}>POS</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colPos, pdfStyles.cellCenter]}>HIGH</Text>
            <Text style={[pdfStyles.cell, pdfStyles.colRemark]}>REMARK</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, pdfStyles.colSN, pdfStyles.cellCenter]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colSubject]}>{r.subjects?.name}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_note}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_cw}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_hw}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_test}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_ca}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colScore, pdfStyles.cellCenter]}>{r.score_exam}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colTotal, pdfStyles.cellCenter]}>{r.total}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colGrade, pdfStyles.cellCenter]}>{r.grade}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colPos, pdfStyles.cellCenter]}>{r.position}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colPos, pdfStyles.cellCenter]}>{r.highest}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colRemark]}>{r.remarks}</Text>
            </View>
          ))}
        </View>

        <View style={{marginTop: 10, flexDirection: 'row'}}>
            <View style={{width: '60%', marginRight: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', marginBottom: 4}}>BEHAVIOURAL REPORT</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', border: '1px solid #000', padding: 5}}>
                    {BEHAVIORAL_TRAITS.map(t => (
                         <Text key={t} style={{width: '50%', fontSize: 7, marginBottom: 2}}>{t}: {behaviorMap[t] || 'Good'}</Text>
                    ))}
                </View>
            </View>
            <View style={{width: '40%'}}>
                 <Text style={{fontSize: 9, fontWeight: 'bold', marginBottom: 4}}>SUMMARY</Text>
                 <View style={{border: '1px solid #000', padding: 5}}>
                     <Text style={{fontSize: 7}}>Total Score: {totalScore}</Text>
                     <Text style={{fontSize: 7}}>No. of Subjects: {results.length}</Text>
                 </View>
            </View>
        </View>

        <View style={{marginTop: 10, border: '1px solid #000', padding: 5}}>
            <Text style={{fontSize: 8, fontWeight: 'bold'}}>FORM TUTOR'S COMMENT:</Text>
            <Text style={{fontSize: 7, marginTop: 2}}>{comments?.tutor_comment || 'No comment.'}</Text>
        </View>

        <View style={{marginTop: 5, border: '1px solid #000', padding: 5}}>
            <Text style={{fontSize: 8, fontWeight: 'bold'}}>PRINCIPAL'S COMMENT:</Text>
            <Text style={{fontSize: 7, marginTop: 2}}>{comments?.principal_comment || 'Result Approved.'}</Text>
        </View>

        <View style={pdfStyles.footer}>
            <View style={pdfStyles.signatureBox}><Text style={{fontSize: 7}}>FORM TUTOR SIGNATURE</Text></View>
            <View style={pdfStyles.signatureBox}><Text style={{fontSize: 7}}>PRINCIPAL SIGNATURE</Text></View>
        </View>
      </Page>
    </Document>
  );
};

// ==================== SUB-COMPONENTS ====================

// 1. SCHOOL ADMIN DASHBOARD
const SchoolAdmin = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data States
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    fetchSchoolData();
  }, [profile]);

  const fetchSchoolData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('schools').select('*').eq('owner_id', profile.id).single();
    setSchool(s);

    if (s) {
      const { data: cls } = await supabase.from('classes').select('*, profiles(full_name)').eq('school_id', s.id);
      setClasses(cls || []);

      // Fetch students with their comment status to check if they are locked/submitted
      const { data: stu } = await supabase.from('students')
        .select('*, classes(name), comments(submission_status, principal_comment)')
        .eq('school_id', s.id)
        .order('name');
      setStudents(stu || []);

      const { data: tch } = await supabase.from('profiles').select('*').eq('school_id', s.id).eq('role', 'teacher');
      setTeachers(tch || []);

      const { data: app } = await supabase.from('comments')
        .select('*, students(name, admission_no, class_id), profiles(full_name)')
        .eq('school_id', s.id)
        .is('principal_comment', null)
        .eq('submission_status', 'submitted');
      setApprovals(app || []);
    }
    setLoading(false);
  };

  const updateSchool = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData.entries());
    
    const file = formData.get('logo_file');
    let logo_url = school.logo_url;
    
    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${school.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('school-assets').upload(fileName, file);
        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('school-assets').getPublicUrl(fileName);
            logo_url = publicUrl;
        }
    }

    await supabase.from('schools').update({ ...updates, logo_url }).eq('id', school.id);
    window.alert('School info updated!');
    fetchSchoolData();
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    
    if (students.length >= school.max_students) return window.alert("Subscription limit reached!");

    const pin = generatePIN();
    const { error } = await supabase.from('students').insert({
      school_id: school.id,
      name: data.name,
      admission_no: data.admission_no,
      gender: data.gender,
      class_id: data.class_id,
      parent_pin: pin
    });

    if (error) window.alert(error.message);
    else {
      window.alert(`Student Added! Parent PIN: ${pin}`);
      e.target.reset();
      fetchSchoolData();
    }
  };

  const addClass = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await supabase.from('classes').insert({
        school_id: school.id,
        name: form.get('name'),
        form_tutor_id: form.get('form_tutor_id') || null
    });
    e.target.reset();
    fetchSchoolData();
  };

  const approveResult = async (id, comment) => {
      await supabase.from('comments').update({ principal_comment: comment }).eq('id', id);
      setApprovals(prev => prev.filter(x => x.id !== id));
  };

  // UNLOCK FUNCTION: Allows teacher to edit again
  const unlockResult = async (studentId) => {
      if(!window.confirm("Unlock this result? This will revert the status to 'draft' and remove principal approval, allowing the teacher to edit again.")) return;
      
      await supabase.from('comments').update({
          submission_status: 'draft',
          principal_comment: null
      }).eq('student_id', studentId);
      
      window.alert("Result unlocked.");
      fetchSchoolData();
  };

  const deleteStudent = async (id) => {
      if(!window.confirm("Delete student? This is irreversible.")) return;
      await supabase.from('students').delete().eq('id', id);
      fetchSchoolData();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><School /> Admin Panel</h2>
        <nav className="space-y-2 flex-1">
          <button onClick={()=>setActiveTab('dashboard')} className={`w-full text-left p-3 rounded flex gap-2 ${activeTab==='dashboard'?'bg-blue-600':''}`}><LayoutDashboard size={18}/> Dashboard</button>
          <button onClick={()=>setActiveTab('info')} className={`w-full text-left p-3 rounded flex gap-2 ${activeTab==='info'?'bg-blue-600':''}`}><Settings size={18}/> School Info</button>
          <button onClick={()=>setActiveTab('students')} className={`w-full text-left p-3 rounded flex gap-2 ${activeTab==='students'?'bg-blue-600':''}`}><Users size={18}/> Students</button>
          <button onClick={()=>setActiveTab('classes')} className={`w-full text-left p-3 rounded flex gap-2 ${activeTab==='classes'?'bg-blue-600':''}`}><BookOpen size={18}/> Classes</button>
          <button onClick={()=>setActiveTab('approvals')} className={`w-full text-left p-3 rounded flex gap-2 ${activeTab==='approvals'?'bg-blue-600':''}`}>
            <CheckCircle size={18}/> Approvals
            {approvals.length > 0 && <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full ml-auto">{approvals.length}</span>}
          </button>
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 mt-auto"><LogOut size={18}/> Logout</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
           <div>
               <h1 className="text-2xl font-bold mb-6">Welcome, {school?.name}</h1>
               <div className="grid grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded shadow">
                       <h3 className="text-gray-500 text-sm">Total Students</h3>
                       <p className="text-3xl font-bold">{students.length} / {school?.max_students}</p>
                   </div>
                   <div className="bg-white p-6 rounded shadow">
                       <h3 className="text-gray-500 text-sm">Teachers</h3>
                       <p className="text-3xl font-bold">{teachers.length}</p>
                   </div>
                   <div className="bg-white p-6 rounded shadow">
                       <h3 className="text-gray-500 text-sm">Pending Approvals</h3>
                       <p className="text-3xl font-bold text-orange-600">{approvals.length}</p>
                   </div>
               </div>
           </div>
        )}

        {activeTab === 'info' && (
            <div className="bg-white p-6 rounded shadow max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Edit School Information</h2>
                <form onSubmit={updateSchool} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold">School Name</label>
                        <input name="name" defaultValue={school?.name} className="w-full p-2 border rounded" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold">Current Term</label>
                        <select name="current_term" defaultValue={school?.current_term} className="w-full p-2 border rounded">
                            <option>Term One</option><option>Term Two</option><option>Term Three</option>
                        </select></div>
                        <div><label className="block text-sm font-bold">Session</label>
                        <input name="current_session" defaultValue={school?.current_session} className="w-full p-2 border rounded" placeholder="2024/2025" /></div>
                    </div>
                    <div><label className="block text-sm font-bold">Address</label><input name="address" defaultValue={school?.address} className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-sm font-bold">Contact Phone</label><input name="contact" defaultValue={school?.contact} className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-sm font-bold">Email</label><input name="email" defaultValue={school?.email} className="w-full p-2 border rounded" /></div>
                    <div>
                        <label className="block text-sm font-bold">School Logo</label>
                        <input type="file" name="logo_file" accept="image/*" className="w-full text-sm" />
                        {school?.logo_url && <img src={school.logo_url} alt="Logo" className="h-16 mt-2" />}
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
                </form>
            </div>
        )}

        {activeTab === 'students' && (
            <div>
                <h2 className="text-xl font-bold mb-4">Manage Students</h2>
                <div className="bg-white p-4 rounded shadow mb-6">
                    <h3 className="font-bold mb-2">Register New Student</h3>
                    <form onSubmit={addStudent} className="grid grid-cols-5 gap-3 items-end">
                        <input name="name" placeholder="Full Name" className="border p-2 rounded" required />
                        <input name="admission_no" placeholder="Adm No" className="border p-2 rounded" required />
                        <select name="gender" className="border p-2 rounded"><option>Male</option><option>Female</option></select>
                        <select name="class_id" className="border p-2 rounded" required>
                            <option value="">Select Class</option>
                            {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button className="bg-green-600 text-white p-2 rounded">Register</button>
                    </form>
                </div>
                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Adm No</th>
                                <th className="p-3">Class</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => {
                                const isLocked = s.comments?.[0]?.submission_status === 'submitted' || !!s.comments?.[0]?.principal_comment;
                                return (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{s.name}</td>
                                    <td className="p-3">{s.admission_no}</td>
                                    <td className="p-3">{s.classes?.name}</td>
                                    <td className="p-3">
                                        {isLocked ? 
                                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Locked</span> : 
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Open</span>
                                        }
                                    </td>
                                    <td className="p-3 flex items-center gap-2">
                                        <button onClick={() => {navigator.clipboard.writeText(s.parent_pin); window.alert('PIN Copied')}} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Copy PIN"><Copy size={16}/></button>
                                        
                                        {isLocked && (
                                            <button onClick={() => unlockResult(s.id)} className="text-orange-600 hover:bg-orange-50 p-1 rounded" title="Unlock Result (Allow Edit)">
                                                <Unlock size={16}/>
                                            </button>
                                        )}

                                        <button onClick={() => deleteStudent(s.id)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Delete Student"><Trash2 size={16}/></button>
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
            <div>
                <h2 className="text-xl font-bold mb-4">Classes & Teachers</h2>
                <div className="bg-white p-4 rounded shadow mb-6">
                    <form onSubmit={addClass} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold">Class Name</label>
                            <input name="name" placeholder="e.g. JSS 1 A" className="w-full border p-2 rounded" required />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold">Assign Form Tutor</label>
                            <select name="form_tutor_id" className="w-full border p-2 rounded">
                                <option value="">None</option>
                                {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded">Create Class</button>
                    </form>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {classes.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-600">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{c.name}</h3>
                                    <p className="text-sm text-gray-500">Tutor: {c.profiles?.full_name || 'Unassigned'}</p>
                                </div>
                                <button className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'approvals' && (
            <div>
                <h2 className="text-xl font-bold mb-4">Result Approvals</h2>
                {approvals.length === 0 ? <p className="text-gray-500">No pending results.</p> : (
                    <div className="space-y-4">
                        {approvals.map(app => (
                            <div key={app.id} className="bg-white p-4 rounded shadow">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">{app.students.name} ({app.students.admission_no})</span>
                                    <span className="text-sm text-gray-500">Tutor: {app.profiles.full_name}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded mb-3 text-sm italic">"{app.tutor_comment}"</div>
                                <div className="flex gap-3">
                                    <button onClick={() => approveResult(app.id, 'Result Approved.')} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                        <Check size={14}/> Approve Standard
                                    </button>
                                    <button onClick={() => {
                                        const c = window.prompt("Enter custom remark:", "Outstanding Result");
                                        if(c) approveResult(app.id, c);
                                    }} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                        Custom Remark
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// 2. TEACHER DASHBOARD
const TeacherDashboard = ({ profile, onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [curClass, setCurClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  
  // Edit State
  const [scores, setScores] = useState({});
  const [behaviors, setBehaviors] = useState({});
  const [comment, setComment] = useState("");
  const [isLocked, setIsLocked] = useState(false); 
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const { save, saving, lastSaved } = useAutoSave(async () => {
    if (!selectedStudent || isLocked) return;
    await saveResultToDB();
  }, 2000);

  useEffect(() => {
    fetchClasses();
  }, [profile]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('form_tutor_id', profile.id);
    setClasses(data || []);
    if (data?.[0]) loadClass(data[0].id);
  };

  const loadClass = async (classId) => {
    const cls = classes.find(c => c.id === classId);
    setCurClass(cls);
    setSelectedStudent(null);
    setIsLocked(false);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', classId);
    setSubjects(sub || []);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', classId).order('name');
    setStudents(stu || []);
  };

  const addSubject = async () => {
    const name = window.prompt("Subject Name:");
    if (!name) return;
    await supabase.from('subjects').insert({ class_id: curClass.id, name });
    loadClass(curClass.id);
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete subject? This will wipe scores for this subject.")) return;
    await supabase.from('subjects').delete().eq('id', id);
    loadClass(curClass.id);
  };

  const loadStudentData = async (student) => {
    // 1. Reset state IMMEDIATELY to prevent seeing previous student's locked status
    setSelectedStudent(null);
    setIsLocked(false); 
    setLoadingStudent(true);
    
    // 2. Fetch Scores
    const { data: res } = await supabase.from('results').select('*').eq('student_id', student.id);
    const scoreMap = {};
    subjects.forEach(s => {
      const existing = res?.find(r => r.subject_id === s.id);
      scoreMap[s.id] = existing || {
        score_note: 0, score_cw: 0, score_hw: 0, score_test: 0, score_ca: 0, score_exam: 0
      };
    });
    setScores(scoreMap);

    // 3. Fetch Comments/Status
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', student.id).single();
    setComment(comm?.tutor_comment || "");
    setBehaviors(comm?.behaviors ? JSON.parse(comm.behaviors) : {});
    
    // 4. Determine Lock Status
    // Lock if Principal has commented (approved) OR if explicitly submitted
    const isApproved = comm?.principal_comment && comm.principal_comment.trim() !== '';
    const isSubmitted = comm?.submission_status === 'submitted'; 
    
    setIsLocked(isApproved || isSubmitted);

    setSelectedStudent(student);
    setLoadingStudent(false);
  };

  const updateScore = (subId, field, value) => {
    if (isLocked) return;
    const validated = validateScore(value, field.replace('score_', ''));
    setScores(prev => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: validated }
    }));
    save(); 
  };

  const saveResultToDB = async (overrideStatus = null) => {
    if(!selectedStudent) return;
    
    // Upsert Results
    const resultsPayload = subjects.map(s => {
      const sc = scores[s.id];
      const total = (sc.score_note||0)+(sc.score_cw||0)+(sc.score_hw||0)+(sc.score_test||0)+(sc.score_ca||0)+(sc.score_exam||0);
      const { grade, remark } = calculateGrade(total);
      return {
        student_id: selectedStudent.id,
        subject_id: s.id,
        score_note: sc.score_note, score_cw: sc.score_cw, score_hw: sc.score_hw,
        score_test: sc.score_test, score_ca: sc.score_ca, score_exam: sc.score_exam,
        total, grade, remarks: remark
      };
    });

    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(resultsPayload);

    // Upsert Comment
    const commentPayload = {
      student_id: selectedStudent.id,
      school_id: curClass.school_id,
      tutor_comment: comment,
      behaviors: JSON.stringify(behaviors)
    };
    if(overrideStatus) commentPayload.submission_status = overrideStatus;

    await supabase.from('comments').upsert(commentPayload, { onConflict: 'student_id' });
  };

  const handlePreview = async () => {
    await saveResultToDB();
    const { data: allResults } = await supabase.from('results')
      .select('*, students(class_id)').eq('students.class_id', curClass.id); 

    const studentTotals = {};
    (allResults || []).forEach(r => {
        if(!studentTotals[r.student_id]) studentTotals[r.student_id] = 0;
        studentTotals[r.student_id] += r.total;
    });

    const sortedIds = Object.keys(studentTotals).sort((a,b) => studentTotals[b] - studentTotals[a]);
    const position = sortedIds.indexOf(selectedStudent.id.toString()) + 1;

    const subjectHighs = {};
    subjects.forEach(s => {
        const subScores = (allResults || []).filter(r => r.subject_id === s.id).map(r => r.total);
        subjectHighs[s.id] = Math.max(0, ...subScores);
    });

    const processedResults = subjects.map(s => {
        const sc = scores[s.id];
        const total = (sc.score_note||0)+(sc.score_cw||0)+(sc.score_hw||0)+(sc.score_test||0)+(sc.score_ca||0)+(sc.score_exam||0);
        const { grade, remark } = calculateGrade(total);
        return {
            ...sc,
            subjects: s,
            total, grade, remarks: remark,
            position: '-',
            highest: subjectHighs[s.id]
        };
    });
    
    const { data: school } = await supabase.from('schools').select('*').eq('id', curClass.school_id).single();

    setPreviewData({
        school,
        student: selectedStudent,
        classInfo: { ...curClass, size: students.length },
        results: processedResults,
        comments: { tutor_comment: comment, principal_comment: isLocked ? 'Approved' : null },
        behaviors: BEHAVIORAL_TRAITS.map(t => ({ trait: t, rating: behaviors[t] || 'Good' }))
    });
    setShowPreview(true);
  };

  const submitToPrincipal = async () => {
      try {
          await saveResultToDB('submitted');
          setIsLocked(true); // Optimistic UI update
          window.alert('Result Submitted to Principal! Editing is now locked.');
          setShowPreview(false);
      } catch(e) {
          // Fallback if column missing
          await saveResultToDB();
          window.alert('Result saved and sent for review.');
          setShowPreview(false);
      }
  };

  if (showPreview) {
      return (
          <div className="h-screen flex flex-col bg-gray-100">
              <div className="bg-white p-4 shadow flex justify-between items-center">
                  <button onClick={() => setShowPreview(false)} className="flex items-center gap-2"><X /> Close Preview</button>
                  <h2 className="font-bold">{previewData.student.name}</h2>
                  <div className="flex gap-2">
                    {!isLocked && <button className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2" onClick={submitToPrincipal}>
                        <Send size={16}/> Submit for Approval
                    </button>}
                  </div>
              </div>
              <PDFViewer className="flex-1 w-full"><ResultPDF {...previewData} /></PDFViewer>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 bg-blue-600 text-white">
            <div className="flex justify-between items-center">
                <h2 className="font-bold truncate">{profile.full_name}</h2>
                <button onClick={onLogout}><LogOut size={16}/></button>
            </div>
            <select className="mt-4 w-full text-black p-2 rounded" onChange={(e) => loadClass(parseInt(e.target.value))}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {curClass && (
                <>
                <div className="p-3 bg-gray-100 font-bold text-xs flex justify-between items-center">
                    <span>SUBJECTS ({subjects.length})</span>
                    <button onClick={addSubject} className="text-blue-600"><Plus size={16}/></button>
                </div>
                <div className="p-2 flex flex-wrap gap-2 border-b">
                    {subjects.map(s => (
                        <span key={s.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                            {s.name} <button onClick={()=>deleteSubject(s.id)} className="text-red-500 hover:text-red-700">×</button>
                        </span>
                    ))}
                </div>
                <div className="p-3 bg-gray-100 font-bold text-xs">STUDENTS ({students.length})</div>
                {students.map(s => (
                    <div key={s.id} onClick={() => loadStudentData(s)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.admission_no}</p>
                    </div>
                ))}
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedStudent ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                {loadingStudent ? <Loader2 className="animate-spin mb-4" size={40}/> : <User size={64} className="mb-4 opacity-20" />}
                <p>{loadingStudent ? 'Loading Student Data...' : 'Select a student to enter results'}</p>
            </div>
        ) : (
            <div className="p-8 pb-20">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                        <p className="text-gray-500">{selectedStudent.admission_no} • {curClass.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-gray-500">
                             {saving ? <span className="flex items-center text-orange-500"><Loader2 className="animate-spin mr-1" size={12}/> Saving...</span> : 
                              lastSaved ? <span className="flex items-center text-green-600"><Check size={12} className="mr-1"/> Saved {lastSaved.toLocaleTimeString()}</span> : null}
                        </div>
                        <button onClick={handlePreview} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 shadow-lg hover:bg-blue-700">
                            <Eye size={18}/> Preview & Submit
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left w-1/4">Subject</th>
                                {['note','cw','hw','test','ca','exam'].map(f => (
                                    <th key={f} className="p-2 text-center uppercase text-xs text-gray-600">{f}<br/>({SCORE_LIMITS[f]})</th>
                                ))}
                                <th className="p-3 text-center w-20">Total</th>
                                <th className="p-3 text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map(s => {
                                const sc = scores[s.id] || {};
                                const total = ['note','cw','hw','test','ca','exam'].reduce((a,k) => a + (sc[`score_${k}`]||0), 0);
                                const { grade, remark } = calculateGrade(total);
                                return (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-700">{s.name}</td>
                                        {['note','cw','hw','test','ca','exam'].map(f => (
                                            <td key={f} className="p-2 text-center">
                                                <input 
                                                    type="number" 
                                                    disabled={isLocked}
                                                    className={`w-14 text-center border rounded p-1 ${isLocked ? 'bg-gray-100' : ''}`}
                                                    value={sc[`score_${f}`] === 0 ? '' : sc[`score_${f}`]}
                                                    placeholder="0"
                                                    onChange={(e) => updateScore(s.id, `score_${f}`, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="p-3 text-center font-bold text-blue-600">{total}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${grade.startsWith('A')?'bg-green-100 text-green-800':grade==='F'?'bg-red-100 text-red-800':'bg-gray-100'}`}>
                                                {grade}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18}/> Behavioral Traits</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {BEHAVIORAL_TRAITS.map(t => (
                                <div key={t}>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">{t}</label>
                                    <select 
                                        disabled={isLocked}
                                        className="w-full border rounded p-1.5 text-sm"
                                        value={behaviors[t] || 'Good'}
                                        onChange={(e) => {
                                            setBehaviors(p => ({...p, [t]: e.target.value}));
                                            save();
                                        }}
                                    >
                                        {RATINGS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow h-fit">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><FileText size={18}/> Tutor's Comment</h3>
                        <textarea 
                            disabled={isLocked}
                            className="w-full border rounded p-3 h-32 text-sm"
                            placeholder="Enter a comprehensive remark about the student's performance..."
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value);
                                save();
                            }}
                        />
                        {isLocked && <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Result submitted/approved. Editing disabled.</p>}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// 3. AUTH & PARENT PORTAL
const Auth = ({ onLogin, onParent }) => {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', name: '', pin: '', schoolCode: '' });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'central') {
                if (form.email === 'oluwatoyin' && form.password === 'Funmilola') onLogin({ role: 'central' });
                else window.alert('Invalid Admin Credentials');
            } 
            else if (mode === 'register') {
                if (form.pin) { 
                    const { data: pinData } = await supabase.from('subscription_pins').select('*').eq('code', form.pin).eq('is_used', false).single();
                    if (!pinData) throw new Error('Invalid PIN');

                    const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
                    if(!user) throw new Error("Signup failed");

                    const { data: school } = await supabase.from('schools').insert({
                        owner_id: user.id, name: 'My School', max_students: pinData.student_limit
                    }).select().single();

                    await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: school.id });
                    await supabase.from('subscription_pins').update({ is_used: true }).eq('id', pinData.id);
                    window.alert("School Created! Login now."); setMode('login');
                } 
                else {
                     const { data: sch } = await supabase.from('schools').select('id').eq('id', form.schoolCode).single();
                     if (!sch) throw new Error('Invalid School Code');
                     const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
                     await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: sch.id });
                     window.alert("Teacher Registered! Login now."); setMode('login');
                }
            } 
            else {
                const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (error) throw error;
            }
        } catch (err) { window.alert(err.message); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                <div className="text-center mb-6">
                    <School className="mx-auto text-blue-600 mb-2" size={48} />
                    <h1 className="text-2xl font-bold">Springforth Results</h1>
                </div>
                <div className="flex justify-center gap-6 mb-6 text-sm font-bold border-b pb-2">
                    {['login', 'register', 'central'].map(m => (
                        <button key={m} onClick={()=>setMode(m)} className={`capitalize ${mode===m ? 'text-blue-600' : 'text-gray-400'}`}>{m}</button>
                    ))}
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'register' && <input placeholder="Full Name" className="w-full p-3 border rounded" required onChange={e=>setForm({...form, name:e.target.value})} />}
                    <input placeholder={mode==='central'?'Username':'Email'} className="w-full p-3 border rounded" required onChange={e=>setForm({...form, email:e.target.value})} />
                    <input type="password" placeholder="Password" className="w-full p-3 border rounded" required onChange={e=>setForm({...form, password:e.target.value})} />
                    
                    {mode === 'register' && (
                        <div className="pt-2 border-t mt-2">
                            <p className="text-xs text-gray-500 mb-2 text-center">Fill ONLY one below</p>
                            <input placeholder="Subscription PIN (For School Owners)" className="w-full p-2 border border-orange-200 bg-orange-50 rounded mb-2 text-sm" onChange={e=>setForm({...form, pin:e.target.value, schoolCode: ''})} />
                            <div className="text-center text-xs text-gray-400">- OR -</div>
                            <input placeholder="School ID Code (For Teachers)" className="w-full p-2 border border-blue-200 bg-blue-50 rounded mt-2 text-sm" onChange={e=>setForm({...form, schoolCode:e.target.value, pin: ''})} />
                        </div>
                    )}

                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : mode === 'register' ? 'Create Account' : 'Login'}
                    </button>
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
        const { data: stu, error } = await supabase.from('students')
            .select('*, schools(*), classes(*), comments(*), results(*, subjects(*))')
            .eq('admission_no', creds.adm).eq('parent_pin', creds.pin).single();

        if (error || !stu) return window.alert('Invalid Admission No or PIN');

        if (!stu.comments?.[0]?.principal_comment) return window.alert('Result not yet approved by Principal.');

        const processed = stu.results.map(r => ({
            ...r,
            total: (r.score_note||0)+(r.score_cw||0)+(r.score_hw||0)+(r.score_test||0)+(r.score_ca||0)+(r.score_exam||0)
        }));

        setData({
            student: stu, school: stu.schools, classInfo: stu.classes,
            results: processed, comments: stu.comments[0],
            behaviors: JSON.parse(stu.comments[0].behaviors || '[]').map(k => ({ trait: k, rating: 'Good' })) 
        });
    };

    if (data) return (
        <div className="h-screen flex flex-col bg-gray-100">
            <div className="bg-white p-4 shadow flex justify-between items-center">
                <button onClick={()=>setData(null)} className="flex items-center gap-2"><X /> Back</button>
                <h2 className="font-bold">{data.student.name}</h2>
                <PDFDownloadLink document={<ResultPDF {...data} />} fileName="Result.pdf">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Download /> Download</button>
                </PDFDownloadLink>
            </div>
            <PDFViewer className="flex-1"><ResultPDF {...data} /></PDFViewer>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50">
            <form onSubmit={fetchResult} className="bg-white p-8 rounded-xl shadow-xl w-96 space-y-4">
                <h2 className="text-xl font-bold text-center mb-4">Parent Portal</h2>
                <input placeholder="Admission Number" className="w-full p-3 border rounded" onChange={e=>setCreds({...creds, adm:e.target.value})} required />
                <input type="password" placeholder="Parent PIN" className="w-full p-3 border rounded" onChange={e=>setCreds({...creds, pin:e.target.value})} required />
                <button className="w-full bg-green-600 text-white py-3 rounded font-bold">Check Result</button>
                <button type="button" onClick={onBack} className="w-full text-center text-sm text-gray-500">Back to Home</button>
            </form>
        </div>
    );
};

// 5. CENTRAL ADMIN (Kept Simple)
const CentralAdmin = ({ onLogout }) => {
    const [pins, setPins] = useState([]);
    const generate = async () => {
        const code = `SUB-${Math.floor(Math.random()*90000)}`;
        await supabase.from('subscription_pins').insert({ code, duration_months: 12, student_limit: 200 });
        fetchPins();
    };
    const fetchPins = async () => {
        const { data } = await supabase.from('subscription_pins').select('*').order('created_at',{ascending:false});
        setPins(data||[]);
    }
    useEffect(()=>{fetchPins()},[]);
    return (
        <div className="p-8 bg-slate-900 min-h-screen text-white">
            <div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">Central Admin</h1><button onClick={onLogout} className="text-red-400">Logout</button></div>
            <button onClick={generate} className="bg-blue-600 px-6 py-3 rounded font-bold mb-6">Generate New PIN</button>
            <div className="space-y-2">
                {pins.map(p=>(<div key={p.id} className="bg-slate-800 p-4 rounded flex justify-between"><span>{p.code}</span><span>{p.is_used?'USED':'ACTIVE'}</span></div>))}
            </div>
        </div>
    );
};

// ==================== APP ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setProfile(null); setView('auth'); }
    });
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    }
  }, [session]);

  if (view === 'central') return <CentralAdmin onLogout={() => setView('auth')} />;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  
  if (!session) return <Auth onLogin={(d) => setView(d.role === 'central' ? 'central' : 'dashboard')} onParent={() => setView('parent')} />;
  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40}/></div>;

  return profile.role === 'admin' 
    ? <SchoolAdmin profile={profile} onLogout={() => supabase.auth.signOut()} />
    : <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;

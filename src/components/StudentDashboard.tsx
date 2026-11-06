"use client";
import Link from "next/link";
import Image from "next/image";
import { startTransition,useCallback,useEffect,useState } from "react";
import FeePanel from "@/components/FeePanel";
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, CreditCard, FileBadge, FileText, GraduationCap, IdCard, LayoutDashboard, LogOut, Megaphone, Printer, RefreshCw, Send, ShieldCheck, UserRound } from "lucide-react";

type Student={id:number;studentId:string;firstName:string|null;lastName:string|null;fatherName:string|null;motherName:string|null;dob:string|null;gender:string|null;mobile:string|null;email:string|null;address:string|null;city:string|null;state:string|null;pinCode:string|null;qualification:string|null;programName:string|null;courseName:string;courseDuration:string|null;universityName:string;universityShortName:string|null;studyMode:string|null;studentStatus:string|null;admissionDate:string|null;enrollmentNumber:string|null;documentStatus:string|null;certificateStatus:string|null;applicationId:string|null;emergencyContactName:string|null;emergencyContactMobile:string|null};
type ClassRow={id:number;title:string;description:string|null;instructor:string|null;scheduledAt:string;durationMinutes:number|null;meetingUrl:string|null;recordingUrl:string|null;status:string};
type ExamRow={id:number;title:string;examCode:string;startsAt:string|null;endsAt:string|null;durationMinutes:number;totalMarks:number;attempt:{attemptStatus:string;score:string|null;resultStatus:string|null}|null};
type ResultRow={id:number;examination:string;semester:string|null;subject:string;maxMarks:string;marksObtained:string;grade:string|null;resultStatus:string;remarks:string|null};
type DocumentRow={id:number;documentType:string;fileName:string|null;verificationStatus:string|null;uploadedAt:string|null;rejectionReason:string|null;hasFile:boolean};
type ServiceRow={id:number;serviceType:string;status:string|null;requestedAt:string;notes:string|null;remarks:string|null;referenceNumber:string|null};
type AttendanceRow={id:number;attendanceDate:string;status:string;notes:string|null};
type NoticeRow={id:number;title:string;body:string;postedAt:string};
type Portal={student:Student;classes:ClassRow[];exams:ExamRow[];results:ResultRow[];services:ServiceRow[];documents:DocumentRow[];attendance:AttendanceRow[];attendanceSummary:{registered:number;present:number;absent:number;excused:number};notices:NoticeRow[]};
type Tab="overview"|"id"|"profile"|"academics"|"attendance"|"results"|"documents"|"fees"|"requests"|"notices";
const nav:{id:Tab;label:string;icon:typeof LayoutDashboard}[]=[
 {id:"overview",label:"Dashboard",icon:LayoutDashboard},{id:"id",label:"My ID Card",icon:IdCard},
 {id:"profile",label:"My Profile",icon:UserRound},{id:"academics",label:"Classes & Exams",icon:BookOpen},
 {id:"attendance",label:"Attendance",icon:CalendarDays},{id:"results",label:"Results",icon:GraduationCap},
 {id:"documents",label:"Documents",icon:FileText},{id:"fees",label:"Fees & Receipts",icon:CreditCard},
 {id:"requests",label:"Student Services",icon:ClipboardList},{id:"notices",label:"Notices",icon:Megaphone}
];
const serviceTypes=["ID Card / Correction","Bonafide Certificate","Transfer Certificate","Fee Clarification","Document Verification","Academic Support","Other"];
const docTypes=["Photo","Aadhaar / Identity","10th Marksheet","12th Marksheet","Graduation Marksheet","Other"];
const input="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";
const card="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
function niceDate(value:string|null|undefined){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?value:d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function niceTime(value:string|null|undefined){if(!value)return "Schedule pending";const d=new Date(value);return Number.isNaN(d.getTime())?value:d.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});}
function fullName(s:Student){return [s.firstName,s.lastName].filter(Boolean).join(" ")||"Student";}
function Empty({title,detail}:{title:string;detail:string}){return <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><p className="font-semibold text-slate-900">{title}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>;}
function Title({label,description}:{label:string;description:string}){return <header className="mb-6"><h2 className="text-2xl font-bold tracking-tight text-slate-950">{label}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></header>;}
function Field({label,value}:{label:string;value:string|null|undefined}){return <div className="border-b border-slate-100 py-3"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{value||"Not provided"}</dd></div>;}

function IdentityCard({s,photoId}:{s:Student;photoId:number|null}){
 const initials=[s.firstName?.[0],s.lastName?.[0]].filter(Boolean).join("").toUpperCase()||"AI";
 return <section>
  <Title label="Digital Student ID Card" description="Print or save as PDF. Your current enrollment record is displayed directly from AIIT."/>
  <div id="student-print-card" className="mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-xl">
   <div className="flex items-center gap-3 bg-[#123a78] px-6 py-5 text-white">
    <Image src="/images/aiit-logo.png" width={46} height={46} alt="AIIT College logo" className="h-12 w-12 rounded-full bg-white object-contain p-1"/>
    <div><p className="text-lg font-bold leading-tight">AIIT College</p><p className="text-[10px] uppercase tracking-[.09em] text-blue-100">Aryabhatta Institute of Information Technology</p><p className="mt-0.5 text-[10px] text-blue-100">Gharghoda · Raigarh · Chhattisgarh</p></div>
   </div>
   <div className="px-6 py-6">
    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">Student identity · Digital record</p>
    <div className="mt-5 flex gap-5">
     <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-3xl font-bold text-slate-500">{photoId ? <Image unoptimized src={"/api/student/documents/"+photoId} alt="Verified student photograph" width={80} height={96} className="h-full w-full object-cover"/> : initials}</div>
     <div className="min-w-0"><p className="break-words text-xl font-bold">{fullName(s)}</p><p className="mt-1 text-xs text-slate-500">Student ID</p><p className="break-all text-sm font-bold text-blue-800">{s.studentId}</p><p className="mt-2 text-xs text-slate-600">{s.studentStatus||"Status unavailable"}</p></div>
    </div>
    <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-200 pt-5 text-sm">
     <div><dt className="text-[10px] uppercase text-slate-500">Course</dt><dd className="mt-1 break-words font-semibold">{s.courseName}</dd></div>
     <div><dt className="text-[10px] uppercase text-slate-500">University</dt><dd className="mt-1 break-words font-semibold">{s.universityShortName||s.universityName}</dd></div>
     <div><dt className="text-[10px] uppercase text-slate-500">Enrollment No.</dt><dd className="mt-1 break-words font-semibold">{s.enrollmentNumber||"Pending"}</dd></div>
     <div><dt className="text-[10px] uppercase text-slate-500">Admission Date</dt><dd className="mt-1 font-semibold">{niceDate(s.admissionDate)}</dd></div>
    </dl>
   </div>
   <footer className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-[10px] text-slate-500">For AIIT identification. Subject to verification with the college office. Not a university-issued certificate.</footer>
  </div>
  <div className="mx-auto mt-6 flex max-w-[520px] gap-3">
   <button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white"><Printer size={16}/> Print / Save as PDF</button>
   <Link href="/contact" className="rounded-lg border px-5 py-3 text-sm font-medium text-slate-700">Request correction</Link>
  </div>
  <style>{`@media print { @page{size:auto;margin:14mm} body *{visibility:hidden!important} #student-print-card,#student-print-card *{visibility:visible!important} #student-print-card{position:absolute;left:5mm;top:5mm;width:90mm;box-shadow:none!important;print-color-adjust:exact;-webkit-print-color-adjust:exact} }`}</style>
 </section>;
}

export default function StudentDashboard(){
 const [data,setData]=useState<Portal|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState<Tab>("overview");
 const [login,setLogin]=useState({mobile:"",dob:""}),[loginBusy,setLoginBusy]=useState(false);
 const [service,setService]=useState({type:serviceTypes[0],message:""}),[serviceBusy,setServiceBusy]=useState(false);
 const [docType,setDocType]=useState(docTypes[0]),[file,setFile]=useState<File|null>(null),[uploadBusy,setUploadBusy]=useState(false),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  try{
   const res=await fetch("/api/student/portal",{cache:"no-store"});
   if(res.status===401){setData(null);setError("");return;}
   const result=await res.json();
   if(!res.ok)throw new Error(result.error||"Unable to load student details.");
   setData(result);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Could not load your dashboard.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{startTransition(()=>{void load();});},[load]);
 async function signIn(e:React.FormEvent){e.preventDefault();setLoginBusy(true);setError("");
  try{const res=await fetch("/api/student/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(login)});const json=await res.json();if(!res.ok)throw new Error(json.error||"Sign-in failed");setLogin({mobile:"",dob:""});await load();}
  catch(e){setError(e instanceof Error?e.message:"Sign-in failed");}finally{setLoginBusy(false);}
 }
 async function signOut(){await fetch("/api/student/logout",{method:"POST"});setData(null);setTab("overview");setLogin({studentId:"",mobile:"",dob:""});}
 async function submitRequest(e:React.FormEvent){e.preventDefault();setServiceBusy(true);setNotice("");try{
  const r=await fetch("/api/student/requests",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(service)});
  const body=await r.json();if(!r.ok)throw new Error(body.error||"Request failed");
  setService({type:serviceTypes[0],message:""});setNotice("Request submitted to the college office.");await load();
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to send request.");}finally{setServiceBusy(false);}}
 async function upload(e:React.FormEvent){e.preventDefault();if(!file)return;setUploadBusy(true);setNotice("");try{
  const form=new FormData();form.append("type",docType);form.append("file",file);
  const r=await fetch("/api/student/documents",{method:"POST",body:form});const body=await r.json();
  if(!r.ok)throw new Error(body.error||"Upload failed.");setFile(null);setNotice("Document submitted for verification.");await load();
 }catch(e){setNotice(e instanceof Error?e.message:"Upload failed");}finally{setUploadBusy(false);}}
 if(loading)return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Loading your student portal…</div>;
 if(!data)return <main className="min-h-screen bg-[#f5f7fb] px-4 py-12">
  <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
   <Link href="/" className="flex items-center gap-3"><Image src="/images/aiit-logo.png" alt="AIIT" width={45} height={45}/><span className="text-lg font-bold text-slate-900">AIIT College</span></Link>
   <p className="mt-9 text-xs font-bold uppercase tracking-[.2em] text-blue-700">Student portal</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome back.</h1>
   <p className="mt-2 text-sm leading-6 text-slate-500">Sign in using your registered mobile number and date of birth. No Student ID needed.</p>
   {error&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
   <form onSubmit={signIn} className="mt-7 space-y-4">
    <label className="block text-sm font-medium text-slate-700">Registered mobile number<input className={input+" mt-2"} required autoComplete="tel-national" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} value={login.mobile} onChange={e=>setLogin({...login,mobile:e.target.value})} placeholder="10-digit number"/></label>
    <label className="block text-sm font-medium text-slate-700">Date of birth<input className={input+" mt-2"} type="date" required value={login.dob} onChange={e=>setLogin({...login,dob:e.target.value})}/></label>
    <button disabled={loginBusy} className="w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loginBusy?"Verifying…":"Open Student Portal"}</button>
   </form><p className="mt-5 text-xs leading-5 text-slate-500">Not enrolled yet? Submit an admission application. If you cannot access your account, contact admissions to verify your registered mobile number.</p>
   <Link href="/admission" className="mt-4 inline-block text-sm font-semibold text-blue-700">Apply for admission</Link>
  </div></main>;
 const s=data.student;
 const tabs=(ids:Tab[])=>ids.map(id=>{const t=nav.find(n=>n.id===id)!;const Icon=t.icon;return <button key={id} onClick={()=>{setTab(id);setNotice("");}} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${tab===id?"bg-blue-700 text-white":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><span className="flex items-center gap-3"><Icon size={17}/>{t.label}</span><ChevronRight size={14} className={tab===id?"opacity-80":"opacity-30"}/></button>});
 const upcoming=data.classes.filter(c=>new Date(c.scheduledAt).getTime()>=Date.now()).sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime());
 const attendanceCount=data.attendance.filter(a=>a.status!=="EXCUSED").length;
 const percentage=attendanceCount?Math.round(100*data.attendanceSummary.present/attendanceCount):null;
 return <main className="min-h-screen bg-[#f4f6fa] text-slate-900">
   <div className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
     <Link href="/" className="flex items-center gap-3"><Image src="/images/aiit-logo.png" alt="AIIT" width={38} height={38}/><span><strong className="block text-sm">AIIT College</strong><span className="text-[10px] text-slate-500">STUDENT CAMPUS</span></span></Link>
     <div className="flex items-center gap-2"><span className="hidden text-sm text-slate-600 sm:block">{s.studentId}</span><button onClick={()=>void load()} title="Refresh" className="rounded-lg border p-2 text-slate-600"><RefreshCw size={17}/></button><button onClick={()=>void signOut()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"><LogOut size={16}/> Sign out</button></div>
   </div></div>
   <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 lg:grid-cols-[235px_minmax(0,1fr)]">
    <aside className="hidden lg:block"><div className="sticky top-6 rounded-2xl border bg-white p-3 shadow-sm">{tabs(nav.map(n=>n.id))}<div className="mt-4 border-t px-3 pt-4 text-xs text-slate-500">Questions? <Link className="font-semibold text-blue-700" href="/contact">Contact the office</Link></div></div></aside>
    <div className="min-w-0">
     <nav aria-label="Student portal navigation" className="mb-6 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2 lg:hidden">{nav.map(({id,label})=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${tab===id?"bg-blue-700 text-white":"text-slate-600"}`}>{label}</button>)}</nav>
     {error&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
     {notice&&<p role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{notice}</p>}
     {tab==="overview"&&<>
      <div className="mb-6 rounded-2xl bg-[#123a78] px-6 py-7 text-white md:px-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">My AIIT campus</p><h1 className="mt-2 text-3xl font-bold">Hello, {s.firstName||"Student"}.</h1><p className="mt-2 text-sm text-blue-100">{s.courseName} · {s.universityShortName||s.universityName}</p><p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Enrollment: {s.studentStatus||"Not specified"}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
       {[{label:"Student ID",value:s.studentId,tab:"id" as Tab},{label:"Attendance",value:percentage===null?"Not recorded":percentage+"%",tab:"attendance" as Tab},{label:"Published results",value:String(data.results.length),tab:"results" as Tab},{label:"Pending requests",value:String(data.services.filter(x=>x.status==="PENDING"||x.status==="IN PROGRESS").length),tab:"requests" as Tab}].map(k=><button key={k.label} onClick={()=>setTab(k.tab)} className={card+" text-left hover:border-blue-300"}><p className="text-xs font-medium text-slate-500">{k.label}</p><p className="mt-3 break-all text-xl font-bold">{k.value}</p></button>)}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
       <section className={card}><h3 className="font-bold">Next class</h3>{upcoming[0]?<div className="mt-4"><p className="text-lg font-semibold">{upcoming[0].title}</p><p className="mt-2 text-sm text-slate-500">{niceTime(upcoming[0].scheduledAt)}</p><button onClick={()=>setTab("academics")} className="mt-4 text-sm font-semibold text-blue-700">View classes →</button></div>:<p className="mt-4 text-sm text-slate-500">No future classes published.</p>}</section>
       <section className={card}><h3 className="font-bold">Latest notice</h3>{data.notices[0]?<div className="mt-4"><p className="text-lg font-semibold">{data.notices[0].title}</p><p className="mt-2 line-clamp-2 text-sm text-slate-500">{data.notices[0].body}</p><button onClick={()=>setTab("notices")} className="mt-4 text-sm font-semibold text-blue-700">Read notices →</button></div>:<p className="mt-4 text-sm text-slate-500">No announcements published.</p>}</section>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{[{id:"id" as Tab,title:"View student ID",detail:"Print or save your digital identity"},{id:"fees" as Tab,title:"Pay course fees",detail:"Any semester, any time"},{id:"documents" as Tab,title:"Manage documents",detail:"Upload and check verification"},{id:"requests" as Tab,title:"Request a service",detail:"Certificates, corrections and support"}].map(k=><button key={k.id} onClick={()=>setTab(k.id)} className={card+" text-left hover:border-blue-300"}><p className="font-semibold">{k.title}</p><p className="mt-1 text-xs text-slate-500">{k.detail}</p></button>)}</div>
     </>}
     {tab==="id"&&<IdentityCard s={s} photoId={data.documents.find(d=>d.documentType==="Photo"&&d.verificationStatus==="VERIFIED"&&d.hasFile)?.id||null}/>}
     {tab==="profile"&&<><Title label="My Profile" description="Official enrollment details maintained by the admissions office."/><dl className={card+" grid gap-x-6 sm:grid-cols-2"}>{[["Student ID",s.studentId],["Full name",fullName(s)],["Father's name",s.fatherName],["Mother's name",s.motherName],["Date of birth",niceDate(s.dob)],["Gender",s.gender],["Mobile",s.mobile],["Email",s.email],["Address",[s.address,s.city,s.state,s.pinCode].filter(Boolean).join(", ")],["Course",s.courseName],["University",s.universityName],["Study mode",s.studyMode],["Enrollment number",s.enrollmentNumber],["Admission date",niceDate(s.admissionDate)],["Qualification",s.qualification],["Emergency contact",s.emergencyContactName],["Emergency mobile",s.emergencyContactMobile],["Document status",s.documentStatus]].map(([label,value])=><Field key={label} label={label||""} value={value}/>)}</dl><button onClick={()=>{setTab("requests");setService({type:"ID Card / Correction",message:""});}} className="mt-4 text-sm font-semibold text-blue-700">Request a correction →</button></>}
     {tab==="academics"&&<><Title label="Classes & Online Exams" description="Your course's sessions, recordings and published assessments."/>
      <h3 className="mb-3 text-lg font-bold">Online classes</h3><div className="grid gap-3 md:grid-cols-2">{data.classes.length?data.classes.map(c=><article key={c.id} className={card}><p className="text-xs font-semibold uppercase text-blue-700">{c.status}</p><h4 className="mt-2 text-lg font-bold">{c.title}</h4><p className="mt-2 text-sm text-slate-500">{niceTime(c.scheduledAt)} · {c.durationMinutes||60} min</p>{c.instructor&&<p className="mt-2 text-sm">Instructor: {c.instructor}</p>}<p className="mt-2 text-sm text-slate-600">{c.description}</p><div className="mt-4 flex gap-3">{c.meetingUrl&&<a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700">Join class</a>}{c.recordingUrl&&<a href={c.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700">Recording</a>}</div></article>):<div className="md:col-span-2"><Empty title="No classes yet" detail="Classes assigned to your course will appear here."/></div>}</div>
      <h3 className="mb-3 mt-8 text-lg font-bold">Online exams</h3>{data.exams.length?<div className="space-y-3">{data.exams.map(e=><div key={e.id} className={card+" flex flex-wrap items-center justify-between gap-3"}><div><p className="text-xs font-semibold text-blue-700">{e.examCode}</p><h4 className="mt-1 font-bold">{e.title}</h4><p className="mt-1 text-xs text-slate-500">{e.durationMinutes} minutes · {e.totalMarks} marks · {e.startsAt?niceTime(e.startsAt):"Open schedule"}</p></div><div className="text-sm">{e.attempt?.attemptStatus==="SUBMITTED"?<span className="font-semibold text-green-700">Submitted · {e.attempt.score} marks</span>:<Link href="/online-exams" className="inline-block rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">Open exam</Link>}</div></div>)}</div>:<Empty title="No published exams" detail="Your exams will appear when released by the academic team."/>}</>}
     {tab==="attendance"&&<><Title label="My Attendance" description="Daily records entered by AIIT staff. Missing records are not treated as absences."/><div className="grid gap-3 sm:grid-cols-3">{[["Recorded days",String(data.attendanceSummary.registered)],["Present / Late",String(data.attendanceSummary.present)],["Attendance rate",percentage===null?"Not available":percentage+"%"]].map(([label,value])=><div key={label} className={card}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>{data.attendance.length?<div className={card+" mt-5 overflow-x-auto"}><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3">Date</th><th>Status</th><th>Notes</th></tr></thead><tbody>{data.attendance.map(a=><tr key={a.id} className="border-b last:border-0"><td className="py-3">{niceDate(a.attendanceDate)}</td><td className="font-semibold">{a.status}</td><td>{a.notes||"—"}</td></tr>)}</tbody></table></div>:<div className="mt-5"><Empty title="Attendance not recorded yet" detail="Only staff-marked attendance appears here."/></div>}</>}
     {tab==="results"&&<><Title label="Examination Results" description="Published academic results only. Unpublished marks are never shown."/>{data.results.length?<div className={card+" overflow-x-auto"}><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500">{["Exam","Semester","Subject","Marks","Grade","Status"].map(k=><th key={k} className="p-3">{k}</th>)}</tr></thead><tbody>{data.results.map(r=><tr key={r.id} className="border-b last:border-0"><td className="p-3 font-medium">{r.examination}</td><td className="p-3">{r.semester||"—"}</td><td className="p-3">{r.subject}</td><td className="p-3 font-semibold">{r.marksObtained}/{r.maxMarks}</td><td className="p-3">{r.grade||"—"}</td><td className="p-3">{r.resultStatus}</td></tr>)}</tbody></table></div>:<Empty title="No results published yet" detail="Only verified, published results will be displayed."/>}</>}
     {tab==="documents"&&<><Title label="My Documents" description="Upload files to the private college document store. Staff verification is required."/>
      <form onSubmit={upload} className={card+" mb-5 space-y-4"}><h3 className="font-bold">Upload a document</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Document category<select className={input+" mt-2"} value={docType} onChange={e=>setDocType(e.target.value)}>{docTypes.map(t=><option key={t}>{t}</option>)}</select></label><label className="text-sm font-medium">Select PDF / JPEG / PNG (max 5 MB)<input className={input+" mt-2"} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div><button disabled={!file||uploadBusy} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{uploadBusy?"Uploading…":"Upload for verification"}</button></form>
      {data.documents.length?<div className="space-y-3">{data.documents.map(d=><div key={d.id} className={card+" flex flex-wrap items-center justify-between gap-3"}><div><p className="font-semibold">{d.documentType}</p><p className="mt-1 text-xs text-slate-500">{d.fileName} · {d.verificationStatus||"Pending"} · {niceDate(d.uploadedAt)}</p>{d.rejectionReason&&<p className="mt-2 text-xs text-red-700">Review note: {d.rejectionReason}</p>}</div>{d.hasFile&&<a href={`/api/student/documents/${d.id}`} className="rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700">View file</a>}</div>)}</div>:<Empty title="No documents uploaded" detail="Uploaded documents and verification updates will appear here."/>}</>}
     {tab==="fees"&&<><Title label="Fees & Payment Receipts" description="Pay any semester when convenient. View verified balances and receipts."/><FeePanel/></>}
     {tab==="requests"&&<><Title label="Student Services" description="Request a certificate, correction, document review or academic assistance."/>
      <form onSubmit={submitRequest} className={card+" mb-5 space-y-4"}><h3 className="font-bold">New service request</h3><label className="block text-sm font-medium">Request type<select className={input+" mt-2"} value={service.type} onChange={e=>setService({...service,type:e.target.value})}>{serviceTypes.map(t=><option key={t}>{t}</option>)}</select></label><label className="block text-sm font-medium">Describe your request<textarea className={input+" mt-2"} rows={4} required minLength={10} maxLength={1000} value={service.message} onChange={e=>setService({...service,message:e.target.value})} placeholder="Explain what you need from the college office."/></label><button disabled={serviceBusy} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={16}/>{serviceBusy?"Submitting…":"Submit request"}</button></form>
      <h3 className="mb-3 font-bold">Request history</h3>{data.services.length?<div className="space-y-3">{data.services.map(r=><div key={r.id} className={card}><div className="flex flex-wrap justify-between gap-3"><p className="font-semibold">{r.serviceType}</p><span className="text-xs font-bold text-blue-700">{r.status||"PENDING"}</span></div><p className="mt-1 text-xs text-slate-500">{niceTime(r.requestedAt)}</p><p className="mt-3 text-sm text-slate-700">{r.notes}</p>{r.remarks&&<p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">College response: {r.remarks}</p>}</div>)}</div>:<Empty title="No requests yet" detail="Requests are tracked here after submission."/>}</>}
     {tab==="notices"&&<><Title label="College Notices" description="Updates published for all students or your course."/>{data.notices.length?<div className="space-y-3">{data.notices.map(n=><article key={n.id} className={card}><p className="text-xs font-semibold text-blue-700">{niceDate(n.postedAt)}</p><h3 className="mt-2 text-lg font-bold">{n.title}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{n.body}</p></article>)}</div>:<Empty title="No published notices" detail="Announcements from the college office will appear here."/>}</>}
    </div>
   </div>
 </main>;
}

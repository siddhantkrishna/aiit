"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
type Person={id:number;studentId:string;firstName:string|null;lastName:string|null;courseId:number|null;programName:string|null;studentStatus:string|null};
type RecordRow={studentId:number;status:string};
type ResponseData={date:string;students:Person[];courses:Array<{id:number;name:string}>;records:RecordRow[]};
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const input="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const statuses=["PRESENT","ABSENT","LATE","EXCUSED"] as const;
export default function StudentAttendanceAdmin(){
 const [day,setDay]=useState(today()),[data,setData]=useState<ResponseData|null>(null),[marks,setMarks]=useState<Record<number,string>>({}),[course,setCourse]=useState("ALL");
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  try{const r=await fetch("/api/admin/student-attendance?date="+encodeURIComponent(day),{cache:"no-store"});const json=await r.json();
   if(!r.ok)throw new Error(json.error||"Could not load attendance");
   setData(json);setMarks(Object.fromEntries(json.records.map((x:RecordRow)=>[x.studentId,x.status])));setError("");
  }catch(e){setError(e instanceof Error?e.message:"Attendance unavailable");}
 },[day]);
 useEffect(()=>{void load();},[load]);
 const students=useMemo(()=>data?.students.filter(s=>s.studentStatus==="ACTIVE"&&(course==="ALL"||String(s.courseId)===course))||[],[data,course]);
 function bulk(status:string){setMarks(prev=>({...prev,...Object.fromEntries(students.map(s=>[s.id,status]))}));}
 async function save(){
  setBusy(true);setError("");setMessage("");
  try{
   const selected=students.filter(s=>statuses.some(x=>x===marks[s.id])).map(s=>({studentId:s.id,status:marks[s.id]}));
   if(!selected.length)throw new Error("Mark at least one student.");
   for(let i=0;i<selected.length;i+=100){const r=await fetch("/api/admin/student-attendance",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({date:day,records:selected.slice(i,i+100)})});const json=await r.json();if(!r.ok)throw new Error(json.error||"Could not save attendance");}
   setMessage("Saved attendance for "+selected.length+" students.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}finally{setBusy(false);}
 }
 return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Academic Operations</p><h1 className="mt-1 text-3xl font-bold">Student Attendance</h1><p className="mt-2 text-sm text-slate-500">Staff-recorded daily attendance. Students see only their own history.</p></header>
  <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-5"><label className="text-sm font-semibold">Attendance date<input type="date" value={day} max={today()} onChange={e=>setDay(e.target.value)} className={input+" mt-1 block"}/></label><label className="text-sm font-semibold">Course<select value={course} onChange={e=>setCourse(e.target.value)} className={input+" mt-1 block max-w-64"}><option value="ALL">All courses</option>{data?.courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <button onClick={()=>bulk("PRESENT")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Mark visible present</button><button onClick={()=>bulk("ABSENT")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Mark visible absent</button>
  <button disabled={busy||!day||day>today()} onClick={()=>void save()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Save attendance"}</button></div>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
  <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Attendance</th></tr></thead><tbody>{students.map(p=><tr key={p.id} className="border-b"><td className="p-3 font-semibold">{p.firstName} {p.lastName}<p className="text-xs font-normal text-slate-500">{p.studentId}</p></td><td className="p-3 text-slate-600">{data?.courses.find(c=>c.id===p.courseId)?.name||p.programName||"—"}</td><td className="p-3"><select className={input} value={marks[p.id]||""} onChange={e=>setMarks({...marks,[p.id]:e.target.value})}><option value="">Not marked</option>{statuses.map(status=><option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table>{!students.length&&<p className="p-7 text-sm text-slate-500">No active students in this selection.</p>}</div>
 </div>;
}
import { useState, useRef } from "react";
import { DUMMY_STUDENTS, Student } from "@/data/dummy";
import { Printer, Download, Search, Palette } from "lucide-react";

export default function IDCard() {
  const [selectedId, setSelectedId] = useState(DUMMY_STUDENTS[0].id);
  const [search, setSearch] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const student = DUMMY_STUDENTS.find(s => s.id === selectedId) || DUMMY_STUDENTS[0];

  const filtered = DUMMY_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">ID Card Generator</h1>
          <p className="text-sm text-muted-foreground font-body">Generate & print student ID cards</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Student Selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filtered.map(s => (
          <button key={s.id} onClick={() => setSelectedId(s.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-all border ${
              selectedId === s.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-display font-bold text-foreground text-xs">{s.name[0]}</span>
            {s.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* ID Card Preview */}
      <div className="flex justify-center">
        <div ref={cardRef} className="w-80 rounded-3xl overflow-hidden shadow-active border border-border print:shadow-none">
          {/* Card Header */}
          <div className="gradient-primary p-5 relative">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold text-primary-foreground text-sm leading-tight">Art Neelam Studio</h2>
                <p className="text-[10px] text-primary-foreground/80 font-body">Student Identity Card</p>
              </div>
            </div>
            <div className="absolute right-4 top-3 bottom-3 flex items-center">
              <div className="text-primary-foreground/10 font-display font-bold text-5xl leading-none">AN</div>
            </div>
          </div>

          {/* Card Body */}
          <div className="bg-card p-5">
            <div className="flex gap-4">
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="w-20 h-24 rounded-2xl bg-primary-soft border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-primary text-3xl">{student.name[0]}</span>
                  )}
                </div>
                {/* QR Placeholder */}
                <div className="w-20 h-20 mt-2 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5">
                    {Array(25).fill(0).map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${Math.random() > 0.5 ? "bg-foreground" : "bg-card"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground text-base leading-tight">{student.name}</h3>
                <div className="mt-2 space-y-1.5">
                  <InfoRow label="Roll No" value={student.rollNumber} highlight />
                  <InfoRow label="Course" value={student.course} />
                  <InfoRow label="Batch" value={student.batch} />
                  <InfoRow label="Enrolled" value={new Date(student.enrollmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} />
                  <InfoRow label="Valid Till" value={new Date(student.validityEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} />
                </div>
              </div>
            </div>

            {/* Contact Strip */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[9px] text-muted-foreground font-body text-center">
                If found, please return to Art Neelam Studio
              </p>
              <p className="text-[10px] font-semibold text-primary text-center font-body mt-0.5">
                📞 +91 {student.whatsapp}
              </p>
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-primary-soft px-5 py-2 flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-body">artneelam.studio</span>
            <span className="text-[9px] text-muted-foreground font-body">{student.rollNumber}</span>
          </div>
        </div>
      </div>

      {/* All Students Grid */}
      <div>
        <h3 className="font-display font-bold text-foreground text-base mb-3">All Students</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DUMMY_STUDENTS.map(s => (
            <div key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedId === s.id ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/50"
              }`}>
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-body text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground font-body">{s.rollNumber} • {s.course}</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-muted-foreground font-body w-12 flex-shrink-0">{label}</span>
      <span className={`text-[10px] font-semibold font-body ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

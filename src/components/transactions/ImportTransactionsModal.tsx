import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { classifyTransactions } from "@/lib/gemini";
import { parseStatementFile, ParsedTransaction } from "@/utils/fileParser";
import { useBudgetStore } from "@/data/useBudgetStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, UploadCloud, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function ImportTransactionsModal() {
  const [open, setOpen] = useState(false);
  const { data, addTransactions, addBucket } = useBudgetStore();
  const buckets = data.buckets.map(b => b.name);

  const [step, setStep] = useState<"upload" | "review" | "success">("upload");
  const [analyzingState, setAnalyzingState] = useState<"idle" | "reading" | "extracting" | "classifying" | "saving">("idle");
  const loading = analyzingState !== "idle";
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ensureBucketsExist = async (mapping: Record<string, string>) => {
    const uniqueBuckets = new Set(Object.values(mapping));
    const newBuckets = Array.from(uniqueBuckets).filter(b => b && b !== "Uncategorized" && !buckets.includes(b));
    
    if (newBuckets.length > 0 && addBucket) {
       // Create buckets in parallel (settled to avoid partial failures blocking all)
       await Promise.allSettled(newBuckets.map(b => addBucket(b)));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setAnalyzingState("reading");
    try {
      setAnalyzingState("extracting");
      const parsed = await parseStatementFile(acceptedFiles[0]);
      
      console.log('parsed AI transactional data ', parsed)
      // Auto-run AI Classification
      setAnalyzingState("classifying");
      const mapping = await classifyTransactions(
        parsed.map(t => ({ id: t.id, note: t.note, amount: t.amount })).filter(t => t.amount !== 0),
        buckets
      );
      
      // specific logic for onDrop to ensure buckets exist before setting state
      const uniqueBuckets = new Set(Object.values(mapping));
      const newBuckets = Array.from(uniqueBuckets).filter(b => b && b !== "Uncategorized" && !buckets.includes(b));
      if (newBuckets.length > 0 && addBucket) {
           await Promise.allSettled(newBuckets.map(b => addBucket(b)));
      }

      const classified = parsed.map(t => ({
         ...t,
         bucket: mapping[t.id] || "Uncategorized"
      }));

      setTransactions(classified);
      setSelectedIds(new Set(classified.map(t => t.id))); 
      setStep("review");
    } catch (err) {
      console.error("Parse error", err);
    } finally {
      setAnalyzingState("idle");
    }
  }, [buckets, addBucket]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
        'text/csv': ['.csv'], 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleAIClassify = async () => {
    setAnalyzingState("classifying");
      const toClassify = transactions.filter(t => selectedIds.has(t.id));
      const mapping = await classifyTransactions(
          toClassify.map(t => ({ id: t.id, note: t.note, amount: t.amount })), 
          buckets
      );
      
      await ensureBucketsExist(mapping);
      
      setTransactions(prev => prev.map(t => {
          if (mapping[t.id]) {
              return { ...t, bucket: mapping[t.id] };
          }
          return t;
      }));
      setAnalyzingState("idle");
  };

  const updateTransaction = (id: string, field: keyof ParsedTransaction, value: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
     setAnalyzingState("saving");
     try {
       // Simulate slight delay for UX
       await new Promise(r => setTimeout(r, 400));

       const toImport = transactions.filter(t => selectedIds.size === 0 ? false : selectedIds.has(t.id));
       if (toImport.length === 0) {
         setAnalyzingState("idle");
         return;
       }
       
       const payload = toImport.map((t) => ({
         amount: t.amount,
         note: t.note,
         bucket: t.bucket || "Uncategorized",
         occurredAt: t.date,
         type: t.type,
       }));

       // Wait for inserts + backend sync to complete before updating UI
       await addTransactions(payload);

       // Only show success after everything is done
       setAnalyzingState("idle");
       setStep("success");

       setTimeout(() => {
           setOpen(false);
           setStep("upload");
           setTransactions([]);
           setSelectedIds(new Set());
       }, 1500);
     } catch (err) {
       console.error("Import failed", err);
       alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
       setAnalyzingState("idle");
     }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full border border-border/50 hover:bg-muted/80 gap-2 h-12 flex items-center justify-center shadow-sm">
             <UploadCloud className="w-4 h-4" />
             <span className="text-sm font-medium">Import Statement</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col !bg-white dark:!bg-slate-950" style={{ backgroundColor: '#ffffff' }}>
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload your bank statement (CSV or Excel) to bulk import transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[400px] flex flex-col">
            {step === "upload" && (
                <div 
                    {...getRootProps()} 
                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${analyzingState === "idle" ? "cursor-pointer" : ""}
                        ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:bg-muted/50'}
                    `}
                >
                    <input {...getInputProps()} disabled={analyzingState !== "idle"} />
                    {analyzingState === "idle" ? (
                      <>
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 shadow-sm border border-border/50">
                            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-lg">
                            Drag & drop file here
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded border border-border/50 shadow-sm">.CSV</span>
                            <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded border border-border/50 shadow-sm">.XLSX</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full max-w-sm mt-4 p-6 bg-white dark:bg-slate-900 border border-border/50 shadow-sm rounded-2xl">
                         <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                             <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                             <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                         </div>
                         <h3 className="font-semibold text-lg mb-6">AI is analyzing your file</h3>
                         <div className="w-full flex flex-col gap-4">
                             {/* Reading Phase */}
                             <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border/30">
                                {analyzingState === "reading" ? <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                <span className={analyzingState === "reading" ? "text-primary font-medium text-sm" : "text-muted-foreground text-sm font-medium"}>Reading file contents...</span>
                             </div>
                             {/* Extracting Phase */}
                             <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border/30">
                                {analyzingState === "reading" ? <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0 mx-0.5" /> : analyzingState === "extracting" ? <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                <span className={analyzingState === "extracting" ? "text-primary font-medium text-sm" : "text-muted-foreground text-sm font-medium"}>Extracting valid transactions...</span>
                             </div>
                             {/* Classifying Phase */}
                             <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border/30">
                                {["idle", "reading", "extracting"].includes(analyzingState) ? <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0 mx-0.5" /> : analyzingState === "classifying" ? <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                <span className={analyzingState === "classifying" ? "text-primary font-medium text-sm" : "text-muted-foreground text-sm font-medium"}>Mapping to your buckets...</span>
                             </div>
                         </div>
                      </div>
                    )}
                </div>
            )}

            {step === "review" && (
                <div className="flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                {selectedIds.size} selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                                onClick={handleAIClassify}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                                AI Smart Classify
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border flex-1 overflow-hidden relative">
                        <div className="absolute inset-0 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                    <tr className="border-b text-left">
                                        <th className="p-3 w-10">
                                            <Checkbox 
                                                checked={selectedIds.size === transactions.length}
                                                onCheckedChange={(c) => setSelectedIds(c ? new Set(transactions.map(t => t.id)) : new Set())}
                                            />
                                        </th>
                                        <th className="p-3 font-medium text-muted-foreground w-32">Date</th>
                                        <th className="p-3 font-medium text-muted-foreground">Description</th>
                                        <th className="p-3 font-medium text-muted-foreground w-28 text-right">Amount</th>
                                        <th className="p-3 font-medium text-muted-foreground w-48">Bucket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map(t => (
                                        <tr key={t.id} className={`group ${!selectedIds.has(t.id) ? 'opacity-50 grayscale' : 'hover:bg-muted/20'}`}>
                                            <td className="p-3 text-center">
                                                <Checkbox 
                                                    checked={selectedIds.has(t.id)} 
                                                    onCheckedChange={() => toggleSelection(t.id)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input 
                                                    type="date"
                                                    value={t.date.split('T')[0]} 
                                                    onChange={e => updateTransaction(t.id, 'date', e.target.value)}
                                                    className="h-7 w-full px-1 py-0 bg-transparent border-transparent hover:border-input focus:border-primary"
                                                />
                                            </td>
                                            <td className="p-3">
                                                 <Input 
                                                    value={t.note} 
                                                    onChange={e => updateTransaction(t.id, 'note', e.target.value)}
                                                    className="h-7 w-full px-1 py-0 bg-transparent border-transparent hover:border-input focus:border-primary"
                                                />
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                <span className={t.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {t.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <Select value={t.bucket} onValueChange={v => updateTransaction(t.id, 'bucket', v)}>
                                                    <SelectTrigger className={`h-7 w-full ${!t.bucket ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}`}>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {buckets.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                        <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

             {step === "success" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-semibold">Import Successful!</h3>
                    <p className="text-muted-foreground">Your transactions have been added.</p>
                </div>
            )}
        </div>

        <DialogFooter className="mt-4">
             {step === 'review' && (
                 <>
                    <Button variant="ghost" onClick={() => setStep("upload")}>Back</Button>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Import {selectedIds.size} Transactions
                    </Button>
                 </>
             )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

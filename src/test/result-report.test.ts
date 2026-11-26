import { reportPdfBase64, resultVars, improvementsFor } from '@/exam/lib/resultReport';
import { test, expect } from 'vitest';

test('pdf', async () => {
  const r:any = { student: { id:'s', name:'Asha K', tabSwitchCount: 1, submissions: [] }, exam: { title:'Java Basics' },
    mcqs:[{id:'m1',question:'What is JVM?',options:['A machine','Java Virtual Machine','Compiler','IDE'],correctIndex:1,marks:1,category:'Java',explanation:'JVM runs bytecode.'}],
    mcqSubs:[{studentId:'s',mcqId:'m1',selectedIndex:0,isCorrect:false,marksAwarded:0}],
    fibs:[{id:'f1',sentence:'Java is ___ typed',answers:['statically'],marks:1}], fibSubs:[{studentId:'s',fibId:'f1',answers:['dynamic'],isCorrect:false,marksAwarded:0,maxMarks:1}],
    writings:[{id:'w1',title:'OOP',prompt:'Explain OOP',minWords:50,maxWords:200,marks:10}], writingSubs:[{studentId:'s',writingId:'w1',answerText:'OOP is objects.',wordCount:3,marksAwarded:2,maxMarks:10}],
    codingSubs:[{questionId:'q1',language:'python',code:'print(1)',passedPublic:1,totalPublic:2,passedPrivate:0,totalPrivate:2,marks:3,maxMarks:10,publicResults:[{passed:true,input:'1',expected:'1',got:'1'}]}],
    questions:[{id:'q1',title:'Sum',description:'Add numbers'}] };
  const b = await reportPdfBase64(r);
  expect(Buffer.from(b,'base64').toString('latin1').startsWith('%PDF')).toBe(true);
  expect(resultVars(r).score).toBe('5'); expect(resultVars(r).maxScore).toBe('22');
  expect(improvementsFor(r).length).toBeGreaterThan(2);
});

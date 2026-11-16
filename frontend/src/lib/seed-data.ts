import type { Application, CVArtifact, Interview } from './pb-types';

export const seedApplications: Application[] = [];

export const seedInterviews: Interview[] = [];

export const seedCVs: CVArtifact[] = [
  {id:'c1',version:'CV-DataAnalyst-v1',label:'Data Analyst & Tableau BI (Rizky)',targetRole:'Data Analyst / BI Specialist',atsScore:94,applications:0,responses:0,offers:0,isMaster:true},
  {id:'c2',version:'CV-TechConsultant-APM-v2',label:'Technical Consultant Analyst & APM (Dynatrace)',targetRole:'Technical Consultant Analyst / APM Engineer',atsScore:91,applications:0,responses:0,offers:0,isMaster:false},
  {id:'c3',version:'CV-SysAdmin-Cloud-v1',label:'System Engineer & Cloud Infrastructure',targetRole:'System Administrator / Cloud Infrastructure',atsScore:88,applications:0,responses:0,offers:0,isMaster:false}
];

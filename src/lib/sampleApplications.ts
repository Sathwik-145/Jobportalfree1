// Sample/demo registered student applications shown when DB is empty.
export interface SampleApp {
  id: string;
  status: string;
  created_at: string;
  resume_url: string | null;
  cover_letter: string | null;
  user_id: string;
  job_id: string;
  profiles: { full_name: string; email: string };
  jobs: { id: string; title: string; company: string };
}

const NAMES = [
  ["Aarav Sharma", "aarav.sharma@example.com"],
  ["Priya Mehta", "priya.mehta@example.com"],
  ["Rohan Verma", "rohan.verma@example.com"],
  ["Ananya Iyer", "ananya.iyer@example.com"],
  ["Vikram Singh", "vikram.singh@example.com"],
  ["Sneha Kapoor", "sneha.kapoor@example.com"],
  ["Karthik Reddy", "karthik.reddy@example.com"],
  ["Neha Joshi", "neha.joshi@example.com"],
  ["Arjun Nair", "arjun.nair@example.com"],
  ["Divya Pillai", "divya.pillai@example.com"],
  ["Rahul Bose", "rahul.bose@example.com"],
  ["Ishita Gupta", "ishita.gupta@example.com"],
  ["Aditya Rao", "aditya.rao@example.com"],
  ["Meera Krishnan", "meera.krishnan@example.com"],
  ["Siddharth Jain", "siddharth.jain@example.com"],
  ["Tanya Malhotra", "tanya.malhotra@example.com"],
  ["Yash Patel", "yash.patel@example.com"],
  ["Pooja Desai", "pooja.desai@example.com"],
  ["Manish Khanna", "manish.khanna@example.com"],
  ["Riya Chatterjee", "riya.chatterjee@example.com"],
  ["Harsh Agarwal", "harsh.agarwal@example.com"],
  ["Kavya Menon", "kavya.menon@example.com"],
  ["Nikhil Saxena", "nikhil.saxena@example.com"],
  ["Sanya Bhatia", "sanya.bhatia@example.com"],
];

const JOBS = [
  { id: "demo-job-1", title: "Frontend Developer", company: "Infosys" },
  { id: "demo-job-2", title: "Data Analyst", company: "TCS" },
  { id: "demo-job-3", title: "Backend Engineer", company: "Wipro" },
  { id: "demo-job-4", title: "Product Manager", company: "Flipkart" },
  { id: "demo-job-5", title: "UI/UX Designer", company: "Razorpay" },
  { id: "demo-job-6", title: "DevOps Engineer", company: "Zoho" },
  { id: "demo-job-7", title: "QA Engineer", company: "Capgemini" },
];

const STATUSES = ["applied", "applied", "applied", "reviewed", "reviewed", "shortlisted", "shortlisted", "selected", "rejected"];

export const SAMPLE_APPLICATIONS: SampleApp[] = NAMES.map(([name, email], i) => {
  const job = JOBS[i % JOBS.length];
  const status = STATUSES[i % STATUSES.length];
  const daysAgo = i + 1;
  const created = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `demo-${i + 1}`,
    status,
    created_at: created,
    resume_url: null,
    cover_letter: null,
    user_id: `demo-user-${i + 1}`,
    job_id: job.id,
    profiles: { full_name: name, email },
    jobs: { id: job.id, title: job.title, company: job.company },
  };
});

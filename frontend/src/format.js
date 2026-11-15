export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
export const EXPERIENCE_LEVELS = ['Fresher', 'Junior', 'Mid-level', 'Senior'];
export const APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected'
];

export function formatSalary(job) {
  if (!job.salaryMin && !job.salaryMax) return 'Not disclosed';
  const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
  if (job.salaryMin && job.salaryMax) return `${money(job.salaryMin)} – ${money(job.salaryMax)} / year`;
  return `${money(job.salaryMin || job.salaryMax)} / year`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

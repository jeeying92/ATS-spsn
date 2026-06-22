-- Seed data for Semipack Malaysia Sdn Bhd ATS
-- 3 Jobs
insert into public.jobs (id, title, slug, department, location, employment_type, salary_min, salary_max, description, requirements, benefits, status) values
(
  'a1111111-1111-1111-1111-111111111111',
  'Senior Process Engineer',
  'senior-process-engineer',
  'Engineering',
  'Nilai, Negeri Sembilan',
  'full_time',
  8000,
  12000,
  'We are looking for a Senior Process Engineer to optimize semiconductor packaging processes at our Nilai facility. You will lead process improvement initiatives, troubleshoot yield issues, and drive continuous improvement across our assembly and test operations.',
  '- Bachelor''s degree in Mechanical, Electrical, or Chemical Engineering\n- 5+ years experience in semiconductor packaging or similar manufacturing\n- Strong knowledge of wire bonding, die attach, and molding processes\n- Experience with SPC, DOE, and 8D problem-solving methodologies\n- Proficiency in data analysis tools (JMP, Minitab)\n- Excellent communication skills in English and Bahasa Malaysia',
  '- Competitive salary with annual bonus\n- Medical and dental coverage for employee and dependents\n- EPF and SOCSO contributions\n- Professional development allowance\n- Free parking and subsidized canteen\n- Career growth in a global semiconductor company',
  'published'
),
(
  'a2222222-2222-2222-2222-222222222222',
  'Quality Assurance Technician',
  'quality-assurance-technician',
  'Quality',
  'Nilai, Negeri Sembilan',
  'full_time',
  3500,
  5000,
  'Join our Quality team to ensure product excellence at Semipack Malaysia. You will perform inspections, maintain quality documentation, and support audit activities for our semiconductor packaging products.',
  '- Diploma or Degree in Engineering, Quality, or related field\n- 2+ years experience in QA within manufacturing environment\n- Familiarity with ISO 9001, IATF 16949, or ISO 14001\n- Knowledge of inspection tools (CMM, microscope, X-ray)\n- Understanding of SPC and control charts\n- Detail-oriented with strong documentation skills',
  '- Competitive salary with shift allowance\n- Medical and dental coverage\n- EPF and SOCSO contributions\n- Overtime opportunities\n- Training and certification support\n- Team building activities and company events',
  'published'
),
(
  'a3333333-3333-3333-3333-333333333333',
  'Production Supervisor',
  'production-supervisor',
  'Production',
  'Nilai, Negeri Sembilan',
  'full_time',
  5000,
  7500,
  'Lead a production team at our semiconductor packaging facility. You will manage daily production output, ensure safety compliance, coordinate with engineering for process improvements, and develop your team members.',
  '- Diploma or Degree in Engineering or Manufacturing\n- 3+ years supervisory experience in semiconductor or electronics manufacturing\n- Experience with lean manufacturing and 5S\n- Strong leadership and people management skills\n- Ability to work rotating shifts\n- Proficiency in English and Bahasa Malaysia',
  '- Competitive salary with shift and leadership allowance\n- Medical and dental coverage for employee and dependents\n- EPF and SOCSO contributions\n- Leadership development program\n- Performance-based bonus\n- Free parking and subsidized meals',
  'draft'
);

-- 5 Candidates
insert into public.candidates (id, name, email, phone, tags, source) values
(
  'c1111111-1111-1111-1111-111111111111',
  'Ahmad Rizal bin Ibrahim',
  'ahmad.rizal@email.com',
  '+60 12-345 6789',
  '{"engineering", "senior", "semiconductor"}',
  'website'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Siti Nurhaliza binti Mohd Yusof',
  'siti.nurhaliza@email.com',
  '+60 13-456 7890',
  '{"quality", "ISO", "inspection"}',
  'linkedin'
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Lee Wei Ming',
  'weiming.lee@email.com',
  '+60 16-789 0123',
  '{"engineering", "process", "wire-bonding"}',
  'referral'
),
(
  'c4444444-4444-4444-4444-444444444444',
  'Priya Devi a/p Rajan',
  'priya.devi@email.com',
  '+60 17-890 1234',
  '{"quality", "SPC", "audit"}',
  'jobstreet'
),
(
  'c5555555-5555-5555-5555-555555555555',
  'Tan Jia Hui',
  'jiahui.tan@email.com',
  '+60 11-234 5678',
  '{"production", "lean", "supervisor"}',
  'website'
);

-- Applications (linking candidates to jobs at various stages)
insert into public.applications (id, job_id, candidate_id, stage, cover_letter, applied_at, stage_changed_at) values
(
  'b1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  'interview_1',
  'I am excited to apply for the Senior Process Engineer role. With 7 years of experience in semiconductor packaging at a leading OSAT company, I bring deep expertise in wire bonding and die attach processes.',
  now() - interval '14 days',
  now() - interval '5 days'
),
(
  'b2222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'c2222222-2222-2222-2222-222222222222',
  'screened',
  'I am writing to express my interest in the QA Technician position. My 3 years of experience in ISO-certified manufacturing environments make me a strong candidate.',
  now() - interval '10 days',
  now() - interval '7 days'
),
(
  'b3333333-3333-3333-3333-333333333333',
  'a1111111-1111-1111-1111-111111111111',
  'c3333333-3333-3333-3333-333333333333',
  'applied',
  'I would like to apply for the Senior Process Engineer position. I have 5 years of hands-on experience with wire bonding processes.',
  now() - interval '3 days',
  now() - interval '3 days'
),
(
  'b4444444-4444-4444-4444-444444444444',
  'a2222222-2222-2222-2222-222222222222',
  'c4444444-4444-4444-4444-444444444444',
  'interview_2',
  'I am keen to join Semipack Malaysia as a QA Technician. My background in SPC and quality audits aligns well with this role.',
  now() - interval '21 days',
  now() - interval '3 days'
),
(
  'b5555555-5555-5555-5555-555555555555',
  'a1111111-1111-1111-1111-111111111111',
  'c5555555-5555-5555-5555-555555555555',
  'applied',
  'Although I am applying for the Senior Process Engineer role, my production supervisory experience gives me a unique perspective on process optimization.',
  now() - interval '2 days',
  now() - interval '2 days'
);

-- Sample interview for Ahmad (Interview 1 for Senior Process Engineer)
insert into public.interviews (application_id, interview_type, scheduled_at, duration_minutes, meeting_link, meeting_provider, interviewer_name, interviewer_email, score, feedback, completed) values
(
  'b1111111-1111-1111-1111-111111111111',
  'interview_1',
  now() + interval '2 days',
  60,
  'https://meet.google.com/abc-defg-hij',
  'google_meet',
  'Dr. Lim Chee Keong',
  'ck.lim@semipack.com.my',
  null,
  null,
  false
);

-- Sample completed interview for Priya (Interview 1, now on Interview 2)
insert into public.interviews (application_id, interview_type, scheduled_at, duration_minutes, meeting_link, meeting_provider, interviewer_name, interviewer_email, score, feedback, completed) values
(
  'b4444444-4444-4444-4444-444444444444',
  'interview_1',
  now() - interval '5 days',
  45,
  'https://zoom.us/j/123456789',
  'zoom',
  'Puan Rohana binti Ahmad',
  'rohana@semipack.com.my',
  4,
  'Strong candidate with excellent knowledge of SPC methodologies. Good communication skills. Recommend proceeding to Interview 2.',
  true
),
(
  'b4444444-4444-4444-4444-444444444444',
  'interview_2',
  now() + interval '3 days',
  60,
  'https://zoom.us/j/987654321',
  'zoom',
  'Mr. Raj Kumar',
  'raj.kumar@semipack.com.my',
  null,
  null,
  false
);

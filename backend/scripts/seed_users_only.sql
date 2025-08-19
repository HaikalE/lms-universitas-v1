-- Seed only the three essential user accounts

INSERT INTO public.users (id, email, password, "fullName", role, "isActive", "studentId", "lecturerId") VALUES
('ccd31bc2-17c9-4b96-8baa-347c7bcc3996', 'admin@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Administrator', 'admin', true, NULL, 'ADM001'),
('93739b43-c91b-486d-b4da-0d49eada1a7b', 'lecturer@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Dr. John Lecturer', 'lecturer', true, NULL, 'LEC001'),
('36515d7c-394d-4570-aaf1-9c1abc9a4618', 'student@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Jane Student', 'student', true, 'STD001', NULL);

--
-- PostgreSQL database dump
--

-- Dumped from database version 13.21 (Debian 13.21-1.pgdg120+1)
-- Dumped by pg_dump version 13.21 (Debian 13.21-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: announcements_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.announcements_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.announcements_priority_enum OWNER TO postgres;

--
-- Name: assignments_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.assignments_type_enum AS ENUM (
    'individual',
    'group',
    'quiz',
    'exam'
);


ALTER TYPE public.assignments_type_enum OWNER TO postgres;

--
-- Name: attendances_attendancetype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendances_attendancetype_enum AS ENUM (
    'manual',
    'video_completion',
    'qr_code',
    'location_based'
);


ALTER TYPE public.attendances_attendancetype_enum OWNER TO postgres;

--
-- Name: attendances_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendances_status_enum AS ENUM (
    'present',
    'absent',
    'auto_present',
    'excused',
    'late'
);


ALTER TYPE public.attendances_status_enum OWNER TO postgres;

--
-- Name: course_materials_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.course_materials_type_enum AS ENUM (
    'pdf',
    'video',
    'document',
    'presentation',
    'link'
);


ALTER TYPE public.course_materials_type_enum OWNER TO postgres;

--
-- Name: forum_posts_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.forum_posts_type_enum AS ENUM (
    'discussion',
    'question',
    'announcement'
);


ALTER TYPE public.forum_posts_type_enum OWNER TO postgres;

--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'assignment_new',
    'assignment_due',
    'assignment_graded',
    'announcement',
    'forum_reply',
    'course_enrollment',
    'general'
);


ALTER TYPE public.notifications_type_enum OWNER TO postgres;

--
-- Name: submissions_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.submissions_status_enum AS ENUM (
    'draft',
    'submitted',
    'late',
    'graded'
);


ALTER TYPE public.submissions_status_enum OWNER TO postgres;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'lecturer',
    'student'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- Name: update_forum_post_likes_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_forum_post_likes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_forum_post_likes_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    priority public.announcements_priority_enum DEFAULT 'medium'::public.announcements_priority_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "courseId" uuid,
    "authorId" uuid NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    type public.assignments_type_enum DEFAULT 'individual'::public.assignments_type_enum NOT NULL,
    "dueDate" timestamp without time zone NOT NULL,
    "maxScore" integer DEFAULT 100 NOT NULL,
    "allowLateSubmission" boolean DEFAULT true NOT NULL,
    "latePenaltyPercent" integer DEFAULT 0 NOT NULL,
    "allowedFileTypes" text[] DEFAULT '{}'::text[] NOT NULL,
    "maxFileSize" integer DEFAULT 10485760 NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "courseId" uuid NOT NULL,
    "lecturerId" uuid NOT NULL
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "studentId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "triggerMaterialId" uuid,
    "attendanceDate" date NOT NULL,
    status public.attendances_status_enum DEFAULT 'present'::public.attendances_status_enum NOT NULL,
    "attendanceType" public.attendances_attendancetype_enum DEFAULT 'manual'::public.attendances_attendancetype_enum NOT NULL,
    notes text,
    "submittedAt" timestamp without time zone,
    "verifiedAt" timestamp without time zone,
    metadata json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "verifiedBy" character varying,
    week integer
);


ALTER TABLE public.attendances OWNER TO postgres;

--
-- Name: COLUMN attendances.week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendances.week IS 'Week number (1-16) for weekly attendance tracking';


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_enrollments (
    "courseId" uuid NOT NULL,
    "studentId" uuid NOT NULL
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_materials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text,
    type public.course_materials_type_enum NOT NULL,
    "fileName" character varying,
    "filePath" character varying,
    "fileSize" integer,
    url character varying,
    week integer DEFAULT 1 NOT NULL,
    "orderIndex" integer DEFAULT 1 NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "courseId" uuid NOT NULL,
    "uploadedById" uuid NOT NULL,
    "isAttendanceTrigger" boolean DEFAULT false NOT NULL,
    "attendanceThreshold" double precision
);


ALTER TABLE public.course_materials OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    credits integer NOT NULL,
    semester character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "lecturerId" uuid NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: forum_post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.forum_post_likes OWNER TO postgres;

--
-- Name: TABLE forum_post_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.forum_post_likes IS 'Tracks individual user likes on forum posts to prevent duplicate likes';


--
-- Name: COLUMN forum_post_likes.post_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.forum_post_likes.post_id IS 'Reference to the forum post being liked';


--
-- Name: COLUMN forum_post_likes.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.forum_post_likes.user_id IS 'Reference to the user who liked the post';


--
-- Name: forum_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying,
    content text NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL,
    "likesCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "courseId" uuid NOT NULL,
    "authorId" uuid NOT NULL,
    mpath character varying DEFAULT ''::character varying,
    "parentId" uuid,
    "viewsCount" integer DEFAULT 0 NOT NULL,
    "isAnswer" boolean DEFAULT false NOT NULL,
    "isAnswered" boolean DEFAULT false NOT NULL,
    type public.forum_posts_type_enum DEFAULT 'discussion'::public.forum_posts_type_enum NOT NULL,
    "repliesCount" integer DEFAULT 0 NOT NULL,
    "parentPostId" uuid
);


ALTER TABLE public.forum_posts OWNER TO postgres;

--
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    score numeric(5,2) NOT NULL,
    "maxScore" numeric(5,2) NOT NULL,
    feedback text,
    "gradedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "courseId" uuid NOT NULL,
    "studentId" uuid NOT NULL,
    "assignmentId" uuid NOT NULL,
    "submissionId" uuid,
    "gradedById" uuid NOT NULL
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    type public.notifications_type_enum NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content text,
    "fileName" character varying,
    "filePath" character varying,
    "fileSize" integer,
    status public.submissions_status_enum DEFAULT 'draft'::public.submissions_status_enum NOT NULL,
    "submittedAt" timestamp without time zone,
    "isLate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "assignmentId" uuid NOT NULL,
    "studentId" uuid NOT NULL
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    "fullName" character varying NOT NULL,
    "studentId" character varying,
    "lecturerId" character varying,
    role public.users_role_enum DEFAULT 'student'::public.users_role_enum NOT NULL,
    phone character varying,
    address character varying,
    avatar character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: video_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "studentId" uuid NOT NULL,
    "materialId" uuid NOT NULL,
    "currentTime" double precision DEFAULT '0'::double precision NOT NULL,
    "totalDuration" double precision,
    "watchedPercentage" double precision DEFAULT '0'::double precision NOT NULL,
    "watchedSeconds" double precision DEFAULT '0'::double precision NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "completedAt" timestamp without time zone,
    "hasTriggeredAttendance" boolean DEFAULT false NOT NULL,
    "watchSessions" json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.video_progress OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, priority, "isActive", "expiresAt", "createdAt", "updatedAt", "courseId", "authorId") FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, title, description, type, "dueDate", "maxScore", "allowLateSubmission", "latePenaltyPercent", "allowedFileTypes", "maxFileSize", "isVisible", "createdAt", "updatedAt", "courseId", "lecturerId") FROM stdin;
d41c4488-01d4-4b92-b45f-0544d05c79db	Tugas pertemuan pertama	Anda diwajibkan menyelesaikan tugas ini	individual	2025-08-14 16:27:00	100	t	10	{.pdf,.doc,.docx,.jpg,.png,.zip}	10	t	2025-08-07 14:26:40.846928	2025-08-07 14:26:40.846928	753178de-f9fd-4a92-bda9-68581669f472	93739b43-c91b-486d-b4da-0d49eada1a7b
e3714509-dbaf-4a68-9d61-f51ec7bd1017	Tugas pertemuan ke-2	Tugas pertemuan ke-2	individual	2025-08-09 04:08:00	100	t	10	{.pdf,.doc,.docx,.jpg,.png,.zip}	10	t	2025-08-08 03:09:15.048428	2025-08-08 03:09:15.048428	753178de-f9fd-4a92-bda9-68581669f472	93739b43-c91b-486d-b4da-0d49eada1a7b
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendances (id, "studentId", "courseId", "triggerMaterialId", "attendanceDate", status, "attendanceType", notes, "submittedAt", "verifiedAt", metadata, "createdAt", "updatedAt", "verifiedBy", week) FROM stdin;
94856237-4fab-49d6-8b85-1881585a02d1	36515d7c-394d-4570-aaf1-9c1abc9a4618	753178de-f9fd-4a92-bda9-68581669f472	d9ce2a57-2aed-491d-a029-aa7897d75f20	2025-08-08	auto_present	video_completion	Auto-submitted via weekly video completion (100.0%) - Week 2	2025-08-08 02:54:10.673	\N	{"videoProgress":100,"completionTime":"2025-08-08T02:54:10.643Z","weekNumber":2,"weeklyCompletion":true,"weeklyCompletionDetails":{"totalRequired":1,"completedCount":1,"weeklyCompletionRate":100,"completedVideos":[{"videoId":"d9ce2a57-2aed-491d-a029-aa7897d75f20","title":"Video Pertemuan Minggu ke-2","completedAt":"2025-08-08T02:54:10.605Z","watchedPercentage":100,"threshold":80}]}}	2025-08-08 02:54:10.674174	2025-08-08 02:54:10.674174	\N	2
\.


--
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_enrollments ("courseId", "studentId") FROM stdin;
753178de-f9fd-4a92-bda9-68581669f472	36515d7c-394d-4570-aaf1-9c1abc9a4618
753178de-f9fd-4a92-bda9-68581669f472	9f819b7e-481c-4237-9d39-d119a38ff816
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, title, description, type, "fileName", "filePath", "fileSize", url, week, "orderIndex", "isVisible", "createdAt", "updatedAt", "courseId", "uploadedById", "isAttendanceTrigger", "attendanceThreshold") FROM stdin;
87bd56d4-148f-489f-a263-ef1cc0d81417	Struktur Data	Struktur Data	pdf	MSIM4202-M1.pdf	course-materials/753178de-f9fd-4a92-bda9-68581669f472_1754576647233_1u4dgzqbvod.pdf	567918	\N	1	1	t	2025-08-07 14:24:07.243223	2025-08-07 14:24:07.243223	753178de-f9fd-4a92-bda9-68581669f472	93739b43-c91b-486d-b4da-0d49eada1a7b	f	1
d9ce2a57-2aed-491d-a029-aa7897d75f20	Video Pertemuan Minggu ke-2	Video Pertemuan Minggu ke-2	video	Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4	course-materials/753178de-f9fd-4a92-bda9-68581669f472_1754621593317_mb4yrbi6veq.mp4	2563556	\N	2	1	t	2025-08-08 02:53:13.421777	2025-08-08 02:53:13.421777	753178de-f9fd-4a92-bda9-68581669f472	93739b43-c91b-486d-b4da-0d49eada1a7b	t	80
b6c39ed3-ed97-4e5c-9a80-847ba2b92f5f	PENGEMBANGAN SIASAT PEMBELAJARAN	Ada lima komponen utama dalam siasat pembelajaran, yaitu: (1) kegiatan pra pembelajaran; (2) penyajian informasi; (3) peran serta peserta didik; (4) pengetesan; (5) tindak lanjut pembelajaran. Kapabilitas belajar meliputi: informasi verbal, \r\nketerampilan intelektual, strategi kognitif, sikap, keterampilan motorik.	pdf	BAB 6.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952978972_zkhjrsrhaho.pdf	425584	\N	1	1	t	2025-09-04 02:26:09.721001	2025-09-04 02:29:38.980262	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
40bba57e-dd99-4296-91ee-d866b7e0e3bc	KARAKTER PESERTA DIDIK	Alasan yang paling menarik mengapa terjadi \r\nperbedaan hasil belajar dalam pembelajaran klasikal adalah\r\nperbedaan karakteristik di antara peserta didik. Individu yang\r\nmemiliki karakteristik berbeda, merespons lingkungan yang\r\nsama akan merespons dengan cara berbeda, dan pada akhirnya \r\nakan menghasilkan perubahan perilaku yang berbeda. Untuk \r\nmengenal karakteristik internal individu menjadi penting\r\nterutama tahapan perkembangan peserta didik yang sangat\r\nkompleks dan saling berkait antara aspek perkembangan fisik,\r\nsosio-emosional, dan kognitifnya.	pdf	BAB 3.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952450348_wgjs5sq3yo9.pdf	265252	\N	3	1	t	2025-09-04 02:20:50.34923	2025-09-04 02:35:08.845928	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
5c564044-0452-4e79-aa7b-0c81397cb63b	PEMILIHAN STRATEGI PEMBELAJARAN	Guru dalam proses pembelajaran di kelas setidak-tidaknya \r\ndihadapkan dua kegiatan pokok, yaitu: kegiatan pembelajaran\r\n(instructional) serta kegiatan mengelola kelas (classroom \r\nmanagement). Realitanya dua kegiatan tersebut menyatu dalam \r\ntingkah laku atau kegiatan guru, sehingga guru kadang-kadang \r\nsulit membedakan kegiatan tersebut. Reigeluth, dkk. (1977) \r\nmengklasifikasikan variabel-variabel pembelajaran dan \r\ndimodifikasi menjadi tiga, yaitu: (1) kondisi pembelajaran; (2) \r\nmetode pembelajaran; dan (3) hasil pembelajaran. Strategi \r\npembelajaran pada dasarnya diklasifikasikan pada strategi\r\npembelajaran yang berorientasi pada guru (teacher oriented) dan \r\nstrategi pembelajaran yang berorientasi pada peserta didik \r\n(student oriented). Beberapa pertimbangan dalam pemanfaatan \r\ndan pemilihan strategi pembelajaran adalah: (1) tujuan \r\npembelajaran yang ingin dicapai: (2) aktivitas dan pengetahuan \r\nawal peserta didik; (3) integritas bidang studi/pokok bahasan; (4) \r\nalokasi waktu dan sarana penunjang: (5) jumlah peserta didik; (6) \r\npengalaman dan kewibawaan guru.	pdf	BAB 4.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952532427_8f4zwbe611s.pdf	82820	\N	4	1	t	2025-09-04 02:22:12.428649	2025-09-04 02:35:32.271488	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
3e161aa5-5ccc-4d3d-8650-8256b0c1bcaa	METODE PEMBELAJARAN	Metode pembelajaran merupakan upaya untuk \r\nmengimplementasikan strategi pembelajaran yang sudah disusun \r\ndalam kegiatan nyata agar tujuan yang telah disusun tercapai\r\nsecara optimal. Metode digunakan untuk merealisasikan strategi\r\nyang telah ditetapkan. Strategi menunjuk pada sebuah \r\nperencanaan untuk mencapai sesuatu, sedangkan metode \r\nadalah cara yang dapat digunakan untuk melaksanakan strategi.\r\nDengan demikian, suatu strategi dapat dilaksanakan dengan\r\nberbagai metode. Terdapat beberapa metode pembelajaran yang \r\ndapat digunakan untuk mengimplementasikan strategi \r\npembelajaran, di antaranya: (1) ceramah; (2) demonstrasi; (3)\r\ndiskusi; (4) simulasi; (5) laboratorium; (6) pengalaman lapangan;\r\n(7) brainstorming; (8) debat, (9) simposium, dan sebagainya. \r\nSelanjutnya metode pembelajaran dijabarkan ke dalam teknik \r\ndan gaya pembelajaran.	pdf	BAB 5.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952623305_mi6kkbsgiu.pdf	343949	\N	5	1	t	2025-09-04 02:23:43.306563	2025-09-04 02:35:47.705292	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
1b7478a0-a945-48b6-b9f5-9a3e2af252ca	PENGELOLAAN KELAS	Secara umum, masalah yang dihadapi guru di dalam kelas dapat dikelompokkan menjadi dua hal yaitu masalah pengelolaan kelas dan masalah pembelajaran. Kadang kadang guru sering tidak jeli, menghadapi masalah di dalam kelas di mana masalah pengelolaan kelas sering ditangani secara pembelajaran. Begitu pula sebaliknya masalah pembelajaran mengatasi dengan cara pengelolaan.	pdf	BAB 7.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756953192973_l0xw9012i5.pdf	86789	\N	6	1	t	2025-09-04 02:33:12.975089	2025-09-04 02:36:03.181544	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
8c4204a4-b852-42ea-8ccd-81933c0d5072	GURU DAN TUGASNYA DALAM  PEMBELAJARAN	Guru merupakan pekerjaan profesional, oleh sebab itu sebelum \r\nmemangku jabatan sebagai guru harus mendapatkan pendidikan \r\ndan latihan secara khusus untuk itu. Masalah besar yang dihadapi \r\ndunia pendidikan di Indonesia akhir-akhir ini dan banyaknya \r\ndiperbincangkan dari berbagai kalangan adalah rendahnya \r\nkualitas pendidikan Pembelajaran adalah inti dari aktivitas \r\npendidikan. Memperbaiki rendahnya kualitas pendidikan harus \r\ndifokuskan pada kualitas pembelajaran.	presentation	GURU PROFESIONAL MASA DEPAN.pptx	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952166436_iovowlkmlz.pptx	16091437	\N	7	1	t	2025-09-04 02:16:06.476192	2025-09-04 02:36:17.487098	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
19bcda92-1551-4c10-8a8d-9ab9a74747e6	HAKIKAT STRATEGI PEMBELAJARAN	Strategi pembelajaran merupakan rencana tindakan atau \r\nrangkaian kegiatan termasuk penggunaan metode dan \r\npemanfaatan berbagai sumber daya atau kekuatan dalam \r\npembelajaran yang disusun untuk mencapai tujuan \r\npembelajaran. Dalam strategi pembelajaran yang menjadi dasar \r\npertimbangan adalah belajar itu sendiri, karena tujuan yang \r\nhendak dicapai adalah berupa perubahan tingkah laku peserta \r\ndidik (si belajar) yaitu individu yang melakukan belajar dan bukan \r\nguru yang memberikan pelajaran. Oleh sebab itu, dalam strategi \r\npembelajaran harus mempertimbangkan prinsip-prinsip belajar.\r\nPada bagian ini secara berurut-turut dibahas tentang: (1) \r\nPengertian Strategi Pembelajaran (2) Konsep Dasar Strategi \r\nPembelajaran (3) Beberapa Istilah yang Terkait dengan Strategi\r\nPembelajaran; (4) Prinsip- Prinsip Belajar dan Pembelajaran.	pdf	BAB 2.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756952306999_5ur33f52lkb.pdf	361470	\N	2	2	t	2025-09-04 02:18:27.000255	2025-09-04 02:33:54.486839	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
098f0472-472c-4649-957f-72d5d091bcf7	PEMANFAATAN SUMBER BELAJAR DALAM STRATEGI  PEMBELAJARAN	Sistem pembelajaran formal di Indonesia masih didominasi pembelajaran yang berorientasi kelas (classroom oriented learning) dibandingkan dengan sistem pebelajaran di ruang bebas (openspace oriented learning) atau kombinasi dari keduanya (Spiro dan Paul, 2003). Sumber belajar yang digunakan dalam pembelajaran yang berorientasi kelas bersifat konvensional seperti: papan tulis, buku teks, buku kerja, peraga demo sederhana, proyektor, slide dalam waktu terbatas dan memerlukan guru atau instruktur dalam kelas. Pada sistem pebelajaran di luar kelas tidak terikat oleh batas waktu, guru, dan tempat, media yang digunakan dapat berupa komputer pribadi, komputer yang terhubung dengan jaringan lokal (local are network/LAN) atau internet, video, TV kabel yang tersedia di luar kelas.	pdf	BAB 8.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756953600220_2gy8ilov0zo.pdf	568508	\N	8	1	t	2025-09-04 02:40:00.221798	2025-09-04 02:40:00.221798	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
c8abdcd1-0ea6-419a-9d09-a9a4079ef930	KETERAMPILAN DASAR DALAM PEMBELAJARAN	Guru sebagai pekerjaan profesional maka sebelum memangku jabatan tersebut harus mengikuti pendidikan dan pelatihat yang dipersyaratkan. Guru wajib memiliki kualifikasi akademik, kompetensi, sertifikat pendidik, sehat jasmani dan rohani, serta memiliki kemampuan untuk mewujudkan tujuan pendidikan nasional. Selanjutnya UU No.14 Tahun 2005 tentang Guru dan Dosen pada Pasal 10 menyebutkan kompetensi yang harus dimiliki guru dan dosen meliputi (1) kompetensi pedagogik, (b) kompetensi kepribadian, (c) kompetensi profesional, dan (d) kompetensi sosial, yang diperoleh melalui pendidikan profesi.	pdf	BAB 9.pdf	course-materials/bb911522-a5d9-4c0e-826b-7f5e1ae97b21_1756953818027_k9jdswav67e.pdf	987851	\N	8	2	t	2025-09-04 02:43:38.030191	2025-09-04 02:43:38.030191	bb911522-a5d9-4c0e-826b-7f5e1ae97b21	ccd31bc2-17c9-4b96-8baa-347c7bcc3996	f	1
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, name, description, credits, semester, "isActive", "createdAt", "updatedAt", "lecturerId") FROM stdin;
753178de-f9fd-4a92-bda9-68581669f472	CS101	Algoritma dan Struktur Data	Algoritma dan Struktur Data	3	Ganjil 2024/2025	t	2025-08-07 14:05:38.328266	2025-08-07 14:05:38.328266	93739b43-c91b-486d-b4da-0d49eada1a7b
bb911522-a5d9-4c0e-826b-7f5e1ae97b21	3JKR47020	STRATEGI PEMBELAJARAN PENJAS	Mata kuliah Startegi Pembelajaran Penjas mengkaji dan menganalisis hakikat dan makna strategi pembelajaran, mengidentifikasi berbagai upaya menata faktor eksternal agar tercipta pemebelajaran yang efektif, efisien, berarah dan bermakna untuk mencapai hasil belajar yang optimal. Menganalisis taksonomi variable dalam pembelajaran (tujuan pembelajaran dan karakteristik Pendidikan Jasmani, kendala, karakteristik peserta didik, strategi pengorganisasian pembelajaran, strategi penyampaian pembelajaran dan strategi pengelolaan pembelajaran).	4	Ganjil 2025/2026	t	2025-09-04 02:02:13.656352	2025-09-04 02:02:13.656352	93739b43-c91b-486d-b4da-0d49eada1a7b
\.


--
-- Data for Name: forum_post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_post_likes (id, post_id, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: forum_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_posts (id, title, content, "isPinned", "isLocked", "likesCount", "createdAt", "updatedAt", "courseId", "authorId", mpath, "parentId", "viewsCount", "isAnswer", "isAnswered", type, "repliesCount", "parentPostId") FROM stdin;
e8ae0786-b77b-43a7-ad03-74c87b39cfa5	Re: Gimana ngerjain tugas pertemuan pertama	Ohh iya nanti saya ajarin ya&nbsp;	f	f	0	2025-08-08 03:16:39.486602	2025-08-08 03:16:39.486602	753178de-f9fd-4a92-bda9-68581669f472	93739b43-c91b-486d-b4da-0d49eada1a7b	e8ae0786-b77b-43a7-ad03-74c87b39cfa5.	59da495a-574d-49e4-98f2-aa5490b01309	0	f	f	discussion	0	\N
28471187-05be-45bf-9e15-411fb50ee46e	Re: Gimana ngerjain tugas pertemuan pertama	Iya gimana ya	f	f	0	2025-08-08 03:17:29.228082	2025-08-08 03:17:29.228082	753178de-f9fd-4a92-bda9-68581669f472	9f819b7e-481c-4237-9d39-d119a38ff816	28471187-05be-45bf-9e15-411fb50ee46e.	59da495a-574d-49e4-98f2-aa5490b01309	0	f	f	discussion	0	\N
59da495a-574d-49e4-98f2-aa5490b01309	Gimana ngerjain tugas pertemuan pertama	Tips Membuat Diskusi yang Baik:\r<div>• Gunakan judul yang spesifik dan deskriptif\r</div><div>• Jelaskan konteks dan latar belakang masalah\r</div><div>• Sertakan detail yang relevan (kode, screenshot, dll)\r</div><div>• Gunakan format yang rapi dan mudah dibaca\r</div><div>• Pastikan konten sesuai dengan mata kuliah yang dipilih</div>	f	f	0	2025-08-08 03:14:14.560512	2025-08-08 06:25:56.010499	753178de-f9fd-4a92-bda9-68581669f472	36515d7c-394d-4570-aaf1-9c1abc9a4618	59da495a-574d-49e4-98f2-aa5490b01309.	\N	6	f	f	discussion	2	\N
\.


--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (id, score, "maxScore", feedback, "gradedAt", "createdAt", "updatedAt", "courseId", "studentId", "assignmentId", "submissionId", "gradedById") FROM stdin;
f9a4ffdb-9ce8-479d-81f9-f67078583377	94.00	100.00	Mantap	2025-08-07 14:48:35.814	2025-08-07 14:48:35.853839	2025-08-07 14:48:35.853839	753178de-f9fd-4a92-bda9-68581669f472	36515d7c-394d-4570-aaf1-9c1abc9a4618	d41c4488-01d4-4b92-b45f-0544d05c79db	b749ad86-be8f-41bc-a618-dda086d5590a	93739b43-c91b-486d-b4da-0d49eada1a7b
3748e439-1023-452e-aeb9-62e47e7e3a79	79.00	100.00	Sudah baik	2025-08-08 03:19:25.737	2025-08-08 03:19:25.749823	2025-08-08 03:19:25.749823	753178de-f9fd-4a92-bda9-68581669f472	36515d7c-394d-4570-aaf1-9c1abc9a4618	e3714509-dbaf-4a68-9d61-f51ec7bd1017	603cee5e-09fd-412f-bbc6-7322055fc699	93739b43-c91b-486d-b4da-0d49eada1a7b
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, "isRead", metadata, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, content, "fileName", "filePath", "fileSize", status, "submittedAt", "isLate", "createdAt", "updatedAt", "assignmentId", "studentId") FROM stdin;
b749ad86-be8f-41bc-a618-dda086d5590a	Ini tugas saya	MSIM4202-M1.pdf	uploads/d958d6160fa9ecfdbf6b8d9ceac93c0c	567918	graded	2025-08-07 14:28:59.143	f	2025-08-07 14:28:59.145061	2025-08-07 14:48:35.833254	d41c4488-01d4-4b92-b45f-0544d05c79db	36515d7c-394d-4570-aaf1-9c1abc9a4618
603cee5e-09fd-412f-bbc6-7322055fc699	Kumpul tugas kedua	MSIM4202-M1.pdf	uploads/1203ac1883eee31453d6fad41bece7a5	567918	graded	2025-08-08 03:12:37.977	f	2025-08-08 03:12:37.97875	2025-08-08 03:19:25.742559	e3714509-dbaf-4a68-9d61-f51ec7bd1017	36515d7c-394d-4570-aaf1-9c1abc9a4618
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, "fullName", "studentId", "lecturerId", role, phone, address, avatar, "isActive", "createdAt", "updatedAt") FROM stdin;
ccd31bc2-17c9-4b96-8baa-347c7bcc3996	admin@lms.com	$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO	Administrator	\N	ADM001	admin	\N	\N	\N	t	2025-08-07 00:25:16.107248	2025-08-07 00:25:16.107248
36515d7c-394d-4570-aaf1-9c1abc9a4618	student@lms.com	$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO	Jane Student	STD001	\N	student	\N	\N	\N	t	2025-08-07 00:25:16.107248	2025-08-07 00:25:16.107248
9f819b7e-481c-4237-9d39-d119a38ff816	student1@lms.com	$2a$10$lLcIcxPPF2wwz2kwptL52.Y5ZthUHlX2RFdN9MfI7z8EULhOuWwie	Andrew Student	12345	\N	student	08123	\N	\N	t	2025-08-08 03:15:36.613024	2025-08-08 03:15:36.613024
93739b43-c91b-486d-b4da-0d49eada1a7b	irfan@unimed.ac.id	$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO	Dr. M. Irfan, S.Pd., M.Or		0024107305	lecturer	085356399909	\N	\N	t	2025-08-07 00:25:16.107248	2025-09-04 02:06:48.679846
\.


--
-- Data for Name: video_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_progress (id, "studentId", "materialId", "currentTime", "totalDuration", "watchedPercentage", "watchedSeconds", "isCompleted", "completedAt", "hasTriggeredAttendance", "watchSessions", "createdAt", "updatedAt") FROM stdin;
20042d9b-374c-4569-a4ab-69432f55f7ae	36515d7c-394d-4570-aaf1-9c1abc9a4618	d9ce2a57-2aed-491d-a029-aa7897d75f20	0	\N	100	0	t	2025-08-08 02:54:10.605	t	[]	2025-08-08 02:54:00.461823	2025-08-08 02:54:10.692353
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 2, true);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: announcements PK_announcements_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "PK_announcements_id" PRIMARY KEY (id);


--
-- Name: assignments PK_assignments_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "PK_assignments_id" PRIMARY KEY (id);


--
-- Name: attendances PK_attendances; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "PK_attendances" PRIMARY KEY (id);


--
-- Name: course_enrollments PK_course_enrollments; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "PK_course_enrollments" PRIMARY KEY ("courseId", "studentId");


--
-- Name: course_materials PK_course_materials_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "PK_course_materials_id" PRIMARY KEY (id);


--
-- Name: courses PK_courses_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_courses_id" PRIMARY KEY (id);


--
-- Name: forum_posts PK_forum_posts_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "PK_forum_posts_id" PRIMARY KEY (id);


--
-- Name: grades PK_grades_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "PK_grades_id" PRIMARY KEY (id);


--
-- Name: notifications PK_notifications_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_notifications_id" PRIMARY KEY (id);


--
-- Name: submissions PK_submissions_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "PK_submissions_id" PRIMARY KEY (id);


--
-- Name: users PK_users_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users_id" PRIMARY KEY (id);


--
-- Name: video_progress PK_video_progress; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "PK_video_progress" PRIMARY KEY (id);


--
-- Name: grades REL_grades_submissionId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "REL_grades_submissionId" UNIQUE ("submissionId");


--
-- Name: video_progress UQ_3d80b3a91eb3096b9caa0634862; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "UQ_3d80b3a91eb3096b9caa0634862" UNIQUE ("studentId", "materialId");


--
-- Name: courses UQ_courses_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "UQ_courses_code" UNIQUE (code);


--
-- Name: users UQ_users_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_email" UNIQUE (email);


--
-- Name: users UQ_users_lecturerId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_lecturerId" UNIQUE ("lecturerId");


--
-- Name: users UQ_users_studentId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_studentId" UNIQUE ("studentId");


--
-- Name: forum_post_likes forum_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_pkey PRIMARY KEY (id);


--
-- Name: forum_post_likes unique_user_post_like; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT unique_user_post_like UNIQUE (post_id, user_id);


--
-- Name: CONSTRAINT unique_user_post_like ON forum_post_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT unique_user_post_like ON public.forum_post_likes IS 'Prevents users from liking the same post multiple times';


--
-- Name: IDX_0533bdb161365ccbec0c890640; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0533bdb161365ccbec0c890640" ON public.course_enrollments USING btree ("studentId");


--
-- Name: IDX_151dff45f01c0c195022e7db12; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_151dff45f01c0c195022e7db12" ON public.forum_posts USING btree ("authorId");


--
-- Name: IDX_3d80b3a91eb3096b9caa063486; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_3d80b3a91eb3096b9caa063486" ON public.video_progress USING btree ("studentId", "materialId");


--
-- Name: IDX_5a609f43233d54cdffb545b379; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_5a609f43233d54cdffb545b379" ON public.forum_posts USING btree ("courseId", "createdAt");


--
-- Name: IDX_8737b85e7e3ac9c09b6b596a06; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8737b85e7e3ac9c09b6b596a06" ON public.forum_posts USING btree ("courseId");


--
-- Name: IDX_90dc8f3363be0aac17437a84cd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_90dc8f3363be0aac17437a84cd" ON public.forum_posts USING btree ("courseId", "isPinned");


--
-- Name: IDX_d04fb6f55fbbf1e27dfc2de76a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d04fb6f55fbbf1e27dfc2de76a" ON public.forum_posts USING btree ("parentId");


--
-- Name: IDX_d77e489db35c7d325700d799be; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d77e489db35c7d325700d799be" ON public.course_enrollments USING btree ("courseId");


--
-- Name: IDX_f186e7ffcddc03565bd913f764; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f186e7ffcddc03565bd913f764" ON public.attendances USING btree ("courseId", "attendanceDate");


--
-- Name: IDX_fe0383be1768c5fb57ca1bd4c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fe0383be1768c5fb57ca1bd4c0" ON public.attendances USING btree ("studentId", "courseId", "attendanceDate");


--
-- Name: idx_attendances_course_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_course_week ON public.attendances USING btree ("courseId", week);


--
-- Name: idx_attendances_student_course_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_student_course_week ON public.attendances USING btree ("studentId", "courseId", week);


--
-- Name: idx_attendances_week_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_week_status ON public.attendances USING btree (week, status);


--
-- Name: idx_forum_post_likes_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_created_at ON public.forum_post_likes USING btree (created_at);


--
-- Name: idx_forum_post_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_post_id ON public.forum_post_likes USING btree (post_id);


--
-- Name: idx_forum_post_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_user_id ON public.forum_post_likes USING btree (user_id);


--
-- Name: forum_post_likes trigger_update_forum_post_likes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_forum_post_likes_updated_at BEFORE UPDATE ON public.forum_post_likes FOR EACH ROW EXECUTE FUNCTION public.update_forum_post_likes_updated_at();


--
-- Name: course_enrollments FK_0533bdb161365ccbec0c8906408; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "FK_0533bdb161365ccbec0c8906408" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- Name: forum_posts FK_151dff45f01c0c195022e7db127; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_151dff45f01c0c195022e7db127" FOREIGN KEY ("authorId") REFERENCES public.users(id);


--
-- Name: forum_posts FK_1554fa495bffe98b6fc627ecd12; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_1554fa495bffe98b6fc627ecd12" FOREIGN KEY ("parentPostId") REFERENCES public.forum_posts(id);


--
-- Name: submissions FK_4fc99318a291abd7e2a50f50851; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_4fc99318a291abd7e2a50f50851" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- Name: attendances FK_615b414059091a9a8ea0355ae89; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_615b414059091a9a8ea0355ae89" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications FK_692a909ee0fa9383e7859f9b406; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: attendances FK_6df4841e53822d299212e278f03; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_6df4841e53822d299212e278f03" FOREIGN KEY ("triggerMaterialId") REFERENCES public.course_materials(id) ON DELETE SET NULL;


--
-- Name: announcements FK_8464026cbf8a3841602563e5bb1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "FK_8464026cbf8a3841602563e5bb1" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: forum_posts FK_8737b85e7e3ac9c09b6b596a06b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_8737b85e7e3ac9c09b6b596a06b" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: announcements FK_92d72877cc8c092c83f37c62752; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "FK_92d72877cc8c092c83f37c62752" FOREIGN KEY ("authorId") REFERENCES public.users(id);


--
-- Name: courses FK_991b0b42fb5ca44bf61d3772188; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "FK_991b0b42fb5ca44bf61d3772188" FOREIGN KEY ("lecturerId") REFERENCES public.users(id);


--
-- Name: grades FK_9a4ec29a3b29310f9fe8999bf3f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_9a4ec29a3b29310f9fe8999bf3f" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignments FK_9e5684667ea189ade0fc79fa4f1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_9e5684667ea189ade0fc79fa4f1" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_materials FK_ace3ef4157ae10a215848945a36; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "FK_ace3ef4157ae10a215848945a36" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: grades FK_bb2c0b9046d01f4f6b1396f7803; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_bb2c0b9046d01f4f6b1396f7803" FOREIGN KEY ("gradedById") REFERENCES public.users(id);


--
-- Name: submissions FK_c2611c601f49945ceff5c0909a2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_c2611c601f49945ceff5c0909a2" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: course_materials FK_c72fda5c18f31710e7decde8bc3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "FK_c72fda5c18f31710e7decde8bc3" FOREIGN KEY ("uploadedById") REFERENCES public.users(id);


--
-- Name: forum_posts FK_d04fb6f55fbbf1e27dfc2de76a8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_d04fb6f55fbbf1e27dfc2de76a8" FOREIGN KEY ("parentId") REFERENCES public.forum_posts(id);


--
-- Name: course_enrollments FK_d77e489db35c7d325700d799be6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "FK_d77e489db35c7d325700d799be6" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: grades FK_d9d3e0c4ac49ec8411b52f2fb87; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_d9d3e0c4ac49ec8411b52f2fb87" FOREIGN KEY ("submissionId") REFERENCES public.submissions(id);


--
-- Name: attendances FK_e3d2dbf34d49f5cc2384398ea90; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_e3d2dbf34d49f5cc2384398ea90" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: video_progress FK_f426680feb3428604a4a0fb6643; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "FK_f426680feb3428604a4a0fb6643" FOREIGN KEY ("materialId") REFERENCES public.course_materials(id) ON DELETE CASCADE;


--
-- Name: assignments FK_f5c22e1640b8496e2556a8fd3ac; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_f5c22e1640b8496e2556a8fd3ac" FOREIGN KEY ("lecturerId") REFERENCES public.users(id);


--
-- Name: grades FK_fcfc027e4e5fb37a4372e688070; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_fcfc027e4e5fb37a4372e688070" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- Name: video_progress FK_fe9e35dcfc37f05799f8689b5c6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "FK_fe9e35dcfc37f05799f8689b5c6" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: grades FK_ff09424ef05361e1c47fa03d82b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_ff09424ef05361e1c47fa03d82b" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: forum_post_likes fk_forum_post_likes_post; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT fk_forum_post_likes_post FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- Name: forum_post_likes fk_forum_post_likes_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT fk_forum_post_likes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


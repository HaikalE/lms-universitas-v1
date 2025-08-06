--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

-- Started on 2025-08-06 09:52:49

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
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 881 (class 1247 OID 32908)
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
-- TOC entry 875 (class 1247 OID 32888)
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
-- TOC entry 929 (class 1247 OID 57529)
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
-- TOC entry 926 (class 1247 OID 57511)
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
-- TOC entry 872 (class 1247 OID 32876)
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
-- TOC entry 923 (class 1247 OID 57496)
-- Name: forum_posts_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.forum_posts_type_enum AS ENUM (
    'discussion',
    'question',
    'announcement'
);


ALTER TYPE public.forum_posts_type_enum OWNER TO postgres;

--
-- TOC entry 884 (class 1247 OID 32918)
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
-- TOC entry 878 (class 1247 OID 32898)
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
-- TOC entry 869 (class 1247 OID 32868)
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'lecturer',
    'student'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- TOC entry 241 (class 1255 OID 57660)
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
-- TOC entry 226 (class 1259 OID 33037)
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
-- TOC entry 222 (class 1259 OID 32982)
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
-- TOC entry 229 (class 1259 OID 57479)
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
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN attendances.week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendances.week IS 'Week number (1-16) for weekly attendance tracking';


--
-- TOC entry 220 (class 1259 OID 32964)
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_enrollments (
    "courseId" uuid NOT NULL,
    "studentId" uuid NOT NULL
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 32969)
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
-- TOC entry 219 (class 1259 OID 32951)
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
-- TOC entry 230 (class 1259 OID 57637)
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
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE forum_post_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.forum_post_likes IS 'Tracks individual user likes on forum posts to prevent duplicate likes';


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN forum_post_likes.post_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.forum_post_likes.post_id IS 'Reference to the forum post being liked';


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN forum_post_likes.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.forum_post_likes.user_id IS 'Reference to the user who liked the post';


--
-- TOC entry 225 (class 1259 OID 33023)
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
-- TOC entry 224 (class 1259 OID 33011)
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
-- TOC entry 217 (class 1259 OID 32859)
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 32858)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 216
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 227 (class 1259 OID 33049)
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
-- TOC entry 223 (class 1259 OID 32999)
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
-- TOC entry 218 (class 1259 OID 32933)
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
-- TOC entry 228 (class 1259 OID 57440)
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
-- TOC entry 4779 (class 2604 OID 32862)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 5091 (class 0 OID 33037)
-- Dependencies: 226
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5087 (class 0 OID 32982)
-- Dependencies: 222
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.assignments VALUES ('5033c3d3-6929-4737-8c65-ea2e0258d62e', 'sdaasd', 'asdqewqe123213', 'group', '2025-05-28 13:21:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-05-28 19:18:24.291471', '2025-05-28 19:18:24.291471', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.assignments VALUES ('b1ad29f8-910b-40a6-9573-1f2779a1067f', '123123123sdadasd csadca', 'qeqwe1223123fds dfasqwwe123', 'individual', '2025-05-29 11:35:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-05-28 19:35:32.441344', '2025-05-28 19:35:32.441344', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.assignments VALUES ('d2440ba1-2cf6-497c-b3cf-08c521be2be9', 'JONO GENENG', 'KERJAin tugasnya woyy', 'quiz', '2025-07-01 14:41:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-01 22:40:35.80948', '2025-07-01 22:40:35.80948', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996');
INSERT INTO public.assignments VALUES ('8b7ccee2-a28b-47cf-b71a-702add99b974', 'dsadsad', 'dsadsad', 'exam', '2025-07-02 14:41:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-01 22:41:43.509733', '2025-07-01 22:41:43.509733', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996');
INSERT INTO public.assignments VALUES ('41d60f30-f860-4bc4-a8e9-0e0a80356a39', 'kbolhjlj', 'dasdasd', 'individual', '2025-07-03 14:42:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-01 22:42:45.553277', '2025-07-01 22:42:45.553277', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996');
INSERT INTO public.assignments VALUES ('cb737b1b-4f28-4690-beda-0326321f60df', 'dasdsad', 'dasdasdqwewqe', 'individual', '2025-07-15 12:46:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-14 20:46:48.766925', '2025-07-14 20:46:48.766925', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.assignments VALUES ('12f10405-67d3-40f0-aa1b-2197c11bafb0', 'dasdasdas', 'dasdasdasd213123123', 'group', '2025-07-16 12:49:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-14 20:49:54.986348', '2025-07-14 20:49:54.986348', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.assignments VALUES ('4d706873-c0d4-47c7-bc62-1a0e7704a464', 'TUGAS PERTAMA', 'INI TUGAS PERTAMA', 'individual', '2025-07-18 15:45:00', 100, true, 10, '{.pdf,.doc,.docx,.jpg,.png,.zip}', 10, true, '2025-07-14 21:46:32.277494', '2025-07-14 21:46:32.277494', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b');


--
-- TOC entry 5094 (class 0 OID 57479)
-- Dependencies: 229
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.attendances VALUES ('9c82cba1-6ddb-49f0-97a4-fefd0dd33bfa', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '169c6d06-82f7-448e-8b3b-55f551d39839', '2025-07-27', 'auto_present', 'video_completion', 'Auto-submitted via weekly video completion (100.0%) - Week 13', '2025-07-27 08:22:34.351', NULL, '{"videoProgress":100,"completionTime":"2025-07-27T08:22:34.340Z","weekNumber":13,"weeklyCompletion":{"totalRequired":2,"completedCount":2,"weeklyCompletionRate":100,"completedVideos":[{"videoId":"f1b452e4-66fc-4274-a92a-5377466ae71b","title":"dsadas12312","completedAt":"2025-07-27T08:21:58.086Z","watchedPercentage":100,"threshold":71},{"videoId":"169c6d06-82f7-448e-8b3b-55f551d39839","title":"ghdfg1231","completedAt":"2025-07-27T08:22:34.323Z","watchedPercentage":100,"threshold":86}]}}', '2025-07-27 16:22:33.969874', '2025-07-27 16:22:33.969874', NULL, 13);
INSERT INTO public.attendances VALUES ('a5f6ae62-b0d7-4fe0-ad66-88f3c9bfe537', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', NULL, '2025-07-27', 'auto_present', 'video_completion', 'Auto-submitted via video completion (100.0%)', '2025-07-27 03:22:34.958', NULL, '{"videoProgress":100,"completionTime":"2025-07-27T03:22:34.948Z"}', '2025-07-27 11:22:35.138522', '2025-07-27 11:22:35.138522', NULL, 9);


--
-- TOC entry 5085 (class 0 OID 32964)
-- Dependencies: 220
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.course_enrollments VALUES ('2024ece7-edc2-4f75-bdd2-e605512f4ac7', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.course_enrollments VALUES ('2024ece7-edc2-4f75-bdd2-e605512f4ac7', '407bbc2d-3f5a-4314-ab68-26cdfcf15192');


--
-- TOC entry 5086 (class 0 OID 32969)
-- Dependencies: 221
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.course_materials VALUES ('ab6bbef0-f8f3-4f69-a4d2-960b0e1e14d7', '213123', 'dsasdad121', 'pdf', 'KTP_Muhammad Haikal Rahman.pdf', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1748429229204_cmcw81j4y9m.pdf', 284238, NULL, 2, 1, true, '2025-05-28 18:47:09.213751', '2025-05-28 18:47:09.213751', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996', false, NULL);
INSERT INTO public.course_materials VALUES ('0f7cab13-ae65-4418-9612-0f4577954942', 'afasd23123', 'fsadad', 'pdf', 'KARTU KELUARGA (1).pdf', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1748429285693_br4ej0tlxg.pdf', 809732, NULL, 3, 1, true, '2025-05-28 18:48:05.702347', '2025-05-28 18:48:05.702347', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996', false, NULL);
INSERT INTO public.course_materials VALUES ('89c21857-7ed1-4c30-aae9-a56f6f100a1d', 'fasdasd2313', 'aewqe21312', 'pdf', '1CV_Muhammad Haikal Rahman.pdf', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1748428590863_285uvr70oq9.pdf', 567677, NULL, 1, 3, true, '2025-05-28 18:36:30.874295', '2025-05-28 19:09:30.213704', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'ccd31bc2-17c9-4b96-8baa-347c7bcc3996', false, NULL);
INSERT INTO public.course_materials VALUES ('a9e54f00-0759-4723-94f9-3531b8dfb88c', 'MATERI PERTAMA', 'INI CONTOH YANG PERTAMA', 'pdf', 'DOKUMEN MAGANG TELKOMSEL.pdf', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1752500682595_j7tcteag9nr.pdf', 405165, NULL, 5, 1, true, '2025-07-14 21:44:42.402572', '2025-07-14 21:44:42.402572', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', false, NULL);
INSERT INTO public.course_materials VALUES ('1e48edad-2f48-45e3-b1dc-6b1c563038c0', 'dsad', 'qe213', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753402199035_qnq49re45sf.mp4', 2563556, NULL, 4, 1, true, '2025-07-25 08:09:59.171976', '2025-07-25 08:09:59.171976', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', false, NULL);
INSERT INTO public.course_materials VALUES ('285c5786-3207-43cb-a653-9920bfc8896a', 'dasdasd', 'qewwqe12321', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753404599075_t8718srs8ef.mp4', 2563556, NULL, 5, 1, true, '2025-07-25 08:49:59.203175', '2025-07-25 08:49:59.203175', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', false, NULL);
INSERT INTO public.course_materials VALUES ('ce03b875-3535-4ed1-b3ea-06c27c8d2431', 'ewr321', 'asdascz', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753590336460_uooeyzae3u.mp4', 2563556, NULL, 10, 1, true, '2025-07-27 12:25:36.561165', '2025-07-27 12:25:36.561165', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 70);
INSERT INTO public.course_materials VALUES ('b7d17606-5b6f-4fb6-868f-a2328beb4d28', 'dsad2313', 'dasdas', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753590433878_memfyr07w9r.mp4', 2563556, NULL, 10, 1, true, '2025-07-27 12:27:14.068499', '2025-07-27 12:27:14.068499', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 76);
INSERT INTO public.course_materials VALUES ('690aeb49-ec84-4f72-b73d-1f59a830c651', 'dsadas', 'ewqeqw', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753591610680_mz7ry0i67nn.mp4', 2563556, NULL, 10, 1, true, '2025-07-27 12:46:50.701887', '2025-07-27 12:46:50.701887', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 75);
INSERT INTO public.course_materials VALUES ('b4283028-cc52-42c9-8b7c-f30367deafd6', 'ddasd23', 'dsadqw123', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753592807182_zcbp7k6yt1i.mp4', 2563556, NULL, 11, 1, true, '2025-07-27 13:06:47.186314', '2025-07-27 13:06:47.186314', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 74);
INSERT INTO public.course_materials VALUES ('281b7411-49a3-4ffb-9d0f-8940b525047a', 'gretw2341', 'dwqe77', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753592828761_ybmrqemsmua.mp4', 2563556, NULL, 11, 2, true, '2025-07-27 13:07:08.894732', '2025-07-27 13:07:08.894732', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 80);
INSERT INTO public.course_materials VALUES ('5273424f-4b06-40af-8eb2-a328186214ff', 'dasdasd212', 'dqdwq', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753593519555_2eek61jzj1x.mp4', 2563556, NULL, 12, 1, true, '2025-07-27 13:18:39.573973', '2025-07-27 13:18:39.573973', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 82);
INSERT INTO public.course_materials VALUES ('b2e698ba-302a-4303-82a1-714a301df9bc', 'pppp', '123123', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753593539186_rle9muqtfqm.mp4', 2563556, NULL, 12, 1, true, '2025-07-27 13:18:59.131047', '2025-07-27 13:18:59.131047', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 80);
INSERT INTO public.course_materials VALUES ('f1b452e4-66fc-4274-a92a-5377466ae71b', 'dsadas12312', 'dqweqwe', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753604448429_bd3fy8vxnge.mp4', 2563556, NULL, 13, 1, true, '2025-07-27 16:20:48.473408', '2025-07-27 16:20:48.473408', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 71);
INSERT INTO public.course_materials VALUES ('169c6d06-82f7-448e-8b3b-55f551d39839', 'ghdfg1231', 'dsadaxz', 'video', 'Selamat Kepada Penerima Beasiswa Lanjutan Kelas Menengah IDCamp 2023 _ IDCamp 2023 - Google Chrome 2023-12-07 16-24-39.mp4', 'uploads/course-materials/2024ece7-edc2-4f75-bdd2-e605512f4ac7_1753604474683_qm9qmp900b.mp4', 2563556, NULL, 13, 2, true, '2025-07-27 16:21:14.624312', '2025-07-27 16:21:14.624312', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', true, 86);


--
-- TOC entry 5084 (class 0 OID 32951)
-- Dependencies: 219
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.courses VALUES ('2024ece7-edc2-4f75-bdd2-e605512f4ac7', 'CS101', 'Algoritma', 'Mantap', 3, '2025/2', true, '2025-05-23 13:16:39.819562', '2025-05-23 13:16:39.819562', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.courses VALUES ('e2b037df-5bd7-4bda-92aa-1b5b550d555e', 'dsa123', 'sadsaqwewq', 'sadasdasdn', 3, 'Genap 2024/2025', true, '2025-07-23 11:56:09.575496', '2025-08-02 18:36:45.987222', '93739b43-c91b-486d-b4da-0d49eada1a7b');


--
-- TOC entry 5095 (class 0 OID 57637)
-- Dependencies: 230
-- Data for Name: forum_post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.forum_post_likes VALUES ('e2df3ac4-151b-48fd-b63c-6cf1eb831ac6', 'fb4c48a2-f5a1-4252-be49-3c377c49b012', '93739b43-c91b-486d-b4da-0d49eada1a7b', '2025-08-01 22:02:26.558675+08', '2025-08-01 22:02:26.558675+08');


--
-- TOC entry 5090 (class 0 OID 33023)
-- Dependencies: 225
-- Data for Name: forum_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.forum_posts VALUES ('e57e75c9-5982-4203-94e2-8e8c42676540', 'dasdasddasdas', '<ul><li><span style="color: rgb(2, 8, 23);">dasdas</span><i style="color: rgb(2, 8, 23);">dasdasda</i><span style="color: rgb(2, 8, 23);">sdasdasdasdasdasdasdadasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdas</span><b style="color: rgb(2, 8, 23);">dasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd</b><span style="color: rgb(2, 8, 23);">asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasda</span><u style="color: rgb(2, 8, 23);">sdasdasdasdass</u></li></ul><u style="color: rgb(2, 8, 23);"><blockquote><ol><li><u style="color: rgb(2, 8, 23);">dasd</u></li></ol><ol><li><u style="color: rgb(2, 8, 23);">dasdas</u></li></ol><ol><li><u style="color: rgb(2, 8, 23);">qw</u></li></ol><ol><li><u style="color: rgb(2, 8, 23);">asd</u></li></ol></blockquote></u>', false, false, 0, '2025-07-08 00:16:06.67682', '2025-07-08 00:16:06.67682', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', 'e57e75c9-5982-4203-94e2-8e8c42676540.', NULL, 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('9ef49fa6-47c4-4829-9c45-af53a888f2c0', 'PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5INI MATERI MINGGU KE 5', false, false, 3, '2025-07-14 21:47:46.416983', '2025-08-01 22:33:30.376007', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '9ef49fa6-47c4-4829-9c45-af53a888f2c0.', NULL, 46, false, false, 'discussion', 5, NULL);
INSERT INTO public.forum_posts VALUES ('32c07053-c586-4102-9a8f-cfce06349c9b', 'Re: PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'dsadas', false, false, 0, '2025-07-30 21:19:42.442608', '2025-07-30 21:19:42.442608', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '32c07053-c586-4102-9a8f-cfce06349c9b.', '9ef49fa6-47c4-4829-9c45-af53a888f2c0', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('a1910f73-13aa-4c7a-9fd4-1945858f61d0', 'Re: PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'OKE BANG!!', false, false, 0, '2025-07-30 15:52:42.446825', '2025-07-30 15:52:42.446825', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', 'a1910f73-13aa-4c7a-9fd4-1945858f61d0.', '9ef49fa6-47c4-4829-9c45-af53a888f2c0', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('fb4c48a2-f5a1-4252-be49-3c377c49b012', 'Re: PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'OKE DEH LU', false, false, 1, '2025-07-30 15:53:10.292935', '2025-08-01 22:02:26.564245', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', 'fb4c48a2-f5a1-4252-be49-3c377c49b012.', '9ef49fa6-47c4-4829-9c45-af53a888f2c0', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('30373238-1baa-4f3f-8a35-d76a181b89cb', 'Re: dasdsadasdasd', 'hai', false, false, 0, '2025-08-01 22:33:43.013346', '2025-08-01 22:33:43.013346', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '30373238-1baa-4f3f-8a35-d76a181b89cb.', '0e99a45e-1ac1-4895-b71f-8f99f057885c', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('fe32a0f2-ccbd-4b0b-bae4-5ac48a3e2017', 'Re: PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'dsad123', false, false, 0, '2025-07-30 21:20:54.306435', '2025-07-30 21:20:54.306435', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', 'fe32a0f2-ccbd-4b0b-bae4-5ac48a3e2017.', '9ef49fa6-47c4-4829-9c45-af53a888f2c0', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('0ccbf5d8-0ebb-45fb-a423-8c07adb97044', 'dsadasddasdasd', 'dasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasd<b>adasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdad</b>asdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasda', false, false, 2, '2025-07-10 01:02:57.580101', '2025-08-01 22:33:46.477787', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '0ccbf5d8-0ebb-45fb-a423-8c07adb97044.', NULL, 3, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('7e4a6d18-30fe-426c-b40a-5a7688b12335', 'saddasdasd', 'adasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasdadasdasd', false, false, 2, '2025-07-14 20:39:42.902705', '2025-07-27 16:29:44.943999', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '7e4a6d18-30fe-426c-b40a-5a7688b12335.', NULL, 4, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('1c522740-ec31-4d4c-87e0-e40b8aff49a5', 'Re: PEMBAHASAN TENTANG MATERI MINGGU KE 5', 'dasdasd', false, false, 0, '2025-07-30 21:55:49.488075', '2025-07-30 21:55:49.488075', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '1c522740-ec31-4d4c-87e0-e40b8aff49a5.', '9ef49fa6-47c4-4829-9c45-af53a888f2c0', 0, false, false, 'discussion', 0, NULL);
INSERT INTO public.forum_posts VALUES ('0e99a45e-1ac1-4895-b71f-8f99f057885c', 'dasdsadasdasd', 'dasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasdadasdasdasdasda', false, false, 2, '2025-07-08 00:20:25.557932', '2025-08-01 22:33:48.705709', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '93739b43-c91b-486d-b4da-0d49eada1a7b', '0e99a45e-1ac1-4895-b71f-8f99f057885c.', NULL, 2, false, false, 'discussion', 1, NULL);


--
-- TOC entry 5089 (class 0 OID 33011)
-- Dependencies: 224
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.grades VALUES ('d1adba3d-099f-48d6-91fd-3f5e627c411a', 70.00, 100.00, 'asdasd', '2025-05-28 11:21:00.076', '2025-05-28 19:21:00.093958', '2025-05-28 19:21:00.093958', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '5033c3d3-6929-4737-8c65-ea2e0258d62e', '5bb6269d-91b9-4a7b-ae28-136f75d78c26', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.grades VALUES ('258fa9e3-a6a4-4fa8-ae9d-1f43bd824e60', 90.00, 100.00, 'Mantap', '2025-07-14 12:47:59.898', '2025-07-14 20:48:00.335113', '2025-07-14 20:48:00.335113', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'cb737b1b-4f28-4690-beda-0326321f60df', '73e4d5b4-d932-4bc7-80c2-00e7a9de6a01', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.grades VALUES ('b27c3f1b-9878-4201-b60a-759f62f89fcb', 87.00, 100.00, 'SEBAIKNYA GINI', '2025-07-14 13:53:01.424', '2025-07-14 21:53:01.862923', '2025-07-14 21:53:01.862923', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '4d706873-c0d4-47c7-bc62-1a0e7704a464', '0f69fb8a-0663-4c8a-8572-c84cbfc9c4ab', '93739b43-c91b-486d-b4da-0d49eada1a7b');
INSERT INTO public.grades VALUES ('ae7d8257-0963-4333-b7b1-cb1522ce78a6', 76.00, 100.00, 'Dinilai via dashboard', '2025-08-02 10:54:15.051', '2025-08-02 18:54:15.068329', '2025-08-02 18:54:15.068329', '2024ece7-edc2-4f75-bdd2-e605512f4ac7', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '12f10405-67d3-40f0-aa1b-2197c11bafb0', '7e0681ff-090b-4390-b4b1-728b5bb6d645', '93739b43-c91b-486d-b4da-0d49eada1a7b');


--
-- TOC entry 5082 (class 0 OID 32859)
-- Dependencies: 217
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.migrations VALUES (1, 1716390000000, 'InitialMigration1716390000000');


--
-- TOC entry 5092 (class 0 OID 33049)
-- Dependencies: 227
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5088 (class 0 OID 32999)
-- Dependencies: 223
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.submissions VALUES ('5bb6269d-91b9-4a7b-ae28-136f75d78c26', NULL, NULL, NULL, NULL, 'graded', '2025-05-28 11:19:45.592', false, '2025-05-28 19:19:45.592831', '2025-05-28 19:21:00.084167', '5033c3d3-6929-4737-8c65-ea2e0258d62e', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.submissions VALUES ('6b3c740b-3252-4761-8835-b13373985b5a', NULL, NULL, NULL, NULL, 'draft', NULL, false, '2025-05-28 19:35:47.537723', '2025-05-28 19:35:47.537723', 'b1ad29f8-910b-40a6-9573-1f2779a1067f', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.submissions VALUES ('73e4d5b4-d932-4bc7-80c2-00e7a9de6a01', 'asdsadasdasd', '1CV_Muhammad Haikal Rahman.pdf', 'uploads/fc821f40d6cfafd7b37ef140e7ce6053', 567677, 'graded', '2025-07-14 12:47:41.084', false, '2025-07-14 20:47:40.913496', '2025-07-14 20:48:00.322291', 'cb737b1b-4f28-4690-beda-0326321f60df', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.submissions VALUES ('339b95f4-1190-4d32-8d57-3fb09939e4cd', 'dasdasdsad13213123', '20254thicera-certificate (2).pdf', 'uploads/c6a1d6948cc57ae7e235a7897a93b537', 877806, 'submitted', '2025-07-14 12:48:21.682', true, '2025-07-14 20:48:22.344974', '2025-07-14 20:48:22.344974', '41d60f30-f860-4bc4-a8e9-0e0a80356a39', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.submissions VALUES ('0f69fb8a-0663-4c8a-8572-c84cbfc9c4ab', 'INI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYAINI JAWABAN SAYA', 'KTM.pdf', 'uploads/0235f1f896e990344385d966c3bf688f', 231018, 'graded', '2025-07-14 13:51:14.073', false, '2025-07-14 21:51:14.174794', '2025-07-14 21:53:01.854345', '4d706873-c0d4-47c7-bc62-1a0e7704a464', '36515d7c-394d-4570-aaf1-9c1abc9a4618');
INSERT INTO public.submissions VALUES ('7e0681ff-090b-4390-b4b1-728b5bb6d645', '4324324234234', '20254thicera-certificate (2).pdf', 'uploads/2b76f37ada20c7545074370a9b4af822', 877806, 'graded', '2025-07-14 12:50:07.885', false, '2025-07-14 20:50:07.687234', '2025-08-02 18:54:15.05024', '12f10405-67d3-40f0-aa1b-2197c11bafb0', '36515d7c-394d-4570-aaf1-9c1abc9a4618');


--
-- TOC entry 5083 (class 0 OID 32933)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('ccd31bc2-17c9-4b96-8baa-347c7bcc3996', 'admin@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Administrator', NULL, NULL, 'admin', NULL, NULL, NULL, true, '2025-05-23 10:28:42.237768', '2025-05-23 10:28:42.237768');
INSERT INTO public.users VALUES ('93739b43-c91b-486d-b4da-0d49eada1a7b', 'lecturer@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Dr. John Lecturer', NULL, 'LEC001', 'lecturer', NULL, NULL, NULL, true, '2025-05-23 10:28:42.27242', '2025-05-23 10:28:42.27242');
INSERT INTO public.users VALUES ('36515d7c-394d-4570-aaf1-9c1abc9a4618', 'student@lms.com', '$2a$10$LGx3NSFEUozWNjzojuB3V.GIO9SY8/4meLEIys6Pb15sjDzr1B9lO', 'Jane Student', 'STD001', NULL, 'student', NULL, NULL, NULL, true, '2025-05-23 10:28:42.280355', '2025-05-23 10:28:42.280355');
INSERT INTO public.users VALUES ('407bbc2d-3f5a-4314-ab68-26cdfcf15192', 'munir@munir.com', '$2a$10$VDTaoVECwzSaDYEyVQnhOOJaq8Wiz7SZJ7jYBATAgriPYlMGJPTjK', 'munir', '12345', NULL, 'student', '082169639538', NULL, NULL, true, '2025-07-04 17:04:35.440725', '2025-07-04 17:04:35.440725');


--
-- TOC entry 5093 (class 0 OID 57440)
-- Dependencies: 228
-- Data for Name: video_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.video_progress VALUES ('eed12348-35de-48e5-9c36-751d5c856343', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '690aeb49-ec84-4f72-b73d-1f59a830c651', 0, NULL, 100, 0, true, '2025-07-27 04:51:27.334', false, '[]', '2025-07-27 12:51:18.957044', '2025-07-27 12:51:27.382176');
INSERT INTO public.video_progress VALUES ('c378e4ab-fd4f-402b-83be-8efd6b435830', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'b4283028-cc52-42c9-8b7c-f30367deafd6', 0, NULL, 100, 0, true, '2025-07-27 05:07:48.068', false, '[]', '2025-07-27 13:07:31.585042', '2025-07-27 13:07:48.065383');
INSERT INTO public.video_progress VALUES ('f544ec68-7a31-4141-acc7-b063364836c9', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '281b7411-49a3-4ffb-9d0f-8940b525047a', 0, NULL, 100, 0, true, '2025-07-27 05:08:25.051', false, '[]', '2025-07-27 13:08:13.134526', '2025-07-27 13:08:24.983281');
INSERT INTO public.video_progress VALUES ('8f69489a-654f-4576-a24f-a382318608bf', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '5273424f-4b06-40af-8eb2-a328186214ff', 2.222255, NULL, 30.642072170208074, 2.222255, true, '2025-07-27 05:19:44.337', false, '[]', '2025-07-27 13:19:31.358087', '2025-07-27 13:19:59.59052');
INSERT INTO public.video_progress VALUES ('774b77f5-00fb-4f90-bd86-cc226da3601e', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'b2e698ba-302a-4303-82a1-714a301df9bc', 0, NULL, 100, 0, true, '2025-07-27 05:20:23.52', false, '[]', '2025-07-27 13:20:10.724537', '2025-07-27 13:20:23.525734');
INSERT INTO public.video_progress VALUES ('e1eab35d-1588-4209-9160-6b3876837ea2', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'f1b452e4-66fc-4274-a92a-5377466ae71b', 0, NULL, 100, 0, true, '2025-07-27 08:21:58.086', true, '[]', '2025-07-27 16:21:48.073508', '2025-07-27 16:22:33.977953');
INSERT INTO public.video_progress VALUES ('61d50edc-a518-4706-a28b-aa4d969a3b1c', '36515d7c-394d-4570-aaf1-9c1abc9a4618', '169c6d06-82f7-448e-8b3b-55f551d39839', 0, NULL, 100, 0, true, '2025-07-27 08:22:34.323', true, '[]', '2025-07-27 16:22:22.409916', '2025-07-27 16:22:33.977953');
INSERT INTO public.video_progress VALUES ('0e97bfa3-aabe-4b0e-b60b-c752ebd5bfab', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'ce03b875-3535-4ed1-b3ea-06c27c8d2431', 0, NULL, 100, 0, true, '2025-07-27 04:50:27.217', false, '[]', '2025-07-27 12:50:17.60551', '2025-07-27 12:50:27.294526');
INSERT INTO public.video_progress VALUES ('df8159db-c117-4739-a116-9beeb9726cbd', '36515d7c-394d-4570-aaf1-9c1abc9a4618', 'b7d17606-5b6f-4fb6-868f-a2328beb4d28', 0, NULL, 100, 0, true, '2025-07-27 04:50:55.5', false, '[]', '2025-07-27 12:50:46.644004', '2025-07-27 12:50:55.517974');


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 216
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 2, true);


--
-- TOC entry 4852 (class 2606 OID 32866)
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 33048)
-- Name: announcements PK_announcements_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "PK_announcements_id" PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 32998)
-- Name: assignments PK_assignments_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "PK_assignments_id" PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 57490)
-- Name: attendances PK_attendances; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "PK_attendances" PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 32968)
-- Name: course_enrollments PK_course_enrollments; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "PK_course_enrollments" PRIMARY KEY ("courseId", "studentId");


--
-- TOC entry 4870 (class 2606 OID 32981)
-- Name: course_materials PK_course_materials_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "PK_course_materials_id" PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 32961)
-- Name: courses PK_courses_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_courses_id" PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 33036)
-- Name: forum_posts PK_forum_posts_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "PK_forum_posts_id" PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 33020)
-- Name: grades PK_grades_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "PK_grades_id" PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 33059)
-- Name: notifications PK_notifications_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_notifications_id" PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 33010)
-- Name: submissions PK_submissions_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "PK_submissions_id" PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 32944)
-- Name: users PK_users_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users_id" PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 57454)
-- Name: video_progress PK_video_progress; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "PK_video_progress" PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 33022)
-- Name: grades REL_grades_submissionId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "REL_grades_submissionId" UNIQUE ("submissionId");


--
-- TOC entry 4894 (class 2606 OID 57553)
-- Name: video_progress UQ_3d80b3a91eb3096b9caa0634862; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "UQ_3d80b3a91eb3096b9caa0634862" UNIQUE ("studentId", "materialId");


--
-- TOC entry 4864 (class 2606 OID 32963)
-- Name: courses UQ_courses_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "UQ_courses_code" UNIQUE (code);


--
-- TOC entry 4856 (class 2606 OID 32946)
-- Name: users UQ_users_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_email" UNIQUE (email);


--
-- TOC entry 4858 (class 2606 OID 32950)
-- Name: users UQ_users_lecturerId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_lecturerId" UNIQUE ("lecturerId");


--
-- TOC entry 4860 (class 2606 OID 32948)
-- Name: users UQ_users_studentId; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_users_studentId" UNIQUE ("studentId");


--
-- TOC entry 4903 (class 2606 OID 57644)
-- Name: forum_post_likes forum_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT forum_post_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 57646)
-- Name: forum_post_likes unique_user_post_like; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT unique_user_post_like UNIQUE (post_id, user_id);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 4908
-- Name: CONSTRAINT unique_user_post_like ON forum_post_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT unique_user_post_like ON public.forum_post_likes IS 'Prevents users from liking the same post multiple times';


--
-- TOC entry 4865 (class 1259 OID 33167)
-- Name: IDX_0533bdb161365ccbec0c890640; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0533bdb161365ccbec0c890640" ON public.course_enrollments USING btree ("studentId");


--
-- TOC entry 4879 (class 1259 OID 57545)
-- Name: IDX_151dff45f01c0c195022e7db12; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_151dff45f01c0c195022e7db12" ON public.forum_posts USING btree ("authorId");


--
-- TOC entry 4890 (class 1259 OID 57549)
-- Name: IDX_3d80b3a91eb3096b9caa063486; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_3d80b3a91eb3096b9caa063486" ON public.video_progress USING btree ("studentId", "materialId");


--
-- TOC entry 4880 (class 1259 OID 57548)
-- Name: IDX_5a609f43233d54cdffb545b379; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_5a609f43233d54cdffb545b379" ON public.forum_posts USING btree ("courseId", "createdAt");


--
-- TOC entry 4881 (class 1259 OID 57544)
-- Name: IDX_8737b85e7e3ac9c09b6b596a06; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8737b85e7e3ac9c09b6b596a06" ON public.forum_posts USING btree ("courseId");


--
-- TOC entry 4882 (class 1259 OID 57547)
-- Name: IDX_90dc8f3363be0aac17437a84cd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_90dc8f3363be0aac17437a84cd" ON public.forum_posts USING btree ("courseId", "isPinned");


--
-- TOC entry 4883 (class 1259 OID 57546)
-- Name: IDX_d04fb6f55fbbf1e27dfc2de76a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d04fb6f55fbbf1e27dfc2de76a" ON public.forum_posts USING btree ("parentId");


--
-- TOC entry 4866 (class 1259 OID 33166)
-- Name: IDX_d77e489db35c7d325700d799be; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d77e489db35c7d325700d799be" ON public.course_enrollments USING btree ("courseId");


--
-- TOC entry 4895 (class 1259 OID 57550)
-- Name: IDX_f186e7ffcddc03565bd913f764; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f186e7ffcddc03565bd913f764" ON public.attendances USING btree ("courseId", "attendanceDate");


--
-- TOC entry 4896 (class 1259 OID 57551)
-- Name: IDX_fe0383be1768c5fb57ca1bd4c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fe0383be1768c5fb57ca1bd4c0" ON public.attendances USING btree ("studentId", "courseId", "attendanceDate");


--
-- TOC entry 4899 (class 1259 OID 57585)
-- Name: idx_attendances_course_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_course_week ON public.attendances USING btree ("courseId", week);


--
-- TOC entry 4900 (class 1259 OID 57584)
-- Name: idx_attendances_student_course_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_student_course_week ON public.attendances USING btree ("studentId", "courseId", week);


--
-- TOC entry 4901 (class 1259 OID 57586)
-- Name: idx_attendances_week_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendances_week_status ON public.attendances USING btree (week, status);


--
-- TOC entry 4904 (class 1259 OID 57659)
-- Name: idx_forum_post_likes_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_created_at ON public.forum_post_likes USING btree (created_at);


--
-- TOC entry 4905 (class 1259 OID 57657)
-- Name: idx_forum_post_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_post_id ON public.forum_post_likes USING btree (post_id);


--
-- TOC entry 4906 (class 1259 OID 57658)
-- Name: idx_forum_post_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_likes_user_id ON public.forum_post_likes USING btree (user_id);


--
-- TOC entry 4937 (class 2620 OID 57661)
-- Name: forum_post_likes trigger_update_forum_post_likes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_forum_post_likes_updated_at BEFORE UPDATE ON public.forum_post_likes FOR EACH ROW EXECUTE FUNCTION public.update_forum_post_likes_updated_at();


--
-- TOC entry 4910 (class 2606 OID 33263)
-- Name: course_enrollments FK_0533bdb161365ccbec0c8906408; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "FK_0533bdb161365ccbec0c8906408" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- TOC entry 4923 (class 2606 OID 33228)
-- Name: forum_posts FK_151dff45f01c0c195022e7db127; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_151dff45f01c0c195022e7db127" FOREIGN KEY ("authorId") REFERENCES public.users(id);


--
-- TOC entry 4924 (class 2606 OID 57554)
-- Name: forum_posts FK_1554fa495bffe98b6fc627ecd12; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_1554fa495bffe98b6fc627ecd12" FOREIGN KEY ("parentPostId") REFERENCES public.forum_posts(id);


--
-- TOC entry 4916 (class 2606 OID 33208)
-- Name: submissions FK_4fc99318a291abd7e2a50f50851; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_4fc99318a291abd7e2a50f50851" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- TOC entry 4932 (class 2606 OID 57569)
-- Name: attendances FK_615b414059091a9a8ea0355ae89; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_615b414059091a9a8ea0355ae89" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 33253)
-- Name: notifications FK_692a909ee0fa9383e7859f9b406; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- TOC entry 4933 (class 2606 OID 57579)
-- Name: attendances FK_6df4841e53822d299212e278f03; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_6df4841e53822d299212e278f03" FOREIGN KEY ("triggerMaterialId") REFERENCES public.course_materials(id) ON DELETE SET NULL;


--
-- TOC entry 4927 (class 2606 OID 33238)
-- Name: announcements FK_8464026cbf8a3841602563e5bb1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "FK_8464026cbf8a3841602563e5bb1" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 33223)
-- Name: forum_posts FK_8737b85e7e3ac9c09b6b596a06b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_8737b85e7e3ac9c09b6b596a06b" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 33243)
-- Name: announcements FK_92d72877cc8c092c83f37c62752; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "FK_92d72877cc8c092c83f37c62752" FOREIGN KEY ("authorId") REFERENCES public.users(id);


--
-- TOC entry 4909 (class 2606 OID 33248)
-- Name: courses FK_991b0b42fb5ca44bf61d3772188; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "FK_991b0b42fb5ca44bf61d3772188" FOREIGN KEY ("lecturerId") REFERENCES public.users(id);


--
-- TOC entry 4918 (class 2606 OID 33188)
-- Name: grades FK_9a4ec29a3b29310f9fe8999bf3f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_9a4ec29a3b29310f9fe8999bf3f" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4914 (class 2606 OID 33213)
-- Name: assignments FK_9e5684667ea189ade0fc79fa4f1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_9e5684667ea189ade0fc79fa4f1" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 33168)
-- Name: course_materials FK_ace3ef4157ae10a215848945a36; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "FK_ace3ef4157ae10a215848945a36" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 33198)
-- Name: grades FK_bb2c0b9046d01f4f6b1396f7803; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_bb2c0b9046d01f4f6b1396f7803" FOREIGN KEY ("gradedById") REFERENCES public.users(id);


--
-- TOC entry 4917 (class 2606 OID 33203)
-- Name: submissions FK_c2611c601f49945ceff5c0909a2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_c2611c601f49945ceff5c0909a2" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 33173)
-- Name: course_materials FK_c72fda5c18f31710e7decde8bc3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT "FK_c72fda5c18f31710e7decde8bc3" FOREIGN KEY ("uploadedById") REFERENCES public.users(id);


--
-- TOC entry 4926 (class 2606 OID 33233)
-- Name: forum_posts FK_d04fb6f55fbbf1e27dfc2de76a8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT "FK_d04fb6f55fbbf1e27dfc2de76a8" FOREIGN KEY ("parentId") REFERENCES public.forum_posts(id);


--
-- TOC entry 4911 (class 2606 OID 33258)
-- Name: course_enrollments FK_d77e489db35c7d325700d799be6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT "FK_d77e489db35c7d325700d799be6" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 33193)
-- Name: grades FK_d9d3e0c4ac49ec8411b52f2fb87; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_d9d3e0c4ac49ec8411b52f2fb87" FOREIGN KEY ("submissionId") REFERENCES public.submissions(id);


--
-- TOC entry 4934 (class 2606 OID 57574)
-- Name: attendances FK_e3d2dbf34d49f5cc2384398ea90; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_e3d2dbf34d49f5cc2384398ea90" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 57564)
-- Name: video_progress FK_f426680feb3428604a4a0fb6643; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "FK_f426680feb3428604a4a0fb6643" FOREIGN KEY ("materialId") REFERENCES public.course_materials(id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 33218)
-- Name: assignments FK_f5c22e1640b8496e2556a8fd3ac; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_f5c22e1640b8496e2556a8fd3ac" FOREIGN KEY ("lecturerId") REFERENCES public.users(id);


--
-- TOC entry 4921 (class 2606 OID 33183)
-- Name: grades FK_fcfc027e4e5fb37a4372e688070; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_fcfc027e4e5fb37a4372e688070" FOREIGN KEY ("studentId") REFERENCES public.users(id);


--
-- TOC entry 4931 (class 2606 OID 57559)
-- Name: video_progress FK_fe9e35dcfc37f05799f8689b5c6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT "FK_fe9e35dcfc37f05799f8689b5c6" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 33178)
-- Name: grades FK_ff09424ef05361e1c47fa03d82b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT "FK_ff09424ef05361e1c47fa03d82b" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4935 (class 2606 OID 57647)
-- Name: forum_post_likes fk_forum_post_likes_post; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT fk_forum_post_likes_post FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 57652)
-- Name: forum_post_likes fk_forum_post_likes_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_likes
    ADD CONSTRAINT fk_forum_post_likes_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-08-06 09:52:49

--
-- PostgreSQL database dump complete
--


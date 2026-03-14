--
-- PostgreSQL database dump
--

\restrict TbKP4cFlqi0XqOZKrLYiSWMCOSxaDeLY2qfPOzJ1wmuH4dcklr7nhwENNvcOg8j

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_assignments (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    employee_id bigint,
    department_id bigint,
    branch_id bigint,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    returned_at timestamp without time zone,
    assigned_by character varying(255),
    return_notes text,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.asset_assignments OWNER TO postgres;

--
-- Name: asset_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asset_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_assignments_id_seq OWNER TO postgres;

--
-- Name: asset_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asset_assignments_id_seq OWNED BY public.asset_assignments.id;


--
-- Name: asset_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_categories (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asset_categories OWNER TO postgres;

--
-- Name: asset_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asset_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_categories_id_seq OWNER TO postgres;

--
-- Name: asset_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asset_categories_id_seq OWNED BY public.asset_categories.id;


--
-- Name: asset_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_status_history (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    old_status character varying(50),
    new_status character varying(50) NOT NULL,
    changed_by character varying(255) NOT NULL,
    reason text,
    changed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asset_status_history OWNER TO postgres;

--
-- Name: asset_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asset_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_status_history_id_seq OWNER TO postgres;

--
-- Name: asset_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asset_status_history_id_seq OWNED BY public.asset_status_history.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    serial_number character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    category_id bigint NOT NULL,
    status character varying(50) DEFAULT 'REGISTERED'::character varying NOT NULL,
    purchase_date date,
    purchase_cost numeric(15,2),
    warranty_expiry_date date,
    image_path character varying(500),
    notes text,
    current_employee_id bigint,
    current_department_id bigint,
    current_branch_id bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_asset_status CHECK (((status)::text = ANY ((ARRAY['REGISTERED'::character varying, 'ASSIGNED'::character varying, 'IN_REPAIR'::character varying, 'LOST'::character varying, 'WRITTEN_OFF'::character varying])::text[])))
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id bigint NOT NULL,
    action character varying(50) NOT NULL,
    performed_by character varying(255) NOT NULL,
    details jsonb,
    ip_address character varying(50),
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    branch_id bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    employee_code character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(50),
    "position" character varying(200),
    department_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'USER'::character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_role CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'MANAGER'::character varying, 'USER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: asset_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments ALTER COLUMN id SET DEFAULT nextval('public.asset_assignments_id_seq'::regclass);


--
-- Name: asset_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories ALTER COLUMN id SET DEFAULT nextval('public.asset_categories_id_seq'::regclass);


--
-- Name: asset_status_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_status_history ALTER COLUMN id SET DEFAULT nextval('public.asset_status_history_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: asset_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_assignments (id, asset_id, employee_id, department_id, branch_id, assigned_at, returned_at, assigned_by, return_notes, active) FROM stdin;
\.


--
-- Data for Name: asset_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_categories (id, name, description, created_at) FROM stdin;
1	IT	IT equipment: laptops, desktops, servers, networking	2026-03-05 07:18:50.147708
2	Office	Office equipment: desks, chairs, cabinets	2026-03-05 07:18:50.147708
3	Security	Security equipment: cameras, access control, safes	2026-03-05 07:18:50.147708
4	Communication	Communication devices: phones, intercoms	2026-03-05 07:18:50.147708
5	Peripherals	Peripheral devices: monitors, printers, scanners	2026-03-05 07:18:50.147708
6	Banking Equipment	Banking-specific: ATMs, POS terminals, cash counters	2026-03-05 07:18:50.147708
\.


--
-- Data for Name: asset_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_status_history (id, asset_id, old_status, new_status, changed_by, reason, changed_at) FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, name, description, serial_number, type, category_id, status, purchase_date, purchase_cost, warranty_expiry_date, image_path, notes, current_employee_id, current_department_id, current_branch_id, created_at, updated_at) FROM stdin;
1	Bank POS Terminal 1	Standard POS Terminal for daily operations.	SN-E6EB106C	POS Terminal	6	ASSIGNED	2023-06-08	3409.25	2026-06-07	\N	\N	13	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
3	Bank Intercom 3	Standard Intercom for daily operations.	SN-BAE66801	Intercom	4	ASSIGNED	2023-05-16	4164.93	2024-05-15	\N	\N	4	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
4	Bank ATM 4	Standard ATM for daily operations.	SN-F70FCB2F	ATM	6	IN_REPAIR	2023-11-12	1076.26	2025-11-11	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
5	Bank Printer 5	Standard Printer for daily operations.	SN-9E226ABB	Printer	5	ASSIGNED	2023-07-21	2143.93	2026-07-20	\N	\N	18	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
6	Bank Intercom 6	Standard Intercom for daily operations.	SN-EDD359E1	Intercom	4	IN_REPAIR	2023-02-19	4370.76	2026-02-18	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
7	Bank CCTV Camera 7	Standard CCTV Camera for daily operations.	SN-A9A5F68B	CCTV Camera	3	IN_REPAIR	2023-09-23	774.51	2026-09-22	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
8	Bank IP Phone 8	Standard IP Phone for daily operations.	SN-7E224DC5	IP Phone	4	ASSIGNED	2023-08-13	3384.57	2026-08-12	\N	\N	14	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
9	Bank Cash Counter 9	Standard Cash Counter for daily operations.	SN-534A4DD3	Cash Counter	6	REGISTERED	2023-07-15	330.41	2026-07-14	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
10	Bank Access Control Panel 10	Standard Access Control Panel for daily operations.	SN-9C9E7FC3	Access Control Panel	3	IN_REPAIR	2023-04-21	312.56	2024-04-20	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
11	Bank ATM 11	Standard ATM for daily operations.	SN-90175C8B	ATM	6	ASSIGNED	2023-01-15	1496.73	2026-01-14	\N	\N	13	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
12	Bank POS Terminal 12	Standard POS Terminal for daily operations.	SN-DA0B6B9B	POS Terminal	6	LOST	2023-03-17	2658.06	2026-03-16	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
13	Bank Filing Cabinet 13	Standard Filing Cabinet for daily operations.	SN-F5C5EA0E	Filing Cabinet	2	ASSIGNED	2023-04-06	3187.97	2026-04-05	\N	\N	9	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
14	Bank CCTV Camera 14	Standard CCTV Camera for daily operations.	SN-48E6A64A	CCTV Camera	3	ASSIGNED	2023-06-21	1054.80	2025-06-20	\N	\N	9	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
15	Bank Desk 15	Standard Desk for daily operations.	SN-7C5AEB4F	Desk	2	ASSIGNED	2023-09-09	591.10	2024-09-08	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
16	Bank Safe 16	Standard Safe for daily operations.	SN-D8C7B1F5	Safe	3	ASSIGNED	2023-07-24	1981.70	2024-07-23	\N	\N	1	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
17	Bank Server 17	Standard Server for daily operations.	SN-4CFDA2BE	Server	1	ASSIGNED	2023-08-19	3946.24	2026-08-18	\N	\N	19	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
18	Bank Filing Cabinet 18	Standard Filing Cabinet for daily operations.	SN-35371BC3	Filing Cabinet	2	ASSIGNED	2023-12-17	3289.90	2025-12-16	\N	\N	3	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
19	Bank Server 19	Standard Server for daily operations.	SN-00E3B0BD	Server	1	IN_REPAIR	2023-09-23	3477.68	2025-09-22	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
20	Bank POS Terminal 20	Standard POS Terminal for daily operations.	SN-3E2523A3	POS Terminal	6	ASSIGNED	2023-06-17	4571.97	2024-06-16	\N	\N	14	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
21	Bank Office Chair 21	Standard Office Chair for daily operations.	SN-50C71D08	Office Chair	2	ASSIGNED	2023-05-25	3765.96	2026-05-24	\N	\N	2	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
22	Bank Monitor 22	Standard Monitor for daily operations.	SN-3BC9AA60	Monitor	5	ASSIGNED	2023-07-19	2281.33	2024-07-18	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
23	Bank Intercom 23	Standard Intercom for daily operations.	SN-AACC2625	Intercom	4	IN_REPAIR	2023-08-13	815.49	2025-08-12	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
24	Bank Scanner 24	Standard Scanner for daily operations.	SN-F6E580C9	Scanner	5	REGISTERED	2023-10-10	4024.94	2024-10-09	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
25	Bank Intercom 25	Standard Intercom for daily operations.	SN-CFCC86AA	Intercom	4	REGISTERED	2023-02-08	1154.54	2024-02-08	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
26	Bank POS Terminal 26	Standard POS Terminal for daily operations.	SN-E0C9CAB7	POS Terminal	6	REGISTERED	2023-02-04	4107.04	2024-02-04	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
27	Bank Intercom 27	Standard Intercom for daily operations.	SN-CFA72738	Intercom	4	IN_REPAIR	2023-08-05	685.97	2026-08-04	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
28	Bank Server 28	Standard Server for daily operations.	SN-EB6D97A8	Server	1	ASSIGNED	2023-06-02	2948.87	2026-06-01	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
29	Bank ATM 29	Standard ATM for daily operations.	SN-8353BBB7	ATM	6	REGISTERED	2023-01-15	3557.67	2024-01-15	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
30	Bank Cash Counter 30	Standard Cash Counter for daily operations.	SN-475C0808	Cash Counter	6	IN_REPAIR	2023-10-30	4009.64	2026-10-29	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
31	Bank Safe 31	Standard Safe for daily operations.	SN-172BF2A7	Safe	3	ASSIGNED	2023-11-18	2700.44	2024-11-17	\N	\N	20	10	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
32	Bank Safe 32	Standard Safe for daily operations.	SN-B135E912	Safe	3	REGISTERED	2023-07-16	2495.93	2024-07-15	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
33	Bank ATM 33	Standard ATM for daily operations.	SN-529C6733	ATM	6	ASSIGNED	2023-03-13	2560.59	2025-03-12	\N	\N	11	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
34	Bank Router 34	Standard Router for daily operations.	SN-FFF538A2	Router	1	ASSIGNED	2023-05-22	3979.12	2026-05-21	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
35	Bank Safe 35	Standard Safe for daily operations.	SN-8A806098	Safe	3	ASSIGNED	2023-06-20	513.62	2026-06-19	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
36	Bank Monitor 36	Standard Monitor for daily operations.	SN-FBE86CD1	Monitor	5	ASSIGNED	2023-07-10	1777.55	2026-07-09	\N	\N	5	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
37	Bank Office Chair 37	Standard Office Chair for daily operations.	SN-D3B3AAD0	Office Chair	2	REGISTERED	2023-08-03	2736.62	2025-08-02	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
38	Bank Office Chair 38	Standard Office Chair for daily operations.	SN-D3C1A009	Office Chair	2	ASSIGNED	2023-01-03	4348.48	2026-01-02	\N	\N	10	10	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
39	Bank Office Chair 39	Standard Office Chair for daily operations.	SN-F6BF8D9B	Office Chair	2	LOST	2023-10-08	1348.90	2025-10-07	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
40	Bank Office Chair 40	Standard Office Chair for daily operations.	SN-3F9F2DB0	Office Chair	2	IN_REPAIR	2023-02-11	975.96	2025-02-10	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
41	Bank Access Control Panel 41	Standard Access Control Panel for daily operations.	SN-5CB2C680	Access Control Panel	3	ASSIGNED	2023-12-21	4221.92	2025-12-20	\N	\N	4	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
42	Bank Monitor 42	Standard Monitor for daily operations.	SN-ABFA6409	Monitor	5	IN_REPAIR	2023-11-12	2209.46	2025-11-11	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
43	Bank Router 43	Standard Router for daily operations.	SN-3EF72B3A	Router	1	REGISTERED	2023-12-27	1572.15	2025-12-26	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
44	Bank Monitor 44	Standard Monitor for daily operations.	SN-A3328D3C	Monitor	5	ASSIGNED	2024-01-01	933.99	2024-12-31	\N	\N	2	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
45	Bank Intercom 45	Standard Intercom for daily operations.	SN-4DFB322D	Intercom	4	ASSIGNED	2023-01-27	891.86	2026-01-26	\N	\N	18	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
46	Bank Office Chair 46	Standard Office Chair for daily operations.	SN-331D0A5C	Office Chair	2	ASSIGNED	2023-01-26	1517.06	2026-01-25	\N	\N	4	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
47	Bank Desk 47	Standard Desk for daily operations.	SN-43159DCA	Desk	2	ASSIGNED	2023-07-04	3909.36	2024-07-03	\N	\N	1	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
48	Bank Server 48	Standard Server for daily operations.	SN-71EEAD58	Server	1	ASSIGNED	2023-10-10	2601.97	2024-10-09	\N	\N	13	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
49	Bank Desktop 49	Standard Desktop for daily operations.	SN-BF1EF5C7	Desktop	1	ASSIGNED	2023-05-14	1084.86	2024-05-13	\N	\N	18	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
50	Bank Intercom 50	Standard Intercom for daily operations.	SN-EDD47DC0	Intercom	4	REGISTERED	2023-10-08	3034.42	2024-10-07	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
51	Bank IP Phone 51	Standard IP Phone for daily operations.	SN-8940B11D	IP Phone	4	ASSIGNED	2023-05-30	1035.48	2026-05-29	\N	\N	12	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
52	Bank Desktop 52	Standard Desktop for daily operations.	SN-43AC90E9	Desktop	1	ASSIGNED	2023-05-07	771.76	2024-05-06	\N	\N	5	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
53	Bank Filing Cabinet 53	Standard Filing Cabinet for daily operations.	SN-0371B77E	Filing Cabinet	2	ASSIGNED	2023-12-04	3462.15	2025-12-03	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
54	Bank Scanner 54	Standard Scanner for daily operations.	SN-EF3834E2	Scanner	5	IN_REPAIR	2023-08-20	3677.87	2026-08-19	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
55	Bank Office Chair 55	Standard Office Chair for daily operations.	SN-694DF666	Office Chair	2	ASSIGNED	2023-12-19	2989.97	2025-12-18	\N	\N	3	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
56	Bank POS Terminal 56	Standard POS Terminal for daily operations.	SN-9FE150E8	POS Terminal	6	LOST	2023-06-02	1435.89	2025-06-01	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
57	Bank Desk 57	Standard Desk for daily operations.	SN-4B215C97	Desk	2	ASSIGNED	2023-11-17	2584.83	2026-11-16	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
58	Bank CCTV Camera 58	Standard CCTV Camera for daily operations.	SN-0EDBB462	CCTV Camera	3	ASSIGNED	2023-04-17	4782.68	2024-04-16	\N	\N	17	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
59	Bank Safe 59	Standard Safe for daily operations.	SN-3D5A6FB0	Safe	3	ASSIGNED	2023-09-29	1859.53	2026-09-28	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
60	Bank Router 60	Standard Router for daily operations.	SN-C5C0FD8A	Router	1	ASSIGNED	2023-08-24	1821.34	2024-08-23	\N	\N	15	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
61	Bank Desk 61	Standard Desk for daily operations.	SN-8C52DCA3	Desk	2	ASSIGNED	2023-10-23	4435.40	2026-10-22	\N	\N	15	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
62	Bank Intercom 62	Standard Intercom for daily operations.	SN-99D79ADE	Intercom	4	IN_REPAIR	2023-04-02	953.01	2024-04-01	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
63	Bank Monitor 63	Standard Monitor for daily operations.	SN-04C84337	Monitor	5	REGISTERED	2023-01-07	2847.40	2026-01-06	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
64	Bank Intercom 64	Standard Intercom for daily operations.	SN-CB348EB0	Intercom	4	ASSIGNED	2023-12-13	4975.16	2024-12-12	\N	\N	1	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
65	Bank Desk 65	Standard Desk for daily operations.	SN-33367022	Desk	2	ASSIGNED	2023-06-16	3331.46	2026-06-15	\N	\N	20	10	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
66	Bank Filing Cabinet 66	Standard Filing Cabinet for daily operations.	SN-71E192E0	Filing Cabinet	2	ASSIGNED	2023-11-01	4577.17	2026-10-31	\N	\N	10	10	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
67	Bank CCTV Camera 67	Standard CCTV Camera for daily operations.	SN-119E5529	CCTV Camera	3	LOST	2023-07-02	3509.86	2024-07-01	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
68	Bank Filing Cabinet 68	Standard Filing Cabinet for daily operations.	SN-B6E8B207	Filing Cabinet	2	ASSIGNED	2023-08-08	3130.97	2025-08-07	\N	\N	10	10	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
69	Bank Intercom 69	Standard Intercom for daily operations.	SN-BAA1AA65	Intercom	4	LOST	2023-05-02	1061.35	2024-05-01	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
70	Bank ATM 70	Standard ATM for daily operations.	SN-A8C0B23D	ATM	6	ASSIGNED	2023-07-16	2446.62	2025-07-15	\N	\N	1	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
71	Bank Intercom 71	Standard Intercom for daily operations.	SN-8187AEBC	Intercom	4	ASSIGNED	2023-09-26	908.70	2025-09-25	\N	\N	16	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
72	Bank Office Chair 72	Standard Office Chair for daily operations.	SN-6ABCDE75	Office Chair	2	ASSIGNED	2023-12-01	3440.52	2025-11-30	\N	\N	5	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
73	Bank Scanner 73	Standard Scanner for daily operations.	SN-6352B087	Scanner	5	ASSIGNED	2023-09-16	2265.30	2024-09-15	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
74	Bank Cash Counter 74	Standard Cash Counter for daily operations.	SN-394B5505	Cash Counter	6	IN_REPAIR	2023-04-05	3264.93	2025-04-04	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
75	Bank Office Chair 75	Standard Office Chair for daily operations.	SN-AC3B52EF	Office Chair	2	WRITTEN_OFF	2023-03-19	1973.69	2025-03-18	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
76	Bank Desk 76	Standard Desk for daily operations.	SN-BCC0AF2F	Desk	2	ASSIGNED	2023-07-30	2862.74	2024-07-29	\N	\N	2	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
77	Bank Safe 77	Standard Safe for daily operations.	SN-4086ADB3	Safe	3	ASSIGNED	2023-06-17	1789.36	2025-06-16	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
78	Bank Safe 78	Standard Safe for daily operations.	SN-0B48BD84	Safe	3	REGISTERED	2023-05-10	1875.00	2026-05-09	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
79	Bank IP Phone 79	Standard IP Phone for daily operations.	SN-AE840A54	IP Phone	4	ASSIGNED	2023-08-15	3410.28	2026-08-14	\N	\N	8	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
80	Bank Printer 80	Standard Printer for daily operations.	SN-7A6E5C06	Printer	5	ASSIGNED	2023-05-11	3655.18	2025-05-10	\N	\N	19	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
81	Bank Router 81	Standard Router for daily operations.	SN-2AC9C0DD	Router	1	ASSIGNED	2023-08-05	3196.27	2024-08-04	\N	\N	18	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
82	Bank Scanner 82	Standard Scanner for daily operations.	SN-9C0CFF32	Scanner	5	ASSIGNED	2023-03-20	4319.82	2026-03-19	\N	\N	15	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
83	Bank Access Control Panel 83	Standard Access Control Panel for daily operations.	SN-A22E425D	Access Control Panel	3	ASSIGNED	2023-11-21	359.21	2026-11-20	\N	\N	2	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
84	Bank Filing Cabinet 84	Standard Filing Cabinet for daily operations.	SN-B46E78D5	Filing Cabinet	2	ASSIGNED	2023-07-19	1822.07	2025-07-18	\N	\N	14	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
85	Bank Access Control Panel 85	Standard Access Control Panel for daily operations.	SN-2093FC36	Access Control Panel	3	ASSIGNED	2023-04-19	4409.17	2026-04-18	\N	\N	14	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
86	Bank Laptop 86	Standard Laptop for daily operations.	SN-45806E60	Laptop	1	ASSIGNED	2023-08-24	3070.19	2024-08-23	\N	\N	8	8	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
87	Bank CCTV Camera 87	Standard CCTV Camera for daily operations.	SN-06EBA3EF	CCTV Camera	3	ASSIGNED	2023-05-19	3607.72	2026-05-18	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
88	Bank CCTV Camera 88	Standard CCTV Camera for daily operations.	SN-FB168834	CCTV Camera	3	ASSIGNED	2023-05-07	1641.20	2026-05-06	\N	\N	12	2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
89	Bank Filing Cabinet 89	Standard Filing Cabinet for daily operations.	SN-5F306E81	Filing Cabinet	2	ASSIGNED	2023-03-20	428.43	2024-03-19	\N	\N	6	6	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
90	Bank Scanner 90	Standard Scanner for daily operations.	SN-87D5FB39	Scanner	5	REGISTERED	2023-01-09	2893.06	2026-01-08	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
91	Bank Office Chair 91	Standard Office Chair for daily operations.	SN-4D5974DD	Office Chair	2	ASSIGNED	2023-02-26	2461.18	2025-02-25	\N	\N	9	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
92	Bank Office Chair 92	Standard Office Chair for daily operations.	SN-2C359DF9	Office Chair	2	ASSIGNED	2023-11-06	4119.74	2026-11-05	\N	\N	3	3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
93	Bank Monitor 93	Standard Monitor for daily operations.	SN-D44874F3	Monitor	5	ASSIGNED	2023-11-26	1655.24	2026-11-25	\N	\N	14	4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
94	Bank Filing Cabinet 94	Standard Filing Cabinet for daily operations.	SN-00B09CB0	Filing Cabinet	2	ASSIGNED	2023-08-27	2342.51	2024-08-26	\N	\N	7	7	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
95	Bank ATM 95	Standard ATM for daily operations.	SN-0F24D852	ATM	6	LOST	2023-03-05	101.81	2024-03-04	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
96	Bank Office Chair 96	Standard Office Chair for daily operations.	SN-64D3A600	Office Chair	2	ASSIGNED	2023-04-14	2320.41	2024-04-13	\N	\N	1	1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
97	Bank Desktop 97	Standard Desktop for daily operations.	SN-9E5B0FE4	Desktop	1	ASSIGNED	2023-03-03	1986.27	2024-03-02	\N	\N	15	5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
98	Bank IP Phone 98	Standard IP Phone for daily operations.	SN-13A84350	IP Phone	4	ASSIGNED	2023-12-02	1133.26	2024-12-01	\N	\N	19	9	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
99	Bank Filing Cabinet 99	Standard Filing Cabinet for daily operations.	SN-983A5790	Filing Cabinet	2	IN_REPAIR	2023-05-16	1894.85	2024-05-15	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
100	Bank Intercom 100	Standard Intercom for daily operations.	SN-1ADB1998	Intercom	4	WRITTEN_OFF	2023-01-22	309.88	2026-01-21	\N	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
2	Bank Server 2	Standard Server for daily operations.	SN-AF5B8008	Server	1	IN_REPAIR	2023-03-05	4007.48	2026-03-04	1995b4d7-9c8d-4991-91ac-9d573038bce7_ab6761610000e5ebe412a782245eb20d9626c601.jpg	\N	\N	\N	\N	2026-03-05 07:18:51.081643	2026-03-12 18:15:29.79559
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, entity_type, entity_id, action, performed_by, details, ip_address, "timestamp") FROM stdin;
1	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-05 07:19:33.298962
2	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-05 11:05:49.382281
3	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-07 11:36:17.461272
4	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-10 16:05:03.151171
5	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-10 16:12:56.077833
6	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-11 16:06:05.18521
7	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 16:56:56.300685
8	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:13:34.238626
9	ASSET	2	IMAGE_UPLOADED	SYSTEM	{"imagePath": "1995b4d7-9c8d-4991-91ac-9d573038bce7_ab6761610000e5ebe412a782245eb20d9626c601.jpg"}	\N	2026-03-12 18:15:29.791279
10	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:20:45.604228
11	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:21:05.01692
12	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:23:07.419141
13	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:28:50.181013
14	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:28:50.181164
15	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:30:49.851149
16	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:32:48.746058
17	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-12 18:33:06.963462
18	USER	1	LOGIN	admin	{"email": "admin@bankassets.com"}	\N	2026-03-13 16:55:29.451901
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, name, code, address, created_at, updated_at) FROM stdin;
1	Main HQ	HQ-001	123 Main St, City Center	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
2	North Branch	NB-002	456 North Ave	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
3	South Branch	SB-003	789 South Blvd	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
4	East Branch	EB-004	321 East Rd	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
5	West Branch	WB-005	654 West Ln	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, branch_id, created_at, updated_at) FROM stdin;
1	IT Dept B1	ITB1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
2	HR Dept B2	HRB2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
3	Finance B3	FINB3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
4	Operations B4	OPSB4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
5	Security B5	SECB5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
6	Legal B1	LGLB1	1	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
7	Audit B2	AUDB2	2	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
8	Marketing B3	MKTB3	3	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
9	Sales B4	SLSB4	4	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
10	Customer Support B5	CSB5	5	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, first_name, last_name, employee_code, email, phone, "position", department_id, active, created_at, updated_at) FROM stdin;
1	James	Smith	EMP-001	james.smith@bankassets.com	555-0101	Staff	1	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
2	Mary	Johnson	EMP-002	mary.johnson@bankassets.com	555-0102	Staff	2	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
3	John	Williams	EMP-003	john.williams@bankassets.com	555-0103	Staff	3	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
4	Patricia	Brown	EMP-004	patricia.brown@bankassets.com	555-0104	Staff	4	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
5	Robert	Jones	EMP-005	robert.jones@bankassets.com	555-0105	Staff	5	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
6	Jennifer	Garcia	EMP-006	jennifer.garcia@bankassets.com	555-0106	Staff	6	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
7	Michael	Miller	EMP-007	michael.miller@bankassets.com	555-0107	Staff	7	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
8	Linda	Davis	EMP-008	linda.davis@bankassets.com	555-0108	Staff	8	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
9	William	Rodriguez	EMP-009	william.rodriguez@bankassets.com	555-0109	Staff	9	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
10	Elizabeth	Martinez	EMP-010	elizabeth.martinez@bankassets.com	555-0110	Staff	10	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
11	David	Hernandez	EMP-011	david.hernandez@bankassets.com	555-0111	Staff	1	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
12	Barbara	Lopez	EMP-012	barbara.lopez@bankassets.com	555-0112	Staff	2	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
13	Richard	Gonzalez	EMP-013	richard.gonzalez@bankassets.com	555-0113	Staff	3	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
14	Susan	Wilson	EMP-014	susan.wilson@bankassets.com	555-0114	Staff	4	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
15	Joseph	Anderson	EMP-015	joseph.anderson@bankassets.com	555-0115	Staff	5	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
16	Jessica	Thomas	EMP-016	jessica.thomas@bankassets.com	555-0116	Staff	6	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
17	Thomas	Taylor	EMP-017	thomas.taylor@bankassets.com	555-0117	Staff	7	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
18	Sarah	Moore	EMP-018	sarah.moore@bankassets.com	555-0118	Staff	8	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
19	Charles	Jackson	EMP-019	charles.jackson@bankassets.com	555-0119	Staff	9	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
20	Karen	Martin	EMP-020	karen.martin@bankassets.com	555-0120	Staff	10	t	2026-03-05 07:18:51.081643	2026-03-05 07:18:51.081643
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	initial schema	SQL	V1__initial_schema.sql	1639409341	postgres	2026-03-05 07:18:50.022954	342	t
2	2	add users table	SQL	V2__add_users_table.sql	744302577	postgres	2026-03-05 07:18:50.510573	60	t
3	3	add sample data	SQL	V3__add_sample_data.sql	1360046737	postgres	2026-03-05 07:18:50.639356	332	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, full_name, role, enabled, created_at, updated_at) FROM stdin;
1	admin	admin@bankassets.com	$2a$10$c.lC6UpzqHcsdbzIDqvIO.eSzI2/BenSo0.RsyzYjfWDJXlmMIZue	System Administrator	ADMIN	t	2026-03-05 07:18:50.547353	2026-03-05 07:18:50.547353
\.


--
-- Name: asset_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asset_assignments_id_seq', 1, false);


--
-- Name: asset_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asset_categories_id_seq', 6, true);


--
-- Name: asset_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asset_status_history_id_seq', 1, false);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assets_id_seq', 100, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 18, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 5, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 10, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: asset_assignments asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_pkey PRIMARY KEY (id);


--
-- Name: asset_categories asset_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_name_key UNIQUE (name);


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: asset_status_history asset_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_status_history
    ADD CONSTRAINT asset_status_history_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assets assets_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_serial_number_key UNIQUE (serial_number);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_code_key UNIQUE (code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_asset_assignments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_assignments_active ON public.asset_assignments USING btree (active);


--
-- Name: idx_asset_assignments_asset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_assignments_asset ON public.asset_assignments USING btree (asset_id);


--
-- Name: idx_asset_assignments_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_assignments_employee ON public.asset_assignments USING btree (employee_id);


--
-- Name: idx_asset_status_history_asset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_status_history_asset ON public.asset_status_history USING btree (asset_id);


--
-- Name: idx_assets_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_category ON public.assets USING btree (category_id);


--
-- Name: idx_assets_current_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_current_department ON public.assets USING btree (current_department_id);


--
-- Name: idx_assets_current_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_current_employee ON public.assets USING btree (current_employee_id);


--
-- Name: idx_assets_serial; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_serial ON public.assets USING btree (serial_number);


--
-- Name: idx_assets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_status ON public.assets USING btree (status);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: asset_assignments asset_assignments_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: asset_assignments asset_assignments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: asset_assignments asset_assignments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: asset_assignments asset_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: asset_status_history asset_status_history_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_status_history
    ADD CONSTRAINT asset_status_history_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets assets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.asset_categories(id);


--
-- Name: assets assets_current_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_current_branch_id_fkey FOREIGN KEY (current_branch_id) REFERENCES public.branches(id);


--
-- Name: assets assets_current_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_current_department_id_fkey FOREIGN KEY (current_department_id) REFERENCES public.departments(id);


--
-- Name: assets assets_current_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_current_employee_id_fkey FOREIGN KEY (current_employee_id) REFERENCES public.employees(id);


--
-- Name: departments departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- PostgreSQL database dump complete
--

\unrestrict TbKP4cFlqi0XqOZKrLYiSWMCOSxaDeLY2qfPOzJ1wmuH4dcklr7nhwENNvcOg8j


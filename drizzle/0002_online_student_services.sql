create table if not exists online_classes (
  id bigint generated always as identity primary key,
  title varchar(255) not null,
  description text,
  instructor varchar(255),
  course_id integer,
  scheduled_at timestamp not null,
  duration_minutes integer default 60,
  meeting_url text,
  recording_url text,
  status varchar(50) not null default 'SCHEDULED',
  enabled boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists online_classes_scheduled_at_idx on online_classes(scheduled_at);
create index if not exists online_classes_enabled_idx on online_classes(enabled);

create table if not exists online_exams (
  id bigint generated always as identity primary key,
  exam_code varchar(100) not null unique,
  title varchar(255) not null,
  instructions text,
  course_id integer,
  starts_at timestamp,
  ends_at timestamp,
  duration_minutes integer not null default 60,
  total_marks integer not null default 0,
  passing_marks integer not null default 0,
  questions jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists online_exam_attempts (
  id bigint generated always as identity primary key,
  exam_id bigint not null references online_exams(id) on delete cascade,
  student_id bigint not null references students(id) on delete cascade,
  started_at timestamp not null default now(),
  submitted_at timestamp,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  result_status varchar(50),
  attempt_status varchar(50) not null default 'IN_PROGRESS',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists online_exam_attempts_exam_student_idx on online_exam_attempts(exam_id, student_id);

create table if not exists student_results (
  id bigint generated always as identity primary key,
  student_id bigint not null references students(id) on delete cascade,
  exam_id bigint references online_exams(id) on delete set null,
  examination varchar(255) not null,
  semester varchar(100),
  subject varchar(255) not null,
  max_marks numeric not null,
  marks_obtained numeric not null,
  grade varchar(20),
  result_status varchar(50) not null default 'PASS',
  published boolean not null default false,
  remarks text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists student_results_student_idx on student_results(student_id);
create index if not exists student_results_published_idx on student_results(published);

create table if not exists vacancies (
  id serial primary key,
  title varchar(255) not null,
  slug varchar(255) not null unique,
  department varchar(100),
  employment_type varchar(100),
  location varchar(255),
  openings integer not null default 1,
  description text,
  responsibilities text,
  qualifications text,
  experience varchar(255),
  salary varchar(255),
  enabled boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists vacancy_applications (
  id serial primary key,
  application_id varchar(50) not null unique,
  vacancy_id integer not null references vacancies(id),
  first_name varchar(255) not null,
  last_name varchar(255),
  mobile varchar(15) not null,
  email varchar(255) not null,
  address text,
  city varchar(100),
  state varchar(100),
  qualification text,
  experience text,
  resume_path text,
  status varchar(20) not null default 'pending',
  declaration boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists vacancy_applications_vacancy_id_idx on vacancy_applications(vacancy_id);
create index if not exists vacancy_applications_status_idx on vacancy_applications(status);

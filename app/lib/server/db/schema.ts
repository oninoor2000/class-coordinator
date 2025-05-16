import { relations } from 'drizzle-orm';
import {
  text,
  time,
  index,
  serial,
  boolean,
  integer,
  varchar,
  timestamp,
  foreignKey,
  pgTableCreator,
  pgEnum as drizzleEnum,
} from 'drizzle-orm/pg-core';

// Define enums
export const ClassTypeEnum = drizzleEnum('class_type', [
  'theory',
  'practicum',
  'midterm-exams',
  'end-of-semester-exams',
]);
export const MeetingTypeEnum = drizzleEnum('meeting_type', ['online', 'offline', 'hybrid']);

export const RoleEnum = drizzleEnum('role', ['admin', 'user']);
export const GenderEnum = drizzleEnum('gender', ['male', 'female', 'other']);
export const PositionEnum = drizzleEnum('position', ['coordinator', 'lecturer', 'student']);
export const PeriodEnum = drizzleEnum('period', ['1', '2']); // Replace with actual enum values
export const PlatformEnum = drizzleEnum('platform', ['google-meet', 'zoom', 'youtube']); // Replace with actual enum values
export const DayOfWeekEnum = drizzleEnum('day_of_week', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
export const FileTypeEnum = drizzleEnum('file_type', ['img', 'pdf']);
export const CourseTypeEnum = drizzleEnum('course_type', ['practicum', 'theory']);

export const createTable = pgTableCreator(name => `bsi_${name}`);

// Define tables
export const classToParticipant = createTable(
  'class_to_participant',
  {
    id: serial('id').primaryKey(),
    coordinatorId: serial('coordinator_id').notNull(),
    classId: serial('class_id').notNull(),
  },
  table => [index('class_to_participant_idx').on(table.coordinatorId, table.classId)]
);

export const classToParticipantRelations = relations(classToParticipant, ({ one }) => ({
  coordinator: one(participants, {
    fields: [classToParticipant.coordinatorId],
    references: [participants.id],
  }),
  classes: one(classes, {
    fields: [classToParticipant.classId],
    references: [classes.id],
  }),
}));

export const locations = createTable(
  'locations',
  {
    id: varchar('id', { length: 500 }).primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    description: varchar('description', { length: 500 }),
    capacity: integer('capacity'),
    imageId: text('image_id'),
  },
  table => [
    index('room_name_idx').on(table.name),
    index('room_name_capacity_idx').on(table.name, table.capacity),
  ]
);

export const locationsRelations = relations(locations, ({ many, one }) => ({
  schedules: many(schedules),
  image: one(files, {
    fields: [locations.imageId],
    references: [files.id],
  }),
}));

export const users = createTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }),
    email: varchar('email', { length: 500 }),
    emailVerified: timestamp('emailVerified', { withTimezone: true }),
    imageId: text('image_id'),
    password: text('password'),
    role: RoleEnum('role'),
    phone: varchar('phone', { length: 500 }).unique(),
  },
  table => [
    index('user_name_idx').on(table.name),
    index('user_email_and_verified_idx').on(table.email, table.emailVerified),
    index('user_role_idx').on(table.role),
    index('user_phone_and_verified_idx').on(table.phone),
  ]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  participants: many(participants),
  schedules_created: many(schedules),
  scheduleExceptionReqs: many(scheduleExceptionReqs),
  image: one(files, {
    fields: [users.imageId],
    references: [files.id],
  }),
}));

export const classes = createTable(
  'classes',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }).notNull().unique(),
    totalStudent: integer('total_student'),
    semester: integer('semester'),
  },
  table => [index('class_name_idx').on(table.name), index('class_semester_idx').on(table.semester)]
);

export const classesRelations = relations(classes, ({ many }) => ({
  participants: many(classToParticipant),
  course: many(classToCourse),
  schedules: many(schedules),
}));

export const schedules = createTable(
  'schedules',
  {
    id: text('id').primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    creatorId: serial('creator_id').notNull(),
    eventsId: serial('events_id').notNull(),
    start: timestamp('start', { withTimezone: true }).notNull(),
    end: timestamp('end', { withTimezone: true }).notNull(),
    classType: ClassTypeEnum('class_type').notNull(),
    meetingType: MeetingTypeEnum('meeting_type').notNull(),
    recurrence: varchar('recurrence', { length: 500 }),
    recurringId: text('recurring_id'),
    sequence: integer('sequence'),
    icalUid: text('ical_uid'),
    color: varchar('color', { length: 500 }),
    locationId: varchar('location_id', { length: 500 }),
    classId: serial('class_id'),
    subjectId: serial('subject_id'),
    createdAt: timestamp('created_at', { withTimezone: true }),
  },
  table => [
    index('schedule_event_idx').on(table.eventsId),
    index('schedule_time_idx').on(table.start, table.end),
    index('schedule_event_type_idx').on(table.classType),
    index('schedule_recurring_idx').on(table.recurringId),
    index('schedule_ical_idx').on(table.icalUid),
    index('schedule_location_idx ').on(table.locationId),
    index('schedule_class_idx').on(table.classId),
    index('schedule_subject_idx').on(table.subjectId),
    index('schedule_filter_idx').on(
      table.locationId,
      table.classId,
      table.subjectId,
      table.classType,
      table.meetingType
    ),
    index('schedule_meeting_type_idx').on(table.meetingType),
  ]
);

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  creator: one(users, {
    fields: [schedules.creatorId],
    references: [users.id],
  }),
  events: one(events, {
    fields: [schedules.eventsId],
    references: [events.id],
  }),
  location: one(locations, {
    fields: [schedules.locationId],
    references: [locations.id],
  }),
  class: one(classes, {
    fields: [schedules.classId],
    references: [classes.id],
  }),
  course: one(courses, {
    fields: [schedules.classId],
    references: [courses.id],
  }),
  link: many(scheduleToLink),
}));

export const links = createTable(
  'links',
  {
    id: serial('id').primaryKey(),
    platform: PlatformEnum('platform').notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    shortenedUrl: varchar('shortened_url', { length: 500 }).notNull(),
    meetingUsername: varchar('meeting_username', { length: 500 }),
    meetingPassword: varchar('meeting_password', { length: 500 }),
    description: text('description'),
    qrImgId: text('qr_img_id'),
    createdAt: timestamp('created_at', { withTimezone: true }),
  },
  table => [
    index('link_platform_idx').on(table.platform),
    index('link_name_idx').on(table.name),
    index('link_url_idx').on(table.url, table.shortenedUrl),
  ]
);

export const linksRelations = relations(links, ({ one, many }) => ({
  schedule: many(scheduleToLink),
  image: one(files, {
    fields: [links.qrImgId],
    references: [files.id],
  }),
}));

export const officeHours = createTable(
  'office_hours',
  {
    id: serial('id').primaryKey(),
    timezoneId: serial('timezone_id').notNull(),
    dayOfWeek: DayOfWeekEnum('day_of_week').notNull().unique(),
    startTime: time('start_time', { withTimezone: true }).notNull(),
    endTime: time('end_time', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').notNull(),
  },

  table => [
    index('office_hours_day_of_week_idx').on(table.dayOfWeek),
    index('office_hours_time_idx').on(table.startTime, table.endTime),
    index('office_hours_active_idx').on(table.isActive),
  ]
);

export const officeHoursRelations = relations(officeHours, ({ one }) => ({
  timezone: one(timezones, {
    fields: [officeHours.timezoneId],
    references: [timezones.id],
  }),
}));

export const files = createTable(
  'files',
  {
    id: text('id').primaryKey(),
    uploaderId: serial('uploader_id').notNull(),
    name: varchar('name', { length: 500 }),
    description: varchar('description', { length: 500 }),
    url: text('url').notNull(),
    fileType: FileTypeEnum('file_type').notNull().default('img'),
    createdAt: timestamp('created_at', { withTimezone: true }),
  },
  table => [
    index('file_user_idx').on(table.uploaderId),
    index('file_identity_idx').on(table.name, table.description),
    index('file_type_idx').on(table.fileType),
  ]
);

export const filesRelations = relations(files, ({ one }) => ({
  link: one(links, {
    fields: [files.id],
    references: [links.qrImgId],
  }),
  location: one(locations, {
    fields: [files.id],
    references: [locations.imageId],
  }),
  user: one(users, {
    fields: [files.id],
    references: [users.imageId],
  }),
}));

export const events = createTable(
  'events',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    timezone: varchar('timezone', { length: 50 }),
    color: varchar('color', { length: 500 }),
  },
  table => [index('event_name_idx').on(table.name), index('event_timezone_idx').on(table.timezone)]
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  timezone: one(timezones, {
    fields: [events.timezone],
    references: [timezones.id],
  }),
  schedule: many(schedules),
}));

export const scheduleExceptionReqs = createTable(
  'schedule_exeption_req',
  {
    id: serial('id').primaryKey(),
    userId: serial('user_id').notNull(),
    timezoneId: serial('timezone_id'),
    dayOfWeek: DayOfWeekEnum('day_of_week').notNull(),
    start: timestamp('start', { withTimezone: true }).notNull(),
    end: timestamp('end', { withTimezone: true }).notNull(),
    exceptionEnd: timestamp('exception_end', { withTimezone: true }),
  },
  table => [
    index('sched_except_userid_idx').on(table.userId),
    index('sched_except_day_idx').on(table.dayOfWeek),
    index('sched_except_ended_idx').on(table.exceptionEnd),
  ]
);

export const scheduleExceptionReqsRelations = relations(scheduleExceptionReqs, ({ one }) => ({
  user: one(users, {
    fields: [scheduleExceptionReqs.userId],
    references: [users.id],
  }),
  timezone: one(timezones, {
    fields: [scheduleExceptionReqs.timezoneId],
    references: [timezones.id],
  }),
}));

export const accounts = createTable('accounts', {
  id: serial('id').primaryKey(),
  userId: serial('userId').notNull(),
  type: varchar('type', { length: 500 }).notNull(),
  provider: varchar('provider', { length: 500 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 500 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  idToken: text('id_token'),
  scope: text('scope'),
  sessionState: text('session_state'),
  tokenType: text('token_type'),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = createTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    userId: serial('userId').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
    sessionToken: varchar('sessionToken', { length: 500 }).notNull(),
  },
  table => [index('sessions_userId_idx').on(table.userId)]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const timezones = createTable(
  'timezones',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    offset: varchar('offset', { length: 500 }).notNull(),
  },

  table => [
    index('timezone_name_idx').on(table.name),
    index('timezone_offset_idx').on(table.offset),
  ]
);

export const timezonesRelations = relations(timezones, ({ many }) => ({
  officeHours: many(officeHours),
  scheduleExceptionReqs: many(scheduleExceptionReqs),
}));

export const scheduleToLink = createTable(
  'schedule_to_link',
  {
    id: serial('id').primaryKey(),
    scheduleId: text('schedule_id').notNull(),
    meetingLinkId: serial('meeting_link_id').notNull(),
  },
  table => [index('schedule_to_link_idx').on(table.scheduleId, table.meetingLinkId)]
);

export const scheduleToLinkRelations = relations(scheduleToLink, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleToLink.scheduleId],
    references: [schedules.id],
  }),
  link: one(links, {
    fields: [scheduleToLink.meetingLinkId],
    references: [links.id],
  }),
}));

export const courses = createTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }).notNull().unique(),
    semester: integer('semester'),
    sks: integer('sks'),
    type: CourseTypeEnum('course_type').default('theory').notNull(),
  },
  table => [
    index('subject_name_idx').on(table.name),
    index('subject_type_idx').on(table.type),
    index('subject_semester_idx').on(table.semester),
    index('subject_name_type_semester_idx').on(table.name, table.semester, table.type),
  ]
);

export const coursesRelations = relations(courses, ({ many, one }) => ({
  class: many(classToCourse),
  schedule: many(schedules),
  exam: one(exams, {
    fields: [courses.id],
    references: [exams.id],
  }),
}));

export const verificationToken = createTable(
  'verification_token',
  {
    identifier: text('identifier').notNull().primaryKey(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
  },

  table => [
    index('verification_token_identifier_idx').on(table.identifier),
    index('verification_token_token_idx').on(table.token),
    index('verification_token_expires_idx').on(table.expires),
  ]
);

export const examCoordinators = createTable(
  'exam_coordinators',
  {
    id: serial('id').primaryKey(),
    lecturerId: serial('lecturer_id').notNull(),
    questionSubmitted: timestamp('question_submitted', { withTimezone: true }),
    questionSubReminderSent: integer('question_sub_reminder_sent'),
    gradeSubmitted: timestamp('grade_submitted', { withTimezone: true }),
    gradeSubReminderSent: integer('grade_sub_reminder_sent'),
    examId: serial('exam_id').notNull(),
  },
  table => [
    index('exam_coord_question_sumitted_idx').on(table.questionSubmitted),
    index('exam_coord_question_submitted_sent_idx').on(table.questionSubReminderSent),
    index('exam_coord_grade_submitted_idx').on(table.gradeSubmitted),
    index('exam_coord_grade_submitted_sent_idx').on(table.gradeSubReminderSent),
    index('exam_coord_exam_id_idx').on(table.examId),
    index('exam_coord_lecurer_id_idx').on(table.lecturerId),
  ]
);

export const examCoordinatorsRelations = relations(examCoordinators, ({ one }) => ({
  exam: one(exams, {
    fields: [examCoordinators.examId],
    references: [exams.id],
  }),
  lecturer: one(participants, {
    fields: [examCoordinators.lecturerId],
    references: [participants.id],
  }),
}));

export const exams = createTable(
  'exams',
  {
    id: serial('id').primaryKey(),
    subjectId: serial('subject_id').notNull(),
    questionSubDeadline: timestamp('question_sub_deadline', {
      withTimezone: true,
    }).notNull(),
    gradingSubDeadline: timestamp('grading_sub_deadline', {
      withTimezone: true,
    }).notNull(),
    period: PeriodEnum('period').notNull(),
    year: integer('year').notNull(),
  },
  table => [
    index('exam_subject_idx').on(table.subjectId),
    index('exam_question_sub_deadline_idx').on(table.questionSubDeadline),
    index('exam_grading_sub_deadline_idx').on(table.gradingSubDeadline),
    index('exam_period_year_idx').on(table.period, table.year),
  ]
);

export const examsRelations = relations(exams, ({ one, many }) => ({
  course: one(courses, {
    fields: [exams.subjectId],
    references: [courses.id],
  }),
  examCoordinator: many(examCoordinators),
}));

export const participants = createTable(
  'participants',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    gender: GenderEnum('gender').notNull(),
    phone: varchar('phone', { length: 500 }).notNull(),
    position: PositionEnum('position').notNull(),
    image: text('image'),
    email: varchar('email', { length: 500 }),
    organization: varchar('organization', { length: 500 }),
    userId: serial('user_id'),
  },
  table => [
    index('participants_name_idx').on(table.name),
    index('participants_phone_idx').on(table.phone),
    index('participants_user_id_idx').on(table.userId),
    index('participants_position_idx').on(table.position),
  ]
);

export const participantsRelations = relations(participants, ({ many, one }) => ({
  class: many(classToParticipant),
  examCoordinator: many(examCoordinators),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
}));

export const classToCourse = createTable(
  'class_to_course',
  {
    id: serial('id').primaryKey(),
    classId: serial('class_id').notNull(),
    courseId: serial('course_id').notNull(),
  },
  table => [index('class_to_course_idx').on(table.courseId, table.classId)]
);

export const classToCourseRelations = relations(classToCourse, ({ one }) => ({
  class: one(classes, {
    fields: [classToCourse.classId],
    references: [classes.id],
  }),
  course: one(courses, {
    fields: [classToCourse.courseId],
    references: [courses.id],
  }),
}));

// Define foreign key constraints
export const accountFk = [
  foreignKey({
    columns: [accounts.userId],
    foreignColumns: [users.id],
  }),
];

export const eventsFk = [
  foreignKey({
    columns: [events.id],
    foreignColumns: [schedules.eventsId],
  }),
];
export const filesFk = [
  foreignKey({
    columns: [files.uploaderId],
    foreignColumns: [users.id],
  }),
];
export const locationsFk = [
  foreignKey({
    columns: [locations.imageId],
    foreignColumns: [files.id],
  }),
];

export const linksFk = [
  foreignKey({
    columns: [links.qrImgId],
    foreignColumns: [files.id],
  }),
];
export const scheduleToLinkFk = [
  foreignKey({
    columns: [scheduleToLink.meetingLinkId],
    foreignColumns: [links.id],
  }),
  foreignKey({
    columns: [scheduleToLink.scheduleId],
    foreignColumns: [schedules.id],
  }),
];
export const scheduleExceptionReqFk = [
  foreignKey({
    columns: [scheduleExceptionReqs.userId],
    foreignColumns: [users.id],
  }),
  foreignKey({
    columns: [scheduleExceptionReqs.timezoneId],
    foreignColumns: [timezones.id],
  }),
];

export const schedulesFk = [
  foreignKey({
    columns: [schedules.locationId],
    foreignColumns: [locations.id],
  }),
  foreignKey({
    columns: [schedules.classId],
    foreignColumns: [classes.id],
  }),
  foreignKey({
    columns: [schedules.creatorId],
    foreignColumns: [users.id],
  }),
  foreignKey({
    columns: [schedules.subjectId],
    foreignColumns: [courses.id],
  }),
];

export const sessionsFk = [
  foreignKey({
    columns: [sessions.userId],
    foreignColumns: [users.id],
  }),
];

export const officeHoursFk = [
  foreignKey({
    columns: [officeHours.timezoneId],
    foreignColumns: [timezones.id],
  }),
];

export const participantsFk = [
  foreignKey({
    columns: [participants.userId],
    foreignColumns: [users.id],
  }),
];

export const classToParticipantFk = [
  foreignKey({
    columns: [classToParticipant.classId],
    foreignColumns: [classes.id],
  }),
  foreignKey({
    columns: [classToParticipant.coordinatorId],
    foreignColumns: [participants.id],
  }),
];

export const examFk = [
  foreignKey({
    columns: [exams.subjectId],
    foreignColumns: [courses.id],
  }),
];

export const examCoordinatorsFk = [
  foreignKey({
    columns: [examCoordinators.lecturerId],
    foreignColumns: [participants.id],
  }),
  foreignKey({
    columns: [examCoordinators.examId],
    foreignColumns: [exams.id],
  }),
];

export const usersFk = [
  foreignKey({
    columns: [users.imageId],
    foreignColumns: [files.id],
  }),
];

export const classToCourseFk = [
  foreignKey({
    columns: [classToCourse.classId],
    foreignColumns: [classes.id],
  }),
  foreignKey({
    columns: [classToCourse.courseId],
    foreignColumns: [courses.id],
  }),
];

import { PrimitiveSubject, Subject, User } from "./definitions";
import { SBJ, SUBJECTS_PLAIN_WITHOUT_OTHERS, SBJ_FINAL } from "./subjects";
import { SUBJECTS_COLORS_WITHOUT_OTHERS, SUBJECTS_BG_COLORS_WITHOUT_OTHERS, SUBJECTS_BORDER_COLORS_WITHOUT_OTHERS  } from "./utils";


const events = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442e',
    name: 'User event',
    description: 'This is the description for the user event',
    date: '2024-12-6',
    time: '10:00:00',
    scope: 'user',
    userId: '410544b2-4001-4271-9855-fec4b6a6442a',
    subjectId: '410544b2-4001-4271-9855-fec4b6a6442c',
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442f',
    name: 'Admin event',
    description: 'This is the description for the admin event',
    date: '2024-12-6',
    time: '10:00:00',
    scope: 'admin',
    userId: '410544b2-4001-4271-9855-fec4b6a6442b',
    subjectId: '410544b2-4001-4271-9855-fec4b6a6442d',
  },
];

const subjects = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442c',
    name: 'Other',
    color: '#ff0000',
    bgColor: '#330000',
    borderColor: '#aa0000',
    userId: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442d',
    name: 'Other',
    color: '#ff0000',
    bgColor: '#330000',
    borderColor: '#aa0000',
    userId: '410544b2-4001-4271-9855-fec4b6a6442b',
  }
]

const primitive_subjects: PrimitiveSubject[] = (() => {
  return SBJ_FINAL.map((subject) => ({...subject, userid: '410544b2-4001-4271-9855-fec4b6a6442b'}))
})() as PrimitiveSubject[]

export { users, events, subjects, primitive_subjects }
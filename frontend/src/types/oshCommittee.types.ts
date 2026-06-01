export interface OSHCommitteeAttendee {
  id: number
  oshId: string
  attendeeName: string
  attendeeMail: string
  attendeeDept?: string
  attendeeCompany?: string
  attendeePhone?: string
  isExternal?: boolean
  isSigned: boolean
  signatureDate?: string
  createdAt?: string
}

export interface OSHCommittee {
  id: number
  oshId: string
  oshDate?: string
  oshYear?: number
  oshQuarter?: number
  oshLocation?: string
  oshLocationDetail?: string
  attendeeCount?: number
  mainAgenda?: string
  comment?: string
  isFileCreated?: boolean
  authorName?: string
  authorMail?: string
  authorDept?: string
  authorCompany?: string
  createdAt: string
  modifiedAt: string
  attendees?: OSHCommitteeAttendee[]
}

export interface OSHCommitteeRequest {
  oshDate?: string
  oshYear?: number
  oshQuarter?: number
  oshLocation?: string
  oshLocationDetail?: string
  mainAgenda?: string
  comment?: string
  authorName?: string
  authorMail?: string
  authorDept?: string
  authorCompany?: string
}
